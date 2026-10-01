import { ConvexError } from 'convex/values';
import { authComponent } from '../auth';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc } from '../_generated/dataModel';
import { defaultSettings } from '../../src/domain/rules';

export const fail = (message: string): never => {
  throw new ConvexError(message);
};
export async function currentUser(ctx: QueryCtx | MutationCtx) {
  const auth = await authComponent.safeGetAuthUser(ctx);
  if (!auth) return null;
  return ctx.db
    .query('users')
    .withIndex('by_auth_user', (q) => q.eq('authUserId', auth._id))
    .unique();
}
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await currentUser(ctx);
  if (!user) return fail('Sign in and complete your profile first.');
  if (user.status !== 'active') return fail('Your account is suspended. Contact an administrator.');
  return user;
}
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== 'admin') return fail('Administrator access is required.');
  return user;
}
export function canCoordinate(user: Doc<'users'>, request: Doc<'bloodRequests'>) {
  return (
    user.role === 'admin' || (user.role === 'coordinator' && user.hospitalId === request.hospitalId)
  );
}
export const getSettings = async (ctx: QueryCtx | MutationCtx) => {
  const settings = await ctx.db.query('settings').first();
  if (!settings) return defaultSettings;
  const { _id, _creationTime, ...values } = settings;
  void _id;
  void _creationTime;
  return values;
};
export function validateLocation(latitude: number, longitude: number) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  )
    fail('Enter valid latitude and longitude.');
}
export async function audit(
  ctx: MutationCtx,
  actorId: Doc<'users'>['_id'],
  action: string,
  entityId: string,
) {
  await ctx.db.insert('auditLogs', { actorId, action, entityId, createdAt: Date.now() });
}
