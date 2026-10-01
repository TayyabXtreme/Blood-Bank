'use node';
import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { components, internal } from './_generated/api';
import { createAuth } from './auth';
import { createDemo } from '../src/data/demo';
import { requireDevelopment, seedCounts, type SeedCounts } from './seedData';

// Only the deployment owner can run this; never expose seed as a public mutation.
export const run = internalAction({
  args: { password: v.string() },
  returns: v.object({ alreadySeeded: v.boolean(), counts: seedCounts, emails: v.array(v.string()) }),
  handler: async (ctx, { password }): Promise<{ alreadySeeded: boolean; counts: SeedCounts; emails: string[] }> => {
    requireDevelopment();
    if (password.length < 12) throw new Error('Use a test password with at least 12 characters.');
    const fixtures = createDemo().users;
    const previous: SeedCounts | null = await ctx.runQuery(internal.seedData.status, {});
    if (previous) return { alreadySeeded: true, counts: previous, emails: fixtures.map(u => u.email) };
    const accounts: { email: string; authUserId: string }[] = [];
    for (const user of fixtures) {
      const existing = await ctx.runQuery(components.betterAuth.adapter.findOne, { model: 'user', where: [{ field: 'email', value: user.email, operator: 'eq' }] });
      if (existing) {
        accounts.push({ email: user.email, authUserId: String(existing._id) });
      } else {
        // Better Auth hashes passwords and creates credential accounts using its normal API.
        const result = await createAuth(ctx).api.signUpEmail({ body: { name: user.name, email: user.email, password } });
        accounts.push({ email: user.email, authUserId: result.user.id });
      }
    }
    const counts: SeedCounts = await ctx.runMutation(internal.seedData.populate, { accounts });
    return { alreadySeeded: false, counts, emails: fixtures.map(u => u.email) };
  },
});
