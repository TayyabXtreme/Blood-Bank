import { Redirect } from 'expo-router';
import { useApp } from '@/providers/AppProvider';
import { appMode, serviceConfig } from '@/lib/config';
export default function Index() {
  const { authenticated, data } = useApp();
  if (appMode === 'live' && !serviceConfig.ready) return <Redirect href="/setup" />;
  if (!authenticated) return <Redirect href="/(auth)/welcome" />;
  if (data.user?.status === 'suspended') return <Redirect href="/suspended" />;
  if (!data.user?.onboardingCompleted) return <Redirect href="/(onboarding)/profile" />;
  return <Redirect href="/(tabs)" />;
}
