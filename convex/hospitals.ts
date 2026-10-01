import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { audit, fail, requireAdmin, validateLocation } from './lib/permissions';
export const save = mutation({
  args: {
    id: v.optional(v.id('hospitals')),
    name: v.string(),
    city: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    contact: v.optional(v.string()),
    verified: v.boolean(),
    active: v.boolean(),
  },
  returns: v.id('hospitals'),
  handler: async (ctx, { id, ...input }) => {
    const admin = await requireAdmin(ctx);
    validateLocation(input.latitude, input.longitude);
    if (
      [input.name, input.city, input.address].some((s) => s.trim().length < 2 || s.length > 200) ||
      (input.contact?.length ?? 0) > 24
    )
      return fail('Enter valid hospital information.');
    if (id && !(await ctx.db.get(id))) return fail('Hospital not found.');
    const hospitalId = id ?? (await ctx.db.insert('hospitals', input));
    if (id) await ctx.db.patch(id, input);
    await audit(ctx, admin._id, 'HOSPITAL_SAVED', hospitalId);
    return hospitalId;
  },
});
