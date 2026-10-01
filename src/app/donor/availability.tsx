import { useState } from 'react';
import { Switch, View } from 'react-native';
import {
  Body,
  Button,
  Card,
  colors,
  Empty,
  Field,
  Label,
  Notice,
  Pill,
  Screen,
  Section,
} from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
import { DAY, eligibility, medicalNotice } from '@/domain/rules';
export default function Availability() {
  const { data } = useApp(),
    { run, busy } = useCommand(),
    [date, setDate] = useState('');
  if (!data.donor || data.user?.role !== 'donor')
    return (
      <Screen title="Availability" back>
        <Empty
          title="A donor profile is needed"
          body="This screen is available to registered donors."
        />
      </Screen>
    );
  const donor = data.donor,
    eligible = eligibility(donor, data.settings);
  const settingRow = (
    title: string,
    body: string,
    value: boolean,
    field: 'available' | 'questionnairePassed' | 'notificationEnabled' | 'shareContact',
  ) => (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Label className="text-sm">{title}</Label>
          <Body className="mt-2 text-xs">{body}</Body>
        </View>
        <Switch
          accessibilityLabel={title}
          value={value}
          disabled={busy}
          onValueChange={(v) => {
            void run({ kind: 'updateDonor', input: { [field]: v } });
          }}
          trackColor={{ true: colors.blood }}
        />
      </View>
    </Card>
  );
  return (
    <Screen title="Help on your terms." subtitle="Availability can change. That’s okay." back>
      <Card>
        <Pill tone={eligible.eligible ? 'green' : 'amber'}>
          {eligible.eligible ? 'PRELIMINARILY ELIGIBLE' : 'TAKE A MOMENT'}
        </Pill>
        <Body className="mt-3">{eligible.reason}</Body>
        <Body className="mt-3 text-xs">
          Last donation:{' '}
          {donor.lastDonationDate
            ? new Date(donor.lastDonationDate).toLocaleDateString()
            : 'Not recorded'}
        </Body>
      </Card>
      <Section title="Your availability" />
      {settingRow(
        'Available for requests',
        'Receive matching offers when you can help.',
        donor.available,
        'available',
      )}
      {settingRow(
        'Preliminary screening declaration',
        'I feel well, have no known reason to defer, and agree to medical screening at the hospital.',
        donor.questionnairePassed,
        'questionnairePassed',
      )}
      <View className="mb-4 gap-3">
        <Button
          title="Pause matching for 7 days"
          variant="secondary"
          busy={busy}
          onPress={() =>
            run(
              { kind: 'updateDonor', input: { temporaryUnavailableUntil: Date.now() + 7 * DAY } },
              'Matching paused for 7 days.',
            )
          }
        />
        {!!donor.temporaryUnavailableUntil && (
          <Button
            title="Remove temporary pause"
            variant="ghost"
            busy={busy}
            onPress={() =>
              run(
                { kind: 'updateDonor', input: { temporaryUnavailableUntil: 0 } },
                'Temporary pause removed.',
              )
            }
          />
        )}
      </View>
      <Section title="Privacy & alerts" />
      {settingRow(
        'Emergency matching alerts',
        'Turn off to stop receiving new matching offers and push alerts.',
        donor.notificationEnabled,
        'notificationEnabled',
      )}
      {settingRow(
        'Share phone after acceptance',
        'Your requester and authorized care team can see it only after you accept.',
        donor.shareContact,
        'shareContact',
      )}
      <Section title="Record another donation" />
      <Field
        label="Donation date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        placeholder="2026-09-25"
      />
      <Button
        className="my-4"
        title="Update last donation date"
        variant="secondary"
        busy={busy}
        disabled={!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))}
        onPress={() =>
          run(
            { kind: 'updateDonor', input: { lastDonationDate: Date.parse(date) } },
            'Last donation date updated.',
          )
        }
      />
      <Notice>
        Self-reported dates affect preliminary eligibility. Only hospital-confirmed donations
        increase your recorded donation count.
      </Notice>
      <Body className="mt-5 text-xs">{medicalNotice}</Body>
    </Screen>
  );
}
