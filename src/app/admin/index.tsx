import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ChevronRight,
  Users,
  Hospital,
  Flag,
  BarChart3,
  Settings2,
  FileClock,
  Layers,
} from 'lucide-react-native';
import { Body, Card, colors, Label, Notice, Screen, Section } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
export default function Administration() {
  const { data } = useApp();
  const links = [
    {
      title: 'People & roles',
      body: 'Assign coordinator access and review accounts',
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'Hospitals & blood facilities',
      body: 'Maintain verified receiving facilities',
      icon: Hospital,
      href: '/admin/hospitals',
    },
    {
      title: 'Request oversight',
      body: 'Review, verify, and coordinate requests',
      icon: Layers,
      href: '/admin/requests',
    },
    {
      title: 'Reports & concerns',
      body: `${data.reports.filter((r) => r.status === 'open').length} open reports to review`,
      icon: Flag,
      href: '/admin/reports',
    },
    {
      title: 'Community analytics',
      body: 'Demand, fulfillment, and donations',
      icon: BarChart3,
      href: '/admin/analytics',
    },
    {
      title: 'Matching policy',
      body: 'Eligibility, radius, batch sizes, and weights',
      icon: Settings2,
      href: '/admin/settings',
    },
    {
      title: 'Audit trail',
      body: 'A record of sensitive platform activity',
      icon: FileClock,
      href: '/admin/audit',
    },
  ] as const;
  return (
    <Screen
      title="Care, at a bigger scale."
      subtitle="The tools that keep the community trusted."
      back
    >
      <View className="flex-row gap-3">
        {[
          { value: data.users.length, label: 'Registered people' },
          { value: data.hospitals.length, label: 'Receiving facilities' },
        ].map((s) => (
          <Card key={s.label} className="flex-1">
            <Text className="font-display text-3xl text-blood">{s.value}</Text>
            <Body className="mt-2 text-[10px]">{s.label}</Body>
          </Card>
        ))}
      </View>
      <Section title="Platform tools" />
      {links.map(({ title, body, icon: Icon, href }) => (
        <Pressable
          key={href}
          accessibilityRole="button"
          onPress={() => router.push(href)}
          className="mb-3 flex-row items-center gap-3 rounded-[22px] border border-line bg-white p-5"
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blush">
            <Icon size={21} color={colors.blood} />
          </View>
          <View className="flex-1">
            <Label className="text-sm">{title}</Label>
            <Body className="mt-1 text-[11px]">{body}</Body>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
      ))}
      <Notice>
        Live accounts cannot choose privileged roles during signup. Every role grant, suspension,
        verification, and donation confirmation is recorded.
      </Notice>
    </Screen>
  );
}
