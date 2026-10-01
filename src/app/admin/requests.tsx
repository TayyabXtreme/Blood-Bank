import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Chip, Empty, Screen } from '@/components/ui';
import RequestCard from '@/components/RequestCard';
import { useApp } from '@/providers/AppProvider';
import { statusLabels } from '@/domain/rules';
import { RequestStatus } from '@/domain/types';
export default function RequestOversight() {
  const { data } = useApp(),
    [scope, setScope] = useState<RequestStatus | 'all'>('all');
  const requests = data.requests.filter((r) => scope === 'all' || r.status === scope);
  return (
    <Screen
      title="Every request, in view."
      subtitle="Verify, coordinate, and review platform requests."
      back
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 18 }}
      >
        <Chip title="All" selected={scope === 'all'} onPress={() => setScope('all')} />
        {(
          [
            'pending',
            'contacted',
            'partial',
            'fulfilled',
            'completed',
            'rejected',
            'expired',
            'cancelled',
          ] as const
        ).map((status) => (
          <Chip
            key={status}
            title={statusLabels[status]}
            selected={scope === status}
            onPress={() => setScope(status)}
          />
        ))}
      </ScrollView>
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
      {!requests.length && (
        <Empty
          title="No requests in this view"
          body="Choose another status to see more requests."
        />
      )}
    </Screen>
  );
}
