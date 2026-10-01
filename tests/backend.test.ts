import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { anyApi } from 'convex/server';
import schema from '../convex/schema';
import { isCompatible, compatibleDonors } from '../convex/lib/compatibility';
import { calculateEligibility } from '../convex/lib/eligibility';
import { haversineKm } from '../convex/lib/haversine';
import { scoreMatch, defaultOperationalPolicy } from '../convex/lib/scoring';
import { needsMoreDonors } from '../convex/lib/lifecycle';

const modules = {
  '../convex/app.ts': () => import('../convex/app'),
  '../convex/workflow.ts': () => import('../convex/workflow'),
  '../convex/integrations.ts': () => import('../convex/integrations'),
  // Backend uses schema-derived wrappers so generated files are not required in unit tests.
  '../convex/_generated/server.ts': async () => ({}),
};
beforeEach(() => { vi.useFakeTimers(); vi.stubEnv('DEMO_MODE', 'true'); vi.stubEnv('DEEPSEEK_API_KEY', ''); });
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });
const newTest = () => convexTest(schema, modules);
type Backend = ReturnType<typeof newTest>;
async function start(t: Backend, role: string) { return (await t.mutation(anyApi.app.startDemo, { role })).sessionToken as string; }
async function snapshot(t: Backend, sessionToken: string) { return await t.query(anyApi.app.snapshot, { sessionToken }); }
async function command(t: Backend, sessionToken: string, operation: string, payload: object) { return await t.mutation(anyApi.app.command, { sessionToken, operation, payload }); }

describe('blood matching fundamentals', () => {
  it('checks all 64 ABO/Rh combinations', () => {
    const groups = Object.keys(compatibleDonors) as (keyof typeof compatibleDonors)[];
    const expected = { 'O-': ['O-'], 'O+': ['O-', 'O+'], 'A-': ['O-', 'A-'], 'A+': ['O-', 'O+', 'A-', 'A+'], 'B-': ['O-', 'B-'], 'B+': ['O-', 'O+', 'B-', 'B+'], 'AB-': ['O-', 'A-', 'B-', 'AB-'], 'AB+': groups };
    for (const recipient of groups) for (const donor of groups) expect(isCompatible(donor, recipient)).toBe(expected[recipient].includes(donor));
  });
  it('requires a facility policy and obeys deferrals', () => {
    const donor = { age: 30, neverDonated: true, selfReportedDeferral: false };
    expect(calculateEligibility(donor, undefined, Date.now()).status).toBe('NeedsReview');
    expect(calculateEligibility({ ...donor, selfReportedDeferral: true }, undefined, Date.now()).status).toBe('TemporarilyIneligible');
  });
  it('ranks nearby donors and rejects unavailable or distant donors', () => {
    const input = { available: true, eligible: true, reliability: 0.5, urgency: 'Urgent' as const, radiusKm: 10 };
    expect(scoreMatch({ ...input, distanceKm: 1 }, defaultOperationalPolicy.matchingWeights)).toBeGreaterThan(scoreMatch({ ...input, distanceKm: 8 }, defaultOperationalPolicy.matchingWeights));
    expect(scoreMatch({ ...input, available: false, distanceKm: 1 }, defaultOperationalPolicy.matchingWeights)).toBe(0);
    expect(scoreMatch({ ...input, distanceKm: 11 }, defaultOperationalPolicy.matchingWeights)).toBe(0);
    expect(haversineKm({ latitude: 24.85, longitude: 67 }, { latitude: 24.85, longitude: 67 })).toBe(0);
    expect(needsMoreDonors(2, 0, 2)).toBe(false);
  });
});

