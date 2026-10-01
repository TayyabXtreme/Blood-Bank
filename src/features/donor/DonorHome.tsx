import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Image, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Field, Notice } from '@/components/auth/ui';
import { BloodGroupBadge, RequestCard, StatusBadge } from '@/components/blood/RequestCard';
import { closedRequestStatuses, type BloodRequestSummary } from '@/components/blood/model';
import { Action, BloodHeader, BloodScreen, BloodSheet, EmptyState, InfoLine, LoadingState, SectionTitle, Segment, ui } from '@/components/blood/ui';
import { useApp } from '@/features/app/AppProvider';
import { colors, fonts, radii } from '@/theme/tokens';
import { isCompatible } from '../../../convex/lib/compatibility';
import type { BloodGroup } from '../../../convex/lib/validators';

type Donor = { id: string; bloodGroup: BloodGroup; available: boolean; eligibilityStatus: string; totalDonations: number; lastDonationDate?: number; temporaryUnavailableUntil?: number };
type Response = { id: string; requestId: string; donorId: string; responseStatus: string; distanceKm?: number; confirmedUnits: number };
type Donation = { id: string; requestId: string; hospitalId?: string; hospitalName?: string; units: number; donatedAt: number };
type Snapshot = { user: { id: string; name: string; city: string; role: string } | null; donor?: Donor; requests: BloodRequestSummary[]; responses: Response[]; donations: Donation[]; hospitals: { id: string; name: string }[] };
export function dateLabel(value?: number) { return value ? new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }).format(value) : 'Not recorded'; }

