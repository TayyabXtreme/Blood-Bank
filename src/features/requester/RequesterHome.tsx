import { router } from 'expo-router';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Button, Notice } from '@/components/auth/ui';
import { RequestCard } from '@/components/blood/RequestCard';
import { closedRequestStatuses, type BloodRequestSummary } from '@/components/blood/model';
import { BloodHeader, BloodScreen, EmptyState, InfoLine, LoadingState, SectionTitle, ui } from '@/components/blood/ui';
import { colors, fonts, radii } from '@/theme/tokens';

export type RequesterHomeProps = {
  name: string; city: string; requests: readonly BloodRequestSummary[]; nearby: readonly BloodRequestSummary[];
  loading: boolean; refreshing: boolean; onRefresh: () => void; error?: string; preview: boolean;
  openRequest: (id: string) => void;
};

export default function RequesterHome({ name, city, requests, nearby, loading, refreshing, onRefresh, error, preview, openRequest }: RequesterHomeProps) {
  const active = requests.filter((request) => !closedRequestStatuses.has(request.requestStatus));
  const completed = requests.filter((request) => request.requestStatus === 'Completed').length;
  return <BloodScreen scroll={false}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
    <BloodHeader city={city} />
    {preview ? <InfoLine>Demo mode · requests and updates are sample data.</InfoLine> : null}
    <View style={styles.greeting}><Text style={ui.title}>Hello{name.trim() ? `, ${name.trim().split(/\s+/)[0]}` : ''}</Text><Text style={ui.body}>Help is closer than you think.</Text></View>
    <View style={styles.hero}><View style={styles.heroCopy}><Text style={styles.heroTitle}>Need blood{ '\n' }urgently?</Text><Text style={styles.heroBody}>Create a request and{ '\n' }let donors near you know.</Text></View><Image source={require('../../../assets/onboarding/requester-hands.png')} style={styles.heroArt} resizeMode="contain" accessible={false} /><Button label="Request Blood" onPress={() => router.push('/request/create')} style={styles.heroButton} /></View>
    {error ? <Notice title="Requests could not load" message={error} tone="error" /> : null}
    <SectionTitle title="Your active request" action="View all" onPress={() => router.push('/(tabs)/requests')} />
    {loading ? <LoadingState label="Loading your requests…" /> : active[0] ? <RequestCard request={active[0]} variant="active" onPress={() => openRequest(active[0].id)} /> : <EmptyState title="No active request" message="Your request progress will appear here." icon="file-text" />}
    <SectionTitle title="Nearby requests" action="View all" onPress={() => router.push('/(tabs)/requests')} />
    {loading ? <LoadingState label="Finding nearby requests…" /> : nearby[0] ? <RequestCard request={nearby[0]} variant="compact" onPress={() => openRequest(nearby[0].id)} /> : <EmptyState title="No requests nearby" message="New verified requests will appear as they become available." />}
    <View style={styles.stats}><View style={styles.stat}><Feather name="file-text" size={26} color={colors.primary} /><View><Text style={styles.statNumber}>{active.length}</Text><Text style={ui.muted}>Active</Text></View></View><View style={styles.stat}><Feather name="check-circle" size={26} color={colors.primary} /><View><Text style={styles.statNumber}>{completed}</Text><Text style={ui.muted}>Completed</Text></View></View></View>
    <InfoLine>For immediate care, contact your hospital.</InfoLine>
  </ScrollView></BloodScreen>;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 12 }, greeting: { gap: 3, marginTop: 7, marginBottom: 16 }, hero: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, backgroundColor: 'rgba(251,225,223,0.25)', padding: 16, minHeight: 193, overflow: 'hidden' },
  heroCopy: { zIndex: 1, width: '62%', paddingBottom: 18 }, heroTitle: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 30, letterSpacing: -0.65, color: colors.primary }, heroBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 7 }, heroArt: { position: 'absolute', right: -8, top: 1, height: 143, width: 150 }, heroButton: { minHeight: 48, paddingVertical: 8, zIndex: 1 },
  stats: { flexDirection: 'row', gap: 9, marginVertical: 12 }, stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.divider, borderRadius: 14, backgroundColor: 'rgba(255,251,249,0.55)', padding: 13 }, statNumber: { fontFamily: fonts.bold, fontSize: 23, lineHeight: 26, color: colors.burgundy },
});
