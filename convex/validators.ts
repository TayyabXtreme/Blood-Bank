import { v } from 'convex/values';
export const bloodGroup = v.union(
  v.literal('O-'),
  v.literal('O+'),
  v.literal('A-'),
  v.literal('A+'),
  v.literal('B-'),
  v.literal('B+'),
  v.literal('AB-'),
  v.literal('AB+'),
);
export const role = v.union(
  v.literal('requester'),
  v.literal('donor'),
  v.literal('coordinator'),
  v.literal('admin'),
);
export const urgency = v.union(v.literal('normal'), v.literal('urgent'), v.literal('critical'));
export const requestStatus = v.union(
  v.literal('pending'),
  v.literal('active'),
  v.literal('contacted'),
  v.literal('partial'),
  v.literal('fulfilled'),
  v.literal('completed'),
  v.literal('cancelled'),
  v.literal('expired'),
  v.literal('rejected'),
);
export const responseStatus = v.union(
  v.literal('notified'),
  v.literal('accepted'),
  v.literal('declined'),
  v.literal('no_response'),
  v.literal('cancelled'),
);
export const settingsFields = {
  donationIntervalDays: v.number(),
  minAge: v.number(),
  maxAge: v.number(),
  initialRadiusKm: v.number(),
  maxRadiusKm: v.number(),
  batchSize: v.number(),
  escalationMinutes: v.number(),
  distanceWeight: v.number(),
  readinessWeight: v.number(),
  reliabilityWeight: v.number(),
};
