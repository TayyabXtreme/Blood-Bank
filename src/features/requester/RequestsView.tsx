import Feather from '@expo/vector-icons/Feather';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Field, Notice } from '@/components/auth/ui';
import { RequestCard } from '@/components/blood/RequestCard';
import { bloodGroups, closedRequestStatuses, requestStatuses, type BloodRequestSummary } from '@/components/blood/model';
import { Action, BloodHeader, BloodScreen, BloodSheet, EmptyState, InfoLine, LoadingState, Segment, ui, FocusPressable as Pressable, type BloodIcon } from '@/components/blood/ui';
import { colors, fonts, radii } from '@/theme/tokens';

type FilterKey = 'bloodGroup' | 'urgency' | 'status' | 'location' | 'deadline';
const initialFilters = { bloodGroup: '', urgency: '', status: '', location: '', deadline: '' };
const filters: readonly { key: FilterKey; label: string; icon: BloodIcon }[] = [
  { key: 'bloodGroup', label: 'Blood group', icon: 'droplet' }, { key: 'urgency', label: 'Urgency', icon: 'alert-circle' },
  { key: 'status', label: 'Status', icon: 'calendar' }, { key: 'location', label: 'Location', icon: 'map-pin' },
  { key: 'deadline', label: 'Required time', icon: 'clock' },
];
const options: Record<Exclude<FilterKey, 'location'>, readonly string[]> = { bloodGroup: bloodGroups, urgency: ['Normal', 'Urgent', 'Critical'], status: requestStatuses, deadline: ['Next 6 hours', 'Next 24 hours', 'Next 7 days'] };
const deadlineWindows: Record<string, number> = { 'Next 6 hours': 6 * 3_600_000, 'Next 24 hours': 24 * 3_600_000, 'Next 7 days': 7 * 86_400_000 };

