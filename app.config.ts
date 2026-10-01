import type { ConfigContext, ExpoConfig } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'BloodBank',
  slug: config.slug ?? 'bloodbank',
  plugins: [
    ...(config.plugins ?? []),
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      ? [
          [
            'react-native-maps',
            { androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
          ] as [string, { androidGoogleMapsApiKey: string }],
        ]
      : []),
  ],
  extra: {
    ...config.extra,
    ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID
      ? { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } }
      : {}),
  },
});
