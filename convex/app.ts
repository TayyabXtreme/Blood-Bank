import { anyApi } from 'convex/server';
import { v } from 'convex/values';
import { query, mutation, internalMutation, type Doc, type MutationCtx, type Id } from './lib/server';
import { role, type BloodGroup, type Urgency, type OperationalPolicy } from './lib/validators';
import { currentUser, managesHospital, requireAdmin, requireScope, requireStaff, sameScope } from './lib/access';
import { fail, integer, phone, text, timestamp, coordinates } from './lib/validation';
import { calculateEligibility, screeningDisclaimer } from './lib/eligibility';
import { defaultOperationalPolicy } from './lib/scoring';
import { confirmedStatus, openStatuses, requireOpen, unfinishedStatuses } from './lib/lifecycle';
import { audit, expireOne, getConfig, matchBatch, notify, stopResponses } from './workflow';

const bloodGroups: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
const urgencies: Urgency[] = ['Normal', 'Urgent', 'Critical'];
type Payload = Record<string, unknown>;
const s = (p: Payload, key: string, fallback?: string) => typeof p[key] === 'string' ? p[key] as string : fallback ?? fail('VALIDATION', `${key} is required.`);
const n = (p: Payload, key: string, fallback?: number) => typeof p[key] === 'number' ? p[key] as number : fallback ?? fail('VALIDATION', `${key} must be a number.`);
const b = (p: Payload, key: string, fallback: boolean) => p[key] === undefined ? fallback : typeof p[key] === 'boolean' ? p[key] as boolean : fail('VALIDATION', `${key} must be true or false.`);
function group(value: string): BloodGroup { if (!bloodGroups.includes(value as BloodGroup)) fail('VALIDATION', 'Choose a valid blood group.'); return value as BloodGroup; }
function urgency(value: string): Urgency { if (!urgencies.includes(value as Urgency)) fail('VALIDATION', 'Choose a valid urgency.'); return value as Urgency; }
function id<T extends 'bloodRequests' | 'hospitals' | 'users' | 'donorResponses' | 'notifications' | 'reports'>(ctx: MutationCtx, table: T, value: string): Id<T> { const normalized = ctx.db.normalizeId(table, value); if (!normalized) fail('VALIDATION', 'Invalid record identifier.'); return normalized; }
const exposedStatus = (r: Doc<'bloodRequests'>, now: number) => r.requiredBefore <= now && unfinishedStatuses.includes(r.requestStatus) ? 'Expired' : r.requestStatus;

