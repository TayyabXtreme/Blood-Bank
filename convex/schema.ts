import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
  bloodGroup,
  requestStatus,
  responseStatus,
  role,
  settingsFields,
  urgency,
} from './validators';

export default defineSchema({
  seedRuns: defineTable({
    key: v.string(),
    createdAt: v.number(),
    users: v.array(v.id('users')),
    donors: v.array(v.id('donors')),
    hospitals: v.array(v.id('hospitals')),
    requests: v.array(v.id('bloodRequests')),
    responses: v.array(v.id('donorResponses')),
    donations: v.array(v.id('donations')),
  }).index('by_key', ['key']),
  users: defineTable({
    authUserId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role,
    city: v.string(),
    hospitalId: v.optional(v.id('hospitals')),
    status: v.union(v.literal('active'), v.literal('suspended')),
    onboardingCompleted: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_auth_user', ['authUserId'])
    .index('by_email', ['email'])
    .index('by_role', ['role'])
    .index('by_account_status', ['status'])
    .index('by_hospital', ['hospitalId']),
  donors: defineTable({
    userId: v.id('users'),
    bloodGroup,
    city: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    age: v.number(),
    lastDonationDate: v.optional(v.number()),
    available: v.boolean(),
    temporaryUnavailableUntil: v.optional(v.number()),
    questionnairePassed: v.boolean(),
    totalDonations: v.number(),
    notificationEnabled: v.boolean(),
    shareContact: v.boolean(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_blood_group', ['bloodGroup'])
    .index('by_available', ['available'])
    .index('by_city', ['city']),
  hospitals: defineTable({
    name: v.string(),
    city: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    contact: v.optional(v.string()),
    verified: v.boolean(),
    active: v.boolean(),
  })
    .index('by_city', ['city'])
    .index('by_active', ['active']),
  bloodRequests: defineTable({
    requesterId: v.id('users'),
    bloodGroup,
    unitsRequired: v.number(),
    unitsArranged: v.number(),
    hospitalId: v.id('hospitals'),
    urgency,
    requiredBefore: v.number(),
    description: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    aiSuggestedUrgency: v.optional(urgency),
    status: requestStatus,
    verification: v.union(v.literal('pending'), v.literal('verified'), v.literal('rejected')),
    searchRadiusKm: v.number(),
    escalationStage: v.number(),
    nextEscalationAt: v.optional(v.number()),
    matchingStartedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id('users')),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_requester', ['requesterId'])
    .index('by_requester_and_time', ['requesterId', 'createdAt'])
    .index('by_duplicate', ['requesterId', 'hospitalId', 'bloodGroup', 'status', 'requiredBefore'])
    .index('by_status', ['status'])
    .index('by_status_and_deadline', ['status', 'requiredBefore'])
    .index('by_verification', ['verification'])
    .index('by_urgency', ['urgency'])
    .index('by_hospital', ['hospitalId'])
    .index('by_created_at', ['createdAt']),
  donorResponses: defineTable({
    requestId: v.id('bloodRequests'),
    donorId: v.id('donors'),
    donorUserId: v.id('users'),
    matchScore: v.number(),
    distanceKm: v.number(),
    stage: v.number(),
    status: responseStatus,
    notifiedAt: v.number(),
    respondedAt: v.optional(v.number()),
    donationConfirmed: v.boolean(),
    confirmedBy: v.optional(v.id('users')),
  })
    .index('by_request', ['requestId'])
    .index('by_donor', ['donorId'])
    .index('by_request_and_donor', ['requestId', 'donorId'])
    .index('by_response_status', ['status'])
    .index('by_request_open', ['requestId', 'status', 'donationConfirmed'])
    .index('by_donor_open', ['donorId', 'status', 'donationConfirmed']),
  notifications: defineTable({
    userId: v.id('users'),
    requestId: v.optional(v.id('bloodRequests')),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    deliveryStatus: v.string(),
    deliveryError: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_read', ['userId', 'read']),
  pushDevices: defineTable({
    userId: v.id('users'),
    expoPushToken: v.string(),
    platform: v.union(v.literal('android'), v.literal('ios')),
    active: v.boolean(),
    createdAt: v.number(),
    lastUsedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_push_token', ['expoPushToken']),
  pushDeliveries: defineTable({
    notificationId: v.id('notifications'),
    deviceId: v.id('pushDevices'),
    ticketId: v.optional(v.string()),
    status: v.string(),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_ticket', ['ticketId']),
  donations: defineTable({
    donorUserId: v.id('users'),
    requestId: v.id('bloodRequests'),
    responseId: v.id('donorResponses'),
    hospitalId: v.id('hospitals'),
    bloodGroup,
    donatedAt: v.number(),
    confirmedBy: v.id('users'),
  })
    .index('by_donor', ['donorUserId'])
    .index('by_request', ['requestId'])
    .index('by_response', ['responseId']),
  reports: defineTable({
    requestId: v.id('bloodRequests'),
    reporterId: v.id('users'),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.union(v.literal('open'), v.literal('resolved'), v.literal('dismissed')),
    resolvedBy: v.optional(v.id('users')),
    createdAt: v.number(),
  })
    .index('by_request', ['requestId'])
    .index('by_status', ['status'])
    .index('by_reporter', ['reporterId'])
    .index('by_request_reporter', ['requestId', 'reporterId', 'status']),
  auditLogs: defineTable({
    actorId: v.id('users'),
    action: v.string(),
    entityId: v.string(),
    createdAt: v.number(),
  }).index('by_created_at', ['createdAt']),
  settings: defineTable(settingsFields),
});
