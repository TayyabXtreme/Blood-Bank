import { router } from 'expo-router';
import { useApp } from '@/features/app/AppProvider';
import AlertsView from '@/features/requester/AlertsView';

export default function AlertsScreen() {
  const { data, loading, error, refresh, command, mode } = useApp();
  return <AlertsView alerts={data?.notifications || []} city={data?.user?.city || ''} preview={mode !== 'live'} loading={loading} refreshing={loading} onRefresh={() => void refresh()} error={error || undefined} markAllRead={async () => { await command('markAllRead', {}); }} openAlert={async (alert) => { if (!alert.read) await command('markNotificationRead', { notificationId: alert.id }); if (alert.requestId) router.push({ pathname: '/request/[id]', params: { id: alert.requestId } }); }} />;
}
