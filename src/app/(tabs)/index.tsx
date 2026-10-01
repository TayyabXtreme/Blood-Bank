import { router } from 'expo-router';
import { useApp } from '@/features/app/AppProvider';
import RequesterHome from '@/features/requester/RequesterHome';
import DonorHome from '@/features/donor/DonorHome';
import StaffHome from '@/features/staff/StaffHome';
import { BloodScreen, LoadingState } from '@/components/blood/ui';
import { closedRequestStatuses } from '@/components/blood/model';

export default function HomeScreen() {
  const { data, loading, error, refresh, mode } = useApp();
  if (!data?.user) return <BloodScreen><LoadingState label="Opening your dashboard…" /></BloodScreen>;
  if (data.user.role === 'donor') return <DonorHome />;
  if (data.user.role === 'coordinator' || data.user.role === 'admin') return <StaffHome />;
  const own = data.requests.filter((item) => item.requesterId === data.user.id);
  const nearby = data.requests.filter((item) => item.verified && item.city.toLowerCase() === data.user.city.toLowerCase() && !closedRequestStatuses.has(item.requestStatus));
  return <RequesterHome name={data.user.name} city={data.user.city} requests={own} nearby={nearby} loading={loading} refreshing={loading} onRefresh={() => void refresh()} error={error || undefined} preview={mode !== 'live'} openRequest={(id) => router.push({ pathname: '/request/[id]', params: { id } })} />;
}
