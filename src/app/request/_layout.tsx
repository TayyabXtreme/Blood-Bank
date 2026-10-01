import { Redirect, Stack } from 'expo-router';
import { BloodScreen, LoadingState } from '@/components/blood/ui';
import { useApp } from '@/features/app/AppProvider';
import { colors } from '@/theme/tokens';

export default function RequestLayout() {
  const { data, loading } = useApp();
  if (!data?.user && loading) return <BloodScreen><LoadingState label="Loading your account…" /></BloodScreen>;
  if (!data?.user) return <Redirect href="/(auth)/welcome" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
