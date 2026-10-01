import { v } from 'convex/values';
import { internalMutation, internalQuery } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { createDemo } from '../src/data/demo';
import { isOpen } from '../src/domain/rules';

export const seedKey = 'bloodbank-development-v1';
export const seedCounts = v.object({
  users: v.number(), donors: v.number(), hospitals: v.number(), requests: v.number(),
  responses: v.number(), donations: v.number(),
});
export type SeedCounts = { users: number; donors: number; hospitals: number; requests: number; responses: number; donations: number };
export function requireDevelopment() {
  // An internal function is owner-only; also prevent accidental production seeding.
  if (process.env.CONVEX_CLOUD_URL !== 'https://woozy-setter-248.convex.cloud')
    throw new Error('Sample accounts are only enabled on the BloodBank development deployment.');
}
export const status = internalQuery({
  args: {}, returns: v.union(seedCounts, v.null()),
  handler: async (ctx): Promise<SeedCounts | null> => {
    requireDevelopment();
    const run = await ctx.db.query('seedRuns').withIndex('by_key', q => q.eq('key', seedKey)).unique();
    if (!run) return null;
    const count = async (ids: Id<'users'>[] | Id<'donors'>[] | Id<'hospitals'>[] | Id<'bloodRequests'>[] | Id<'donorResponses'>[] | Id<'donations'>[]) =>
      (await Promise.all(ids.map(id => ctx.db.get(id)))).filter(Boolean).length;
    return { users: await count(run.users), donors: await count(run.donors), hospitals: await count(run.hospitals), requests: await count(run.requests), responses: await count(run.responses), donations: await count(run.donations) };
  },
});
export const populate = internalMutation({
  args: { accounts: v.array(v.object({ email: v.string(), authUserId: v.string() })) },
  returns: seedCounts,
  handler: async (ctx, { accounts }): Promise<SeedCounts> => {
    requireDevelopment();
    const previous = await ctx.db.query('seedRuns').withIndex('by_key', q => q.eq('key', seedKey)).unique();
    if (previous) return { users: previous.users.length, donors: previous.donors.length, hospitals: previous.hospitals.length, requests: previous.requests.length, responses: previous.responses.length, donations: previous.donations.length };
    const now = Date.now(), fixture = createDemo(now);
    if (accounts.length !== fixture.users.length || new Set(accounts.map(a => a.authUserId)).size !== accounts.length)
      throw new Error('Seed needs one distinct authenticated account per fixture user.');
    // Never turn an existing application account into an administrator or overwrite its profile.
    for (const user of fixture.users) {
      if (!accounts.find(a => a.email === user.email)) throw new Error('Missing seed account.');
      const existing = await ctx.db.query('users').withIndex('by_email', q => q.eq('email', user.email)).unique();
      const identity = accounts.find(a => a.email === user.email)!;
      const byIdentity = await ctx.db.query('users').withIndex('by_auth_user', q => q.eq('authUserId', identity.authUserId)).unique();
      if (existing || byIdentity) throw new Error(`Existing application account ${user.email}; seed will not change its role.`);
    }
    const hospitals = new Map<string, Id<'hospitals'>>();
    for (const { id, ...hospital } of fixture.hospitals)
      hospitals.set(id, await ctx.db.insert('hospitals', { ...hospital, name: `Sample — ${hospital.name}`, address: `Fictional test facility, ${hospital.city}` }));
    const users = new Map<string, Id<'users'>>();
    for (const { id, hospitalId, ...user } of fixture.users)
      users.set(id, await ctx.db.insert('users', { ...user, authUserId: accounts.find(a => a.email === user.email)!.authUserId, hospitalId: hospitalId ? hospitals.get(hospitalId)! : undefined }));
    const donors = new Map<string, Id<'donors'>>();
    for (const { id, userId, ...donor } of fixture.donors)
      donors.set(id, await ctx.db.insert('donors', { ...donor, userId: users.get(userId)!, updatedAt: now }));
    const requests = new Map<string, Id<'bloodRequests'>>();
    for (const { id, requesterId, hospitalId, ...request } of fixture.requests) {
      const requestId = await ctx.db.insert('bloodRequests', { ...request, description: 'Fictional sample request for testing only.', requesterId: users.get(requesterId)!, hospitalId: hospitals.get(hospitalId)!, verifiedBy: request.verification === 'verified' ? users.get('u-admin')! : undefined });
      requests.set(id, requestId);
      if (isOpen(request.status) || request.status === 'pending')
        await ctx.scheduler.runAt(request.requiredBefore, internal.requests.expireOne, { requestId });
      if (isOpen(request.status))
        await ctx.scheduler.runAfter(10 * 60_000, internal.matching.runBatch, { requestId });
    }
    const responses: Id<'donorResponses'>[] = [];
    for (const { id, requestId, donorId, donorUserId, ...response } of fixture.responses) {
      void id;
      responses.push(await ctx.db.insert('donorResponses', { ...response, requestId: requests.get(requestId)!, donorId: donors.get(donorId)!, donorUserId: users.get(donorUserId)! }));
    }
    const donations: Id<'donations'>[] = [];
    for (const { id, requestId, donorUserId, hospitalId, ...donation } of fixture.donations) {
      void id;
      const responseId = await ctx.db.insert('donorResponses', { requestId: requests.get(requestId)!, donorId: donors.get('d-0')!, donorUserId: users.get(donorUserId)!, matchScore: 95, distanceKm: 2, stage: 0, status: 'accepted', notifiedAt: donation.donatedAt, respondedAt: donation.donatedAt, donationConfirmed: true, confirmedBy: users.get('u-coordinator')! });
      responses.push(responseId);
      donations.push(await ctx.db.insert('donations', { ...donation, responseId, requestId: requests.get(requestId)!, donorUserId: users.get(donorUserId)!, hospitalId: hospitals.get(hospitalId)!, confirmedBy: users.get('u-coordinator')! }));
    }
    for (const { id, userId, requestId, ...notification } of fixture.notifications) {
      void id;
      await ctx.db.insert('notifications', { ...notification, userId: users.get(userId)!, requestId: requestId ? requests.get(requestId)! : undefined });
    }
    for (const user of fixture.users)
      await ctx.db.insert('notifications', { userId: users.get(user.id)!, title: 'Welcome to the test workspace', body: 'These accounts and requests are fictional. Explore your dashboard and profile.', read: false, deliveryStatus: 'in_app', createdAt: now });
    for (const { id, requestId, reporterId, ...report } of fixture.reports) {
      void id;
      await ctx.db.insert('reports', { ...report, requestId: requests.get(requestId)!, reporterId: users.get(reporterId)! });
    }
    if (!(await ctx.db.query('settings').first())) await ctx.db.insert('settings', fixture.settings);
    await ctx.db.insert('auditLogs', { actorId: users.get('u-admin')!, action: 'DEVELOPMENT_SAMPLE_DATA_CREATED', entityId: seedKey, createdAt: now });
    const run = { key: seedKey, createdAt: now, users: [...users.values()], donors: [...donors.values()], hospitals: [...hospitals.values()], requests: [...requests.values()], responses, donations };
    await ctx.db.insert('seedRuns', run);
    return { users: run.users.length, donors: run.donors.length, hospitals: run.hospitals.length, requests: run.requests.length, responses: responses.length, donations: donations.length };
  },
});