export const snapshot = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const user = await currentUser(ctx, sessionToken), now = Date.now();
    const [allHospitals, allRequests, allResponses, allDonors, allUsers, allDonations, notifications, config] = await Promise.all([
      ctx.db.query('hospitals').collect(), ctx.db.query('bloodRequests').collect(), ctx.db.query('donorResponses').collect(), ctx.db.query('donors').collect(), ctx.db.query('users').collect(), ctx.db.query('donations').collect(),
      ctx.db.query('notifications').withIndex('by_user', q => q.eq('userId', user._id)).order('desc').take(100), getConfig(ctx, user.demo),
    ]);
    const staff = user.role === 'admin' || user.role === 'coordinator';
    const hospitals = allHospitals.filter(h => sameScope(user, h) && (h.active || user.role === 'admin'));
    const donors = allDonors.filter(d => sameScope(user, d)), donor = donors.find(d => d.userId === user._id);
    const users = allUsers.filter(u => sameScope(user, u));
    const hospitalMap = new Map(hospitals.map(h => [h._id, h]));
    const donorMap = new Map(donors.map(d => [d._id, d]));
    const userMap = new Map(users.map(u => [u._id, u]));
    const relevant = allRequests.filter(r => sameScope(user, r) && (user.role === 'admin' || managesHospital(user, r.hospitalId) || r.requesterId === user._id || (r.verificationStatus === 'Verified' && !['Rejected'].includes(r.requestStatus))));
    const responseVisible = (response: Doc<'donorResponses'>) => {
      const request = relevant.find(r => r._id === response.requestId);
      return request && (managesHospital(user, request.hospitalId) || request.requesterId === user._id || donor?._id === response.donorId);
    };
    const responses = allResponses.filter(r => sameScope(user, r) && responseVisible(r)).map(r => {
      const d = donorMap.get(r.donorId), owner = d ? userMap.get(d.userId) : undefined;
      const accepted = r.responseStatus === 'Accepted' || r.donationConfirmed;
      return { id: r._id, requestId: r.requestId, donorId: r.donorId, donorName: accepted || staff || donor?._id === r.donorId ? owner?.name ?? 'Donor' : 'Compatible donor', bloodGroup: d?.bloodGroup, distanceKm: r.distanceKm, matchScore: r.matchScore, responseStatus: r.responseStatus, confirmedUnits: r.confirmedUnits, donationConfirmed: r.donationConfirmed, notifiedAt: r.notifiedAt, ...(accepted && owner?.phone ? { phone: owner.phone, donorPhone: owner.phone } : {}) };
    });
    const requests = relevant.map(r => {
      const h = hospitalMap.get(r.hospitalId), owns = r.requesterId === user._id, manages = managesHospital(user, r.hospitalId), status = exposedStatus(r, now);
      const count = allResponses.filter(response => response.requestId === r._id && response.responseStatus === 'Accepted').length;
      return { id: r._id, requesterId: r.requesterId, bloodGroup: r.bloodGroup, unitsRequired: r.unitsRequired, unitsArranged: r.unitsArranged, hospitalId: r.hospitalId, hospitalName: h?.name ?? 'Hospital', city: h?.city ?? '', urgency: r.urgency, requiredBefore: r.requiredBefore, requestStatus: status, verificationStatus: r.verificationStatus, verified: r.verificationStatus === 'Verified', acceptedDonors: count, canCancel: (owns || manages) && unfinishedStatuses.includes(status), canComplete: (owns || manages) && status === 'Fulfilled', description: owns || manages ? r.description ?? '' : '', createdAt: r.createdAt, searchRadiusKm: r.searchRadiusKm, escalationStage: r.escalationStage, aiSummary: r.aiSummary, aiSuggestedUrgency: r.aiSuggestedUrgency, rejectionReason: owns || manages ? r.rejectionReason : undefined, demo: Boolean(r.demo) };
    });
    const visibleDonations = allDonations.filter(d => sameScope(user, d) && (user.role === 'admin' || managesHospital(user, d.hospitalId) || d.donorId === donor?._id || relevant.find(r => r._id === d.requestId)?.requesterId === user._id)).map(d => ({ id: d._id, requestId: d.requestId, donorId: d.donorId, donorName: userMap.get(donorMap.get(d.donorId)?.userId as Id<'users'>)?.name ?? 'Donor', units: d.units, donatedAt: d.donatedAt, hospitalName: hospitalMap.get(d.hospitalId)?.name ?? 'Hospital' }));
    const managed = relevant.filter(r => user.role === 'admin' || managesHospital(user, r.hospitalId) || r.requesterId === user._id || user.role === 'donor');
    const activeRequests = managed.filter(r => unfinishedStatuses.includes(exposedStatus(r, now))).length;
    const confirmedUnits = visibleDonations.reduce((sum, d) => sum + d.units, 0);
    const statusCounts: Record<string, number> = {}, bloodGroupDemand: Record<string, number> = {}, cityDemand: Record<string, number> = {};
    for (const r of managed) { const status = exposedStatus(r, now); statusCounts[status] = (statusCounts[status] ?? 0) + 1; bloodGroupDemand[r.bloodGroup] = (bloodGroupDemand[r.bloodGroup] ?? 0) + r.unitsRequired; const city = hospitalMap.get(r.hospitalId)?.city ?? ''; cityDemand[city] = (cityDemand[city] ?? 0) + r.unitsRequired; }
    const reports = staff ? (await ctx.db.query('reports').collect()).filter(r => sameScope(user, r) && relevant.some(request => request._id === r.requestId && managesHospital(user, request.hospitalId))).map(r => ({ ...r, id: r._id })) : [];
    const logs = user.role === 'admin' ? (await ctx.db.query('auditLogs').order('desc').take(200)).filter(r => sameScope(user, r)).map(r => ({ ...r, id: r._id })) : [];
    const ownEligibility = donor ? calculateEligibility(donor, config?.eligibility, now) : undefined;
    return {
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, city: user.city, role: user.role, hospitalId: user.hospitalId, accountStatus: user.accountStatus, notificationEnabled: user.notificationEnabled, demo: Boolean(user.demo) },
      donor: donor ? { ...donor, id: donor._id, eligibilityStatus: ownEligibility?.status, eligibilityReason: ownEligibility?.reason } : null,
      users: staff ? users.map(u => { const d = donors.find(row => row.userId === u._id); return { id: u._id, name: u.name, city: u.city, role: u.role, accountStatus: u.accountStatus, hospitalId: u.hospitalId, ...(user.role === 'admin' ? { email: u.email, phone: u.phone } : {}), ...(d ? { donorId: d._id, bloodGroup: d.bloodGroup, available: d.available, eligibilityStatus: calculateEligibility(d, config?.eligibility, now).status, lastDonationDate: d.lastDonationDate, totalDonations: d.totalDonations } : {}) }; }) : [],
      hospitals: hospitals.map(h => ({ id: h._id, name: h.name, city: h.city, address: h.address, latitude: h.latitude, longitude: h.longitude, contact: h.contact, active: h.active, verified: h.verified, kind: h.kind })),
      requests, responses, donations: visibleDonations, notifications: notifications.map(notification => ({ ...notification, id: notification._id })), reports, auditLogs: logs,
      stats: { activeRequests, totalRequests: managed.length, pendingVerification: managed.filter(r => exposedStatus(r, now) === 'Pending Verification').length, fulfilledRequests: managed.filter(r => ['Fulfilled', 'Completed'].includes(r.requestStatus)).length, completedDonations: visibleDonations.length, totalDonations: visibleDonations.length, confirmedUnits, unitsArranged: confirmedUnits, availableDonors: donors.filter(d => d.available).length, totalDonors: donors.length, totalUsers: users.length, statusCounts, bloodGroupDemand, cityDemand, urgentRequests: managed.filter(r => r.urgency !== 'Normal' && openStatuses.includes(exposedStatus(r, now))).length },
      config: { operational: config?.operational ?? defaultOperationalPolicy, eligibility: config?.eligibility ?? null, screeningDisclaimer, demo: Boolean(user.demo), demoPolicyLabel: user.demo ? 'Simulated screening policy for demonstration only; not clinical guidance.' : null, aiAvailable: Boolean(process.env.DEEPSEEK_API_KEY), pushConfigured: Boolean(process.env.EXPO_ACCESS_TOKEN) },
    };
  },
});

