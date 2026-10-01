import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { audit, fail, requireAdmin, requireUser } from './lib/permissions';
export const create = mutation({
  args: { requestId: v.id('bloodRequests'), reason: v.string(), details: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      request = await ctx.db.get(args.requestId);
    if (
      !request ||
      (request.verification !== 'verified' &&
        request.requesterId !== user._id &&
        user.role !== 'admin' &&
        !(user.role === 'coordinator' && user.hospitalId === request.hospitalId))
    )
      return fail('Request not found.');
    if (!args.reason.trim() || args.reason.length > 100 || (args.details?.length ?? 0) > 600)
      return fail('Enter a valid report reason and details.');
    const existing = await ctx.db
      .query('reports')
      .withIndex('by_request_reporter', (q) =>
        q.eq('requestId', request._id).eq('reporterId', user._id).eq('status', 'open'),
      )
      .first();
    if (existing) return fail('You have already reported this request.');
    await ctx.db.insert('reports', {
      ...args,
      reporterId: user._id,
      status: 'open',
      createdAt: Date.now(),
    });
    await audit(ctx, user._id, 'REQUEST_REPORTED', request._id);
  },
});
export const resolve = mutation({
  args: { reportId: v.id('reports'), dismiss: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx),
      report = await ctx.db.get(args.reportId);
    if (!report || report.status !== 'open') return fail('Open report not found.');
    await ctx.db.patch(report._id, {
      status: args.dismiss ? 'dismissed' : 'resolved',
      resolvedBy: user._id,
    });
    await audit(ctx, user._id, 'REPORT_REVIEWED', report._id);
  },
});
