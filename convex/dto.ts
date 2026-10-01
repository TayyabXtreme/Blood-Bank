import { v, type Infer } from 'convex/values';
import schema from './schema';
import { settingsFields } from './validators';

// Derive the client contract from stored documents while stripping private fields.
const user = schema
  .doc('users')
  .omit('_id', '_creationTime', 'authUserId')
  .extend({ id: v.id('users') });
const donor = schema
  .doc('donors')
  .omit('_id', '_creationTime', 'updatedAt')
  .extend({ id: v.id('donors') });
const hospital = schema
  .doc('hospitals')
  .omit('_id', '_creationTime')
  .extend({ id: v.id('hospitals') });
const request = schema
  .doc('bloodRequests')
  .omit('_id', '_creationTime', 'verifiedBy', 'nextEscalationAt', 'matchingStartedAt')
  .extend({ id: v.id('bloodRequests') });
const response = schema
  .doc('donorResponses')
  .omit('_id', '_creationTime', 'confirmedBy')
  .extend({
    id: v.id('donorResponses'),
    donorName: v.optional(v.string()),
    contact: v.optional(v.string()),
  });
const notification = schema
  .doc('notifications')
  .omit('_id', '_creationTime', 'deliveryError')
  .extend({ id: v.id('notifications') });
const donation = schema
  .doc('donations')
  .omit('_id', '_creationTime', 'responseId', 'confirmedBy')
  .extend({ id: v.id('donations') });
const report = schema
  .doc('reports')
  .omit('_id', '_creationTime', 'resolvedBy')
  .extend({ id: v.id('reports') });
const audit = schema
  .doc('auditLogs')
  .omit('_id', '_creationTime')
  .extend({ id: v.id('auditLogs') });

export const snapshotValidator = v.object({
  user: v.union(v.null(), user),
  donor: v.union(v.null(), donor),
  hospitals: v.array(hospital),
  requests: v.array(request),
  responses: v.array(response),
  notifications: v.array(notification),
  donations: v.array(donation),
  users: v.array(user),
  reports: v.array(report),
  audits: v.array(audit),
  settings: v.object(settingsFields),
  stats: v.object({ donors: v.number(), requests: v.number(), donations: v.number() }),
});

export type SnapshotDto = Infer<typeof snapshotValidator>;
