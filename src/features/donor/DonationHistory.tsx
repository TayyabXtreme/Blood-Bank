import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Notice } from '@/components/auth/ui';
import { Action, BloodHeader, BloodScreen, EmptyState, InfoLine, LoadingState, ui } from '@/components/blood/ui';
import { useApp } from '@/features/app/AppProvider';
import { colors, radii } from '@/theme/tokens';
import { dateLabel } from './DonorHome';

type Snapshot = { donations: { id: string; requestId: string; hospitalId?: string; hospitalName?: string; units: number; donatedAt: number }[]; hospitals: { id: string; name: string }[] };
export default function DonationHistory() {
  const { data, loading, error, mode } = useApp();
  const snapshot = data as unknown as Snapshot | null;
  const donations = [...(snapshot?.donations ?? [])].sort((a, b) => b.donatedAt - a.donatedAt);
  return <BloodScreen><BloodHeader back={() => router.back()} /><Text style={ui.title}>Donation history</Text><Text style={[ui.body, { marginVertical: 10 }]}>Every confirmed donation matters.</Text>{mode !== 'live' ? <InfoLine>Demo history · sample donations.</InfoLine> : null}{error ? <Notice title="Could not load history" message={error} tone="error" /> : null}{loading ? <LoadingState label="Loading your donations…" /> : donations.length ? donations.map((donation) => <View key={donation.id} style={styles.card}><View style={styles.row}><Feather name="droplet" color={colors.primary} size={28} /><View style={{ flex: 1 }}><Text style={ui.section}>{donation.units} {donation.units === 1 ? 'unit' : 'units'} donated</Text><Text style={ui.body}>{donation.hospitalName ?? snapshot?.hospitals.find((hospital) => hospital.id === donation.hospitalId)?.name ?? 'Receiving hospital'}</Text><Text style={ui.muted}>{dateLabel(donation.donatedAt)} · Staff confirmed</Text></View></View><Action label="View request" icon="chevron-right" onPress={() => router.push({ pathname: '/request/[id]', params: { id: donation.requestId } })} /></View>) : <EmptyState title="Your story starts here" message="Your completed donations appear here after hospital staff confirm them." icon="heart" />}<InfoLine>Self-reported donation dates support your profile. This history contains staff-confirmed donations.</InfoLine></BloodScreen>;
}
const styles = StyleSheet.create({ card: { borderWidth: 1, borderColor: colors.divider, borderRadius: radii.card, backgroundColor: colors.surface, padding: 16, marginVertical: 8, gap: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 } });