export default function RequestsView({ requests, city, loading, refreshing, onRefresh, error, preview, openRequest, hasMore = false, loadMore, ownRequestIds, canCreate = false }: {
  requests: readonly BloodRequestSummary[]; city: string; loading: boolean; refreshing: boolean; onRefresh: () => void;
  error?: string; preview: boolean; openRequest: (id: string) => void; hasMore?: boolean; loadMore?: () => void;
  ownRequestIds?: readonly string[]; canCreate?: boolean;
}) {
  const [tab, setTab] = useState('active');
  const [mine, setMine] = useState(false);
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState('');
  const input = useRef<TextInput>(null);
  const [selected, setSelected] = useState(initialFilters);
  const [sheet, setSheet] = useState<FilterKey | null>(null);
  const [locationDraft, setLocationDraft] = useState('');
  const needle = search.trim().toLocaleLowerCase('en');
  const visible = requests.filter((request) => {
    const history = closedRequestStatuses.has(request.requestStatus);
    return (tab === 'history' ? history : !history) && (!mine || ownRequestIds?.includes(request.id))
      && (!needle || `${request.hospitalName} ${request.city}`.toLocaleLowerCase('en').includes(needle))
      && (!selected.bloodGroup || request.bloodGroup === selected.bloodGroup)
      && (!selected.urgency || request.urgency === selected.urgency)
      && (!selected.status || request.requestStatus === selected.status)
      && (!selected.location || request.city.toLocaleLowerCase('en').includes(selected.location.toLocaleLowerCase('en')))
      && (!selected.deadline || request.requiredBefore >= now && request.requiredBefore <= now + deadlineWindows[selected.deadline]);
  });
  const filtered = !!needle || Object.values(selected).some(Boolean);
  const clear = () => { setSearch(''); setSelected(initialFilters); input.current?.focus(); };

  const header = <><BloodHeader city={city} /><Text style={ui.title}>Requests</Text><Text style={ui.body}>Find and track blood requests.</Text><View style={styles.results}>{ownRequestIds ? <Action label={mine ? 'Show all requests' : 'Show my requests'} icon="user" onPress={() => setMine((value) => !value)} /> : null}{canCreate ? <Action label="New request" icon="plus" onPress={() => router.push('/request/create')} /> : null}</View>{preview ? <View style={styles.preview}><InfoLine>Demo mode · sample requests and changes.</InfoLine></View> : null}
    <View style={styles.search}><Feather name="search" size={22} color={colors.burgundy} /><TextInput ref={input} accessibilityLabel="Search hospital or city" placeholder="Search hospital or city" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} autoCapitalize="none" returnKeyType="search" style={styles.input} selectionColor={colors.primary} />{search ? <Action label="Clear search" icon="x" iconOnly onPress={() => { setSearch(''); input.current?.focus(); }} /> : null}</View>
    <Segment values={[{ key: 'active', label: 'Active' }, { key: 'history', label: 'History' }]} selected={tab} onSelect={setTab} />
    <View style={styles.filters}>{filters.map((filter) => <Pressable key={filter.key} accessibilityRole="button" accessibilityLabel={`${filter.label}: ${selected[filter.key] || 'All'}`} accessibilityState={{ expanded: sheet === filter.key }} onPress={() => { if (filter.key === 'location') setLocationDraft(selected.location); setSheet(filter.key); }} style={({ pressed, hovered, focused }) => [styles.chip, selected[filter.key] ? styles.activeChip : null, (pressed || hovered) && { opacity: 0.75 }, focused && ui.focus]}><Feather name={filter.icon} size={19} color={colors.primary} /><Text style={styles.chipText} numberOfLines={1}>{selected[filter.key] || filter.label}</Text><Feather name="chevron-right" size={16} color={colors.primary} /></Pressable>)}</View>
    {filtered ? <View style={styles.results}><Text style={ui.muted}>{visible.length} {visible.length === 1 ? 'request' : 'requests'}</Text><Action label="Clear filters" onPress={clear} /></View> : null}
    {error ? <Notice title="Could not load requests" message={error} tone="error" /> : null}
  </>;
  return <BloodScreen scroll={false}><FlatList data={visible} keyExtractor={(request) => request.id} renderItem={({ item }) => <RequestCard request={item} onPress={() => openRequest(item.id)} />} ListHeaderComponent={header} ListEmptyComponent={loading ? <LoadingState label="Loading requests…" /> : <EmptyState title={filtered ? 'No matching requests' : tab === 'history' ? 'No previous requests' : 'No active requests'} message={filtered ? 'Try another blood group, urgency, status or city.' : 'Requests will appear here when they are available.'} action={filtered ? 'Clear filters' : error ? 'Try again' : undefined} onPress={filtered ? clear : onRefresh} />} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} refreshing={refreshing} onRefresh={onRefresh} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" ListFooterComponent={hasMore && loadMore ? <Action label="Load more requests" onPress={loadMore} disabled={loading} /> : null} />
    <BloodSheet title={sheet ? filters.find((filter) => filter.key === sheet)?.label || 'Filter' : 'Filter'} visible={sheet !== null} onClose={() => setSheet(null)}>{sheet === 'location' ? <><Text style={ui.body}>Filter by hospital city.</Text><Field label="City" value={locationDraft} onChangeText={setLocationDraft} placeholder="e.g. Hyderabad" icon="map-pin" maxLength={80} /><Button label="Apply location" onPress={() => { setSelected((current) => ({ ...current, location: locationDraft.trim() })); setSheet(null); }} /><Action label="All locations" onPress={() => { setSelected((current) => ({ ...current, location: '' })); setSheet(null); }} /></> : sheet ? ['', ...options[sheet]].map((value) => <Pressable key={value || 'all'} accessibilityRole="radio" accessibilityState={{ checked: selected[sheet] === value }} accessibilityLabel={value || 'All'} onPress={() => { setSelected((current) => ({ ...current, [sheet]: value })); setSheet(null); }} style={({ pressed, focused }) => [styles.option, pressed && { opacity: 0.65 }, focused && ui.focus]}><Text style={ui.body}>{value || 'All'}</Text><Feather name={selected[sheet] === value ? 'check-circle' : 'circle'} size={21} color={colors.primary} /></Pressable>) : null}</BloodSheet>
  </BloodScreen>;
}

const styles = StyleSheet.create({
  list: { paddingBottom: 20 }, preview: { marginTop: 12 }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 13, minHeight: 52, marginTop: 17, backgroundColor: 'rgba(255,251,249,0.6)' }, input: { flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingVertical: 13 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, chip: { width: '48%', flexGrow: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 10, backgroundColor: 'rgba(255,251,249,0.6)' }, activeChip: { backgroundColor: colors.blush }, chipText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.text }, results: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }, option: { minHeight: 52, borderBottomWidth: 1, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: radii.field },
});
