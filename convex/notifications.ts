import schema from './schema';
import { v } from 'convex/values';
import { mutation, internalAction, internalMutation, internalQuery } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { fail, requireUser } from './lib/permissions';

export async function notify(
  ctx: MutationCtx,
  userId: Id<'users'>,
  title: string,
  body: string,
  requestId?: Id<'bloodRequests'>,
) {
  const notificationId = await ctx.db.insert('notifications', {
    userId,
    title,
    body,
    requestId,
    read: false,
    createdAt: Date.now(),
    deliveryStatus: 'queued',
  });
  await ctx.scheduler.runAfter(0, internal.notifications.deliver, { notificationId });
  return notificationId;
}
export const markRead = mutation({
  args: { notificationId: v.optional(v.id('notifications')) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.notificationId) {
      const item = await ctx.db.get(args.notificationId);
      if (!item || item.userId !== user._id) return fail('Notification not found.');
      await ctx.db.patch(item._id, { read: true });
    } else {
      const items = await ctx.db
        .query('notifications')
        .withIndex('by_user_and_read', (q) => q.eq('userId', user._id).eq('read', false))
        .take(100);
      for (const item of items) await ctx.db.patch(item._id, { read: true });
    }
  },
});
export const registerDevice = mutation({
  args: { token: v.string(), platform: v.union(v.literal('android'), v.literal('ios')) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!/^(ExponentPushToken|ExpoPushToken)\[[a-zA-Z0-9_-]+\]$/.test(args.token))
      return fail('Invalid Expo push token.');
    const existing = await ctx.db
      .query('pushDevices')
      .withIndex('by_push_token', (q) => q.eq('expoPushToken', args.token))
      .unique();
    if (existing)
      await ctx.db.patch(existing._id, { userId: user._id, active: true, lastUsedAt: Date.now() });
    else
      await ctx.db.insert('pushDevices', {
        userId: user._id,
        expoPushToken: args.token,
        platform: args.platform,
        active: true,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
      });
  },
});
export const unregisterDevice = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx),
      device = await ctx.db
        .query('pushDevices')
        .withIndex('by_push_token', (q) => q.eq('expoPushToken', args.token))
        .unique();
    if (device?.userId === user._id) await ctx.db.patch(device._id, { active: false });
  },
});
export const deliveryData = internalQuery({
  args: { notificationId: v.id('notifications') },
  returns: v.union(
    v.null(),
    v.object({
      notification: schema.doc('notifications'),
      devices: v.array(schema.doc('pushDevices')),
    }),
  ),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return null;
    const user = await ctx.db.get(notification.userId);
    if (user?.status !== 'active') return null;
    const donor = await ctx.db
      .query('donors')
      .withIndex('by_user', (q) => q.eq('userId', notification.userId))
      .unique();
    const devices = await ctx.db
      .query('pushDevices')
      .withIndex('by_user', (q) => q.eq('userId', notification.userId))
      .order('desc')
      .take(20);
    return {
      notification,
      devices: donor && !donor.notificationEnabled ? [] : devices.filter((d) => d.active),
    };
  },
});
export const recordDelivery = internalMutation({
  args: {
    notificationId: v.id('notifications'),
    deviceId: v.optional(v.id('pushDevices')),
    ticketId: v.optional(v.string()),
    status: v.string(),
    error: v.optional(v.string()),
    deactivate: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      deliveryStatus: args.status,
      deliveryError: args.error,
    });
    if (args.deviceId) {
      await ctx.db.insert('pushDeliveries', {
        notificationId: args.notificationId,
        deviceId: args.deviceId,
        ticketId: args.ticketId,
        status: args.status,
        error: args.error,
        createdAt: Date.now(),
      });
      if (args.deactivate) await ctx.db.patch(args.deviceId, { active: false });
    }
  },
});
type Ticket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};
export const deliver = internalAction({
  args: { notificationId: v.id('notifications') },
  returns: v.null(),
  handler: async (ctx, args): Promise<void> => {
    const data = await ctx.runQuery(internal.notifications.deliveryData, args);
    if (!data) return;
    if (!data.devices.length) {
      await ctx.runMutation(internal.notifications.recordDelivery, { ...args, status: 'in_app' });
      return;
    }
    for (const device of data.devices) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.EXPO_ACCESS_TOKEN
              ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
              : {}),
          },
          body: JSON.stringify({
            to: device.expoPushToken,
            sound: 'default',
            channelId: 'blood-requests',
            title: data.notification.title,
            body: data.notification.body,
            data: { requestId: data.notification.requestId },
            priority: 'high',
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error(`Push service returned ${response.status}`);
        const payload = (await response.json()) as { data?: Ticket };
        const ticket = payload.data;
        if (!ticket || !['ok', 'error'].includes(ticket.status))
          throw new Error('Invalid push service response');
        await ctx.runMutation(internal.notifications.recordDelivery, {
          ...args,
          deviceId: device._id,
          ticketId: ticket.id,
          status: ticket.status === 'ok' ? 'sent' : 'failed',
          error: ticket.message,
          deactivate: ticket.details?.error === 'DeviceNotRegistered',
        });
        if (ticket.id)
          await ctx.scheduler.runAfter(15 * 60_000, internal.notifications.checkReceipt, {
            ticketId: ticket.id,
            notificationId: args.notificationId,
            deviceId: device._id,
          });
      } catch (error) {
        await ctx.runMutation(internal.notifications.recordDelivery, {
          ...args,
          deviceId: device._id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Push delivery failed',
        });
      }
    }
  },
});
export const checkReceipt = internalAction({
  args: {
    ticketId: v.string(),
    notificationId: v.id('notifications'),
    deviceId: v.id('pushDevices'),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<void> => {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN
            ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({ ids: [args.ticketId] }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Push receipt service returned ${response.status}`);
      const payload = (await response.json()) as { data?: Record<string, Ticket> },
        receipt = payload.data?.[args.ticketId];
      if (receipt)
        await ctx.runMutation(internal.notifications.recordDelivery, {
          notificationId: args.notificationId,
          deviceId: args.deviceId,
          status: receipt.status === 'ok' ? 'delivered' : 'failed',
          error: receipt.message,
          deactivate: receipt.details?.error === 'DeviceNotRegistered',
        });
    } catch {
      await ctx.runMutation(internal.notifications.recordDelivery, {
        notificationId: args.notificationId,
        deviceId: args.deviceId,
        status: 'receipt_failed',
        error: 'Push receipt could not be retrieved.',
      });
    }
  },
});
