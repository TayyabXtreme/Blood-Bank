import { View, Text } from 'react-native';
import { Heart } from 'lucide-react-native';
import { format } from 'date-fns';
import { router } from 'expo-router';
import {
  Body,
  Button,
  Card,
  colors,
  Empty,
  Eyebrow,
  Label,
  Screen,
  Section,
} from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
export default function History() {
  const { data } = useApp();
  return (
    <Screen title="A little more hope." subtitle="Every confirmed donation leaves a mark." back>
      <Card className="items-center bg-blush">
        <Heart size={31} color={colors.blood} />
        <Text className="mt-3 font-display text-[42px] text-blood">
          {data.donor?.totalDonations ?? data.donations.length}
        </Text>
        <Eyebrow className="mt-1 text-blood">CONFIRMED DONATIONS</Eyebrow>
        <Body className="mt-3 text-center text-xs">Thank you for showing up when it matters.</Body>
      </Card>
      <Section title="Your donation history" />
      {[...data.donations]
        .sort((a, b) => b.donatedAt - a.donatedAt)
        .map((donation) => (
          <Card key={donation.id} className="mb-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Label>
                  {data.hospitals.find((h) => h.id === donation.hospitalId)?.name ?? 'Hospital'}
                </Label>
                <Body className="mt-1 text-xs">
                  {format(donation.donatedAt, 'dd MMM yyyy')} · 1 unit confirmed
                </Body>
              </View>
              <Text className="font-display text-xl text-blood">{donation.bloodGroup}</Text>
            </View>
            <Button
              className="mt-3"
              title="View completed request"
              variant="ghost"
              onPress={() =>
                router.push({ pathname: '/request/[id]', params: { id: donation.requestId } })
              }
            />
          </Card>
        ))}
      {!data.donations.length && (
        <Empty
          title="Your story starts here"
          body="Your first hospital-confirmed donation will appear here."
        />
      )}
    </Screen>
  );
}
