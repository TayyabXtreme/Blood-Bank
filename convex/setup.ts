import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { audit, fail } from './lib/permissions';
export const promoteFirstAdmin = internalMutation({
  args: { email: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_role', (q) => q.eq('role', 'admin'))
      .first();
    if (existing)
      return fail('An admin already exists. Use the admin interface for further role grants.');
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email.trim().toLowerCase()))
      .unique();
    if (!user) return fail('Register and complete onboarding before bootstrapping the admin.');
    await ctx.db.patch(user._id, { role: 'admin' });
    await audit(ctx, user._id, 'ADMIN_BOOTSTRAPPED', user._id);
    return 'Administrator access granted.';
  },
});
