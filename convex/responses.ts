import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { internal } from './_generated/api';
import { audit, canCoordinate, fail, getSettings, requireUser } from './lib/permissions';
import { eligibility, isCompatible, isOpen } from '../src/domain/rules';
import { notify } from './notifications';
import { closeOffers } from './requests';

export const respond = mutation({
  args: { responseId: v.id('donorResponses'), accept: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      response = await ctx.db.get(args.responseId);
    if (!response || response.donorUserId !== user._id || user.role !== 'donor')
      return fail('This offer does not belong to you.');
    if (response.status !== 'notified') return fail('You have already responded to this offer.');
    const request = await ctx.db.get(response.requestId),
      donor = await ctx.db.get(response.donorId);
    if (
      !request ||
      !isOpen(request.status) ||
      request.requiredBefore <= Date.now() ||
      request.verification !== 'verified'
    )
      return fail('This request is no longer accepting responses.');
    if (args.accept) {
      if (
        !donor ||
        !donor.available ||
        !eligibility(donor, await getSettings(ctx)).eligible ||
        !isCompatible(donor.bloodGroup, request.bloodGroup)
      )
        return fail('Your profile is not currently eligible for this request.');
      const offers = await ctx.db
        .query('donorResponses')
        .withIndex('by_donor_open', (q) =>
          q.eq('donorId', donor._id).eq('status', 'accepted').eq('donationConfirmed', false),
        )
        .take(21);
      for (const offer of offers.filter((r) => r.status === 'accepted' && !r.donationConfirmed)) {
        const other = await ctx.db.get(offer.requestId);
        if (other && isOpen(other.status) && other.requiredBefore > Date.now())
          return fail('Finish your accepted donation before accepting another request.');
      }
      const requestResponses = await ctx.db
        .query('donorResponses')
        .withIndex('by_request_open', (q) =>
          q.eq('requestId', request._id).eq('status', 'accepted').eq('donationConfirmed', false),
        )
        .take(21);
      const accepted = requestResponses.filter(
        (r) => r.status === 'accepted' && !r.donationConfirmed,
      ).length;
      if (accepted + request.unitsArranged >= request.unitsRequired)
        return fail('Enough donors have accepted. Thank you for offering to help.');
    }
    await ctx.db.patch(response._id, {
      status: args.accept ? 'accepted' : 'declined',
      respondedAt: Date.now(),
    });
    await audit(ctx, user._id, args.accept ? 'DONOR_ACCEPTED' : 'DONOR_DECLINED', request._id);
    if (args.accept)
      await notify(
        ctx,
        request.requesterId,
        'A donor accepted your request',
        'Open your request to see coordination details.',
        request._id,
      );
    else await ctx.scheduler.runAfter(0, internal.matching.runBatch, { requestId: request._id });
  },
});
export const confirmDonation = mutation({
  args: { responseId: v.id('donorResponses') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      response = await ctx.db.get(args.responseId);
    const request = response && (await ctx.db.get(response.requestId));
    if (!response || !request || !canCoordinate(user, request))
      return fail('Hospital coordinator access is required.');
    if (response.status !== 'accepted' || response.donationConfirmed)
      return fail('This donation has already been confirmed or was not accepted.');
    if (
      !isOpen(request.status) ||
      request.requiredBefore <= Date.now() ||
      request.unitsArranged >= request.unitsRequired
    )
      return fail('This request cannot receive further confirmed donations.');
    const donor = await ctx.db.get(response.donorId),
      donorUser = await ctx.db.get(response.donorUserId);
    if (!donor || donorUser?.status !== 'active')
      return fail('An active donor profile is required.');
    if (!eligibility(donor, await getSettings(ctx)).eligible)
      return fail('The donor is outside the configured preliminary eligibility policy.');
    const now = Date.now(),
      unitsArranged = request.unitsArranged + 1;
    await ctx.db.patch(response._id, { donationConfirmed: true, confirmedBy: user._id });
    await ctx.db.patch(donor._id, {
      lastDonationDate: now,
      totalDonations: donor.totalDonations + 1,
      updatedAt: now,
    });
    await ctx.db.insert('donations', {
      donorUserId: response.donorUserId,
      requestId: request._id,
      responseId: response._id,
      hospitalId: request.hospitalId,
      bloodGroup: donor.bloodGroup,
      donatedAt: now,
      confirmedBy: user._id,
    });
    await ctx.db.patch(request._id, {
      unitsArranged,
      status: unitsArranged >= request.unitsRequired ? 'fulfilled' : 'partial',
      updatedAt: now,
    });
    await audit(ctx, user._id, 'DONATION_CONFIRMED', response._id);
    await notify(
      ctx,
      response.donorUserId,
      'Thank you for donating',
      'Your hospital confirmed your donation. Your donation history has been updated.',
      request._id,
    );
    await notify(
      ctx,
      request.requesterId,
      unitsArranged >= request.unitsRequired
        ? 'Your blood request is fulfilled'
        : 'A donation was confirmed',
      `${unitsArranged} of ${request.unitsRequired} units have been confirmed.`,
      request._id,
    );
    if (unitsArranged >= request.unitsRequired)
      await closeOffers(ctx, request._id, 'Request fulfilled');
  },
});
