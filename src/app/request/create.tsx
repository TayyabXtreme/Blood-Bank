import { useRef } from 'react';
import { router } from 'expo-router';
import { useApp } from '@/features/app/AppProvider';
import { RequestFlowCreate } from '@/features/requests/request-flow-create';

export default function CreateRequestScreen() {
  const { data, loading, error, refresh, command, mode } = useApp();
  const clientRequestId = useRef<string | null>(null);
  return <RequestFlowCreate hospitals={(data?.hospitals || []).filter((item) => item.active)} loading={loading} facilityError={error || undefined} onRetry={() => void refresh()} canSubmit={!!data?.user && data.user.role !== 'donor'} preview={mode !== 'live'} unavailableReason={mode === 'live' ? 'Use a requester or authorized hospital account to create a blood request.' : 'Requests are created in the sample environment. No real donors are contacted.'} onExit={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/requests')} onSubmit={async ({ location: _location, ...input }) => {
    clientRequestId.current ||= `request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await command('createRequest', { ...input, clientRequestId: clientRequestId.current });
    const id = result.requestId || result.id;
    if (!id) throw new Error('No request confirmation was received. Please retry.');
    router.replace({ pathname: '/request/success', params: { id: String(id) } });
  }} />;
}
