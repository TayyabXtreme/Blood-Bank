import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Field, Notice, Screen, Section } from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
import { Settings } from '@/domain/types';
export default function PolicySettings() {
  const { data } = useApp(),
    { run, busy } = useCommand(),
    [values, setValues] = useState<Settings>(data.settings);
  const groups: { title: string; fields: { key: keyof Settings; label: string }[] }[] = [
    {
      title: 'Preliminary eligibility',
      fields: [
        { key: 'donationIntervalDays', label: 'Minimum donation interval (days)' },
        { key: 'minAge', label: 'Minimum donor age' },
        { key: 'maxAge', label: 'Maximum donor age' },
      ],
    },
    {
      title: 'Matching & escalation',
      fields: [
        { key: 'initialRadiusKm', label: 'Initial radius (km)' },
        { key: 'maxRadiusKm', label: 'Maximum radius (km)' },
        { key: 'batchSize', label: 'Initial donor batch size' },
        { key: 'escalationMinutes', label: 'Wait between batches (minutes)' },
      ],
    },
    {
      title: 'Ranking weights',
      fields: [
        { key: 'distanceWeight', label: 'Distance weight' },
        { key: 'readinessWeight', label: 'Readiness weight' },
        { key: 'reliabilityWeight', label: 'Response reliability weight' },
      ],
    },
  ];
  return (
    <Screen title="Match with intention." subtitle="Configure deterministic matching policy." back>
      <Notice>
        Preliminary rules must be reviewed by the receiving facilities. They do not replace medical
        screening. Changes affect subsequent matching batches.
      </Notice>
      {groups.map((group) => (
        <View key={group.title}>
          <Section title={group.title} />
          <Card className="gap-4">
            {group.fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                keyboardType="numeric"
                value={String(values[field.key])}
                onChangeText={(text) => setValues((v) => ({ ...v, [field.key]: Number(text) }))}
              />
            ))}
          </Card>
        </View>
      ))}
      <Body className="mt-5 text-xs">
        Availability and urgency have fixed weights of 20 and 10. Scores normalize all weights to a
        0–100 scale. Critical requests escalate twice as fast.
      </Body>
      <Button
        className="mt-6"
        title="Save platform policy"
        busy={busy}
        onPress={() => run({ kind: 'updateSettings', input: values }, 'Matching policy updated.')}
      />
    </Screen>
  );
}
