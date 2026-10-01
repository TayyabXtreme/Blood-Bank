import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useApp } from '@/providers/AppProvider';

// Must be module-level so foreground notifications always display a banner/sound,
// regardless of auth or onboarding state when the notification arrives.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function useNotificationNavigation(enabled: boolean) {
  const { mode } = useApp();
  useEffect(() => {
    if (!enabled || mode !== 'live' || Platform.OS === 'web') return;

    // Create the Android channel at startup so existing registered users
    // (who skip usePushRegistration) still see notifications properly.
    if (Platform.OS === 'android') {
      void Notifications.setNotificationChannelAsync('blood-requests', {
        name: 'Blood requests',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#BC2846',
      });
    }

    const navigate = (notification: Notifications.Notification) => {
      const requestId = notification.request.content.data?.requestId;
      if (typeof requestId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(requestId))
        router.push({ pathname: '/request/[id]', params: { id: requestId } });
    };
    let mounted = true;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (mounted && response) {
          navigate(response.notification);
          void Notifications.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => {});
    const listener = Notifications.addNotificationResponseReceivedListener((response) => {
      navigate(response.notification);
      void Notifications.clearLastNotificationResponseAsync();
    });
    return () => {
      mounted = false;
      listener.remove();
    };
  }, [enabled, mode]);
}
// Presents unread in-app notifications as Expo local notifications so they
// surface as system banners even when push delivery failed or wasn't set up.
export function useUnreadNotificationSync(enabled: boolean) {
  const { data, mode } = useApp();
  // Track which notification IDs we've already scheduled this session.
  const shown = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || mode !== 'live' || Platform.OS === 'web') return;

    const pending = data.notifications.filter(
      (n) => !n.read && !shown.current.has(n.id),
    );
    for (const n of pending) {
      shown.current.add(n.id);
      void Notifications.scheduleNotificationAsync({
        content: {
          title: n.title,
          body: n.body,
          data: n.requestId ? { requestId: n.requestId } : {},
          sound: true,
        },
        trigger: null, // show immediately
      });
    }
  }, [data.notifications, enabled, mode]);
}

export function usePushRegistration() {
  const { registerDevice, mode } = useApp();
  return async () => {
    if (mode === 'demo')
      throw new Error(
        'Demo alerts appear in your inbox. Enable live mode to register a real device.',
      );
    if (Platform.OS === 'web')
      throw new Error('Push alerts are available on the Android and iOS app.');
    if (!Device.isDevice)
      throw new Error('Use a physical device and a development build to enable push alerts.');
    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;
    if (!projectId) throw new Error('Connect your EAS project before enabling push alerts.');
    if (Platform.OS === 'android')
      await Notifications.setNotificationChannelAsync('blood-requests', {
        name: 'Blood requests',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#BC2846',
      });
    let permissions = await Notifications.getPermissionsAsync();
    if (permissions.status !== 'granted')
      permissions = await Notifications.requestPermissionsAsync();
    if (permissions.status !== 'granted')
      throw new Error('Notification permission was declined. Your in-app inbox still works.');
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
  };
}
