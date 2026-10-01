import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  ChevronRight,
  Heart,
  Bell,
  Shield,
  Hospital,
  LogOut,
  UserRound,
  Settings2,
  MapPin,
} from 'lucide-react-native';
import { router } from 'expo-router';
import {
  Body,
  Button,
  Card,
  colors,
  ConfirmSheet,
  Eyebrow,
  Field,
  Label,
  Notice,
  Pill,
  Screen,
  Section,
} from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
import { demoAccounts } from '@/data/demo';
import { usePushRegistration } from '@/hooks/useNotifications';
import { authClient } from '@/lib/auth-client';
export default function Profile() {
  const app = useApp(),
    { data, mode } = app,
    { run, busy } = useCommand(),
    registerPush = usePushRegistration();
  const [editing, setEditing] = useState(false),
    [name, setName] = useState(data.user?.name ?? ''),
    [phone, setPhone] = useState(data.user?.phone ?? ''),
    [city, setCity] = useState(data.user?.city ?? ''),
    [signingOut, setSigningOut] = useState(false),
    [reset, setReset] = useState(false),
    [pushBusy, setPushBusy] = useState(false);
  const row = (title: string, subtitle: string, icon: React.ReactNode, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-[72px] flex-row items-center gap-3 border-b border-line py-4"
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F6F1EF]">{icon}</View>
      <View className="flex-1">
        <Label className="text-sm">{title}</Label>
        <Body className="text-[11px]">{subtitle}</Body>
      </View>
      <ChevronRight size={17} color={colors.muted} />
    </Pressable>
  );
  return (
    <Screen title="Your little corner." subtitle="Your profile, your preferences, your impact.">
      <Card>
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-blush">
            <Text className="font-display text-2xl text-blood">
              {data.user?.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </Text>
          </View>
          <View className="flex-1">
            <Label className="text-lg">{data.user?.name}</Label>
            <Body className="text-xs">{data.user?.email}</Body>
            <View className="mt-2">
              <Pill tone="red">{data.user?.role.toUpperCase()}</Pill>
            </View>
          </View>
        </View>
        {data.donor && (
          <View className="mt-5 flex-row justify-between border-t border-line pt-5">
            <View>
              <Eyebrow>BLOOD GROUP</Eyebrow>
              <Label className="mt-1 text-lg text-blood">{data.donor.bloodGroup}</Label>
            </View>
            <View>
              <Eyebrow>DONATIONS</Eyebrow>
              <Label className="mt-1 text-lg">{data.donor.totalDonations}</Label>
            </View>
            <View>
              <Eyebrow>COMMUNITY</Eyebrow>
              <Label className="mt-1 text-lg">{data.user?.city}</Label>
            </View>
          </View>
        )}
      </Card>
      <Section title="Make it yours" />
      {row(
        'Personal details',
        'Name and private contact information',
        <UserRound size={19} color={colors.blood} />,
        () => setEditing(!editing),
      )}
      {editing && (
        <Card className="mt-4 gap-4">
          <Field label="Name" value={name} onChangeText={setName} />
          <Field
            label="Phone (private)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Field label="City" value={city} onChangeText={setCity} editable={!data.donor} />
          {data.donor && (
            <Body className="text-xs">Change your matching area from Location & area below.</Body>
          )}
          <Button
            title="Save details"
            busy={busy}
            onPress={async () => {
              const result = await run(
                { kind: 'updateProfile', name, phone, city },
                'Profile updated.',
              );
              if (result.ok) setEditing(false);
            }}
          />
        </Card>
      )}
      {data.donor && (
        <>
          {row(
            'Availability & eligibility',
            'Take a break or update your screening details',
            <Heart size={19} color={colors.blood} />,
            () => router.push('/donor/availability'),
          )}
          {row(
            'Location & area',
            'Update your approximate matching location',
            <MapPin size={19} color={colors.blood} />,
            () => router.push('/donor/location'),
          )}
          {row(
            'Your donation history',
            'Every donation is a little more hope',
            <Heart size={19} color={colors.blood} />,
            () => router.push('/donor/history'),
          )}
          {row(
            'Your matching offers',
            'Pending and accepted donor requests',
            <Bell size={19} color={colors.blood} />,
            () => router.push('/donor/incoming'),
          )}
        </>
      )}
      {row(
        'Push alerts',
        pushBusy ? 'Registering your device…' : 'Enable alerts on this device',
        <Bell size={19} color={colors.blood} />,
        async () => {
          if (pushBusy) return;
          setPushBusy(true);
          try {
            await registerPush();
            app.showToast('Push alerts enabled on this device.');
          } catch (e) {
            app.showToast(e instanceof Error ? e.message : 'Unable to enable push alerts.');
          } finally {
            setPushBusy(false);
          }
        },
      )}
      {row(
        'Verify your email',
        'Add another layer of trust',
        <Shield size={19} color={colors.blood} />,
        async () => {
          if (mode === 'demo') {
            app.showToast('Demo preview only. No email was sent.');
            return;
          }
          try {
            const result = await authClient.sendVerificationEmail({
              email: data.user?.email ?? '',
              callbackURL: 'bloodbank://',
            });
            if (result.error) throw new Error(result.error.message);
            app.showToast('Verification link sent to your email.');
          } catch (e) {
            app.showToast(e instanceof Error ? e.message : 'Unable to send email.');
          }
        },
      )}
      {(data.user?.role === 'coordinator' || data.user?.role === 'admin') &&
        row(
          'Hospital care dashboard',
          'Verify requests and confirm donations',
          <Hospital size={19} color={colors.blood} />,
          () => router.push('/coordinator'),
        )}
      {data.user?.role === 'admin' &&
        row(
          'Platform administration',
          'Manage people, hospitals, and platform policy',
          <Settings2 size={19} color={colors.blood} />,
          () => router.push('/admin'),
        )}
      {mode === 'demo' && (
        <>
          <Section title="Explore another perspective" />
          <Notice>
            Role switching is available only in this demo. Live coordinator and admin access is
            controlled by the backend.
          </Notice>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.role}
                className="grow"
                title={account.role[0].toUpperCase() + account.role.slice(1)}
                variant={data.user?.role === account.role ? 'primary' : 'secondary'}
                onPress={() => {
                  app.enterDemo(account.role);
                  router.replace('/');
                }}
              />
            ))}
          </View>
          <Button
            className="mt-4"
            title="Reset all sample data"
            variant="ghost"
            onPress={() => setReset(true)}
          />
        </>
      )}
      <Button
        className="mt-7"
        title="Sign out"
        variant="secondary"
        icon={<LogOut size={17} color={colors.blood} />}
        onPress={() => setSigningOut(true)}
      />
      <Body className="mt-5 text-center text-[10px]">
        BloodBank · A little of you. A life for someone.
      </Body>
      <ConfirmSheet
        visible={signingOut}
        title="See you soon."
        body="You’ll be signed out on this device."
        confirmLabel="Sign out"
        onCancel={() => setSigningOut(false)}
        onConfirm={async () => {
          try {
            await app.signOut();
            router.replace('/');
          } catch (e) {
            app.showToast(e instanceof Error ? e.message : 'Unable to sign out.');
          }
          setSigningOut(false);
        }}
      />
      <ConfirmSheet
        visible={reset}
        title="Start the demo again?"
        body="This resets all sample requests, responses, and demo profiles."
        confirmLabel="Reset sample data"
        onCancel={() => setReset(false)}
        onConfirm={() => {
          app.resetDemo();
          router.replace('/');
        }}
      />
    </Screen>
  );
}