export const command = mutation({
  args: { sessionToken: v.string(), operation: v.string(), payload: v.any() },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx, args.sessionToken), now = Date.now();
    if (args.payload === null || typeof args.payload !== 'object' || Array.isArray(args.payload)) fail('VALIDATION', 'Supply an object payload.');
    const p = args.payload as Payload;
    const requestFor = async () => { const r = await ctx.db.get(id(ctx, 'bloodRequests', s(p, 'requestId'))); requireScope(user, r); return r!; };
    const operation = args.operation;
    if (operation === 'createRequest') {
      if (user.role !== 'requester' && user.role !== 'admin' && user.role !== 'coordinator') fail('FORBIDDEN', 'Use a requester account to create requests.');
      const hospitalId = id(ctx, 'hospitals', s(p, 'hospitalId')), hospital = await ctx.db.get(hospitalId); requireScope(user, hospital);
      if (!hospital!.active) fail('VALIDATION', 'This hospital is inactive.');
      const bloodGroup = group(s(p, 'bloodGroup')), unitsRequired = integer(n(p, 'unitsRequired'), 'Units', 1, 100), requiredBefore = timestamp(n(p, 'requiredBefore'), 'Required-by time', now, true), level = urgency(s(p, 'urgency', 'Urgent'));
      if (requiredBefore - now > 30 * 86400000) fail('VALIDATION', 'Required-by time must fall within 30 days.');
      const own = await ctx.db.query('bloodRequests').withIndex('by_requester', q => q.eq('requesterId', user._id)).collect();
      const clientRequestId = s(p, 'clientRequestId', `${now}:${Math.random()}`);
      const previous = own.find(r => r.clientRequestId === clientRequestId); if (previous) return { ok: true, id: previous._id, requestId: previous._id, duplicate: true };
      if (own.filter(r => r.createdAt > now - 3600000).length >= 5) fail('RATE_LIMITED', 'You can create at most five requests per hour.');
      if (own.some(r => r.hospitalId === hospitalId && r.bloodGroup === bloodGroup && unfinishedStatuses.includes(exposedStatus(r, now)))) fail('DUPLICATE_REQUEST', 'You already have an open request for this blood group at this hospital.');
      const description = p.description === undefined ? '' : s(p, 'description').trim(); if (description.length > 1000) fail('VALIDATION', 'Description must be at most 1000 characters.');
      const requestId = await ctx.db.insert('bloodRequests', { demo: Boolean(user.demo), requesterId: user._id, clientRequestId, bloodGroup, unitsRequired, unitsArranged: 0, hospitalId, latitude: hospital!.latitude, longitude: hospital!.longitude, requiredBefore, urgency: level, description, verificationStatus: 'Pending', requestStatus: 'Pending Verification', searchRadiusKm: (await getConfig(ctx, user.demo))?.operational.initialRadiusKm ?? 10, escalationStage: 0, revision: 0, createdAt: now, updatedAt: now });
      await ctx.scheduler.runAt(requiredBefore, anyApi.workflow.expire, { requestId });
      await ctx.scheduler.runAfter(0, anyApi.integrations.summarizeRequest, { requestId });
      for (const staff of await ctx.db.query('users').collect()) if (sameScope(user, staff) && managesHospital(staff, hospitalId)) await notify(ctx, staff._id, 'Verification', 'Request awaiting verification', `${bloodGroup} · ${unitsRequired} units · ${hospital!.name}`, `verify:${requestId}:${staff._id}`, requestId);
      await audit(ctx, user, operation, 'bloodRequest', requestId);
      return { ok: true, id: requestId, requestId };
    }
    if (['verifyRequest', 'rejectRequest', 'cancelRequest', 'completeRequest'].includes(operation)) {
      const request = await requestFor();
      if (await expireOne(ctx, request)) return { ok: false, code: 'REQUEST_EXPIRED', message: 'This request has expired.' };
      if (operation === 'verifyRequest' || operation === 'rejectRequest') {
        requireStaff(user, request.hospitalId);
        if (request.requestStatus !== 'Pending Verification') fail('INVALID_STATE', 'Only pending requests can be verified or rejected.');
        if (operation === 'verifyRequest') {
          const unitsRequired = integer(n(p, 'unitsRequired', request.unitsRequired), 'Units', 1, 100);
          await ctx.db.patch(request._id, { unitsRequired, verificationStatus: 'Verified', verifiedBy: user._id, requestStatus: 'Active', revision: request.revision + 1, updatedAt: now });
          await matchBatch(ctx, request._id, 0);
          await notify(ctx, request.requesterId, 'Verification', 'Request verified', 'Your request is verified. Compatible donors are being matched.', `verified:${request._id}`, request._id);
        } else {
          const reason = text(s(p, 'reason', 'Unable to verify request.'), 'Rejection reason', 500);
          await ctx.db.patch(request._id, { verificationStatus: 'Rejected', requestStatus: 'Rejected', rejectionReason: reason, revision: request.revision + 1, updatedAt: now });
          await notify(ctx, request.requesterId, 'Verification', 'Request rejected', 'The facility could not verify your request. Open the request for details.', `rejected:${request._id}`, request._id);
        }
      } else {
        if (request.requesterId !== user._id && !managesHospital(user, request.hospitalId)) fail('FORBIDDEN', 'Only the requester or authorized facility may close this request.');
        if (operation === 'cancelRequest' && !unfinishedStatuses.includes(request.requestStatus)) fail('INVALID_STATE', 'Only unfinished requests may be cancelled.');
        if (operation === 'completeRequest' && request.requestStatus !== 'Fulfilled') fail('INVALID_STATE', 'Confirm all required units before completion.');
        await ctx.db.patch(request._id, { requestStatus: operation === 'cancelRequest' ? 'Cancelled' : 'Completed', revision: request.revision + 1, updatedAt: now });
        await stopResponses(ctx, request._id);
        await notify(ctx, request.requesterId, 'RequestUpdate', operation === 'cancelRequest' ? 'Request cancelled' : 'Request completed', 'Your blood request status was updated.', `${operation}:${request._id}`, request._id);
      }
      await audit(ctx, user, operation, 'bloodRequest', request._id); return { ok: true, id: request._id };
    }
    if (operation === 'respondRequest') {
      if (user.role !== 'donor') fail('FORBIDDEN', 'Only donors may respond.');
      const request = await requestFor(); requireOpen(request.requestStatus, request.requiredBefore, now);
      const donor = await ctx.db.query('donors').withIndex('by_user', q => q.eq('userId', user._id)).unique(); if (!donor) fail('VALIDATION', 'Complete your donor profile.');
      const response = await ctx.db.query('donorResponses').withIndex('by_request_and_donor', q => q.eq('requestId', request._id).eq('donorId', donor._id)).unique();
      if (!response) fail('FORBIDDEN', 'Respond to a request you have been matched with.');
      if (response.donationConfirmed) fail('INVALID_STATE', 'This donation is already confirmed.');
      const responseValue = p.responseStatus ?? p.response ?? p.status ?? (p.accept === true ? 'Accepted' : p.accept === false ? 'Declined' : undefined);
      const responseStatus = responseValue === 'accept' ? 'Accepted' : responseValue === 'decline' ? 'Declined' : responseValue;
      if (responseStatus !== 'Accepted' && responseStatus !== 'Declined') fail('VALIDATION', 'Choose Accepted or Declined.');
      if (responseStatus === response.responseStatus) return { ok: true, id: response._id };
      if (responseStatus === 'Accepted') {
        const eligibility = calculateEligibility(donor, (await getConfig(ctx, user.demo))?.eligibility, now);
        if (!donor.available || eligibility.status !== 'PreliminaryEligible') fail('INELIGIBLE', eligibility.reason);
        const accepted = await ctx.db.query('donorResponses').withIndex('by_request_status', q => q.eq('requestId', request._id).eq('responseStatus', 'Accepted')).collect();
        if (request.unitsArranged + accepted.filter(r => !r.donationConfirmed).length >= request.unitsRequired) fail('SUFFICIENT_DONORS', 'Enough donors have already accepted this request.');
        const other = await ctx.db.query('donorResponses').withIndex('by_donor', q => q.eq('donorId', donor._id)).collect();
        for (const r of other) if (r.requestId !== request._id && r.responseStatus === 'Accepted' && !r.donationConfirmed) { const otherRequest = await ctx.db.get(r.requestId); if (otherRequest && openStatuses.includes(exposedStatus(otherRequest, now))) fail('DONOR_COMMITTED', 'Complete or decline your other accepted request first.'); }
      }
      await ctx.db.patch(response._id, { responseStatus, responseTime: now });
      await notify(ctx, request.requesterId, 'RequestUpdate', responseStatus === 'Accepted' ? 'A donor accepted' : 'A donor declined', responseStatus === 'Accepted' ? 'A matched donor is ready to coordinate. Units count after facility confirmation.' : 'Matching continues for your request.', `response:${response._id}:${responseStatus}:${now}`, request._id);
      if (responseStatus === 'Declined') await ctx.scheduler.runAfter(0, anyApi.workflow.escalate, { requestId: request._id, expectedStage: request.escalationStage });
      await audit(ctx, user, operation, 'donorResponse', response._id); return { ok: true, id: response._id };
    }
    if (operation === 'confirmDonation') {
      const response = await ctx.db.get(id(ctx, 'donorResponses', s(p, 'responseId'))); requireScope(user, response);
      const request = await ctx.db.get(response!.requestId); requireScope(user, request); requireStaff(user, request!.hospitalId);
      if (response!.donationConfirmed) return { ok: true, id: response!._id, alreadyConfirmed: true };
      requireOpen(request!.requestStatus, request!.requiredBefore, now);
      if (response!.responseStatus !== 'Accepted') fail('INVALID_STATE', 'Only accepted donors may have donations confirmed.');
      const units = integer(n(p, 'units', 1), 'Confirmed units', 1, 100);
      if (units > request!.unitsRequired - request!.unitsArranged) fail('VALIDATION', 'Confirmed units exceed the remaining requested units.');
      const donor = await ctx.db.get(response!.donorId); requireScope(user, donor);
      const donationId = await ctx.db.insert('donations', { demo: Boolean(user.demo), requestId: request!._id, responseId: response!._id, donorId: donor!._id, hospitalId: request!.hospitalId, units, confirmedBy: user._id, donatedAt: now });
      await ctx.db.patch(response!._id, { donationConfirmed: true, donationConfirmedBy: user._id, donationConfirmedAt: now, confirmedUnits: units });
      await ctx.db.patch(donor!._id, { totalDonations: donor!.totalDonations + 1, lastDonationDate: now, neverDonated: false, eligibilityStatus: 'TemporarilyIneligible', updatedAt: now });
      const unitsArranged = request!.unitsArranged + units, status = confirmedStatus(unitsArranged, request!.unitsRequired);
      await ctx.db.patch(request!._id, { unitsArranged, requestStatus: status, updatedAt: now, revision: request!.revision + 1 });
      if (status === 'Fulfilled') await stopResponses(ctx, request!._id);
      // A just-donated donor must not remain committed to another unconfirmed donation.
      for (const other of await ctx.db.query('donorResponses').withIndex('by_donor', q => q.eq('donorId', donor!._id)).collect()) if (other._id !== response!._id && other.responseStatus === 'Accepted' && !other.donationConfirmed) { await ctx.db.patch(other._id, { responseStatus: 'Cancelled' }); const r = await ctx.db.get(other.requestId); if (r) await ctx.scheduler.runAfter(0, anyApi.workflow.escalate, { requestId: r._id, expectedStage: r.escalationStage }); }
      await notify(ctx, donor!.userId, 'DonationConfirmed', 'Donation confirmed', `The facility confirmed ${units} unit(s). Thank you for helping.`, `donation:${donationId}:donor`, request!._id);
      await notify(ctx, request!.requesterId, 'DonationConfirmed', status === 'Fulfilled' ? 'Required units confirmed' : 'Donation confirmed', `${unitsArranged} of ${request!.unitsRequired} units confirmed by the facility.`, `donation:${donationId}:requester`, request!._id);
      await audit(ctx, user, operation, 'donation', donationId); return { ok: true, id: donationId, unitsArranged, requestStatus: status };
    }
    if (operation === 'updateProfile') {
      const patch: Partial<Doc<'users'>> = { updatedAt: now };
      if (p.name !== undefined) patch.name = text(s(p, 'name'), 'Name');
      if (p.city !== undefined) patch.city = text(s(p, 'city'), 'City');
      if (p.phone !== undefined) patch.phone = phone(s(p, 'phone'));
      if (p.notificationEnabled !== undefined) patch.notificationEnabled = b(p, 'notificationEnabled', true);
      await ctx.db.patch(user._id, patch);
      const donor = await ctx.db.query('donors').withIndex('by_user', q => q.eq('userId', user._id)).first();
      if (donor) await ctx.db.patch(donor._id, { ...(patch.notificationEnabled !== undefined ? { notificationEnabled: patch.notificationEnabled } : {}), ...(patch.city ? { city: patch.city } : {}), updatedAt: now });
      await audit(ctx, user, operation, 'user', user._id); return { ok: true };
    }
    if (operation === 'updateDonorProfile' || operation === 'setAvailability') {
      if (user.role !== 'donor') fail('FORBIDDEN', 'Only donors may update donor profiles.');
      const donor = await ctx.db.query('donors').withIndex('by_user', q => q.eq('userId', user._id)).unique();
      const profile = { demo: Boolean(user.demo), userId: user._id, bloodGroup: group(s(p, 'bloodGroup', donor?.bloodGroup ?? 'O+')), city: text(s(p, 'city', donor?.city ?? user.city), 'City'), age: integer(n(p, 'age', donor?.age ?? 0), 'Age', 1, 120), neverDonated: b(p, 'neverDonated', donor?.neverDonated ?? true), available: b(p, 'available', donor?.available ?? false), selfReportedDeferral: b(p, 'selfReportedDeferral', donor?.selfReportedDeferral ?? false), totalDonations: donor?.totalDonations ?? 0, notificationEnabled: b(p, 'notificationEnabled', donor?.notificationEnabled ?? user.notificationEnabled), updatedAt: now,
        ...(donor?.latitude !== undefined ? { latitude: donor.latitude, longitude: donor.longitude } : {}), ...(donor?.lastDonationDate !== undefined ? { lastDonationDate: donor.lastDonationDate } : {}), ...(donor?.temporaryUnavailableUntil !== undefined ? { temporaryUnavailableUntil: donor.temporaryUnavailableUntil } : {}) };
      if (p.latitude !== undefined || p.longitude !== undefined) { const latitude = n(p, 'latitude'), longitude = n(p, 'longitude'); coordinates(latitude, longitude); Object.assign(profile, { latitude, longitude }); }
      if (p.lastDonationDate !== undefined) Object.assign(profile, { lastDonationDate: p.lastDonationDate === null ? undefined : timestamp(n(p, 'lastDonationDate'), 'Last donation date', now, false) });
      if (p.temporaryUnavailableUntil !== undefined) Object.assign(profile, { temporaryUnavailableUntil: p.temporaryUnavailableUntil === null ? undefined : timestamp(n(p, 'temporaryUnavailableUntil'), 'Pause-until time', now, true) });
      if (donor && donor.totalDonations > 0) {
        const latestConfirmed = await ctx.db.query('donations').withIndex('by_donor', q => q.eq('donorId', donor._id)).order('desc').first();
        if (latestConfirmed) Object.assign(profile, { neverDonated: false, lastDonationDate: Math.max(latestConfirmed.donatedAt, 'lastDonationDate' in profile && typeof profile.lastDonationDate === 'number' ? profile.lastDonationDate : 0) });
      }
      const eligibility = calculateEligibility(profile, (await getConfig(ctx, user.demo))?.eligibility, now);
      if (donor) await ctx.db.patch(donor._id, { ...profile, eligibilityStatus: eligibility.status }); else await ctx.db.insert('donors', { ...profile, eligibilityStatus: eligibility.status });
      await audit(ctx, user, operation, 'user', user._id); return { ok: true, eligibilityStatus: eligibility.status };
    }
    if (operation === 'markNotificationRead' || operation === 'markAllRead') {
      const notifications = operation === 'markAllRead' ? await ctx.db.query('notifications').withIndex('by_user_and_read', q => q.eq('userId', user._id).eq('read', false)).collect() : [await ctx.db.get(id(ctx, 'notifications', s(p, 'notificationId')))];
      for (const notification of notifications) { if (!notification || notification.userId !== user._id) fail('FORBIDDEN', 'This notification does not belong to you.'); await ctx.db.patch(notification._id, { read: true }); }
      return { ok: true };
    }
    if (operation === 'reportRequest') {
      const request = await requestFor(); const previous = await ctx.db.query('reports').withIndex('by_reporter_request', q => q.eq('reporterId', user._id).eq('requestId', request._id)).first();
      if (previous) return { ok: true, id: previous._id };
      const reportId = await ctx.db.insert('reports', { demo: Boolean(user.demo), requestId: request._id, reporterId: user._id, reason: text(s(p, 'reason'), 'Report reason', 500), details: s(p, 'details', '').slice(0, 1000), status: 'Open', createdAt: now });
      await audit(ctx, user, operation, 'report', reportId); return { ok: true, id: reportId };
    }
    if (operation === 'resolveReport') {
      const report = await ctx.db.get(id(ctx, 'reports', s(p, 'reportId'))); requireScope(user, report); const request = await ctx.db.get(report!.requestId); requireScope(user, request); requireStaff(user, request!.hospitalId);
      const status = s(p, 'status', 'Resolved'); if (status !== 'Resolved' && status !== 'Dismissed') fail('VALIDATION', 'Choose Resolved or Dismissed.');
      await ctx.db.patch(report!._id, { status, resolvedBy: user._id, resolvedAt: now, resolution: text(s(p, 'resolution', 'Reviewed by the facility.'), 'Resolution', 500) });
      await audit(ctx, user, operation, 'report', report!._id); return { ok: true };
    }
    if (operation === 'saveHospital') {
      requireAdmin(user); const latitude = n(p, 'latitude'), longitude = n(p, 'longitude'); coordinates(latitude, longitude);
      const kind = s(p, 'kind', 'hospital'); if (kind !== 'hospital' && kind !== 'bloodBank') fail('VALIDATION', 'Choose hospital or bloodBank.');
      const values = { demo: Boolean(user.demo), name: text(s(p, 'name'), 'Hospital name'), city: text(s(p, 'city'), 'City'), address: text(s(p, 'address'), 'Address', 300), latitude, longitude, verified: b(p, 'verified', true), active: b(p, 'active', true), kind: kind as 'hospital' | 'bloodBank', updatedAt: now };
      const hospitalId = p.hospitalId ? id(ctx, 'hospitals', s(p, 'hospitalId')) : undefined;
      let saved: Id<'hospitals'>;
      if (hospitalId) { const hospital = await ctx.db.get(hospitalId); requireScope(user, hospital); await ctx.db.patch(hospitalId, values); saved = hospitalId; } else saved = await ctx.db.insert('hospitals', { ...values, createdAt: now });
      await audit(ctx, user, operation, 'hospital', saved); return { ok: true, id: saved };
    }
    if (operation === 'setUserStatus' || operation === 'setUserRole') {
      requireAdmin(user); const targetId = id(ctx, 'users', s(p, 'userId')), target = await ctx.db.get(targetId); requireScope(user, target);
      if (targetId === user._id) fail('FORBIDDEN', 'Administrators cannot revoke their own access.');
      if (operation === 'setUserStatus') { const accountStatus = s(p, 'accountStatus', s(p, 'status', 'suspended')).toLowerCase(); if (accountStatus !== 'active' && accountStatus !== 'suspended') fail('VALIDATION', 'Choose active or suspended.'); await ctx.db.patch(targetId, { accountStatus, updatedAt: now });
        if (accountStatus === 'suspended') {
          const donor = await ctx.db.query('donors').withIndex('by_user', q => q.eq('userId', targetId)).first();
          if (donor) {
            await ctx.db.patch(donor._id, { available: false, updatedAt: now });
            for (const response of await ctx.db.query('donorResponses').withIndex('by_donor', q => q.eq('donorId', donor._id)).collect()) {
              if (!response.donationConfirmed && ['Accepted', 'Notified'].includes(response.responseStatus)) {
                await ctx.db.patch(response._id, { responseStatus: 'Cancelled' });
                const request = await ctx.db.get(response.requestId);
                if (request) await ctx.scheduler.runAfter(0, anyApi.workflow.escalate, { requestId: request._id, expectedStage: request.escalationStage });
              }
            }
          }
        }
      }
      else { const nextRole = s(p, 'role'); if (!['requester', 'donor', 'coordinator', 'admin'].includes(nextRole)) fail('VALIDATION', 'Invalid role.'); let hospitalId: Id<'hospitals'> | undefined; if (nextRole === 'coordinator') { hospitalId = id(ctx, 'hospitals', s(p, 'hospitalId')); requireScope(user, await ctx.db.get(hospitalId)); } await ctx.db.patch(targetId, { role: nextRole as Doc<'users'>['role'], hospitalId, updatedAt: now }); }
      await audit(ctx, user, operation, 'user', targetId); return { ok: true };
    }
    if (operation === 'setConfig') {
      requireAdmin(user); const existing = await getConfig(ctx, user.demo);
      const operational = validateOperational(p.operational ?? existing?.operational ?? defaultOperationalPolicy);
      let eligibility = existing?.eligibility;
      if (p.eligibility !== undefined) {
        if (p.eligibility === null) eligibility = undefined;
        else { const e = p.eligibility as Payload; const minimumAge = integer(n(e, 'minimumAge'), 'Minimum age', 1, 120), maximumAge = integer(n(e, 'maximumAge'), 'Maximum age', minimumAge, 120), minimumDonationIntervalDays = integer(n(e, 'minimumDonationIntervalDays'), 'Donation interval', 1, 3650); eligibility = { minimumAge, maximumAge, minimumDonationIntervalDays, reference: text(s(e, 'reference'), 'Facility policy reference', 500), approvedBy: user._id, approvedAt: now }; }
      }
      const values = { demo: Boolean(user.demo), key: 'main' as const, operational, eligibility, updatedBy: user._id, updatedAt: now };
      if (existing) await ctx.db.patch(existing._id, values); else await ctx.db.insert('platformConfig', values);
      await audit(ctx, user, operation, 'platformConfig', existing?._id ?? 'main'); return { ok: true };
    }
    if (operation === 'registerPushDevice') {
      const token = s(p, 'expoPushToken'); if (!/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/.test(token)) fail('VALIDATION', 'Invalid Expo push token.');
      const platform = s(p, 'platform'); if (platform !== 'android' && platform !== 'ios') fail('VALIDATION', 'Choose android or ios.');
      const existing = await ctx.db.query('pushDevices').withIndex('by_push_token', q => q.eq('expoPushToken', token)).first();
      if (existing && existing.userId !== user._id) fail('FORBIDDEN', 'This token is associated with another account.');
      if (existing) await ctx.db.patch(existing._id, { active: true, lastUsedAt: now }); else await ctx.db.insert('pushDevices', { demo: Boolean(user.demo), userId: user._id, expoPushToken: token, platform, active: true, createdAt: now, lastUsedAt: now });
      return { ok: true };
    }
    fail('UNKNOWN_OPERATION', 'This operation is not supported.');
  },
});

