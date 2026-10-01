import { snapshotValidator, type SnapshotDto } from './dto';
import { query } from './_generated/server';
import { currentUser, getSettings } from './lib/permissions';

import type { Doc } from './_generated/dataModel';

function dto<T extends { _id: string; _creationTime: number }>(
  doc: T,
): Omit<T, '_id' | '_creationTime'> & { id: T['_id'] } {
  const { _id, _creationTime, ...rest } = doc;
  void _creationTime;
  return { ...rest, id: _id };
}
function publicUser(user: Doc<'users'>) {
  const { authUserId, ...rest } = dto(user);
  void authUserId;
  return rest;
}
export const snapshot = query({
  args: {},
  returns: snapshotValidator,
  handler: async (ctx): Promise<SnapshotDto> => {
    const user = await currentUser(ctx),
      settings = await getSettings(ctx);
    const empty: SnapshotDto = {
      user: user ? publicUser(user) : null,
      donor: null,
      hospitals: [],
      requests: [],
      responses: [],
      notifications: [],
      donations: [],
      users: [],
      reports: [],
      audits: [],
      settings,
      stats: { donors: 0, requests: 0, donations: 0 },
    };
    if (!user || user.status === 'suspended') return empty;
    const admin = user.role === 'admin',
      coordinator = user.role === 'coordinator';
    const donor = await ctx.db
      .query('donors')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .unique();
    const hospitals = await ctx.db.query('hospitals').order('desc').take(500);
    const recent = await ctx.db
      .query('bloodRequests')
      .withIndex('by_created_at')
      .order('desc')
      .take(250);
    const own = await ctx.db
      .query('bloodRequests')
      .withIndex('by_requester', (q) => q.eq('requesterId', user._id))
      .order('desc')
      .take(200);
    const assignedHospital = user.hospitalId;
    const managed =
      coordinator && assignedHospital
        ? await ctx.db
            .query('bloodRequests')
            .withIndex('by_hospital', (q) => q.eq('hospitalId', assignedHospital))
            .order('desc')
            .take(250)
        : [];
    const offers = donor
      ? await ctx.db
          .query('donorResponses')
          .withIndex('by_donor', (q) => q.eq('donorId', donor._id))
          .order('desc')
          .take(200)
      : [];
    const offeredRequests = (await Promise.all(offers.map((r) => ctx.db.get(r.requestId)))).filter(
      (r): r is Doc<'bloodRequests'> => r !== null,
    );
    const uniqueRequests = new Map(
      [...recent, ...own, ...managed, ...offeredRequests].map((r) => [r._id, r]),
    );
    const visibleRequests = [...uniqueRequests.values()]
      .filter(
        (r) =>
          admin ||
          r.requesterId === user._id ||
          (coordinator && r.hospitalId === user.hospitalId) ||
          r.verification === 'verified',
      )
      .sort((a, b) => b.createdAt - a.createdAt);
    const responses: SnapshotDto['responses'] = [];
    for (const request of visibleRequests) {
      const manager = admin || (coordinator && request.hospitalId === user.hospitalId),
        owner = request.requesterId === user._id;
      const items =
        manager || owner
          ? await ctx.db
              .query('donorResponses')
              .withIndex('by_request', (q) => q.eq('requestId', request._id))
              .order('desc')
              .take(100)
          : offers.filter((r) => r.requestId === request._id);
      for (const item of items) {
        const { confirmedBy, ...view } = dto(item);
        void confirmedBy;
        const accepted = item.status === 'accepted' || item.donationConfirmed;
        const donorProfile = accepted && (manager || owner) ? await ctx.db.get(item.donorId) : null;
        const donorUser = donorProfile ? await ctx.db.get(donorProfile.userId) : null;
        responses.push({
          ...view,
          donorName: accepted && (manager || owner) ? donorUser?.name : undefined,
          contact:
            accepted && (manager || owner) && donorProfile?.shareContact
              ? donorUser?.phone
              : undefined,
        });
      }
    }
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);
    const donations = admin
      ? await ctx.db.query('donations').order('desc').take(500)
      : await ctx.db
          .query('donations')
          .withIndex('by_donor', (q) => q.eq('donorUserId', user._id))
          .order('desc')
          .take(200);
    const users = admin ? await ctx.db.query('users').order('desc').take(500) : [];
    const reports = admin ? await ctx.db.query('reports').order('desc').take(200) : [];
    const audits = admin
      ? await ctx.db.query('auditLogs').withIndex('by_created_at').order('desc').take(100)
      : [];
    const availableDonors = await ctx.db
      .query('donors')
      .withIndex('by_available', (q) => q.eq('available', true))
      .take(1000);
    return {
      user: publicUser(user),
      donor: donor
        ? (() => {
            const { updatedAt, ...view } = dto(donor);
            void updatedAt;
            return view;
          })()
        : null,
      hospitals: hospitals.filter((h) => admin || h.active).map(dto),
      requests: visibleRequests.map((request) => {
        const {
          verifiedBy,
          nextEscalationAt,
          matchingStartedAt,
          description,
          rejectionReason,
          ...view
        } = dto(request);
        void verifiedBy;
        void nextEscalationAt;
        void matchingStartedAt;
        const privateAccess =
          request.requesterId === user._id ||
          admin ||
          (coordinator && request.hospitalId === user.hospitalId);
        return {
          ...view,
          description: privateAccess ? description : undefined,
          rejectionReason: privateAccess ? rejectionReason : undefined,
        };
      }),
      responses,
      notifications: notifications.map(({ deliveryError, ...item }) => {
        void deliveryError;
        return dto(item);
      }),
      donations: donations.map(({ confirmedBy, responseId, ...item }) => {
        void confirmedBy;
        void responseId;
        return dto(item);
      }),
      users: users.map(publicUser),
      reports: reports.map(({ resolvedBy, ...item }) => {
        void resolvedBy;
        return dto(item);
      }),
      audits: audits.map(dto),
      settings,
      stats: {
        donors: availableDonors.length,
        requests: visibleRequests.filter((r) =>
          ['active', 'contacted', 'partial'].includes(r.status),
        ).length,
        donations: donations.length,
      },
    };
  },
});
