import { Empty, Screen } from '@/components/ui';
import RequestCard from '@/components/RequestCard';
import { useApp } from '@/providers/AppProvider';
export default function Pending() {
  const { data } = useApp();
  const requests = data.requests.filter(
    (r) =>
      r.status === 'pending' &&
      (data.user?.role === 'admin' || r.hospitalId === data.user?.hospitalId),
  );
  return (
    <Screen
      title="Review. Verify. Connect."
      subtitle="Requests waiting for hospital verification."
      back
    >
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} />
      ))}
      {!requests.length && (
        <Empty
          title="You’re all caught up"
          body="There are no pending requests for your hospital."
        />
      )}
    </Screen>
  );
}
