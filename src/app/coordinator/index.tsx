import { Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Body,
  Button,
  Card,
  Empty,
  Eyebrow,
  Label,
  Notice,
  Screen,
  Section,
} from '@/components/ui';
import RequestCard from '@/components/RequestCard';
import { useApp } from '@/providers/AppProvider';
export default function CoordinatorDashboard() {
  const { data } = useApp(),
    scoped = data.requests.filter(
      (r) => data.user?.role === 'admin' || r.hospitalId === data.user?.hospitalId,
    ),
    pending = scoped.filter((r) => r.status === 'pending'),
    active = scoped.filter((r) =>
      ['active', 'contacted', 'partial', 'fulfilled'].includes(r.status),
    );
  const accepted = data.responses.filter(
    (r) =>
      r.status === 'accepted' && !r.donationConfirmed && scoped.some((q) => q.id === r.requestId),
  );
  return (
    <Screen
      title="Your care dashboard."
      subtitle={
        data.user?.role === 'admin'
          ? 'Platform-wide request coordination.'
          : (data.hospitals.find((h) => h.id === data.user?.hospitalId)?.name ??
            'No hospital assigned')
      }
      back
      refresh
    >
      <View className="flex-row gap-3">
        {[
          { value: pending.length, label: 'Awaiting review' },
          { value: accepted.length, label: 'Donors accepted' },
        ].map((s) => (
          <Card key={s.label} className="flex-1">
            <Text className="font-display text-3xl text-blood">{s.value}</Text>
            <Body className="mt-2 text-xs">{s.label}</Body>
          </Card>
        ))}
      </View>
      <Button
        className="mt-5"
        title="Review pending requests"
        onPress={() => router.push('/coordinator/pending')}
      />
      <Section title="Active care coordination" />
      {active.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
      {!active.length && (
        <Empty
          title="No active requests"
          body="Verified requests and accepted donor coordination will appear here."
        />
      )}
      <Section title="Hospital activity" />
      <Card>
        <View className="gap-4">
          <View className="flex-row justify-between">
            <Label className="text-xs">Confirmed units</Label>
            <Body>{scoped.reduce((sum, r) => sum + r.unitsArranged, 0)}</Body>
          </View>
          <View className="flex-row justify-between">
            <Label className="text-xs">Completed requests</Label>
            <Body>{scoped.filter((r) => r.status === 'completed').length}</Body>
          </View>
          <View>
            <Eyebrow>YOUR RESPONSIBILITY</Eyebrow>
            <Body className="mt-2 text-xs">
              Verify the request, arrange medical screening, and confirm only completed donations.
              Acceptance alone does not count as an arranged unit.
            </Body>
          </View>
        </View>
      </Card>
      <View className="mt-5">
        <Notice>
          Coordinator access is restricted to the hospital assigned by an administrator. Actions are
          recorded in the audit log.
        </Notice>
      </View>
    </Screen>
  );
}
