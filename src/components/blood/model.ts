import type { BloodGroup, RequestStatus, Urgency } from '../../../convex/lib/validators';

/** Public request-card view model: never includes donor or patient contact data. */
export type BloodRequestSummary = {
  id: string;
  bloodGroup: BloodGroup;
  urgency: Urgency;
  hospitalName: string;
  city: string;
  unitsRequired: number;
  unitsArranged: number;
  requiredBefore: number;
  requestStatus: RequestStatus;
  verified: boolean;
  acceptedDonors?: number;
  distanceKm?: number;
};

export const closedRequestStatuses: ReadonlySet<RequestStatus> = new Set(['Completed', 'Cancelled', 'Expired', 'Rejected']);
export const bloodGroups: readonly BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
export const requestStatuses: readonly RequestStatus[] = ['Pending Verification', 'Active', 'Donors Contacted', 'Partially Fulfilled', 'Fulfilled', 'Completed', 'Cancelled', 'Expired', 'Rejected'];

export function deadlineLabel(requiredBefore: number, now = Date.now()) {
  const hours = Math.ceil((requiredBefore - now) / 3_600_000);
  return hours <= 0 ? 'Required time passed' : hours === 1 ? 'Within 1 hour' : `Within ${hours} hours`;
}

export function relativeTime(timestamp: number, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (hours < 48) return 'Yesterday';
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }).format(timestamp);
}

export function notificationDay(timestamp: number, now = Date.now()) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' });
  if (date.format(timestamp) === date.format(now)) return 'Today';
  if (date.format(timestamp) === date.format(now - 86_400_000)) return 'Yesterday';
  return new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'long', year: 'numeric' }).format(timestamp);
}
