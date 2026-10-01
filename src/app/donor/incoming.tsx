import { useState } from 'react';
import { View } from 'react-native';
import { Chip, Empty, Screen } from '@/components/ui';
import RequestCard from '@/components/RequestCard';
import { useApp } from '@/providers/AppProvider';
export default function Incoming() {
  const { data } = useApp(),
    [scope, setScope] = useState('Pending');
  const offers = data.responses.filter(
    (r) =>
      r.donorUserId === data.user?.id &&
      (scope === 'Pending'
        ? r.status === 'notified'
        : scope === 'Accepted'
          ? r.status === 'accepted' && !r.donationConfirmed
          : true),
  );
  const requests = data.requests.filter((r) => offers.some((o) => o.requestId === r.id));
  return (
    <Screen
      title="Your chance to help."
      subtitle="Matching offers made for your donor profile."
      back
    >
      <View className="mb-5 flex-row gap-2">
        {['Pending', 'Accepted', 'All'].map((s) => (
          <Chip key={s} title={s} selected={s === scope} onPress={() => setScope(s)} />
        ))}
      </View>
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
      {!requests.length && (
        <Empty
          title="No matching offers here"
          body="Keep your profile and availability up to date. Matching offers will appear when you’re needed."
        />
      )}
    </Screen>
  );
}
