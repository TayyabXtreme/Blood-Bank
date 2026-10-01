import { Pressable, Switch, Text, View } from 'react-native';
import {
  Bell,
  ArrowUpRight,
  Droplet,
  Heart,
  ShieldCheck,
  MapPin,
  Plus,
  Activity,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp, useCommand } from '@/providers/AppProvider';
import {
  Body,
  Brand,
  Button,
  Card,
  colors,
  Empty,
  Eyebrow,
  Label,
  Notice,
  Pill,
  Screen,
  Section,
  Title,
} from '@/components/ui';
import RequestCard from '@/components/RequestCard';
import { eligibility, isCompatible, isOpen } from '@/domain/rules';
import { useNow } from '@/hooks/useNow';
export default function Home() {
  const now = useNow();
  const { data, mode } = useApp(),
    { run, busy } = useCommand(),
    { user, donor } = data;
  const isStaff = user?.role === 'admin' || user?.role === 'coordinator';
  const eligible = donor ? eligibility(donor, data.settings, now) : null;
  const feed = data.requests
    .filter(
      (r) =>
        isOpen(r.status) &&
        r.requiredBefore > now &&
        (!donor || isCompatible(donor.bloodGroup, r.bloodGroup)),
    )
    .sort(
      (a, b) =>
        ({ critical: 0, urgent: 1, normal: 2 })[a.urgency] -
        { critical: 0, urgent: 1, normal: 2 }[b.urgency],
    );
  const owned = data.requests.filter(
    (r) =>
      r.requesterId === user?.id &&
      ['pending', 'active', 'contacted', 'partial', 'fulfilled'].includes(r.status),
  );
  const pending = data.requests.filter(
    (r) => r.status === 'pending' && (user?.role === 'admin' || r.hospitalId === user?.hospitalId),
  );
  return (
    <Screen refresh>
      <View className="mb-7 flex-row items-center justify-between">
        <Brand small />
        <Pressable
          accessibilityLabel="Open alerts"
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/notifications')}
          className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
        >
          <Bell size={19} color={colors.ink} />
          {data.notifications.some((n) => !n.read) && (
            <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-blood" />
          )}
        </Pressable>
      </View>
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Eyebrow className="mb-2">
            {isStaff ? 'YOUR COMMUNITY. YOUR IMPACT.' : 'GOOD TO HAVE YOU HERE'}
          </Eyebrow>
          <Title>
            Hello, {user?.name.split(' ')[0]}
            <Text className="text-blood">.</Text>
          </Title>
          <View className="mt-1 flex-row items-center gap-1">
            <MapPin size={12} color={colors.muted} />
            <Body className="text-xs">
              {user?.city} · {isStaff ? 'Care team' : 'Your local donor network'}
            </Body>
          </View>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EDDEDA]">
          <Text className="font-bold text-lg text-[#8D655F]">
            {user?.name
              .split(' ')
              .map((s) => s[0])
              .slice(0, 2)
              .join('')}
          </Text>
        </View>
      </View>
      {mode === 'demo' && (
        <View className="mb-4">
          <Pill>DEMO · FICTIONAL SAMPLE DATA</Pill>
        </View>
      )}
      {donor && (
        <Card className="mb-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blush">
                <Text className="font-display text-lg text-blood">{donor.bloodGroup}</Text>
              </View>
              <View>
                <Label className="text-sm">
                  {donor.available ? 'Available to help' : 'Taking a little break'}
                </Label>
                <Body className="text-[11px]">
                  {donor.available ? 'Your kindness is on call' : 'Turn on when you’re ready'}
                </Body>
              </View>
            </View>
            <Switch
              accessibilityLabel="Available to donate"
              disabled={busy}
              value={donor.available}
              onValueChange={(available) => {
                void run({ kind: 'updateDonor', input: { available } });
              }}
              trackColor={{ true: colors.blood }}
            />
          </View>
        </Card>
      )}
      <LinearGradient
        colors={['#B62341', '#90243D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 24, overflow: 'hidden' }}
      >
        <Droplet
          size={112}
          color="#FFFFFF16"
          fill="#FFFFFF0D"
          style={{ position: 'absolute', right: -10, top: 10, transform: [{ rotate: '16deg' }] }}
        />
        <Eyebrow className="mb-3 text-[#EFB8C2]">
          {isStaff ? 'CARE STARTS WITH COORDINATION' : 'WHEN EVERY MOMENT MATTERS'}
        </Eyebrow>
        <Text className="font-display text-[27px] leading-9 text-white">
          {isStaff ? 'Bring the right help' : 'A little blood.'}
        </Text>
        <Text className="font-display text-[27px] leading-9 text-white">
          {isStaff ? 'to the right place.' : 'A whole new chance.'}
        </Text>
        <Text className="mb-5 mt-3 max-w-[250px] font-sans text-[12px] leading-5 text-[#F2CFD5]">
          {isStaff
            ? `${pending.length} requests waiting for your review. Help move care forward.`
            : 'Request blood in a few simple steps. We’ll help connect you with compatible donors.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(isStaff ? '/coordinator' : '/request/create')}
          className="self-start flex-row items-center gap-3 rounded-xl bg-white px-4 py-3.5"
        >
          <Text className="font-bold text-xs text-blood">
            {isStaff ? 'Open care dashboard' : 'Request blood'}
          </Text>
          {isStaff ? (
            <ArrowUpRight size={17} color={colors.blood} />
          ) : (
            <Plus size={17} color={colors.blood} />
          )}
        </Pressable>
      </LinearGradient>
      <View className="mt-5 flex-row gap-3">
        {[
          {
            icon: <Heart size={18} color={colors.blood} />,
            value: donor?.totalDonations ?? data.stats.donations,
            label: donor ? 'Your donations' : 'Donations recorded',
          },
          {
            icon: <Activity size={18} color={colors.green} />,
            value: isStaff ? pending.length : data.stats.requests,
            label: isStaff ? 'Awaiting review' : 'Active requests',
          },
        ].map((stat) => (
          <Card key={stat.label} className="flex-1 p-4">
            <View className="flex-row items-center justify-between">
              {stat.icon}
              <Text className="font-display text-[25px] text-ink">{stat.value}</Text>
            </View>
            <Body className="mt-3 text-[10px]">{stat.label}</Body>
          </Card>
        ))}
      </View>
      {donor && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/donor/availability')}
          className="mt-5 flex-row items-center gap-3 rounded-2xl border border-[#DEEAE0] bg-[#F0F6EE] p-4"
        >
          <ShieldCheck size={21} color={colors.green} />
          <View className="flex-1">
            <Label className="text-xs text-[#2D7865]">
              {eligible?.eligible
                ? 'Ready for preliminary matching'
                : 'Your eligibility needs a moment'}
            </Label>
            <Body className="mt-1 text-[10px]">
              {eligible?.eligible ? 'Final screening happens at the hospital.' : eligible?.reason}
            </Body>
          </View>
          <ArrowUpRight size={16} color={colors.green} />
        </Pressable>
      )}
      {owned.length > 0 && (
        <>
          <Section
            title="Your active request"
            action="View all"
            onPress={() => router.push('/(tabs)/requests')}
          />
          <RequestCard request={owned[0]} />
        </>
      )}
      <Section
        title={
          isStaff
            ? 'Requests to review'
            : donor
              ? 'You could make a difference'
              : 'Around your community'
        }
        action="View all"
        onPress={() => router.push(isStaff ? '/coordinator/pending' : '/(tabs)/requests')}
      />
      {(isStaff ? pending : feed).slice(0, 2).map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
      {!(isStaff ? pending : feed).length && (
        <Empty
          title="A quiet moment"
          body={
            isStaff
              ? 'No pending requests for your hospital.'
              : 'No active matching requests right now. Check back soon.'
          }
        />
      )}
      <View className="mt-4">
        <Notice>
          For immediate medical emergencies, contact local emergency services or your hospital.
          BloodBank supports donation coordination.
        </Notice>
      </View>
      {user?.role === 'admin' && (
        <Button
          className="mt-5"
          title="Manage the platform"
          variant="secondary"
          onPress={() => router.push('/admin')}
        />
      )}
    </Screen>
  );
}
