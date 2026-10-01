import { anyApi } from 'convex/server';
import { v } from 'convex/values';
import { internalMutation, type MutationCtx, type Doc, type Id, type QueryCtx } from './lib/server';
import { compatibleDonors } from './lib/compatibility';
import { calculateEligibility } from './lib/eligibility';
import { approximateDistance, haversineKm } from './lib/haversine';
import { defaultOperationalPolicy, scoreMatch } from './lib/scoring';
import { needsMoreDonors, unfinishedStatuses, openStatuses } from './lib/lifecycle';

export async function getConfig(ctx: QueryCtx | MutationCtx, demo?: boolean) {
  return await ctx.db.query('platformConfig').withIndex('by_key', q => q.eq('key', 'main')).filter(q => demo ? q.eq(q.field('demo'), true) : q.neq(q.field('demo'), true)).first();
}
export async function audit(ctx: MutationCtx, user: Doc<'users'>, action: string, entityType: string, entityId: string) {
  await ctx.db.insert('auditLogs', { demo: Boolean(user.demo), userId: user._id, action, entityType, entityId, createdAt: Date.now() });
}
export async function notify(ctx: MutationCtx, userId: Id<'users'>, type: Doc<'notifications'>['type'], title: string, body: string, eventKey: string, requestId?: Id<'bloodRequests'>) {
  if (await ctx.db.query('notifications').withIndex('by_event', q => q.eq('eventKey', eventKey)).first()) return;
  const user = await ctx.db.get(userId);
  if (!user || user.accountStatus !== 'active') return;
  const notificationId = await ctx.db.insert('notifications', { demo: Boolean(user.demo), userId, type, title, body, eventKey, ...(requestId ? { requestId, deepLink: `/request/${requestId}` } : {}), read: false, sentAt: Date.now(), deliveryStatus: 'InAppOnly' });
  if (user.notificationEnabled && !user.demo) await ctx.scheduler.runAfter(0, anyApi.integrations.pushNotification, { notificationId });
}
export async function stopResponses(ctx: MutationCtx, requestId: Id<'bloodRequests'>) {
  for (const response of await ctx.db.query('donorResponses').withIndex('by_request', q => q.eq('requestId', requestId)).collect()) {
    if ((response.responseStatus === 'Notified' || response.responseStatus === 'Accepted') && !response.donationConfirmed) await ctx.db.patch(response._id, { responseStatus: 'Cancelled' });
  }
}
export async function expireOne(ctx: MutationCtx, request: Doc<'bloodRequests'>) {
  if (request.requiredBefore <= Date.now() && unfinishedStatuses.includes(request.requestStatus)) {
    await ctx.db.patch(request._id, { requestStatus: 'Expired', updatedAt: Date.now(), revision: request.revision + 1 });
    await stopResponses(ctx, request._id);
    await notify(ctx, request.requesterId, 'RequestUpdate', 'Request expired', 'The required-by time has passed. Please coordinate with the hospital.', `expired:${request._id}`, request._id);
    return true;
  }
  return false;
}
export async function matchBatch(ctx: MutationCtx, requestId: Id<'bloodRequests'>, expectedStage: number) {
  const request = await ctx.db.get(requestId);
  if (!request || request.escalationStage !== expectedStage || !openStatuses.includes(request.requestStatus) || await expireOne(ctx, request)) return;
  const config = await getConfig(ctx, request.demo), policy = config?.operational ?? defaultOperationalPolicy;
  if (expectedStage >= policy.maximumStages) return;
  const responses = await ctx.db.query('donorResponses').withIndex('by_request', q => q.eq('requestId', requestId)).collect();
  const accepted = responses.filter(r => r.responseStatus === 'Accepted' && !r.donationConfirmed).length;
  if (!needsMoreDonors(request.unitsRequired, request.unitsArranged, accepted)) return;
  const radius = Math.min(policy.maximumRadiusKm, policy.initialRadiusKm + expectedStage * policy.radiusStepKm);
  const seen = new Set(responses.map(r => r.donorId));
  const candidates: { donor: Doc<'donors'>; distanceKm: number; matchScore: number }[] = [];
  for (const group of compatibleDonors[request.bloodGroup]) {
    const donors = await ctx.db.query('donors').withIndex('by_group_available', q => q.eq('bloodGroup', group).eq('available', true)).collect();
    for (const donor of donors) {
      if (Boolean(donor.demo) !== Boolean(request.demo) || seen.has(donor._id) || donor.latitude === undefined || donor.longitude === undefined || !donor.notificationEnabled) continue;
      const user = await ctx.db.get(donor.userId);
      if (!user || user.accountStatus !== 'active' || user.role !== 'donor') continue;
      const eligibility = calculateEligibility(donor, config?.eligibility, Date.now());
      if (eligibility.status !== 'PreliminaryEligible') continue;
      const distanceKm = haversineKm({ latitude: donor.latitude, longitude: donor.longitude }, request);
      if (distanceKm > radius) continue;
      const history = await ctx.db.query('donorResponses').withIndex('by_donor', q => q.eq('donorId', donor._id)).take(50);
      const answered = history.filter(r => r.responseStatus === 'Accepted' || r.responseStatus === 'Declined').length;
      const reliability = history.length ? answered / history.length : 0.5;
      candidates.push({ donor, distanceKm, matchScore: scoreMatch({ distanceKm, radiusKm: radius, available: true, eligible: true, reliability, urgency: request.urgency }, policy.matchingWeights) });
    }
  }
  candidates.sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm || a.donor._id.localeCompare(b.donor._id));
  const hospital = await ctx.db.get(request.hospitalId);
  for (const candidate of candidates.slice(0, expectedStage === 0 ? policy.firstBatchSize : policy.laterBatchSize)) {
    await ctx.db.insert('donorResponses', { demo: Boolean(request.demo), requestId, donorId: candidate.donor._id, matchScore: candidate.matchScore, distanceKm: approximateDistance(candidate.distanceKm), notificationStage: expectedStage, responseStatus: 'Notified', notifiedAt: Date.now(), donationConfirmed: false, confirmedUnits: 0 });
    await notify(ctx, candidate.donor.userId, 'DonorRequest', `${request.urgency} ${request.bloodGroup} blood request`, `${hospital?.name ?? 'Hospital'} · approximately ${approximateDistance(candidate.distanceKm)} km · ${request.unitsRequired - request.unitsArranged} units needed.`, `match:${requestId}:${candidate.donor._id}`, requestId);
  }
  await ctx.db.patch(requestId, { escalationStage: expectedStage + 1, searchRadiusKm: radius, requestStatus: request.unitsArranged > 0 ? 'Partially Fulfilled' : (candidates.length || responses.length ? 'Donors Contacted' : 'Active'), updatedAt: Date.now() });
  if (expectedStage + 1 < policy.maximumStages) await ctx.scheduler.runAfter(request.urgency === 'Critical' ? policy.criticalDelayMs : policy.escalationDelayMs, anyApi.workflow.escalate, { requestId, expectedStage: expectedStage + 1 });
}
export const escalate = internalMutation({ args: { requestId: v.id('bloodRequests'), expectedStage: v.number() }, handler: async (ctx, args) => { await matchBatch(ctx, args.requestId, args.expectedStage); } });
export const expire = internalMutation({ args: { requestId: v.id('bloodRequests') }, handler: async (ctx, args) => { const request = await ctx.db.get(args.requestId); if (request) await expireOne(ctx, request); } });
export const expireSession = internalMutation({ args: { sessionId: v.id('demoSessions') }, handler: async (ctx, args) => { const session = await ctx.db.get(args.sessionId); if (session && session.expiresAt <= Date.now()) await ctx.db.delete(session._id); } });
