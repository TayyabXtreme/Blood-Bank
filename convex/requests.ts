import { v } from 'convex/values';
import { mutation, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { bloodGroup, urgency } from './validators';
import { audit, canCoordinate, fail, getSettings, requireUser } from './lib/permissions';
import { isOpen } from '../src/domain/rules';
import { notify } from './notifications';

export const create = mutation({
  args: {
    bloodGroup,
    unitsRequired: v.number(),
    hospitalId: v.id('hospitals'),
    urgency,
    requiredBefore: v.number(),
    description: v.optional(v.string()),
  },
  returns: v.id('bloodRequests'),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      now = Date.now();
    if (!Number.isInteger(args.unitsRequired) || args.unitsRequired < 1 || args.unitsRequired > 20)
      return fail('Units must be between 1 and 20.');
    if (
      !Number.isFinite(args.requiredBefore) ||
      args.requiredBefore <= now ||
      args.requiredBefore > now + 30 * 86_400_000
    )
      return fail('Required-by time must be within the next 30 days.');
    if ((args.description?.length ?? 0) > 600)
      return fail('Description must be under 600 characters.');
    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital?.active || !hospital.verified)
      return fail('Choose an active, verified hospital.');
    const recent = await ctx.db
      .query('bloodRequests')
      .withIndex('by_requester_and_time', (q) =>
        q.eq('requesterId', user._id).gt('createdAt', now - 3_600_000),
      )
      .take(5);
    if (recent.length >= 5) return fail('You have reached the hourly request limit.');
    for (const status of ['pending', 'active', 'contacted', 'partial'] as const) {
      const duplicate = await ctx.db
        .query('bloodRequests')
        .withIndex('by_duplicate', (q) =>
          q
            .eq('requesterId', user._id)
            .eq('hospitalId', args.hospitalId)
            .eq('bloodGroup', args.bloodGroup)
            .eq('status', status)
            .gt('requiredBefore', now),
        )
        .first();
      if (duplicate)
        return fail('You already have an open request for this blood group at this hospital.');
    }
    const settings = await getSettings(ctx);
    const requestId = await ctx.db.insert('bloodRequests', {
      ...args,
      description: args.description?.trim(),
      requesterId: user._id,
      unitsArranged: 0,
      status: 'pending',
      verification: 'pending',
      searchRadiusKm: settings.initialRadiusKm,
      escalationStage: 0,
      createdAt: now,
      updatedAt: now,
    });
    await audit(ctx, user._id, 'REQUEST_CREATED', requestId);
    const reviewers = [
      ...(await ctx.db
        .query('users')
        .withIndex('by_role', (q) => q.eq('role', 'admin'))
        .take(100)),
      ...(await ctx.db
        .query('users')
        .withIndex('by_hospital', (q) => q.eq('hospitalId', args.hospitalId))
        .take(100)),
    ];
    for (const reviewer of reviewers.filter(
      (u) =>
        u.status === 'active' &&
        (u.role === 'admin' || (u.role === 'coordinator' && u.hospitalId === args.hospitalId)),
    ))
      await notify(
        ctx,
        reviewer._id,
        'Request needs verification',
        `${args.bloodGroup} · ${hospital.name} · ${args.unitsRequired} units`,
        requestId,
      );
    await ctx.scheduler.runAfter(0, internal.ai.summarize, { requestId });
    await ctx.scheduler.runAt(args.requiredBefore, internal.requests.expireOne, { requestId });
    return requestId;
  },
});
export const verify = mutation({
  args: { requestId: v.id('bloodRequests'), approve: v.boolean(), reason: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      request = await ctx.db.get(args.requestId);
    if (!request || !canCoordinate(user, request)) return fail('You cannot verify this request.');
    if (request.status !== 'pending' || request.requiredBefore <= Date.now())
      return fail('This request can no longer be verified.');
    const hospital = await ctx.db.get(request.hospitalId);
    if (args.approve && (!hospital?.active || !hospital.verified))
      return fail('The receiving hospital must still be active and verified.');
    if (!args.approve && (!args.reason?.trim() || args.reason.length > 300))
      return fail('Enter a rejection reason (up to 300 characters).');
    await ctx.db.patch(request._id, {
      status: args.approve ? 'active' : 'rejected',
      verification: args.approve ? 'verified' : 'rejected',
      verifiedBy: user._id,
      rejectionReason: args.approve ? undefined : args.reason?.trim(),
      updatedAt: Date.now(),
    });
    await audit(ctx, user._id, args.approve ? 'REQUEST_VERIFIED' : 'REQUEST_REJECTED', request._id);
    await notify(
      ctx,
      request.requesterId,
      args.approve ? 'Your request is verified' : 'Your request was rejected',
      args.approve
        ? 'We are reaching out to compatible donors.'
        : 'Open your request to see the verification decision.',
      request._id,
    );
    if (args.approve)
      await ctx.scheduler.runAfter(0, internal.matching.runBatch, { requestId: request._id });
  },
});
export const cancel = mutation({
  args: { requestId: v.id('bloodRequests') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      request = await ctx.db.get(args.requestId);
    if (!request || (request.requesterId !== user._id && !canCoordinate(user, request)))
      return fail('You cannot cancel this request.');
    if (!['pending', 'active', 'contacted', 'partial'].includes(request.status))
      return fail('This request is already closed.');
    await ctx.db.patch(request._id, { status: 'cancelled', updatedAt: Date.now() });
    await closeOffers(ctx, request._id, 'Request cancelled');
    await audit(ctx, user._id, 'REQUEST_CANCELLED', request._id);
  },
});
export const complete = mutation({
  args: { requestId: v.id('bloodRequests') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      request = await ctx.db.get(args.requestId);
    if (!request || (request.requesterId !== user._id && !canCoordinate(user, request)))
      return fail('You cannot complete this request.');
    if (request.status !== 'fulfilled' || request.unitsArranged < request.unitsRequired)
      return fail('The required donations must be confirmed first.');
    await ctx.db.patch(request._id, { status: 'completed', updatedAt: Date.now() });
    await audit(ctx, user._id, 'REQUEST_COMPLETED', request._id);
  },
});
export async function closeOffers(
  ctx: import('./_generated/server').MutationCtx,
  requestId: import('./_generated/dataModel').Id<'bloodRequests'>,
  title: string,
) {
  for (const status of ['notified', 'accepted'] as const) {
    const responses = await ctx.db
      .query('donorResponses')
      .withIndex('by_request_open', (q) =>
        q.eq('requestId', requestId).eq('status', status).eq('donationConfirmed', false),
      )
      .take(100);
    for (const response of responses) {
      await ctx.db.patch(response._id, { status: 'cancelled' });
      await notify(
        ctx,
        response.donorUserId,
        title,
        'This request is no longer accepting donors.',
        requestId,
      );
    }
    if (responses.length === 100)
      await ctx.scheduler.runAfter(0, internal.requests.closeOffersPage, { requestId, title });
  }
}
export const closeOffersPage = internalMutation({
  args: { requestId: v.id('bloodRequests'), title: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await closeOffers(ctx, args.requestId, args.title);
  },
});
export const expireOne = internalMutation({
  args: { requestId: v.id('bloodRequests') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (
      request &&
      request.requiredBefore <= Date.now() &&
      (request.status === 'pending' || isOpen(request.status))
    ) {
      await ctx.db.patch(request._id, { status: 'expired', updatedAt: Date.now() });
      await closeOffers(ctx, request._id, 'Request expired');
      await notify(
        ctx,
        request.requesterId,
        'Your request expired',
        'The required-by time has passed. Create a new request if blood is still needed.',
        request._id,
      );
    }
  },
});
export const expireAll = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const status of ['pending', 'active', 'contacted', 'partial'] as const) {
      const requests = await ctx.db
        .query('bloodRequests')
        .withIndex('by_status_and_deadline', (q) =>
          q.eq('status', status).lte('requiredBefore', Date.now()),
        )
        .take(100);
      for (const request of requests)
        await ctx.scheduler.runAfter(0, internal.requests.expireOne, { requestId: request._id });
    }
  },
});
