import { v, type Infer } from 'convex/values';

export const bloodGroup = v.union(v.literal('O-'), v.literal('O+'), v.literal('A-'), v.literal('A+'), v.literal('B-'), v.literal('B+'), v.literal('AB-'), v.literal('AB+'));
export const role = v.union(v.literal('requester'), v.literal('donor'), v.literal('coordinator'), v.literal('admin'));
export const selfRole = v.union(v.literal('requester'), v.literal('donor'));
export const urgency = v.union(v.literal('Normal'), v.literal('Urgent'), v.literal('Critical'));
export const requestStatus = v.union(v.literal('Pending Verification'), v.literal('Active'), v.literal('Donors Contacted'), v.literal('Partially Fulfilled'), v.literal('Fulfilled'), v.literal('Completed'), v.literal('Cancelled'), v.literal('Expired'), v.literal('Rejected'));
export const verificationStatus = v.union(v.literal('Pending'), v.literal('Verified'), v.literal('Rejected'));
export const responseStatus = v.union(v.literal('Notified'), v.literal('Accepted'), v.literal('Declined'), v.literal('NoResponse'), v.literal('Cancelled'));
export const eligibilityStatus = v.union(v.literal('NeedsReview'), v.literal('PreliminaryEligible'), v.literal('TemporarilyIneligible'));
export const accountStatus = v.union(v.literal('active'), v.literal('suspended'));
export const notificationType = v.union(v.literal('DonorRequest'), v.literal('RequestUpdate'), v.literal('Verification'), v.literal('DonationConfirmed'));
export const deliveryStatus = v.union(v.literal('InAppOnly'), v.literal('Pending'), v.literal('Sending'), v.literal('Sent'), v.literal('Failed'), v.literal('Skipped'));
export const weights = v.object({ distance: v.number(), availability: v.number(), readiness: v.number(), reliability: v.number(), urgency: v.number() });
export const eligibilityPolicy = v.object({ minimumAge: v.number(), maximumAge: v.number(), minimumDonationIntervalDays: v.number(), reference: v.string(), approvedBy: v.id('users'), approvedAt: v.number() });
export const operationalPolicy = v.object({ initialRadiusKm: v.number(), maximumRadiusKm: v.number(), radiusStepKm: v.number(), firstBatchSize: v.number(), laterBatchSize: v.number(), escalationDelayMs: v.number(), criticalDelayMs: v.number(), maximumStages: v.number(), matchingWeights: weights });

export type BloodGroup = Infer<typeof bloodGroup>;
export type Role = Infer<typeof role>;
export type RequestStatus = Infer<typeof requestStatus>;
export type Urgency = Infer<typeof urgency>;
export type EligibilityPolicy = Infer<typeof eligibilityPolicy>;
export type MatchingWeights = Infer<typeof weights>;
export type OperationalPolicy = Infer<typeof operationalPolicy>;
