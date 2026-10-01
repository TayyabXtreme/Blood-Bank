import { BloodGroup, Donor, RequestStatus, Settings, Urgency } from './types';

export const DAY = 86_400_000;
export const defaultSettings: Settings = {
  donationIntervalDays: 90,
  minAge: 18,
  maxAge: 65,
  initialRadiusKm: 10,
  maxRadiusKm: 50,
  batchSize: 5,
  escalationMinutes: 10,
  distanceWeight: 40,
  readinessWeight: 20,
  reliabilityWeight: 10,
};
export const compatibility: Record<BloodGroup, readonly BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};
export const isCompatible = (donor: BloodGroup, recipient: BloodGroup) =>
  compatibility[recipient].includes(donor);
export const isOpen = (status: RequestStatus) =>
  ['active', 'contacted', 'partial'].includes(status);
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dlat = rad(b.latitude - a.latitude),
    dlon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function eligibility(
  donor: Pick<
    Donor,
    'age' | 'lastDonationDate' | 'questionnairePassed' | 'temporaryUnavailableUntil'
  >,
  settings = defaultSettings,
  now = Date.now(),
) {
  if (donor.age < settings.minAge || donor.age > settings.maxAge)
    return {
      eligible: false,
      reason: `Age must be ${settings.minAge}–${settings.maxAge} under current policy.`,
    };
  if (!donor.questionnairePassed)
    return { eligible: false, reason: 'Please review your donor screening answers.' };
  if (donor.temporaryUnavailableUntil && donor.temporaryUnavailableUntil > now)
    return { eligible: false, reason: 'Your donation availability is paused.' };
  if (donor.lastDonationDate) {
    const nextDate = donor.lastDonationDate + settings.donationIntervalDays * DAY;
    if (nextDate > now)
      return {
        eligible: false,
        reason: `Your next preliminary eligibility date is ${new Date(nextDate).toLocaleDateString()}.`,
        nextDate,
      };
  }
  return {
    eligible: true,
    reason: 'Ready for preliminary matching. Hospital screening is still required.',
  };
}
export function matchScore(
  km: number,
  radiusKm: number,
  lastDonationDate: number | undefined,
  urgency: Urgency,
  reliability = 0.5,
  settings = defaultSettings,
  now = Date.now(),
) {
  const distance = Math.max(0, 1 - km / radiusKm);
  const readiness = lastDonationDate
    ? Math.min(1, (now - lastDonationDate) / (settings.donationIntervalDays * DAY * 2))
    : 1;
  const urgencyScore =
    urgency === 'critical'
      ? Math.max(0, 1 - km / 15)
      : urgency === 'urgent'
        ? Math.max(0, 1 - km / 30)
        : 0.7;
  const totalWeight =
    settings.distanceWeight + settings.readinessWeight + settings.reliabilityWeight + 30;
  return Math.round(
    (100 *
      (distance * settings.distanceWeight +
        readiness * settings.readinessWeight +
        reliability * settings.reliabilityWeight +
        20 +
        urgencyScore * 10)) /
      totalWeight,
  );
}
export const statusLabels: Record<RequestStatus, string> = {
  pending: 'Pending verification',
  active: 'Active',
  contacted: 'Finding donors',
  partial: 'Partially fulfilled',
  fulfilled: 'Fulfilled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  rejected: 'Rejected',
};
export const medicalNotice =
  'Eligibility is preliminary. Final donor eligibility must be determined by qualified healthcare professionals or the receiving blood facility.';
