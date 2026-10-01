import type { EligibilityPolicy } from './validators';

export const screeningDisclaimer = 'Eligibility is preliminary. Final donor eligibility must be determined by qualified healthcare professionals or the receiving blood facility.';
export type EligibilityInput = { age: number; lastDonationDate?: number; neverDonated: boolean; temporaryUnavailableUntil?: number; selfReportedDeferral: boolean };
export function calculateEligibility(donor: EligibilityInput, policy: EligibilityPolicy | undefined, now: number) {
  if (donor.selfReportedDeferral || (donor.temporaryUnavailableUntil ?? 0) > now) return { status: 'TemporarilyIneligible' as const, reason: 'A temporary pause or self-reported deferral is active.' };
  if (!policy) return { status: 'NeedsReview' as const, reason: 'A facility-approved screening policy has not been configured.' };
  if (donor.age < policy.minimumAge || donor.age > policy.maximumAge) return { status: 'TemporarilyIneligible' as const, reason: 'Age is outside the configured preliminary screening policy.' };
  if (!donor.neverDonated && donor.lastDonationDate === undefined) return { status: 'NeedsReview' as const, reason: 'Add the last donation date or confirm no previous donation.' };
  if (donor.lastDonationDate !== undefined && (donor.lastDonationDate > now || now - donor.lastDonationDate < policy.minimumDonationIntervalDays * 86400000)) return { status: 'TemporarilyIneligible' as const, reason: 'The configured donation interval has not elapsed.' };
  return { status: 'PreliminaryEligible' as const, reason: screeningDisclaimer };
}
