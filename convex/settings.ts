import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { settingsFields } from './validators';
import { audit, fail, requireAdmin } from './lib/permissions';
export const update = mutation({
  args: settingsFields,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    if (
      Object.values(args).some((n) => !Number.isFinite(n) || n < 0) ||
      args.donationIntervalDays < 56 ||
      args.donationIntervalDays > 365 ||
      args.minAge < 18 ||
      args.maxAge > 70 ||
      args.minAge > args.maxAge ||
      args.initialRadiusKm < 1 ||
      args.maxRadiusKm > 200 ||
      args.maxRadiusKm < args.initialRadiusKm ||
      !Number.isInteger(args.batchSize) ||
      args.batchSize < 1 ||
      args.batchSize > 20 ||
      args.escalationMinutes < 1 ||
      args.escalationMinutes > 120 ||
      args.distanceWeight + args.readinessWeight + args.reliabilityWeight <= 0
    )
      return fail('Enter valid matching and eligibility policy values.');
    const existing = await ctx.db.query('settings').first();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert('settings', args);
    await audit(ctx, user._id, 'SETTINGS_UPDATED', existing?._id ?? 'settings');
  },
});