function validateOperational(raw: unknown): OperationalPolicy {
  if (!raw || typeof raw !== 'object') fail('VALIDATION', 'Operational policy must be an object.'); const p = raw as Payload;
  const initialRadiusKm = n(p, 'initialRadiusKm'), maximumRadiusKm = n(p, 'maximumRadiusKm'), radiusStepKm = n(p, 'radiusStepKm');
  if (![initialRadiusKm, maximumRadiusKm, radiusStepKm].every(x => Number.isFinite(x) && x > 0 && x <= 1000) || initialRadiusKm > maximumRadiusKm) fail('VALIDATION', 'Search radii must be positive, ordered and at most 1000 km.');
  const firstBatchSize = integer(n(p, 'firstBatchSize'), 'First batch', 1, 50), laterBatchSize = integer(n(p, 'laterBatchSize'), 'Later batch', 1, 100), maximumStages = integer(n(p, 'maximumStages'), 'Maximum stages', 1, 30), escalationDelayMs = integer(n(p, 'escalationDelayMs'), 'Escalation delay', 10000, 86400000), criticalDelayMs = integer(n(p, 'criticalDelayMs'), 'Critical delay', 10000, 86400000);
  if (!p.matchingWeights || typeof p.matchingWeights !== 'object') fail('VALIDATION', 'Matching weights are required.'); const w = p.matchingWeights as Payload;
  const matchingWeights = { distance: n(w, 'distance'), availability: n(w, 'availability'), readiness: n(w, 'readiness'), reliability: n(w, 'reliability'), urgency: n(w, 'urgency') };
  if (!Object.values(matchingWeights).every(x => Number.isFinite(x) && x >= 0 && x <= 1) || Object.values(matchingWeights).reduce((a, c) => a + c, 0) <= 0) fail('VALIDATION', 'Weights must be nonnegative with a positive total.');
  return { initialRadiusKm, maximumRadiusKm, radiusStepKm, firstBatchSize, laterBatchSize, maximumStages, escalationDelayMs, criticalDelayMs, matchingWeights };
}

