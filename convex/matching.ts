import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { internal } from './_generated/api';
import { distanceKm, eligibility, isCompatible, isOpen, matchScore } from '../src/domain/rules';
import { getSettings } from './lib/permissions';
import { notify } from './notifications';

const candidate = v.object({ donorId: v.id('donors'), km: v.number(), score: v.number() });
async function canOffer(
  ctx: MutationCtx,
  donor: Doc<'donors'>,
  request: Doc<'bloodRequests'>,
  settings: Awaited<ReturnType<typeof getSettings>>,
  now: number,
) {
  if (
    !donor.available ||
    !donor.notificationEnabled ||
    !isCompatible(donor.bloodGroup, request.bloodGroup) ||
    !eligibility(donor, settings, now).eligible
  )
    return false;
  const user = await ctx.db.get(donor.userId);
  if (user?.status !== 'active' || user.role !== 'donor') return false;
  const previous = await ctx.db
    .query('donorResponses')
    .withIndex('by_request_and_donor', (q) =>
      q.eq('requestId', request._id).eq('donorId', donor._id),
    )
    .first();
  if (previous) return false;
  const accepted = await ctx.db
    .query('donorResponses')
    .withIndex('by_donor_open', (q) =>
      q.eq('donorId', donor._id).eq('status', 'accepted').eq('donationConfirmed', false),
    )
    .take(21);
  for (const offer of accepted) {
    const other = await ctx.db.get(offer.requestId);
    if (other && isOpen(other.status) && other.requiredBefore > now) return false;
  }
  return true;
}

// Each transaction scans one donor page and carries only the best batch.
// An epoch prevents stale pages from delivering offers after another scan or closure.
export const runBatch = internalMutation({
  args: {
    requestId: v.id('bloodRequests'),
    cursor: v.optional(v.union(v.string(), v.null())),
    candidates: v.optional(v.array(candidate)),
    epoch: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId),
      now = Date.now();
    if (
      !request ||
      !isOpen(request.status) ||
      request.verification !== 'verified' ||
      request.requiredBefore <= now
    )
      return;
    if (
      args.epoch !== undefined
        ? request.matchingStartedAt !== args.epoch
        : request.nextEscalationAt && request.nextEscalationAt > now
    )
      return;
    const settings = await getSettings(ctx),
      hospital = await ctx.db.get(request.hospitalId);
    if (!hospital?.active || !hospital.verified) return;
    const delay = Math.max(
      60_000,
      (request.urgency === 'critical'
        ? settings.escalationMinutes / 2
        : settings.escalationMinutes) * 60_000,
    );
    const committed = await ctx.db
      .query('donorResponses')
      .withIndex('by_request_open', (q) =>
        q.eq('requestId', request._id).eq('status', 'accepted').eq('donationConfirmed', false),
      )
      .take(21);
    if (committed.length + request.unitsArranged >= request.unitsRequired) {
      await ctx.db.patch(request._id, {
        nextEscalationAt: now + delay,
        matchingStartedAt: undefined,
      });
      await ctx.scheduler.runAfter(delay, internal.matching.runBatch, { requestId: request._id });
      return;
    }
    const epoch = args.epoch ?? now;
    if (args.epoch === undefined) {
      const pending = await ctx.db
        .query('donorResponses')
        .withIndex('by_request_open', (q) =>
          q.eq('requestId', request._id).eq('status', 'notified').eq('donationConfirmed', false),
        )
        .take(100);
      for (const offer of pending)
        if (offer.notifiedAt + delay <= now)
          await ctx.db.patch(offer._id, { status: 'no_response' });
      await ctx.db.patch(request._id, { matchingStartedAt: epoch, nextEscalationAt: now + delay });
      // Recovery tick also covers a failed intermediate page.
      await ctx.scheduler.runAfter(delay, internal.matching.runBatch, { requestId: request._id });
    }
    const radius = Math.min(
      settings.maxRadiusKm,
      settings.initialRadiusKm * Math.pow(1.7, request.escalationStage),
    );
    const batchSize =
      request.escalationStage === 0 ? settings.batchSize : Math.min(20, settings.batchSize * 2);
    const page = await ctx.db
      .query('donors')
      .withIndex('by_available', (q) => q.eq('available', true))
      .paginate({ cursor: args.cursor ?? null, numItems: 50 });
    const ranked = [...(args.candidates ?? [])];
    for (const donor of page.page) {
      const km = distanceKm(donor, hospital);
      if (km > radius || !(await canOffer(ctx, donor, request, settings, now))) continue;
      const history = await ctx.db
        .query('donorResponses')
        .withIndex('by_donor', (q) => q.eq('donorId', donor._id))
        .order('desc')
        .take(50);
      const reliability = history.length
        ? history.filter((r) => r.respondedAt !== undefined).length / history.length
        : 0.5;
      ranked.push({
        donorId: donor._id,
        km,
        score: matchScore(
          km,
          radius,
          donor.lastDonationDate,
          request.urgency,
          reliability,
          settings,
          now,
        ),
      });
    }
    ranked.sort((a, b) => b.score - a.score || a.km - b.km || a.donorId.localeCompare(b.donorId));
    const best = ranked.slice(0, batchSize);
    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.matching.runBatch, {
        requestId: request._id,
        cursor: page.continueCursor,
        candidates: best,
        epoch,
      });
      return;
    }
    for (const match of best) {
      const donor = await ctx.db.get(match.donorId);
      if (!donor || !(await canOffer(ctx, donor, request, settings, now))) continue;
      await ctx.db.insert('donorResponses', {
        requestId: request._id,
        donorId: donor._id,
        donorUserId: donor.userId,
        matchScore: match.score,
        distanceKm: Math.round(match.km * 10) / 10,
        stage: request.escalationStage,
        status: 'notified',
        notifiedAt: now,
        donationConfirmed: false,
      });
      await notify(
        ctx,
        donor.userId,
        `${request.urgency.toUpperCase()}: ${request.bloodGroup} blood needed`,
        `${hospital.name} · about ${match.km.toFixed(1)} km away · ${request.unitsRequired - request.unitsArranged} units needed`,
        request._id,
      );
    }
    await ctx.db.patch(request._id, {
      status: request.unitsArranged > 0 ? 'partial' : 'contacted',
      escalationStage: request.escalationStage + 1,
      searchRadiusKm: radius,
      matchingStartedAt: undefined,
      updatedAt: now,
    });
  },
});
