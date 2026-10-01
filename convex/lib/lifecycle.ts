import type { RequestStatus } from './validators';
import { fail } from './validation';

export const openStatuses: RequestStatus[] = ['Active', 'Donors Contacted', 'Partially Fulfilled'];
export const unfinishedStatuses: RequestStatus[] = ['Pending Verification', ...openStatuses];
export function requireOpen(status: RequestStatus, deadline: number, now: number) {
  if (!openStatuses.includes(status) || deadline <= now) fail('REQUEST_CLOSED', 'This request is no longer accepting donor responses.');
}
export function confirmedStatus(unitsArranged: number, unitsRequired: number): RequestStatus {
  return unitsArranged >= unitsRequired ? 'Fulfilled' : unitsArranged > 0 ? 'Partially Fulfilled' : 'Donors Contacted';
}
export function needsMoreDonors(unitsRequired: number, unitsArranged: number, unconfirmedAccepted: number) { return unitsArranged + unconfirmedAccepted < unitsRequired; }