export const startDemo = mutation({
  args: { role, demoUserId: v.optional(v.id('users')) },
  handler: async (ctx, args) => {
    if (process.env.DEMO_MODE !== 'true') fail('DEMO_DISABLED', 'Demo mode is disabled on this deployment.');
    await seedDemo(ctx);
    let user = args.demoUserId ? await ctx.db.get(args.demoUserId) : await ctx.db.query('users').withIndex('by_auth_user_id', q => q.eq('authUserId', `demo:${args.role}`)).unique();
    if (args.demoUserId && (!user?.demo || user.role !== args.role)) fail('DEMO_UNAVAILABLE', 'Choose a demo identity with the requested role.');
    if (args.role === 'donor' && !args.demoUserId) {
      const config = await getConfig(ctx, true);
      const primary = user ? await ctx.db.query('donors').withIndex('by_user', q => q.eq('userId', user!._id)).first() : null;
      const ready = primary && primary.available && user?.accountStatus === 'active' && calculateEligibility(primary, config?.eligibility, Date.now()).status === 'PreliminaryEligible';
      if (!ready) {
        const candidates: { user: Doc<'users'>; hasOpenInvitation: boolean; matchScore: number }[] = [];
        for (const donor of await ctx.db.query('donors').withIndex('by_available', q => q.eq('available', true)).collect()) {
          if (!donor.demo || calculateEligibility(donor, config?.eligibility, Date.now()).status !== 'PreliminaryEligible') continue;
          const owner = await ctx.db.get(donor.userId);
          if (!owner?.demo || owner.role !== 'donor' || owner.accountStatus !== 'active') continue;
          let hasOpenInvitation = false, matchScore = 0, committed = false;
          for (const response of await ctx.db.query('donorResponses').withIndex('by_donor', q => q.eq('donorId', donor._id)).collect()) {
            const request = await ctx.db.get(response.requestId);
            if (!request || !openStatuses.includes(exposedStatus(request, Date.now()))) continue;
            if (response.responseStatus === 'Accepted' && !response.donationConfirmed) committed = true;
            if (response.responseStatus === 'Notified') { hasOpenInvitation = true; matchScore = Math.max(matchScore, response.matchScore); }
          }
          if (!committed) candidates.push({ user: owner, hasOpenInvitation, matchScore });
        }
        candidates.sort((a, c) => Number(c.hasOpenInvitation) - Number(a.hasOpenInvitation) || c.matchScore - a.matchScore || a.user._id.localeCompare(c.user._id));
        if (candidates.length) user = candidates[0].user;
      }
    }
    if (!user?.demo || user.accountStatus !== 'active') fail('DEMO_UNAVAILABLE', 'This demo role is unavailable.');
    const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
    const sessionToken = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const expiresAt = Date.now() + 8 * 3600000;
    const sessionId = await ctx.db.insert('demoSessions', { token: sessionToken, userId: user._id, expiresAt, createdAt: Date.now() });
    await ctx.scheduler.runAt(expiresAt, anyApi.workflow.expireSession, { sessionId });
    return { sessionToken, expiresAt, demo: true };
  },
});

