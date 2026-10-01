import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { Notice } from '@/components/auth/ui';
import { notificationDay, relativeTime } from '@/components/blood/model';
import { Action, BloodHeader, BloodScreen, EmptyState, InfoLine, LoadingState, Segment, ui, FocusPressable as Pressable, type BloodIcon } from '@/components/blood/ui';
import { colors, fonts, radii } from '@/theme/tokens';

export type InboxItem = { id: string; requestId?: string; type: string; title: string; body: string; read: boolean; sentAt: number };
const alertIcons: Record<string, BloodIcon> = { DonorRequest: 'droplet', RequestUpdate: 'users', Verification: 'calendar', DonationConfirmed: 'check' };

export default function AlertsView({ alerts, city, preview, loading, refreshing, onRefresh, error, markAllRead, openAlert, hasMore = false, loadMore }: {
  alerts: readonly InboxItem[]; city: string; preview: boolean; loading: boolean; refreshing: boolean; onRefresh: () => void;
  error?: string; markAllRead: () => Promise<void>; openAlert: (alert: InboxItem) => Promise<void>; hasMore?: boolean; loadMore?: () => void;
}) {
  const [tab, setTab] = useState('all');
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [failure, setFailure] = useState('');
  const unread = alerts.filter((alert) => !alert.read).length;
  const groups = new Map<string, InboxItem[]>();
  for (const alert of [...alerts].sort((left, right) => right.sentAt - left.sentAt)) {
    if (tab === 'unread' && alert.read) continue;
    const day = notificationDay(alert.sentAt);
    groups.set(day, [...(groups.get(day) || []), alert]);
  }
  const sections = [...groups].map(([title, data]) => ({ title, data }));
  const markAll = async () => { if (busy) return; setBusy(true); setFailure(''); try { await markAllRead(); } catch { setFailure('Could not mark your alerts as read. Please try again.'); } finally { setBusy(false); } };
  const open = async (item: InboxItem) => { if (opening) return; setOpening(item.id); setFailure(''); try { await openAlert(item); } catch { setFailure('Could not open this alert. Please try again.'); } finally { setOpening(null); } };

  return <BloodScreen scroll={false}><SectionList sections={sections} keyExtractor={(item) => item.id} stickySectionHeadersEnabled={false} contentContainerStyle={styles.list} refreshing={refreshing} onRefresh={onRefresh}
    ListHeaderComponent={<><BloodHeader city={city} /><View style={styles.heading}><Text style={ui.title}>Alerts</Text><Action label={busy ? 'Marking…' : 'Mark all read'} underline onPress={() => void markAll()} disabled={busy || unread === 0} /></View>{preview ? <InfoLine>Demo mode · sample notifications.</InfoLine> : null}<Segment values={[{ key: 'all', label: `All (${alerts.length})` }, { key: 'unread', label: `Unread (${unread})` }]} selected={tab} onSelect={setTab} />{failure || error ? <Notice title="Alerts could not update" message={failure || error || ''} tone="error" /> : null}</>}
    renderSectionHeader={({ section }) => <Text style={styles.day}>{section.title}</Text>}
    renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.read ? 'Read' : 'Unread'}: ${item.title}. ${item.body}. ${relativeTime(item.sentAt)}`} accessibilityState={{ busy: opening === item.id, disabled: opening !== null }} disabled={opening !== null} onPress={() => void open(item)} style={({ pressed, hovered, focused }) => [styles.row, !item.read && styles.unread, (pressed || hovered) && { opacity: 0.7 }, focused && ui.focus]}>
      {!item.read ? <View style={styles.dot} /> : null}<View style={styles.icon}><Feather name={alertIcons[item.type] || 'bell'} size={25} color={colors.primary} /></View><View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={styles.time}>{relativeTime(item.sentAt)}</Text></View>{item.requestId ? <Feather name="chevron-right" size={19} color={colors.primary} /> : null}
    </Pressable>}
    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
    ListEmptyComponent={loading ? <LoadingState label="Loading your alerts…" /> : <EmptyState title={tab === 'unread' ? 'You’re all caught up' : 'No alerts yet'} message={tab === 'unread' ? 'You have no unread notifications.' : 'Your blood request updates will appear here.'} icon="bell" />}
    ListFooterComponent={hasMore && loadMore ? <Action label="Load more alerts" onPress={loadMore} disabled={loading} /> : null}
  /></BloodScreen>;
}

const styles = StyleSheet.create({
  list: { paddingBottom: 20 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, day: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, marginTop: 14, marginBottom: 12 },
  row: { borderRadius: radii.card, borderWidth: 1, borderColor: colors.divider, backgroundColor: 'rgba(255,251,249,0.7)', padding: 15, minHeight: 113, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, unread: { backgroundColor: 'rgba(251,225,223,0.34)' }, dot: { position: 'absolute', left: 3, top: 42, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }, icon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0, gap: 4 }, title: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, color: colors.text }, body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted }, time: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 1 },
});
