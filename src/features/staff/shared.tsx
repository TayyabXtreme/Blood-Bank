import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Notice } from '@/components/auth/ui';
import { BloodHeader, BloodScreen, EmptyState, InfoLine, LoadingState, ui } from '@/components/blood/ui';
import { useApp } from '@/features/app/AppProvider';
import { colors, fonts, radii } from '@/theme/tokens';
import type { BloodRequestSummary } from '@/components/blood/model';

export type StaffUser = { id: string; name: string; email: string; city: string; role: string; accountStatus?: string; status?: string; hospitalId?: string; bloodGroup?: string; available?: boolean; eligibilityStatus?: string; totalDonations?: number };
export type Hospital = { id: string; name: string; city: string; address: string; latitude: number; longitude: number; contact?: string; verified: boolean; active: boolean; kind: 'hospital' | 'bloodBank' };
export type StaffResponse = { id: string; requestId: string; donorName?: string; bloodGroup?: string; responseStatus: string; matchScore: number; distanceKm: number; confirmedUnits: number; donationConfirmed?: boolean };
export type StaffSnapshot = { user: StaffUser | null; requests: (BloodRequestSummary & { hospitalId: string; description?: string })[]; users: StaffUser[]; hospitals: Hospital[]; responses: StaffResponse[]; donations: { units: number; hospitalId: string; donatedAt: number }[]; reports: { id: string; requestId: string; reason: string; details?: string; status: string; resolution?: string; createdAt: number }[]; auditLogs: { id: string; action: string; entityType: string; entityId: string; createdAt: number; actorName?: string }[]; config?: { operational?: Record<string, unknown>; eligibility?: Record<string, unknown> } | null };
export function useStaff() {
  const app = useApp();
  const snapshot = app.data as unknown as StaffSnapshot | null;
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  async function run(name: string, payload: Record<string, unknown>, success: string): Promise<boolean> {
    if (busy) return false;
    setBusy(name); setFeedback(''); setFailed(false);
    try { await app.command(name, payload); setFeedback(success); return true; }
    catch (cause) { setFailed(true); setFeedback(cause instanceof Error ? cause.message : 'Could not save the change. Please try again.'); return false; }
    finally { setBusy(''); }
  }
  return { ...app, snapshot, busy, feedback, failed, run, setFeedback, setFailed };
}
export function StaffGate({ loading, user, admin = false }: { loading: boolean; user?: StaffUser | null; admin?: boolean }) {
  return <BloodScreen><BloodHeader />{loading ? <LoadingState label="Checking staff access…" /> : <EmptyState title="Staff access required" message={admin ? 'This page is available to an authorized administrator.' : 'This workspace is available to authorized hospital coordinators and administrators.'} icon="lock" />}</BloodScreen>;
}
export function StaffFeedback({ error, feedback, failed, mode }: { error?: string | null; feedback?: string; failed?: boolean; mode: string }) {
  return <View style={{ gap: 10 }}>{mode !== 'live' ? <InfoLine>Demo staff workspace · actions update isolated sample data.</InfoLine> : null}{error ? <Notice title="Could not refresh workspace" message={error} tone="error" /> : null}{feedback ? <Notice title={failed ? 'Action could not complete' : 'Saved'} message={feedback} tone={failed ? 'error' : 'success'} /> : null}</View>;
}
export function Metric({ value, label }: { value: string | number; label: string }) { return <View style={staffStyles.metric}><Text style={staffStyles.number}>{value}</Text><Text style={[ui.muted, { textAlign: 'center' }]}>{label}</Text></View>; }
export const staffStyles = StyleSheet.create({ content: { gap: 12, paddingBottom: 28 }, card: { gap: 10, padding: 16, borderWidth: 1, borderColor: colors.divider, borderRadius: radii.card, backgroundColor: colors.surface }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, flex: { flex: 1 }, metrics: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, metric: { flex: 1, minWidth: 90, gap: 4, borderWidth: 1, borderColor: colors.divider, borderRadius: 16, backgroundColor: colors.surface, padding: 13, alignItems: 'center' }, number: { fontFamily: fonts.bold, fontSize: 27, color: colors.burgundy }, button: { minHeight: 48, paddingVertical: 7, paddingHorizontal: 12 }, chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: radii.pill, justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary }, separator: { height: 1, backgroundColor: colors.divider, marginVertical: 4 } });
