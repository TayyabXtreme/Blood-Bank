import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, MapPin, UserRound, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import {
  Body,
  Button,
  Card,
  Chip,
  colors,
  Eyebrow,
  Field,
  Label,
  Notice,
  Screen,
  Title,
} from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
import { bloodGroups, OnboardingInput } from '@/domain/types';
import { onboardingSchema } from '@/domain/validation';
import { medicalNotice } from '@/domain/rules';
import { cities } from '@/data/demo';
import { approximateLocation } from '@/hooks/useLocation';

export default function Onboarding() {
  const app = useApp(),
    { run, busy } = useCommand(),
    [step, setStep] = useState(0),
    [date, setDate] = useState(''),
    [locating, setLocating] = useState(false),
    [error, setError] = useState('');
  const { control, setValue, trigger, handleSubmit } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: 'donor',
      name: app.sessionName,
      phone: '',
      city: cities[0].name,
      bloodGroup: 'O+',
      age: 25,
      latitude: cities[0].latitude,
      longitude: cities[0].longitude,
      questionnairePassed: false,
      shareContact: false,
    },
  });
  const values = useWatch({ control, compute: (formValues) => formValues });
  const next = async () => {
    setError('');
    if (
      step === 1 &&
      !(await trigger(
        values.role === 'donor' ? ['name', 'phone', 'age', 'bloodGroup'] : ['name', 'phone'],
      ))
    )
      return;
    if (step === 2 && !(await trigger(['city', 'latitude', 'longitude']))) return;
    if (step === 1 && date) {
      const parsed = Date.parse(date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed) || parsed > Date.now()) {
        setError('Enter a past donation date as YYYY-MM-DD.');
        return;
      }
      setValue('lastDonationDate', parsed);
    }
    setStep(step + 1);
  };
  return (
    <Screen>
      <View className="mb-6 flex-row items-center justify-between">
        <Eyebrow>YOUR BLOODBANK PROFILE</Eyebrow>
        <Label className="text-xs text-blood">{step + 1} / 4</Label>
      </View>
      <View className="mb-7 flex-row gap-2">
        {[0, 1, 2, 3].map((s) => (
          <View
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-blood' : 'bg-line'}`}
          />
        ))}
      </View>
      <Title>
        {
          ['How will you help?', 'A little about you.', 'Keep help close.', 'You’re almost there.'][
            step
          ]
        }
      </Title>
      <Body className="mb-7 mt-2">
        {
          [
            'Choose your role. You can request blood with either profile.',
            'The details we need to connect you safely.',
            'We use an approximate location to find nearby matches.',
            'You stay in control of what you share.',
          ][step]
        }
      </Body>
      {step === 0 && (
        <View className="gap-4">
          {(['donor', 'requester'] as const).map((role) => (
            <Pressable
              key={role}
              accessibilityRole="radio"
              accessibilityState={{ selected: values.role === role }}
              onPress={() => setValue('role', role)}
              className={`flex-row items-center gap-4 rounded-[24px] border p-5 ${values.role === role ? 'border-blood bg-blush' : 'border-line bg-white'}`}
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
                {role === 'donor' ? (
                  <Heart size={24} color={colors.blood} />
                ) : (
                  <UserRound size={24} color={colors.blood} />
                )}
              </View>
              <View className="flex-1">
                <Label>{role === 'donor' ? 'I want to donate' : 'I need blood'}</Label>
                <Body className="mt-1 text-xs">
                  {role === 'donor'
                    ? 'Be there when someone needs you.'
                    : 'Find help for you or someone you love.'}
                </Body>
              </View>
              {values.role === role && <Check size={19} color={colors.blood} />}
            </Pressable>
          ))}
          <Notice>
            Hospital coordinator and administrator accounts are assigned by an authorized admin.
          </Notice>
        </View>
      )}
      {step === 1 && (
        <View className="gap-5">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field
                label="Full name"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Field
                label="Phone number (optional)"
                keyboardType="phone-pad"
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          {values.role === 'donor' && (
            <>
              <Label>Blood group</Label>
              <View className="flex-row flex-wrap gap-2">
                {bloodGroups.map((g) => (
                  <Chip
                    key={g}
                    title={g}
                    selected={values.bloodGroup === g}
                    onPress={() => setValue('bloodGroup', g)}
                  />
                ))}
              </View>
              <Controller
                control={control}
                name="age"
                render={({ field, fieldState }) => (
                  <Field
                    label="Age"
                    keyboardType="number-pad"
                    value={String(field.value ?? '')}
                    onChangeText={(v) => field.onChange(Number(v))}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Field
                label="Last donation (optional, YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
                placeholder="2026-01-15"
                autoCapitalize="none"
              />
              <Notice>{medicalNotice}</Notice>
            </>
          )}
        </View>
      )}
      {step === 2 && (
        <View className="gap-5">
          <View className="flex-row flex-wrap gap-2">
            {cities.map((city) => (
              <Chip
                key={city.name}
                title={city.name}
                selected={values.city === city.name}
                onPress={() => {
                  setValue('city', city.name);
                  setValue('latitude', city.latitude);
                  setValue('longitude', city.longitude);
                }}
              />
            ))}
          </View>
          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <Field
                label="City"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Button
            title="Use my approximate location"
            variant="secondary"
            busy={locating}
            icon={<MapPin size={17} color={colors.blood} />}
            onPress={async () => {
              setLocating(true);
              setError('');
              try {
                const location = await approximateLocation();
                setValue('latitude', location.latitude);
                setValue('longitude', location.longitude);
                app.showToast(
                  'Approximate location added. Your exact home location is never shared.',
                );
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : 'Location unavailable. Choose a city instead.',
                );
              } finally {
                setLocating(false);
              }
            }}
          />
          <Body className="text-xs">
            Choosing a city uses its center for approximate matching. Location permission is
            optional, and no background tracking is used.
          </Body>
          <Card>
            <Label>Selected area</Label>
            <Body>
              {values.city} · {values.latitude.toFixed(2)}, {values.longitude.toFixed(2)}
            </Body>
          </Card>
        </View>
      )}
      {step === 3 && (
        <View className="gap-5">
          {values.role === 'donor' && (
            <>
              <Card>
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Label>Ready for preliminary screening</Label>
                    <Body className="mt-2 text-xs">
                      I feel well, have no known reason to defer donation, and agree to complete
                      medical screening at the hospital.
                    </Body>
                  </View>
                  <Switch
                    accessibilityLabel="Preliminary screening declaration"
                    value={values.questionnairePassed}
                    onValueChange={(v) => setValue('questionnairePassed', v)}
                    trackColor={{ true: colors.blood }}
                  />
                </View>
              </Card>
              <Card>
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Label>Share contact after acceptance</Label>
                    <Body className="mt-2 text-xs">
                      Only the requester and authorized hospital coordinator may see your phone
                      after you accept.
                    </Body>
                  </View>
                  <Switch
                    accessibilityLabel="Share contact after acceptance"
                    value={values.shareContact}
                    onValueChange={(v) => setValue('shareContact', v)}
                    trackColor={{ true: colors.blood }}
                  />
                </View>
              </Card>
              {!values.questionnairePassed && (
                <Notice>
                  You can finish your profile while unavailable for matching. Review your screening
                  declaration later in Availability.
                </Notice>
              )}
            </>
          )}
          <Notice>
            Enable push alerts from your profile whenever you’re ready. Your in-app inbox is
            available immediately.
          </Notice>
          <Body className="text-xs">{medicalNotice}</Body>
        </View>
      )}
      {error && <Body className="mt-4 text-blood">{error}</Body>}
      <Button
        className="mt-8"
        title={step === 3 ? 'Finish my profile' : 'Continue'}
        busy={busy}
        onPress={
          step === 3
            ? handleSubmit(
                async (input) => {
                  const result = await run({ kind: 'onboard', input }, 'Welcome to BloodBank.');
                  if (result.ok) router.replace('/');
                },
                () => setError('Please check your profile details.'),
              )
            : next
        }
      />
      {step > 0 && (
        <Button title="Previous step" variant="ghost" onPress={() => setStep(step - 1)} />
      )}
      <Button
        title="Sign out"
        variant="ghost"
        onPress={() => app.signOut().catch((e: Error) => app.showToast(e.message))}
      />
    </Screen>
  );
}
