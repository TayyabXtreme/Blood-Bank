import { createAuthClient } from 'better-auth/react';
import { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { serviceConfig } from './config';
export const authClient = createAuthClient({
  baseURL: serviceConfig.authUrl ?? 'https://unconfigured.invalid',
  plugins: [
    convexClient(),
    ...(Platform.OS === 'web'
      ? [crossDomainClient()]
      : [expoClient({ scheme: 'bloodbank', storagePrefix: 'bloodbank', storage: SecureStore })]),
  ],
});
