import { describe, expect, it } from 'vitest';
import { createDemo, demoSnapshot, simulateCommand, DemoState } from '../src/data/demo';
const as = (s: DemoState, userId: string): DemoState => ({ ...s, selectedUserId: userId });
describe('MVP lifecycle and privacy', () => {
  it('tracks acceptance separately from confirmed units, enforces cooldown, and closes fulfilled requests', () => {
    let state = as(createDemo(), 'u-donor');
    const offer = state.responses.find(
      (r) => r.donorUserId === 'u-donor' && r.requestId === 'r-critical',
    )!;
    state = simulateCommand(state, { kind: 'respond', responseId: offer.id, accept: true }).state;
    expect(state.requests.find((r) => r.id === 'r-critical')?.unitsArranged).toBe(0);
    state = simulateCommand(as(state, 'u-coordinator'), {
      kind: 'confirmDonation',
      responseId: offer.id,
    }).state;
    expect(state.requests.find((r) => r.id === 'r-critical')?.status).toBe('partial');
    expect(state.donors.find((d) => d.userId === 'u-donor')?.totalDonations).toBe(4);
    expect(() =>
      simulateCommand(state, { kind: 'confirmDonation', responseId: offer.id }),
    ).toThrow();
    const another = state.responses.find(
      (r) => r.requestId === 'r-critical' && r.donorUserId !== 'u-donor',
    )!;
    state = simulateCommand(as(state, another.donorUserId), {
      kind: 'respond',
      responseId: another.id,
      accept: true,
    }).state;
    state = simulateCommand(as(state, 'u-coordinator'), {
      kind: 'confirmDonation',
      responseId: another.id,
    }).state;
    expect(state.requests.find((r) => r.id === 'r-critical')?.status).toBe('fulfilled');
    expect(
      state.responses.some((r) => r.requestId === 'r-critical' && r.status === 'notified'),
    ).toBe(false);
    state = simulateCommand(as(state, 'u-requester'), {
      kind: 'completeRequest',
      requestId: 'r-critical',
    }).state;
    expect(state.requests.find((r) => r.id === 'r-critical')?.status).toBe('completed');
  });
  it('rejects unauthorized verification and donation confirmation', () => {
    const state = as(createDemo(), 'u-donor');
    expect(() =>
      simulateCommand(state, { kind: 'verify', requestId: 'r-pending', approve: true }),
    ).toThrow('Coordinator');
    expect(() =>
      simulateCommand(state, { kind: 'confirmDonation', responseId: state.responses[0].id }),
    ).toThrow('coordinator');
  });
  it('does not expose donor contacts, other people, reports, or private notes to a browsing donor', () => {
    const view = demoSnapshot(as(createDemo(), 'u-donor'));
    expect(view.users).toEqual([]);
    expect(view.reports).toEqual([]);
    expect(view.requests.find((r) => r.id === 'r-critical')?.description).toBeUndefined();
    expect(view.responses.every((r) => !r.contact && !r.donorName)).toBe(true);
    expect(view.requests.some((r) => r.id === 'r-pending')).toBe(false);
  });
  it('blocks self-granted admin access and premature completion', () => {
    const state = as(createDemo(), 'u-requester');
    expect(() =>
      simulateCommand(state, {
        kind: 'manageUser',
        userId: 'u-requester',
        role: 'admin',
        status: 'active',
      }),
    ).toThrow('Administrator');
    expect(() =>
      simulateCommand(state, { kind: 'completeRequest', requestId: 'r-critical' }),
    ).toThrow('confirmed');
  });
  it('stops outstanding offers when the requester cancels', () => {
    const result = simulateCommand(as(createDemo(), 'u-requester'), {
      kind: 'cancelRequest',
      requestId: 'r-critical',
    });
    expect(
      result.state.responses
        .filter((r) => r.requestId === 'r-critical')
        .every((r) => r.status === 'cancelled'),
    ).toBe(true);
  });
  it('rejects duplicate open requests', () =>
    expect(() =>
      simulateCommand(as(createDemo(), 'u-requester'), {
        kind: 'createRequest',
        input: {
          bloodGroup: 'B+',
          hospitalId: 'h-civil',
          urgency: 'urgent',
          unitsRequired: 1,
          requiredBefore: Date.now() + 3_600_000,
        },
      }),
    ).toThrow('already have'));
});
