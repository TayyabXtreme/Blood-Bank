import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, MapPin, Minus, Plus } from 'lucide-react-native';
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
import { bloodGroups, RequestInput } from '@/domain/types';
import { requestSchema } from '@/domain/validation';
export default function CreateRequest() {
  const { data } = useApp(),
    { run, busy } = useCommand(),
    [step, setStep] = useState(0),
    [hours, setHours] = useState(6),
    [hospitalQuery, setHospitalQuery] = useState('');
  const [initialDeadline] = useState(() => Date.now() + 6 * 3_600_000);
  const { control, setValue, trigger, handleSubmit } = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      bloodGroup: 'B+',
      unitsRequired: 2,
      hospitalId: '',
      urgency: 'urgent',
      requiredBefore: initialDeadline,
      description: '',
    },
  });
  const input = useWatch({ control, compute: (formValues) => formValues }),
    hospital = data.hospitals.find((h) => h.id === input.hospitalId);
  const next = async () => {
    if (
      await trigger(
        step === 0
          ? ['bloodGroup', 'unitsRequired']
          : step === 1
            ? ['hospitalId']
            : ['urgency', 'requiredBefore', 'description'],
      )
    )
      setStep(step + 1);
  };
  return (
    <Screen back>
      <Eyebrow className="mb-3">REQUEST BLOOD · STEP {step + 1} OF 4</Eyebrow>
      <View className="mb-6 flex-row gap-2">
        {[0, 1, 2, 3].map((s) => (
          <View
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-blood' : 'bg-line'}`}
          />
        ))}
      </View>
      <Title>
        {
          ['What’s needed?', 'Where is help needed?', 'When does it matter?', 'Let’s make sure.'][
            step
          ]
        }
      </Title>
      <Body className="mb-7 mt-2">
        {
          [
            'Choose the recipient’s blood group and required units.',
            'Select the receiving hospital or blood facility.',
            'Help us reach donors with the right sense of urgency.',
            'Review your request before sending it for verification.',
          ][step]
        }
      </Body>
      {step === 0 && (
        <>
          <Label className="mb-3">Blood group</Label>
          <View className="mb-8 flex-row flex-wrap gap-3">
            {bloodGroups.map((group) => (
              <Pressable
                key={group}
                accessibilityRole="radio"
                accessibilityLabel={group}
                accessibilityState={{ selected: input.bloodGroup === group }}
                onPress={() => setValue('bloodGroup', group)}
                className={`h-[72px] w-[21%] items-center justify-center rounded-2xl border ${input.bloodGroup === group ? 'border-blood bg-blood' : 'border-line bg-white'}`}
              >
                <Text
                  className={`font-display text-xl ${input.bloodGroup === group ? 'text-white' : 'text-ink'}`}
                >
                  {group}
                </Text>
              </Pressable>
            ))}
          </View>
          <Label className="mb-3">Units required</Label>
          <Card>
            <View className="flex-row items-center justify-between">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease units"
                disabled={input.unitsRequired <= 1}
                onPress={() => setValue('unitsRequired', input.unitsRequired - 1)}
                className="h-12 w-12 items-center justify-center rounded-full bg-[#F4F0EE]"
              >
                <Minus size={20} color={colors.ink} />
              </Pressable>
              <View className="items-center">
                <Text className="font-display text-4xl text-ink">{input.unitsRequired}</Text>
                <Body className="text-xs">unit{input.unitsRequired > 1 ? 's' : ''}</Body>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase units"
                disabled={input.unitsRequired >= 20}
                onPress={() => setValue('unitsRequired', input.unitsRequired + 1)}
                className="h-12 w-12 items-center justify-center rounded-full bg-blush"
              >
                <Plus size={20} color={colors.blood} />
              </Pressable>
            </View>
          </Card>
        </>
      )}
      {step === 1 && (
        <>
          <Field
            label="Find your hospital"
            value={hospitalQuery}
            onChangeText={setHospitalQuery}
            placeholder="Hospital name or city"
          />
          <View className="mt-5 gap-3">
            {data.hospitals
              .filter(
                (h) =>
                  h.active &&
                  h.verified &&
                  `${h.name} ${h.city}`.toLowerCase().includes(hospitalQuery.toLowerCase()),
              )
              .map((h) => (
                <Pressable
                  key={h.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: input.hospitalId === h.id }}
                  onPress={() => setValue('hospitalId', h.id)}
                  className={`flex-row items-center gap-3 rounded-[22px] border p-5 ${input.hospitalId === h.id ? 'border-blood bg-blush' : 'border-line bg-white'}`}
                >
                  <MapPin size={22} color={colors.blood} />
                  <View className="flex-1">
                    <Label className="text-sm">{h.name}</Label>
                    <Body className="text-xs">
                      {h.city} · {h.address}
                    </Body>
                  </View>
                  {input.hospitalId === h.id && <Check size={18} color={colors.blood} />}
                </Pressable>
              ))}
            {!data.hospitals.some((h) => h.active && h.verified) && (
              <Notice>
                Your administrator needs to add and verify a hospital before you can create a
                request.
              </Notice>
            )}
            <Controller
              control={control}
              name="hospitalId"
              render={({ fieldState }) => (
                <Body className="text-xs text-blood">{fieldState.error?.message ?? ''}</Body>
              )}
            />
          </View>
        </>
      )}
      {step === 2 && (
        <View className="gap-5">
          <Label>Urgency</Label>
          <View className="flex-row gap-2">
            {(['normal', 'urgent', 'critical'] as const).map((u) => (
              <Chip
                key={u}
                title={u[0].toUpperCase() + u.slice(1)}
                selected={input.urgency === u}
                onPress={() => setValue('urgency', u)}
              />
            ))}
          </View>
          <Label>Required within</Label>
          <View className="flex-row flex-wrap gap-2">
            {[4, 6, 12, 24, 48].map((h) => (
              <Chip
                key={h}
                title={`${h} hours`}
                selected={hours === h}
                onPress={() => {
                  setHours(h);
                  setValue('requiredBefore', Date.now() + h * 3_600_000);
                }}
              />
            ))}
          </View>
          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <Field
                label="Coordinator notes (optional)"
                placeholder="Share only essential coordination details. Avoid patient medical information."
                multiline
                maxLength={600}
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                style={{ minHeight: 110, textAlignVertical: 'top' }}
              />
            )}
          />
          <Notice>
            Your notes are visible to you and the authorized care team. They are never included in
            donor push alerts.
          </Notice>
        </View>
      )}
      {step === 3 && (
        <>
          <Card>
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Eyebrow className="mb-2">YOUR REQUEST</Eyebrow>
                <Label className="text-xl">{input.unitsRequired} units needed</Label>
              </View>
              <View className="h-16 w-16 items-center justify-center rounded-[20px] bg-blush">
                <Text className="font-display text-2xl text-blood">{input.bloodGroup}</Text>
              </View>
            </View>
            <View className="gap-4">
              <View>
                <Eyebrow>RECEIVING HOSPITAL</Eyebrow>
                <Body className="mt-1 text-ink">
                  {hospital?.name} · {hospital?.city}
                </Body>
              </View>
              <View>
                <Eyebrow>URGENCY & DEADLINE</Eyebrow>
                <Body className="mt-1 text-ink">
                  {input.urgency.toUpperCase()} · {new Date(input.requiredBefore).toLocaleString()}
                </Body>
              </View>
              {input.description && (
                <View>
                  <Eyebrow>PRIVATE COORDINATION NOTES</Eyebrow>
                  <Body className="mt-1">{input.description}</Body>
                </View>
              )}
            </View>
          </Card>
          <View className="mt-5">
            <Notice>
              Your request starts as Pending verification. The hospital care team verifies it before
              compatible donors are notified.
            </Notice>
          </View>
        </>
      )}
      <Button
        className="mt-8"
        title={step === 3 ? 'Submit for verification' : 'Continue'}
        busy={busy}
        disabled={step === 1 && !input.hospitalId}
        onPress={
          step === 3
            ? handleSubmit(async (values) => {
                const result = await run({ kind: 'createRequest', input: values });
                if (result.ok && result.result)
                  router.replace({ pathname: '/request/[id]', params: { id: result.result } });
              })
            : next
        }
      />
      {step > 0 && (
        <Button title="Previous step" variant="ghost" onPress={() => setStep(step - 1)} />
      )}
    </Screen>
  );
}
