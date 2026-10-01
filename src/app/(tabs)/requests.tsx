import { router } from 'expo-router';
import { useApp } from '@/features/app/AppProvider';
import RequestsView from '@/features/requester/RequestsView';

export default function RequestsScreen() {
  const { data, loading, error, refresh, mode } = useApp();
  return <RequestsView requests={data?.requests || []} city={data?.user?.city || ''} loading={loading} refreshing={loading} onRefresh={() => void refresh()} error={error || undefined} preview={mode !== 'live'} ownRequestIds={data?.requests.filter((item) => item.requesterId === data.user?.id).map((item) => item.id)} canCreate={!!data?.user && data.user.role !== 'donor'} openRequest={(id) => router.push({ pathname: '/request/[id]', params: { id } })} />;
}
