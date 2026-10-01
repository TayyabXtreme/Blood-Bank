import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { fail, requireUser, validateLocation } from './lib/permissions';
export const update = mutation({
  args: {
    available: v.optional(v.boolean()),
    temporaryUnavailableUntil: v.optional(v.number()),
    lastDonationDate: v.optional(v.number()),
    notificationEnabled: v.optional(v.boolean()),
    shareContact: v.optional(v.boolean()),
    questionnairePassed: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== 'donor') return fail('Donor access is required.');
    const donor = await ctx.db
      .query('donors')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .unique();
    if (!donor) return fail('Complete your donor profile.');
    if (
      args.lastDonationDate !== undefined &&
      (!Number.isFinite(args.lastDonationDate) ||
        args.lastDonationDate > Date.now() ||
        args.lastDonationDate < 0)
    )
      return fail('Enter a valid past donation date.');
    if (
      args.lastDonationDate !== undefined &&
      donor.lastDonationDate &&
      args.lastDonationDate < donor.lastDonationDate
    )
      return fail('Last donation cannot be moved earlier than the recorded date.');
    if (
      args.temporaryUnavailableUntil !== undefined &&
      (!Number.isFinite(args.temporaryUnavailableUntil) || args.temporaryUnavailableUntil < 0)
    )
      return fail('Enter a valid pause date.');
    await ctx.db.patch(donor._id, { ...args, updatedAt: Date.now() });
  },
});
export const setLocation = mutation({
  args: { latitude: v.number(), longitude: v.number(), city: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    validateLocation(args.latitude, args.longitude);
    if (args.city.trim().length < 2 || args.city.length > 80) return fail('Enter a valid city.');
    const donor = await ctx.db
      .query('donors')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .unique();
    if (!donor || user.role !== 'donor') return fail('Donor profile required.');
    await ctx.db.patch(donor._id, {
      latitude: Math.round(args.latitude * 100) / 100,
      longitude: Math.round(args.longitude * 100) / 100,
      city: args.city.trim(),
      updatedAt: Date.now(),
    });
    await ctx.db.patch(user._id, { city: args.city.trim() });
  },
});
