import { Text, View } from 'react-native';
import { Body, Card, Eyebrow, Label, Notice, Screen, Section } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { bloodGroups } from '@/domain/types';
import { statusLabels } from '@/domain/rules';
export default function Analytics() {
  const { data } = useApp(),
    requested = data.requests.reduce((n, r) => n + r.unitsRequired, 0),
    arranged = data.requests.reduce((n, r) => n + r.unitsArranged, 0),
    demand = bloodGroups.map((group) => ({
      group,
      units: data.requests
        .filter((r) => r.bloodGroup === group)
        .reduce((n, r) => n + r.unitsRequired, 0),
    })),
    max = Math.max(1, ...demand.map((d) => d.units));
  return (
    <Screen
      title="The impact, in numbers."
      subtitle="Recent requests and confirmed donation activity."
      back
    >
      <View className="flex-row gap-3">
        <Card className="flex-1">
          <Eyebrow>UNITS NEEDED</Eyebrow>
          <Text className="mt-3 font-display text-3xl text-ink">{requested}</Text>
        </Card>
        <Card className="flex-1">
          <Eyebrow>UNITS CONFIRMED</Eyebrow>
          <Text className="mt-3 font-display text-3xl text-blood">{arranged}</Text>
        </Card>
      </View>
      <Section title="Demand by blood group" />
      <Card>
        {demand.map((d) => (
          <View key={d.group} className="mb-4 flex-row items-center gap-3">
            <Label className="w-10 text-xs">{d.group}</Label>
            <View className="h-3 flex-1 overflow-hidden rounded-full bg-[#F4EFED]">
              <View
                className="h-full rounded-full bg-blood"
                style={{ width: `${(d.units / max) * 100}%` }}
              />
            </View>
            <Body className="w-7 text-right text-xs">{d.units}</Body>
          </View>
        ))}
      </Card>
      <Section title="Request fulfillment" />
      <Card>
        <Text className="font-display text-4xl text-[#2D7865]">
          {requested ? Math.round((arranged / requested) * 100) : 0}%
        </Text>
        <Body className="mt-2">of requested units confirmed</Body>
        <Body className="mt-3 text-xs">
          Acceptance is tracked separately. Only facility-confirmed donations count toward
          fulfillment.
        </Body>
      </Card>
      <Section title="Request status" />
      <Card>
        <View className="gap-4">
          {Object.entries(statusLabels).map(([key, label]) => (
            <View key={key} className="flex-row justify-between">
              <Body className="text-xs">{label}</Body>
              <Label className="text-xs">
                {data.requests.filter((r) => r.status === key).length}
              </Label>
            </View>
          ))}
        </View>
      </Card>
      <Section title="Demand by city" />
      <Card>
        <View className="gap-4">
          {[...new Set(data.hospitals.map((h) => h.city))].map((city) => (
            <View key={city} className="flex-row justify-between">
              <Label className="text-sm">{city}</Label>
              <Body className="text-xs">
                {data.requests
                  .filter((r) => data.hospitals.find((h) => h.id === r.hospitalId)?.city === city)
                  .reduce((n, r) => n + r.unitsRequired, 0)}{' '}
                units requested
              </Body>
            </View>
          ))}
        </View>
      </Card>
      <View className="mt-5">
        <Notice>
          Analytics cover the recent requests and donation records loaded in this MVP dashboard.
          These are coordination metrics, not clinical forecasts.
        </Notice>
      </View>
    </Screen>
  );
}