export default function DonorHome() {
  const { data, loading, error, refresh, command, mode } = useApp();
  const snapshot = data as unknown as Snapshot | null;
  const [tab, setTab] = useState('nearby');
  const [availability, setAvailability] = useState(false);
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDate, setLastDate] = useState('');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  const donor = snapshot?.donor;
  const responses = (snapshot?.responses ?? []).filter((response) => !donor?.id || response.donorId === donor.id);
  const acceptedIds = new Set(responses.filter((response) => response.responseStatus === 'Accepted' && response.confirmedUnits === 0).map((response) => response.requestId));
  const declinedIds = new Set(responses.filter((response) => response.responseStatus === 'Declined').map((response) => response.requestId));
  const matchedIds = new Set(responses.filter((response) => ['Notified', 'NoResponse'].includes(response.responseStatus)).map((response) => response.requestId));
  const requests = (snapshot?.requests ?? []).filter((request) => !closedRequestStatuses.has(request.requestStatus) && request.requiredBefore > now && (tab === 'accepted' ? acceptedIds.has(request.id) : matchedIds.has(request.id) && request.verified && request.requestStatus !== 'Fulfilled' && !acceptedIds.has(request.id) && !declinedIds.has(request.id) && !!donor && isCompatible(donor.bloodGroup, request.bloodGroup))).map((request) => ({ ...request, distanceKm: responses.find((response) => response.requestId === request.id)?.distanceKm }));
  async function run(name: string, payload: Record<string, unknown>, success: string) {
    setBusy(name); setFeedback(''); setFailed(false);
    try { await command(name, payload); setFeedback(success); }
    catch (cause) { setFailed(true); setFeedback(cause instanceof Error ? cause.message : 'This change could not be saved. Please try again.'); }
    finally { setBusy(''); }
  }
  async function reload() { setRefreshing(true); try { await refresh(); } finally { setRefreshing(false); } }
  async function updateLastDonation() {
    const parsed = new Date(lastDate + 'T12:00:00').getTime();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastDate) || !Number.isFinite(parsed) || parsed > Date.now() || new Date(parsed).toISOString().slice(0, 10) !== lastDate) { setFailed(true); setFeedback('Enter a valid past date as YYYY-MM-DD.'); return; }
    await run('updateDonorProfile', { lastDonationDate: parsed, neverDonated: false }, 'Last donation date updated.');
  }
  if (!snapshot && loading) return <BloodScreen><BloodHeader /><LoadingState label="Loading your donor dashboard…" /></BloodScreen>;
  return <BloodScreen scroll={false}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}>
    <BloodHeader city={snapshot?.user?.city} />
    {mode !== 'live' ? <InfoLine>{mode === 'offline-demo' ? 'Offline demo' : 'Demo'} · Sample requests and local donor updates.</InfoLine> : null}
    <View style={styles.greeting}><Text style={ui.title}>Hello, {snapshot?.user?.name.split(' ')[0] || 'donor'}</Text><Text style={ui.body}>A little of you. A lifetime for someone.</Text></View>
    <View style={styles.hero}><View style={styles.heroCopy}><Text style={styles.heroTitle}>Ready to{ '\n' }make a difference?</Text><Text style={ui.muted}>Your next donation starts with{ '\n' }being there when it matters.</Text></View><Image source={require('../../../assets/onboarding/requester-hands.png')} resizeMode="contain" style={styles.art} accessible={false} /></View>
    {error ? <Notice title="Could not refresh" message={error} tone="error" /> : null}
    {feedback ? <Notice title={failed ? 'Change not saved' : 'Updated'} message={feedback} tone={failed ? 'error' : 'success'} /> : null}
    {donor ? <View style={styles.card}><View style={styles.row}><BloodGroupBadge group={donor.bloodGroup} /><View style={styles.flex}><Text style={ui.section}>Your donor profile</Text><Text style={ui.muted}>{snapshot?.user?.city} · Last donated {dateLabel(donor.lastDonationDate)}</Text></View></View><View style={styles.row}><Feather name="heart" color={colors.primary} size={20} /><Text style={[ui.body, styles.flex]}>{donor.available ? 'Available to help' : 'Availability paused'}</Text><Switch accessibilityLabel="Available for donation requests" value={donor.available} disabled={!!busy} thumbColor={colors.white} trackColor={{ false: colors.divider, true: colors.success }} onValueChange={(available) => run('setAvailability', { available }, available ? 'You are available for compatible requests.' : 'Donation alerts are paused.')} /></View>{donor.temporaryUnavailableUntil ? <Text style={ui.muted}>Paused until {dateLabel(donor.temporaryUnavailableUntil)}</Text> : null}<Action label="Manage availability & donation date" icon="chevron-right" onPress={() => { setLastDate(donor.lastDonationDate ? new Date(donor.lastDonationDate).toISOString().slice(0, 10) : ''); setAvailability(true); }} /><StatusBadge label={donor.eligibilityStatus === 'PreliminaryEligible' ? 'Preliminary eligibility recorded' : donor.eligibilityStatus === 'TemporarilyIneligible' ? 'Temporarily unavailable for matching' : 'Eligibility needs review'} positive={donor.eligibilityStatus === 'PreliminaryEligible'} /><Text style={ui.muted}>Medical staff confirm final eligibility. Availability does not establish medical clearance.</Text></View> : <EmptyState title="Complete your donor profile" message="Add your blood group and donation information before responding to requests." action="Open profile" onPress={() => router.push('/(tabs)/profile')} />}
    <Segment values={[{ key: 'nearby', label: 'Compatible requests' }, { key: 'accepted', label: 'Accepted' }]} selected={tab} onSelect={setTab} />
    {tab === 'accepted' ? <InfoLine positive>Your acceptance helps the hospital coordinate. A donation is counted after staff confirmation.</InfoLine> : null}
    {loading ? <LoadingState label="Finding compatible requests…" /> : requests.length ? requests.map((request) => <View key={request.id} style={styles.request}><RequestCard request={request} variant={tab === 'accepted' ? 'active' : 'list'} onPress={() => router.push({ pathname: '/request/[id]', params: { id: request.id } })} />{tab === 'nearby' ? <View style={styles.actions}><Button label="Accept request" busy={busy === 'respondRequest'} disabled={!!busy || !donor?.available || donor?.eligibilityStatus !== 'PreliminaryEligible'} onPress={() => run('respondRequest', { requestId: request.id, response: 'Accepted' }, 'Request accepted. Open the request to coordinate with the hospital.')} style={styles.smallButton} /><Button label="Decline" variant="outline" disabled={!!busy} onPress={() => run('respondRequest', { requestId: request.id, response: 'Declined' }, 'Request declined. You can still help with future requests.')} style={styles.smallButton} /></View> : <Button label="Withdraw acceptance" variant="outline" disabled={!!busy} style={styles.smallButton} onPress={() => run('respondRequest', { requestId: request.id, response: 'Declined' }, 'Acceptance withdrawn. The hospital can contact another donor.')} />}</View>) : <EmptyState title={tab === 'accepted' ? 'No accepted requests yet' : 'No compatible requests right now'} message={tab === 'accepted' ? 'Requests you accept will appear here for hospital coordination.' : 'Verified requests matching your blood group will appear here.'} icon="heart" />}
    <SectionTitle title="Your donation journey" action="History" onPress={() => router.push('/donor/history')} />
    <View style={styles.stats}><View style={styles.stat}><Feather name="droplet" size={25} color={colors.primary} /><Text style={styles.number}>{donor?.totalDonations ?? snapshot?.donations.length ?? 0}</Text><Text style={ui.muted}>Confirmed donations</Text></View><View style={styles.stat}><Feather name="users" size={25} color={colors.primary} /><Text style={styles.number}>{acceptedIds.size}</Text><Text style={ui.muted}>Accepted requests</Text></View></View>
    <InfoLine>For urgent care or donation instructions, contact the receiving hospital.</InfoLine>
  </ScrollView><BloodSheet visible={availability} title="Your availability" onClose={() => setAvailability(false)}><Text style={ui.body}>Choose when you are open to receiving compatible requests.</Text><Button label="Available now" disabled={!!busy} onPress={() => run('setAvailability', { available: true }, 'Availability enabled.')} /><Button label="Pause for 24 hours" variant="outline" disabled={!!busy} onPress={() => run('setAvailability', { available: false, temporaryUnavailableUntil: Date.now() + 86_400_000 }, 'Availability paused for 24 hours.')} /><Button label="Pause for 7 days" variant="outline" disabled={!!busy} onPress={() => run('setAvailability', { available: false, temporaryUnavailableUntil: Date.now() + 7 * 86_400_000 }, 'Availability paused for 7 days.')} /><SectionTitle title="Last donation date" /><Field label="Last donation date" placeholder="YYYY-MM-DD" value={lastDate} onChangeText={setLastDate} keyboardType="numbers-and-punctuation" /><Button label="Save donation date" disabled={!!busy} onPress={updateLastDonation} />{feedback ? <Notice title={failed ? 'Check your update' : 'Updated'} message={feedback} tone={failed ? 'error' : 'success'} /> : null}<InfoLine>Eligibility follows the policy approved by medical staff. No eligibility threshold has been assumed.</InfoLine></BloodSheet></BloodScreen>;
}

const styles = StyleSheet.create({ content: { paddingBottom: 24, gap: 12 }, greeting: { gap: 5, marginVertical: 12 }, hero: { minHeight: 155, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.blush, borderRadius: radii.card, overflow: 'hidden', justifyContent: 'center' }, heroCopy: { padding: 18, width: '73%', zIndex: 1 }, heroTitle: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 29, color: colors.primary, marginBottom: 8 }, art: { width: 145, height: 145, position: 'absolute', right: -15, bottom: -5, opacity: 0.82 }, card: { gap: 12, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, borderRadius: radii.card }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, flex: { flex: 1 }, request: { gap: 8, marginBottom: 4 }, actions: { flexDirection: 'row', gap: 8 }, smallButton: { flex: 1, minHeight: 48, paddingHorizontal: 9, paddingVertical: 8 }, stats: { flexDirection: 'row', gap: 10 }, stat: { flex: 1, alignItems: 'center', gap: 5, borderRadius: radii.card, borderColor: colors.divider, borderWidth: 1, padding: 16, backgroundColor: colors.surface }, number: { fontFamily: fonts.bold, fontSize: 30, color: colors.burgundy } });
