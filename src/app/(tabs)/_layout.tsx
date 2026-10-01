import { Tabs } from 'expo-router';
import { Bell, House, Layers, UserRound } from 'lucide-react-native';
import { colors } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
export default function TabsLayout() {
  const { data } = useApp(),
    unread = data.notifications.filter((n) => !n.read).length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blood,
        tabBarInactiveTintColor: '#91888E',
        tabBarStyle: {
          backgroundColor: '#FFFCFA',
          borderTopColor: colors.line,
          paddingTop: 10,
          height: 78,
          paddingBottom: 18,
        },
        tabBarLabelStyle: { fontFamily: 'DMSans_500Medium', fontSize: 10, marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <House size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <Layers size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarBadge: unread || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.blood, fontSize: 9 },
          tabBarIcon: ({ color }) => <Bell size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserRound size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