async function seedDemo(ctx: MutationCtx) {
  if (await ctx.db.query('users').withIndex('by_auth_user_id', q => q.eq('authUserId', 'demo:admin')).first()) return;
  const now = Date.now();
  const hospitalIds: Id<'hospitals'>[] = [];
  for (const hospital of [
    { name: 'Civil Hospital', city: 'Karachi', address: 'Baba-e-Urdu Road, Karachi', latitude: 24.8597, longitude: 67.0101 },
    { name: 'Jinnah Postgraduate Medical Centre', city: 'Karachi', address: 'Rafiqui Shaheed Road, Karachi', latitude: 24.8525, longitude: 67.0432 },
    { name: 'Aga Khan University Hospital', city: 'Karachi', address: 'Stadium Road, Karachi', latitude: 24.8919, longitude: 67.0748 },
    { name: 'Indus Hospital', city: 'Karachi', address: 'Korangi Crossing, Karachi', latitude: 24.8171, longitude: 67.1114 },
  ]) hospitalIds.push(await ctx.db.insert('hospitals', { ...hospital, demo: true, verified: true, active: true, kind: 'hospital', createdAt: now, updatedAt: now }));
  const identities = [{ role: 'admin' as const, name: 'Ayesha Admin' }, { role: 'coordinator' as const, name: 'Dr. Sara Ahmed' }, { role: 'requester' as const, name: 'Munib Khan' }, { role: 'donor' as const, name: 'Ali Hassan' }];
  const ids: Partial<Record<Doc<'users'>['role'], Id<'users'>>> = {};
  for (const identity of identities) ids[identity.role] = await ctx.db.insert('users', { demo: true, authUserId: `demo:${identity.role}`, name: identity.name, email: `${identity.role}@demo.invalid`, phone: '+923000000000', city: 'Karachi', role: identity.role, accountStatus: 'active', onboardingCompleted: true, notificationEnabled: true, ...(identity.role === 'coordinator' ? { hospitalId: hospitalIds[0] } : {}), createdAt: now, updatedAt: now });
  await ctx.db.insert('platformConfig', { demo: true, key: 'main', operational: defaultOperationalPolicy, eligibility: { minimumAge: 18, maximumAge: 65, minimumDonationIntervalDays: 90, reference: 'SIMULATED DEMO POLICY ONLY — not clinical guidance or a production screening policy.', approvedBy: ids.admin!, approvedAt: now }, updatedBy: ids.admin!, updatedAt: now });
  for (let i = 0; i < 16; i++) {
    const userId = i === 0 ? ids.donor! : await ctx.db.insert('users', { demo: true, authUserId: `demo:donor:${i}`, name: ['Hamza Ali', 'Fatima Noor', 'Usman Raza', 'Zainab Ahmed', 'Bilal Khan', 'Hira Shah', 'Omar Siddiqui', 'Mariam Abbas'][i % 8], email: `donor${i}@demo.invalid`, city: 'Karachi', role: 'donor', accountStatus: 'active', onboardingCompleted: true, notificationEnabled: true, createdAt: now, updatedAt: now });
    await ctx.db.insert('donors', { demo: true, userId, bloodGroup: i === 0 ? 'O-' : bloodGroups[i % bloodGroups.length], city: 'Karachi', latitude: 24.8597 + (i % 4) * 0.008, longitude: 67.0101 + (i % 3) * 0.009, age: 25 + i, neverDonated: true, available: true, selfReportedDeferral: false, eligibilityStatus: 'PreliminaryEligible', totalDonations: 0, notificationEnabled: true, updatedAt: now });
  }
  const demoRequests = [
    { bloodGroup: 'B+' as const, unitsRequired: 2, urgency: 'Critical' as const, description: 'Demo request: facility coordination required.', hospitalId: hospitalIds[0], requestStatus: 'Active' as const, verificationStatus: 'Verified' as const },
    { bloodGroup: 'A+' as const, unitsRequired: 3, urgency: 'Urgent' as const, description: 'Demo request awaiting verification.', hospitalId: hospitalIds[0], requestStatus: 'Pending Verification' as const, verificationStatus: 'Pending' as const },
    { bloodGroup: 'O-' as const, unitsRequired: 1, urgency: 'Urgent' as const, description: 'Demo community request.', hospitalId: hospitalIds[1], requestStatus: 'Active' as const, verificationStatus: 'Verified' as const },
  ];
  for (let i = 0; i < demoRequests.length; i++) {
    const r = demoRequests[i], hospital = await ctx.db.get(r.hospitalId), requiredBefore = now + (6 + i * 3) * 3600000;
    const requestId = await ctx.db.insert('bloodRequests', { ...r, demo: true, requesterId: ids.requester!, clientRequestId: `seed:${i}`, unitsArranged: 0, latitude: hospital!.latitude, longitude: hospital!.longitude, requiredBefore, searchRadiusKm: 10, escalationStage: 0, revision: 0, createdAt: now - i * 1800000, updatedAt: now });
    await ctx.scheduler.runAt(requiredBefore, anyApi.workflow.expire, { requestId });
    if (r.verificationStatus === 'Verified') await matchBatch(ctx, requestId, 0);
    else await notify(ctx, ids.coordinator!, 'Verification', 'Request awaiting verification', `${r.bloodGroup} · ${r.unitsRequired} units · Civil Hospital`, `verify:${requestId}:${ids.coordinator}`, requestId);
  }
  await notify(ctx, ids.requester!, 'RequestUpdate', 'Welcome to the demo', 'This isolated sandbox uses fictional identities and simulated donor screening.', 'demo:welcome');
}

// Deployment operators bootstrap real administrators through the internal API, never the client.
export const bootstrapAdmin = internalMutation({
  args: { authUserId: v.string(), name: v.string(), email: v.string(), city: v.string() },
  handler: async (ctx, args) => {
    if ((await ctx.db.query('users').withIndex('by_role', q => q.eq('role', 'admin')).collect()).some(u => !u.demo)) fail('ALREADY_BOOTSTRAPPED', 'A production administrator already exists.');
    if (await ctx.db.query('users').withIndex('by_auth_user_id', q => q.eq('authUserId', args.authUserId)).first()) fail('DUPLICATE_ACCOUNT', 'This auth identity already exists.');
    const now = Date.now(), userId = await ctx.db.insert('users', { authUserId: text(args.authUserId, 'Auth identity', 300), name: text(args.name, 'Name'), email: text(args.email, 'Email', 300), city: text(args.city, 'City'), role: 'admin', accountStatus: 'active', onboardingCompleted: true, notificationEnabled: true, createdAt: now, updatedAt: now });
    await ctx.db.insert('platformConfig', { key: 'main', operational: defaultOperationalPolicy, updatedBy: userId, updatedAt: now });
    return { userId };
  },
});
