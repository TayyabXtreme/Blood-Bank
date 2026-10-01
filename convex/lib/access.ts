import type { Doc, QueryCtx, MutationCtx } from './server';
import { fail } from './validation';

export const sameScope = (user: Pick<Doc<'users'>, 'demo'>, row: { demo?: boolean }) => Boolean(user.demo) === Boolean(row.demo);
export function requireScope(user: Doc<'users'>, row: { demo?: boolean } | null) {
  if (!row || !sameScope(user, row)) fail('NOT_FOUND', 'The requested record is unavailable.');
}
export const managesHospital = (user: Doc<'users'>, hospitalId: string) => user.role === 'admin' || (user.role === 'coordinator' && user.hospitalId === hospitalId);
export function requireStaff(user: Doc<'users'>, hospitalId?: string) {
  if (user.role !== 'admin' && (user.role !== 'coordinator' || (hospitalId && user.hospitalId !== hospitalId))) fail('FORBIDDEN', 'An authorized hospital coordinator or administrator is required.');
}
export function requireAdmin(user: Doc<'users'>) {
  if (user.role !== 'admin') fail('FORBIDDEN', 'Administrator access is required.');
}
export async function currentUser(ctx: QueryCtx | MutationCtx, token: string) {
  const identity = await ctx.auth.getUserIdentity();
  let user: Doc<'users'> | null = null;
  if (identity) user = await ctx.db.query('users').withIndex('by_auth_user_id', q => q.eq('authUserId', identity.subject)).unique();
  if (!user && token && process.env.DEMO_MODE === 'true') {
    const session = await ctx.db.query('demoSessions').withIndex('by_token', q => q.eq('token', token)).unique();
    if (session && session.expiresAt > Date.now()) {
      const demoUser = await ctx.db.get(session.userId);
      if (demoUser?.demo === true) user = demoUser;
    }
  }
  if (!user || (user.demo && process.env.DEMO_MODE !== 'true')) fail('UNAUTHENTICATED', 'Sign in or start an enabled demo session.');
  if (user.accountStatus !== 'active') fail('SUSPENDED', 'This account is suspended.');
  return user;
}
