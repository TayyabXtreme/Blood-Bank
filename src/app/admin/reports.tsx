import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Body, Button, Card, Chip, Empty, Label, Pill, Screen } from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
export default function ReportsAdmin() {
  const { data } = useApp(),
    { run, busy } = useCommand(),
    [scope, setScope] = useState('open');
  const reports = data.reports.filter((r) => scope === 'all' || r.status === scope);
  return (
    <Screen
      title="Keep the network trusted."
      subtitle="Review concerns raised by the community."
      back
    >
      <View className="mb-5 flex-row gap-2">
        {['open', 'resolved', 'all'].map((s) => (
          <Chip
            key={s}
            title={s.toUpperCase()}
            selected={s === scope}
            onPress={() => setScope(s)}
          />
        ))}
      </View>
      {reports.map((report) => (
        <Card key={report.id} className="mb-4">
          <Pill tone={report.status === 'open' ? 'amber' : 'green'}>
            {report.status.toUpperCase()}
          </Pill>
          <Label className="mt-4">{report.reason}</Label>
          {report.details && <Body className="mt-2 text-xs">{report.details}</Body>}
          <Body className="mt-3 text-[10px]">
            Reported {new Date(report.createdAt).toLocaleString()}
          </Body>
          <Button
            className="mt-3"
            title="Review related request"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/request/[id]', params: { id: report.requestId } })
            }
          />
          {report.status === 'open' && (
            <View className="mt-3 gap-2">
              <Button
                title="Mark concern resolved"
                busy={busy}
                onPress={() =>
                  run(
                    { kind: 'resolveReport', reportId: report.id, dismiss: false },
                    'Report resolved.',
                  )
                }
              />
              <Button
                title="Dismiss report"
                variant="ghost"
                busy={busy}
                onPress={() =>
                  run(
                    { kind: 'resolveReport', reportId: report.id, dismiss: true },
                    'Report dismissed.',
                  )
                }
              />
            </View>
          )}
        </Card>
      ))}
      {!reports.length && (
        <Empty title="A trusted community" body="No reports need attention in this view." />
      )}
    </Screen>
  );
}
