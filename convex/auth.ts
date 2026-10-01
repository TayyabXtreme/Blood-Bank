import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex, crossDomain } from '@convex-dev/better-auth/plugins';
import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth/minimal';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';

export const authComponent = createClient<DataModel>(components.betterAuth);
async function sendEmail(email: string, url: string, purpose: 'reset' | 'verify') {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)
    throw new Error(
      'Email delivery is not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM on Convex.',
    );
  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM,
      to: email,
      subject:
        purpose === 'reset' ? 'Reset your BloodBank password' : 'Verify your BloodBank email',
      text: `Open this link to ${purpose === 'reset' ? 'reset your password' : 'verify your email'}: ${url}\n\nIf you did not request this, you can ignore this email.`,
    }),
  });
  if (!result.ok) throw new Error('Unable to send email. Check the email provider configuration.');
}
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32)
    throw new Error(
      'Set a BETTER_AUTH_SECRET of at least 32 random characters on Convex before using live authentication.',
    );
  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [
      'bloodbank://',
      'bloodbank://*',
      ...(process.env.SITE_URL ? [process.env.SITE_URL] : []),
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => sendEmail(user.email, url, 'reset'),
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => sendEmail(user.email, url, 'verify'),
      autoSignInAfterVerification: true,
    },
    plugins: [
      expo(),
      convex({ authConfig }),
      ...(process.env.SITE_URL ? [crossDomain({ siteUrl: process.env.SITE_URL })] : []),
    ],
  });
};
