import { anyApi } from 'convex/server';
import { v } from 'convex/values';
import { action, internalAction, internalMutation, internalQuery } from './lib/server';
import { currentUser, managesHospital, requireScope } from './lib/access';
import { fail } from './lib/validation';

export const aiInput = internalQuery({
  args: { sessionToken: v.string(), requestId: v.id('bloodRequests') },
  handler: async (ctx, args) => {
    const user = await currentUser(ctx, args.sessionToken), request = await ctx.db.get(args.requestId); requireScope(user, request);
    if (request!.requesterId !== user._id && !managesHospital(user, request!.hospitalId)) fail('FORBIDDEN', 'Only the requester or authorized facility may request AI assistance.');
    const hospital = await ctx.db.get(request!.hospitalId);
    return { requestId: request!._id, bloodGroup: request!.bloodGroup, unitsRequired: request!.unitsRequired, urgency: request!.urgency, hospitalName: hospital?.name ?? 'Hospital', requiredBefore: request!.requiredBefore };
  },
});
export const requestInput = internalQuery({
  args: { requestId: v.id('bloodRequests') },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId); if (!request) return null;
    const hospital = await ctx.db.get(request.hospitalId);
    // Patient descriptions and contacts never leave the database for this summarization task.
    return { requestId: request._id, bloodGroup: request.bloodGroup, unitsRequired: request.unitsRequired, urgency: request.urgency, hospitalName: hospital?.name ?? 'Hospital', requiredBefore: request.requiredBefore };
  },
});
type AIInput = { bloodGroup: string; unitsRequired: number; urgency: string; hospitalName: string; requiredBefore: number };
async function callAI(input: AIInput) {
  const fallback = `${input.urgency}: ${input.unitsRequired} unit(s) of ${input.bloodGroup} required at ${input.hospitalName}. Coordinate with the receiving facility.`;
  if (!process.env.DEEPSEEK_API_KEY) return { available: false, source: 'rules', summary: fallback, message: 'DeepSeek is unavailable: no server API key is configured.' };
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.2, max_tokens: 160, messages: [{ role: 'system', content: 'Summarize the blood request in one factual sentence under 250 characters. Do not diagnose, assess donor eligibility, change urgency, invent facts or include patient information. Output only the sentence.' }, { role: 'user', content: JSON.stringify(input) }] }), signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('AI service unavailable');
    const body = await response.json(); const summary = body.choices?.[0]?.message?.content;
    if (typeof summary !== 'string' || !summary.trim()) throw new Error('No summary returned');
    return { available: true, source: 'deepseek', summary: summary.trim().slice(0, 250), message: 'AI assistance only; urgency and medical screening remain with the facility.' };
  } catch { return { available: false, source: 'rules', summary: fallback, message: 'DeepSeek could not respond. A factual summary is shown.' }; }
}
export const assist = action({
  args: { sessionToken: v.string(), requestId: v.id('bloodRequests') },
  handler: async (ctx, args) => { const input = await ctx.runQuery(anyApi.integrations.aiInput, args); return await callAI(input); },
});
export const storeSummary = internalMutation({
  args: { requestId: v.id('bloodRequests'), summary: v.string() },
  handler: async (ctx, args) => { const request = await ctx.db.get(args.requestId); if (request) await ctx.db.patch(request._id, { aiSummary: args.summary.slice(0, 250) }); },
});
export const summarizeRequest = internalAction({
  args: { requestId: v.id('bloodRequests') },
  handler: async (ctx, args) => { const input = await ctx.runQuery(anyApi.integrations.requestInput, args); if (!input) return; const result = await callAI(input); if (result.available) await ctx.runMutation(anyApi.integrations.storeSummary, { requestId: args.requestId, summary: result.summary }); },
});
export const pushInput = internalQuery({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId); if (!notification || notification.demo || notification.deliveryStatus === 'Sent') return null;
    const user = await ctx.db.get(notification.userId); if (!user || user.accountStatus !== 'active' || !user.notificationEnabled) return null;
    const devices = await ctx.db.query('pushDevices').withIndex('by_user', q => q.eq('userId', user._id)).filter(q => q.eq(q.field('active'), true)).collect();
    return { notification, devices };
  },
});
export const recordPush = internalMutation({
  args: { notificationId: v.id('notifications'), deviceId: v.optional(v.id('pushDevices')), status: v.union(v.literal('Sent'), v.literal('Failed'), v.literal('Skipped')), ticketId: v.optional(v.string()), error: v.optional(v.string()), deactivate: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId); if (!notification) return;
    await ctx.db.patch(notification._id, { deliveryStatus: args.status, error: args.error });
    if (args.deviceId) { await ctx.db.insert('pushDeliveries', { notificationId: args.notificationId, deviceId: args.deviceId, state: args.status, ticketId: args.ticketId, error: args.error, createdAt: Date.now() }); if (args.deactivate) await ctx.db.patch(args.deviceId, { active: false }); }
  },
});
export const pushNotification = internalAction({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const input = await ctx.runQuery(anyApi.integrations.pushInput, args);
    if (!input || !input.devices.length || !process.env.EXPO_ACCESS_TOKEN) { await ctx.runMutation(anyApi.integrations.recordPush, { ...args, status: 'Skipped' }); return; }
    for (const device of input.devices) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }, body: JSON.stringify({ to: device.expoPushToken, title: input.notification.title, body: input.notification.body, sound: 'default', data: { requestId: input.notification.requestId, url: input.notification.deepLink } }), signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Push service unavailable');
        const result = await response.json(), ticket = Array.isArray(result.data) ? result.data[0] : result.data;
        if (ticket?.status === 'ok') await ctx.runMutation(anyApi.integrations.recordPush, { ...args, deviceId: device._id, status: 'Sent', ticketId: ticket.id });
        else await ctx.runMutation(anyApi.integrations.recordPush, { ...args, deviceId: device._id, status: 'Failed', error: String(ticket?.details?.error ?? 'Push rejected').slice(0, 120), deactivate: ticket?.details?.error === 'DeviceNotRegistered' });
      } catch { await ctx.runMutation(anyApi.integrations.recordPush, { ...args, deviceId: device._id, status: 'Failed', error: 'Push service unavailable' }); }
    }
  },
});
