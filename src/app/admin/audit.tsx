import { Body, Card, Empty, Eyebrow, Label, Screen } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
export default function Audit() {
  const { data } = useApp();
  return (
    <Screen title="Care leaves a record." subtitle="Sensitive platform actions, newest first." back>
      {[...data.audits]
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((entry) => (
          <Card key={entry.id} className="mb-3">
            <Eyebrow className="text-blood">{entry.action.replaceAll('_', ' ')}</Eyebrow>
            <Label className="mt-3 text-sm">
              {data.users.find((u) => u.id === entry.actorId)?.name ?? 'Authorized platform user'}
            </Label>
            <Body className="mt-1 text-xs">{new Date(entry.createdAt).toLocaleString()}</Body>
            <Body className="mt-2 text-[10px]">Reference: {entry.entityId}</Body>
          </Card>
        ))}
      {!data.audits.length && (
        <Empty
          title="No activity recorded yet"
          body="Role grants, request verification, account suspension, and donation confirmation will be recorded here."
        />
      )}
    </Screen>
  );
}