describe('Convex authorization and request lifecycle', () => {
  it('disables demo access by default and rejects forged sessions', async () => {
    const t = newTest(); vi.stubEnv('DEMO_MODE', 'false');
    await expect(start(t, 'admin')).rejects.toThrow('disabled');
    await expect(snapshot(t, 'forged-admin-token')).rejects.toThrow('Sign in');
  });
  it('keeps production rows invisible and immutable to demo administrators', async () => {
    const t = newTest(), token = await start(t, 'admin');
    const production = await t.mutation(anyApi.app.bootstrapAdmin, { authUserId: 'real-admin', name: 'Production Admin', email: 'admin@example.test', city: 'Lahore' });
    const state = await snapshot(t, token);
    expect(state.users.some((u: { id: string }) => u.id === production.userId)).toBe(false);
    await expect(command(t, token, 'setUserStatus', { userId: production.userId, status: 'suspended' })).rejects.toThrow('unavailable');
  });
  it('blocks role escalation, unassigned staff actions and premature completion', async () => {
    const t = newTest(), requester = await start(t, 'requester'), donor = await start(t, 'donor'), coordinator = await start(t, 'coordinator');
    const state = await snapshot(t, requester), pending = state.requests.find((r: { requestStatus: string }) => r.requestStatus === 'Pending Verification');
    await expect(command(t, requester, 'verifyRequest', { requestId: pending.id })).rejects.toThrow('authorized');
    await expect(command(t, requester, 'setUserRole', { userId: state.user.id, role: 'admin' })).rejects.toThrow('Administrator');
    await command(t, requester, 'updateProfile', { role: 'admin', name: 'Requester Safe' });
    expect((await snapshot(t, requester)).user.role).toBe('requester');
    const otherHospital = state.hospitals.find((h: { id: string }) => h.id !== (awaitSnapshotHospital(state.requests)));
    const created = await command(t, requester, 'createRequest', { hospitalId: otherHospital.id, bloodGroup: 'AB-', unitsRequired: 1, urgency: 'Normal', requiredBefore: Date.now() + 3600000 });
    await expect(command(t, coordinator, 'verifyRequest', { requestId: created.requestId })).rejects.toThrow('authorized');
    await expect(command(t, requester, 'completeRequest', { requestId: pending.id })).rejects.toThrow('Confirm all');
    await expect(command(t, donor, 'createRequest', { hospitalId: state.hospitals[0].id })).rejects.toThrow('requester');
  });
  it('counts only confirmed donations and makes confirmation idempotent', async () => {
    const t = newTest(), donorToken = await start(t, 'donor'), coordinator = await start(t, 'coordinator'), requester = await start(t, 'requester');
    const donorState = await snapshot(t, donorToken), response = donorState.responses.find((r: { requestId: string }) => donorState.requests.find((q: { id: string; hospitalId: string }) => q.id === r.requestId && q.hospitalId === donorState.hospitals[0].id));
    await command(t, donorToken, 'respondRequest', { requestId: response.requestId, response: 'Accepted' });
    let state = await snapshot(t, requester); expect(state.requests.find((r: { id: string }) => r.id === response.requestId).unitsArranged).toBe(0);
    const accepted = state.responses.find((r: { id: string }) => r.id === response.id); expect(accepted.donorName).toBe('Ali Hassan');
    await expect(command(t, requester, 'confirmDonation', { responseId: response.id, units: 2 })).rejects.toThrow('authorized');
    await command(t, coordinator, 'confirmDonation', { responseId: response.id, units: 2 });
    await command(t, coordinator, 'confirmDonation', { responseId: response.id, units: 2 });
    state = await snapshot(t, requester);
    expect(state.requests.find((r: { id: string }) => r.id === response.requestId).unitsArranged).toBe(2);
    expect(state.donations.filter((r: { requestId: string }) => r.requestId === response.requestId)).toHaveLength(1);
    await command(t, requester, 'completeRequest', { requestId: response.requestId });
    expect((await snapshot(t, requester)).requests.find((r: { id: string }) => r.id === response.requestId).requestStatus).toBe('Completed');
    expect((await snapshot(t, donorToken)).donor.eligibilityStatus).toBe('TemporarilyIneligible');
  });
  it('verifies pending requests, ranks batches and hides donor identity before acceptance', async () => {
    const t = newTest(), requester = await start(t, 'requester'), coordinator = await start(t, 'coordinator');
    const state = await snapshot(t, requester), pending = state.requests.find((r: { requestStatus: string }) => r.requestStatus === 'Pending Verification');
    await command(t, coordinator, 'verifyRequest', { requestId: pending.id });
    const updated = await snapshot(t, requester), responses = updated.responses.filter((r: { requestId: string }) => r.requestId === pending.id);
    expect(responses.length).toBeGreaterThan(0); expect(responses.length).toBeLessThanOrEqual(5);
    expect(responses.every((r: { donorName: string; phone?: string }) => r.donorName === 'Compatible donor' && !r.phone)).toBe(true);
    expect(updated.requests.find((r: { id: string }) => r.id === pending.id).verified).toBe(true);
  });
  it('expires requests atomically and prevents later acceptance', async () => {
    const t = newTest(), donor = await start(t, 'donor'), requester = await start(t, 'requester');
    const state = await snapshot(t, donor), response = state.responses[0];
    await t.run(async ctx => { await ctx.db.patch(response.requestId, { requiredBefore: Date.now() - 1 }); });
    await t.mutation(anyApi.workflow.expire, { requestId: response.requestId });
    expect((await snapshot(t, requester)).requests.find((r: { id: string }) => r.id === response.requestId).requestStatus).toBe('Expired');
    await expect(command(t, donor, 'respondRequest', { requestId: response.requestId, response: 'Accepted' })).rejects.toThrow('no longer');
  });
  it('keeps AI fallback honest when no backend key is configured', async () => {
    const t = newTest(), requester = await start(t, 'requester'), state = await snapshot(t, requester);
    const result = await t.action(anyApi.integrations.assist, { sessionToken: requester, requestId: state.requests[0].id });
    expect(result.available).toBe(false); expect(result.source).toBe('rules'); expect(result.message).toContain('no server API key');
  });
  it('revokes suspended sessions and cancels donor commitments', async () => {
    const t = newTest(), admin = await start(t, 'admin'), donor = await start(t, 'donor');
    const state = await snapshot(t, donor), response = state.responses[0];
    await command(t, donor, 'respondRequest', { requestId: response.requestId, response: 'Accepted' });
    await command(t, admin, 'setUserStatus', { userId: state.user.id, accountStatus: 'Suspended' });
    await expect(snapshot(t, donor)).rejects.toThrow('suspended');
    const cancelled = await t.run(ctx => ctx.db.get(ctx.db.normalizeId('donorResponses', response.id)!)); expect(cancelled?.responseStatus).toBe('Cancelled');
  });
  it('issues independent random tokens and expires sessions after the TTL', async () => {
    const t = newTest(), token1 = await start(t, 'requester'), token2 = await start(t, 'requester');
    expect(token1).toMatch(/^[a-f0-9]{64}$/); expect(token1).not.toBe(token2);
    await t.run(async ctx => { const session = await ctx.db.query('demoSessions').withIndex('by_token', q => q.eq('token', token1)).unique(); await ctx.db.patch(session!._id, { expiresAt: Date.now() - 1 }); });
    await expect(snapshot(t, token1)).rejects.toThrow('Sign in');
    expect((await snapshot(t, token2)).user.role).toBe('requester');
  });
  it('does not let donor profile edits erase a confirmed donation interval', async () => {
    const t = newTest(), donor = await start(t, 'donor'), coordinator = await start(t, 'coordinator');
    const state = await snapshot(t, donor), response = state.responses.find((r: { requestId: string }) => state.requests.find((q: { id: string; hospitalId: string }) => q.id === r.requestId && q.hospitalId === state.hospitals[0].id));
    await command(t, donor, 'respondRequest', { requestId: response.requestId, response: 'Accepted' });
    await command(t, coordinator, 'confirmDonation', { responseId: response.id, units: 1 });
    await command(t, donor, 'updateDonorProfile', { neverDonated: true, lastDonationDate: null });
    const updated = await snapshot(t, donor); expect(updated.donor.neverDonated).toBe(false); expect(updated.donor.lastDonationDate).toBe(Date.now()); expect(updated.donor.eligibilityStatus).toBe('TemporarilyIneligible');
  });
  it('rotates demo donor entry to an eligible fictional actor while preserving history', async () => {
    const t = newTest(), donor = await start(t, 'donor'), coordinator = await start(t, 'coordinator');
    const initial = await snapshot(t, donor), response = initial.responses.find((r: { requestId: string }) => initial.requests.find((q: { id: string; hospitalId: string }) => q.id === r.requestId && q.hospitalId === initial.hospitals[0].id));
    await command(t, donor, 'respondRequest', { requestId: response.requestId, response: 'Accepted' });
    await command(t, coordinator, 'confirmDonation', { responseId: response.id, units: 1 });
    const alternate = await snapshot(t, await start(t, 'donor'));
    expect(alternate.user.id).not.toBe(initial.user.id);
    expect(alternate.user.demo).toBe(true);
    expect(alternate.donor.eligibilityStatus).toBe('PreliminaryEligible');
    expect(alternate.responses.some((r: { responseStatus: string }) => r.responseStatus === 'Notified')).toBe(true);
    expect((await snapshot(t, donor)).donations).toHaveLength(1);
    const selected = await t.mutation(anyApi.app.startDemo, { role: 'donor', demoUserId: initial.user.id });
    expect((await snapshot(t, selected.sessionToken)).user.id).toBe(initial.user.id);
    await expect(t.mutation(anyApi.app.startDemo, { role: 'admin', demoUserId: alternate.user.id })).rejects.toThrow('requested role');
  });
});
function awaitSnapshotHospital(requests: { hospitalId: string; requestStatus: string }[]) { return requests.find(r => r.requestStatus === 'Pending Verification')?.hospitalId; }
