import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { authComponent } from './auth';
import { bloodGroup, role } from './validators';
import { audit, fail, requireAdmin, requireUser, validateLocation } from './lib/permissions';
import { internal } from './_generated/api';
import { notify } from './notifications';

export const onboard = mutation({
  args: {
    role: v.union(v.literal('donor'), v.literal('requester')),
    name: v.string(),
    phone: v.optional(v.string()),
    city: v.string(),
    bloodGroup: v.optional(bloodGroup),
    age: v.optional(v.number()),
    latitude: v.number(),
    longitude: v.number(),
    lastDonationDate: v.optional(v.number()),
    questionnairePassed: v.boolean(),
    shareContact: v.boolean(),
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    const auth = await authComponent.getAuthUser(ctx);
    const existing = await ctx.db
      .query('users')
      .withIndex('by_auth_user', (q) => q.eq('authUserId', auth._id))
      .unique();
    if (existing) return fail('Your profile already exists. Edit it in Profile.');
    if (
      args.name.trim().length < 2 ||
      args.name.length > 80 ||
      args.city.trim().length < 2 ||
      args.city.length > 80 ||
      (args.phone?.length ?? 0) > 24
    )
      return fail('Enter a valid name, city, and phone number.');
    validateLocation(args.latitude, args.longitude);
    if (
      args.role === 'donor' &&
      (!args.bloodGroup ||
        !args.age ||
        !Number.isInteger(args.age) ||
        args.age < 18 ||
        args.age > 65)
    )
      return fail('Donors need a blood group and an age between 18 and 65.');
    if (
      args.lastDonationDate !== undefined &&
      (!Number.isFinite(args.lastDonationDate) ||
        args.lastDonationDate < 0 ||
        args.lastDonationDate > Date.now())
    )
      return fail('Last donation cannot be in the future.');
    const userId = await ctx.db.insert('users', {
      authUserId: auth._id,
      name: args.name.trim(),
      email: auth.email.toLowerCase(),
      phone: args.phone?.trim(),
      role: args.role,
      city: args.city.trim(),
      status: 'active',
      onboardingCompleted: true,
      createdAt: Date.now(),
    });
    if (args.role === 'donor')
      await ctx.db.insert('donors', {
        userId,
        bloodGroup: args.bloodGroup!,
        age: args.age!,
        city: args.city.trim(),
        latitude: Math.round(args.latitude * 100) / 100,
        longitude: Math.round(args.longitude * 100) / 100,
        lastDonationDate: args.lastDonationDate,
        questionnairePassed: args.questionnairePassed,
        shareContact: args.shareContact,
        available: true,
        totalDonations: 0,
        notificationEnabled: true,
        updatedAt: Date.now(),
      });
    await audit(ctx, userId, 'PROFILE_CREATED', userId);
    return userId;
  },
});
export const updateProfile = mutation({
  args: { name: v.string(), phone: v.optional(v.string()), city: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (
      args.name.trim().length < 2 ||
      args.name.length > 80 ||
      args.city.trim().length < 2 ||
      args.city.length > 80 ||
      (args.phone?.length ?? 0) > 24
    )
      return fail('Enter valid profile details.');
    await ctx.db.patch(user._id, {
      name: args.name.trim(),
      phone: args.phone?.trim(),
      city: args.city.trim(),
    });
    const donor = await ctx.db
      .query('donors')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .unique();
    if (donor) await ctx.db.patch(donor._id, { city: args.city.trim(), updatedAt: Date.now() });
  },
});
export const manage = mutation({
  args: {
    userId: v.id('users'),
    role,
    status: v.union(v.literal('active'), v.literal('suspended')),
    hospitalId: v.optional(v.id('hospitals')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (admin._id === args.userId) return fail('You cannot change your own administrator access.');
    const target = await ctx.db.get(args.userId);
    if (!target) return fail('User not found.');
    if (args.role === 'coordinator') {
      const hospital = args.hospitalId && (await ctx.db.get(args.hospitalId));
      if (!hospital || !hospital.active)
        return fail('Assign an active hospital to the coordinator.');
    }
    if (
      args.role === 'donor' &&
      !(await ctx.db
        .query('donors')
        .withIndex('by_user', (q) => q.eq('userId', target._id))
        .unique())
    )
      return fail('This user has not created a donor profile.');
    await ctx.db.patch(args.userId, {
      role: args.role,
      status: args.status,
      hospitalId: args.role === 'coordinator' ? args.hospitalId : undefined,
    });
    if (args.status === 'suspended' || (target.role === 'donor' && args.role !== 'donor')) {
      const donor = await ctx.db
        .query('donors')
        .withIndex('by_user', (q) => q.eq('userId', target._id))
        .unique();
      if (donor) {
        const offers = [
          ...(await ctx.db
            .query('donorResponses')
            .withIndex('by_donor_open', (q) =>
              q.eq('donorId', donor._id).eq('status', 'accepted').eq('donationConfirmed', false),
            )
            .take(21)),
          ...(await ctx.db
            .query('donorResponses')
            .withIndex('by_donor_open', (q) =>
              q.eq('donorId', donor._id).eq('status', 'notified').eq('donationConfirmed', false),
            )
            .take(100)),
        ];
        for (const offer of offers.filter(
          (r) => !r.donationConfirmed && ['accepted', 'notified'].includes(r.status),
        )) {
          await ctx.db.patch(offer._id, { status: 'cancelled' });
          const request = await ctx.db.get(offer.requestId);
          if (request) {
            if (offer.status === 'accepted')
              await notify(
                ctx,
                request.requesterId,
                'Donor coordination updated',
                'A donor is no longer available. Matching will continue.',
                request._id,
              );
            await ctx.scheduler.runAfter(0, internal.matching.runBatch, { requestId: request._id });
          }
        }
      }
    }
    await audit(ctx, admin._id, 'USER_UPDATED', args.userId);
  },
});
