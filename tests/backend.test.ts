import { convexTest } from 'convex-test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryCtx } from '../convex/_generated/server';
import schema from '../convex/schema';
import { api, internal } from '../convex/_generated/api';

// Replace the external identity adapter only. Tests execute the real Convex functions and database.
vi.mock('../convex/auth', () => ({
  authComponent: {
    safeGetAuthUser: async (ctx: QueryCtx) => {
      const identity = await ctx.auth.getUserIdentity();
      return identity
        ? { _id: identity.subject, email: identity.email ?? 'test@bloodbank.test' }
        : null;
    },
    getAuthUser: async (ctx: QueryCtx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error('Unauthenticated');
      return { _id: identity.subject, email: identity.email ?? 'test@bloodbank.test' };
    },
  },
}));
const modules = import.meta.glob('../convex/**/*.ts');
async function fixture() {
  const t = convexTest(schema, modules),
    now = Date.now();
  const ids = await t.run(async (ctx) => {
    const hospital = await ctx.db.insert('hospitals', {
      name: 'Test hospital',
      city: 'Hyderabad',
      address: 'Receiving facility',
      latitude: 25.39,
      longitude: 68.37,
      active: true,
      verified: true,
    });
    const otherHospital = await ctx.db.insert('hospitals', {
      name: 'Other hospital',
      city: 'Karachi',
      address: 'Other facility',
      latitude: 24.89,
      longitude: 67.07,
      active: true,
      verified: true,
    });
    const makeUser = async (
      authUserId: string,
      role: 'requester' | 'donor' | 'coordinator' | 'admin',
      hospitalId?: typeof hospital,
    ) =>
      ctx.db.insert('users', {
        authUserId,
        name: authUserId,
        email: `${authUserId}@test.test`,
        phone: '+92 555 0100',
        role,
        city: 'Hyderabad',
        hospitalId,
        status: 'active',
        onboardingCompleted: true,
        createdAt: now,
      });
    const requester = await makeUser('auth-requester', 'requester'),
      donorUser = await makeUser('auth-donor', 'donor'),
      coordinator = await makeUser('auth-coordinator', 'coordinator', hospital),
      otherCoordinator = await makeUser('auth-other', 'coordinator', otherHospital),
      admin = await makeUser('auth-admin', 'admin');
    const donor = await ctx.db.insert('donors', {
      userId: donorUser,
      bloodGroup: 'O+',
      age: 26,
      city: 'Hyderabad',
      latitude: 25.39,
      longitude: 68.36,
      lastDonationDate: now - 120 * 86_400_000,
      available: true,
      questionnairePassed: true,
      totalDonations: 0,
      notificationEnabled: true,
      shareContact: false,
      updatedAt: now,
    });
    const request = await ctx.db.insert('bloodRequests', {
      requesterId: requester,
      bloodGroup: 'B+',
      unitsRequired: 1,
      unitsArranged: 0,
      hospitalId: hospital,
      urgency: 'urgent',
      requiredBefore: now + 3_600_000,
      description: 'Private patient coordination note',
      status: 'contacted',
      verification: 'verified',
      searchRadiusKm: 10,
      escalationStage: 1,
      createdAt: now,
      updatedAt: now,
    });
    const response = await ctx.db.insert('donorResponses', {
      requestId: request,
      donorId: donor,
      donorUserId: donorUser,
      matchScore: 95,
      distanceKm: 1,
      stage: 0,
      status: 'notified',
      notifiedAt: now,
      donationConfirmed: false,
    });
    return {
      hospital,
      otherHospital,
      requester,
      donorUser,
      coordinator,
      otherCoordinator,
      admin,
      donor,
      request,
      response,
    };
  });
  return {
    t,
    ids,
    donor: t.withIdentity({ subject: 'auth-donor' }),
    requester: t.withIdentity({ subject: 'auth-requester' }),
    coordinator: t.withIdentity({ subject: 'auth-coordinator' }),
    other: t.withIdentity({ subject: 'auth-other' }),
    admin: t.withIdentity({ subject: 'auth-admin' }),
  };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
describe('actual Convex backend', () => {
  it('blocks unauthenticated mutations and privileged self-assignment', async () => {
    const { t, ids, donor } = await fixture();
    await expect(
      t.mutation(api.responses.respond, { responseId: ids.response, accept: true }),
    ).rejects.toThrow();
    await expect(
      donor.mutation(api.users.manage, { userId: ids.donorUser, role: 'admin', status: 'active' }),
    ).rejects.toThrow('Administrator');
  });
  it('enforces hospital scope on verification and confirmation', async () => {
    const { t, ids, other } = await fixture();
    await t.run(async (ctx) =>
      ctx.db.patch(ids.request, { status: 'pending', verification: 'pending' }),
    );
    await expect(
      other.mutation(api.requests.verify, { requestId: ids.request, approve: true }),
    ).rejects.toThrow('cannot verify');
    await expect(
      other.mutation(api.responses.confirmDonation, { responseId: ids.response }),
    ).rejects.toThrow('coordinator');
  });
  it('records donations transactionally, blocks repeated confirmation, and closes a fulfilled request', async () => {
    const { ids, t, donor, requester, coordinator } = await fixture();
    await donor.mutation(api.responses.respond, { responseId: ids.response, accept: true });
    expect((await t.run((ctx) => ctx.db.get(ids.request)))?.unitsArranged).toBe(0);
    await expect(
      requester.mutation(api.responses.confirmDonation, { responseId: ids.response }),
    ).rejects.toThrow('coordinator');
    await coordinator.mutation(api.responses.confirmDonation, { responseId: ids.response });
    const request = await t.run((ctx) => ctx.db.get(ids.request));
    expect(request?.unitsArranged).toBe(1);
    expect(request?.status).toBe('fulfilled');
    expect((await t.run((ctx) => ctx.db.get(ids.donor)))?.totalDonations).toBe(1);
    await expect(
      coordinator.mutation(api.responses.confirmDonation, { responseId: ids.response }),
    ).rejects.toThrow('already');
    await requester.mutation(api.requests.complete, { requestId: ids.request });
    expect((await t.run((ctx) => ctx.db.get(ids.request)))?.status).toBe('completed');
  });
  it('sanitizes public request notes and donor contacts in the live snapshot', async () => {
    const { ids, donor, requester } = await fixture();
    const before = await donor.query(api.app.snapshot, {});
    expect(before.requests.find((r) => r.id === ids.request)?.description).toBeUndefined();
    expect(before.users).toEqual([]);
    await donor.mutation(api.responses.respond, { responseId: ids.response, accept: true });
    const view = await requester.query(api.app.snapshot, {});
    expect(view.responses[0].donorName).toBe('auth-donor');
    expect(view.responses[0].contact).toBeUndefined();
    expect(view.donor).toBeNull();
  });
  it('rechecks eligibility and availability when accepting an existing offer', async () => {
    const { t, ids, donor } = await fixture();
    await t.run(async (ctx) => ctx.db.patch(ids.donor, { available: false }));
    await expect(
      donor.mutation(api.responses.respond, { responseId: ids.response, accept: true }),
    ).rejects.toThrow('eligible');
  });
  it('prevents duplicate requests, overflow acceptances, and accepting another donor’s offer', async () => {
    const { ids, requester, donor } = await fixture();
    await expect(
      requester.mutation(api.requests.create, {
        hospitalId: ids.hospital,
        bloodGroup: 'B+',
        unitsRequired: 1,
        urgency: 'urgent',
        requiredBefore: Date.now() + 3_600_000,
      }),
    ).rejects.toThrow('already have');
    await expect(
      requester.mutation(api.responses.respond, { responseId: ids.response, accept: true }),
    ).rejects.toThrow('belong');
    await donor.mutation(api.responses.respond, { responseId: ids.response, accept: true });
    await expect(
      donor.mutation(api.responses.respond, { responseId: ids.response, accept: true }),
    ).rejects.toThrow('already responded');
  });
  it('expires requests and cancels their open donor offers', async () => {
    const { t, ids } = await fixture();
    await t.run(async (ctx) => ctx.db.patch(ids.request, { requiredBefore: Date.now() - 1 }));
    await t.mutation(internal.requests.expireOne, { requestId: ids.request });
    expect((await t.run((ctx) => ctx.db.get(ids.request)))?.status).toBe('expired');
    expect((await t.run((ctx) => ctx.db.get(ids.response)))?.status).toBe('cancelled');
  });
  it('blocks suspended accounts and prevents requesters reading other people’s notifications', async () => {
    const { t, ids, requester, donor } = await fixture();
    const notificationId = await t.run((ctx) =>
      ctx.db.insert('notifications', {
        userId: ids.donorUser,
        title: 'Private update',
        body: 'Sample',
        read: false,
        createdAt: Date.now(),
        deliveryStatus: 'in_app',
      }),
    );
    await expect(
      requester.mutation(api.notifications.markRead, { notificationId }),
    ).rejects.toThrow('not found');
    await t.run((ctx) => ctx.db.patch(ids.donorUser, { status: 'suspended' }));
    await expect(
      donor.mutation(api.responses.respond, { responseId: ids.response, accept: true }),
    ).rejects.toThrow('suspended');
  });
});
