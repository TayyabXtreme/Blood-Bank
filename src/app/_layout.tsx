import '../../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '@/providers/AppProvider';
import { Loading, Toast } from '@/components/ui';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import {
  useNotificationNavigation,
  useUnreadNotificationSync,
} from '@/hooks/useNotifications';

function Routes() {
  const { authenticated, loading, data } = useApp();
  const notificationsEnabled = authenticated && !!data.user?.onboardingCompleted;
  useNotificationNavigation(notificationsEnabled);
  useUnreadNotificationSync(notificationsEnabled);
  if (loading) return <Loading />;
  const ready = authenticated && !!data.user?.onboardingCompleted && data.user.status === 'active';
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FBF8F6' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="+not-found" />
        <Stack.Protected guard={!authenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={authenticated && !data.user?.onboardingCompleted}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={authenticated && data.user?.status === 'suspended'}>
          <Stack.Screen name="suspended" />
        </Stack.Protected>
        <Stack.Protected guard={ready}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="request" />
          <Stack.Screen name="donor" />
          <Stack.Protected guard={data.user?.role === 'coordinator' || data.user?.role === 'admin'}>
            <Stack.Screen name="coordinator" />
          </Stack.Protected>
          <Stack.Protected guard={data.user?.role === 'admin'}>
            <Stack.Screen name="admin" />
          </Stack.Protected>
        </Stack.Protected>
      </Stack>
      <Toast />
    </>
  );
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_700Bold,
    Manrope_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
  });
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppProvider>{loaded || error ? <Routes /> : <Loading />}</AppProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
