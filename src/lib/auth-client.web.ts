import { createAuthClient } from 'better-auth/react';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { serviceConfig } from './config';
export const authClient = createAuthClient({
  baseURL: serviceConfig.authUrl ?? 'https://unconfigured.invalid',
  plugins: [convexClient(), crossDomainClient()],
});
