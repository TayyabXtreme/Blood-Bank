import Feather from '@expo/vector-icons/Feather';
import { Redirect, Tabs } from 'expo-router';
import { useApp } from '@/features/app/AppProvider';
import { colors, fonts } from '@/theme/tokens';
import { BloodScreen, LoadingState } from '@/components/blood/ui';

export default function TabsLayout() {
  const { data, loading } = useApp();
  if (!data?.user && loading) return <BloodScreen><LoadingState label="Loading your account…" /></BloodScreen>;
  if (!data?.user) return <Redirect href="/(auth)/welcome" />;
  const unread = data.notifications.filter((item) => !item.read).length;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.divider, paddingTop: 7, minHeight: 66 }, tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 }, sceneStyle: { backgroundColor: colors.background } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }} />
    <Tabs.Screen name="requests" options={{ title: 'Requests', tabBarIcon: ({ color, size }) => <Feather name="droplet" color={color} size={size} /> }} />
    <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarBadge: unread || undefined, tabBarBadgeStyle: { backgroundColor: colors.primary }, tabBarIcon: ({ color, size }) => <Feather name="bell" color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} /> }} />
  </Tabs>;
}
