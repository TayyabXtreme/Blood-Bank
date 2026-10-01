import { Pressable, Text, View } from 'react-native';
import { ArrowUpRight, Clock3, MapPin, ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { BloodRequest } from '@/domain/types';
import { useApp } from '@/providers/AppProvider';
import { Body, colors, Eyebrow, Pill } from './ui';
import { statusLabels } from '@/domain/rules';
export function timeRemaining(time: number) {
  const hours = (time - Date.now()) / 3_600_000;
  if (hours <= 0) return 'Time passed';
  if (hours < 1) return `${Math.max(1, Math.ceil(hours * 60))} min left`;
  if (hours < 24) return `${Math.ceil(hours)} hours left`;
  return `${Math.ceil(hours / 24)} days left`;
}
export default function RequestCard({
  request,
  compact = false,
}: {
  request: BloodRequest;
  compact?: boolean;
}) {
  const { data } = useApp(),
    hospital = data.hospitals.find((h) => h.id === request.hospitalId),
    offer = data.responses.find(
      (r) => r.requestId === request.id && r.donorUserId === data.user?.id,
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${request.bloodGroup} request at ${hospital?.name ?? 'hospital'}`}
      onPress={() => router.push({ pathname: '/request/[id]', params: { id: request.id } })}
      className="mb-3 rounded-[24px] border border-line bg-white p-5 active:opacity-80"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-3 flex-row items-center gap-2">
            <Pill
              tone={
                request.urgency === 'critical'
                  ? 'red'
                  : request.urgency === 'urgent'
                    ? 'amber'
                    : 'neutral'
              }
            >
              {request.urgency.toUpperCase()}
            </Pill>
            {request.verification === 'verified' && <ShieldCheck size={14} color={colors.green} />}
          </View>
          <Text className="font-bold text-[17px] leading-6 text-ink">
            {hospital?.name ?? 'Hospital'}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <MapPin size={12} color={colors.muted} />
            <Body className="text-xs">
              {hospital?.city ?? '—'}
              {offer ? ` · ${offer.distanceKm} km away` : ''}
            </Body>
          </View>
        </View>
        <View className="ml-3 h-[62px] w-[62px] items-center justify-center rounded-[20px] bg-blush">
          <Text className="font-display text-[24px] text-blood">{request.bloodGroup}</Text>
        </View>
      </View>
      {!compact && (
        <>
          <View className="mb-3 mt-4 h-[1px] bg-line" />
          <View className="flex-row items-center justify-between">
            <View>
              <Eyebrow className="text-[8px] tracking-[1px]">
                {request.unitsArranged} OF {request.unitsRequired} UNITS ARRANGED
              </Eyebrow>
              <View className="mt-1 flex-row items-center gap-1.5">
                <Clock3 size={12} color={colors.muted} />
                <Body className="text-xs">{timeRemaining(request.requiredBefore)}</Body>
              </View>
            </View>
            <ArrowUpRight size={19} color={colors.blood} />
          </View>
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F4EFED]">
            <View
              style={{
                width: `${Math.min(100, (request.unitsArranged / request.unitsRequired) * 100)}%`,
              }}
              className="h-full rounded-full bg-blood"
            />
          </View>
          <Body className="mt-2 text-[10px]">
            {statusLabels[request.status]}
            {offer?.status === 'accepted' ? ' · You accepted' : ''}
          </Body>
        </>
      )}
    </Pressable>
  );
}
