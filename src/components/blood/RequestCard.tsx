import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';
import { Action } from './ui';
import { deadlineLabel, type BloodRequestSummary } from './model';

export function BloodGroupBadge({ group }: { group: string }) {
  return <View style={styles.group}><Text style={styles.groupText}>{group}</Text></View>;
}

export function StatusBadge({ label, positive = false }: { label: string; positive?: boolean }) {
  return <View style={[styles.badge, positive && styles.positive]}><Text style={[styles.badgeText, positive && styles.positiveText]}>{label}</Text></View>;
}

export function RequestProgress({ arranged, required }: { arranged: number; required: number }) {
  const percentage = required > 0 ? Math.min(100, Math.max(0, arranged / required * 100)) : 0;
  return <View style={styles.progressRow}>
    <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityLabel="Units arranged" accessibilityValue={{ min: 0, max: required, now: arranged, text: `${arranged} of ${required} units arranged` }}><View style={[styles.progressFill, { width: `${percentage}%` }]} /></View>
    <Text style={styles.progressText}>{arranged} of {required} units arranged</Text>
  </View>;
}

export function RequestCard({ request, onPress, variant = 'list' }: { request: BloodRequestSummary; onPress: () => void; variant?: 'list' | 'active' | 'compact' }) {
  const compact = variant === 'compact';
  const showProgress = !compact && (variant === 'active' || request.unitsArranged > 0);
  return <View style={[styles.card, compact && styles.compact]}>
    <View style={styles.row}><BloodGroupBadge group={request.bloodGroup} /><View style={styles.copy}>
      {compact ? <Text style={styles.strong}>{request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'}</Text> : <View style={styles.badges}><StatusBadge label={request.urgency} />{request.verified ? <View style={styles.verified}><Feather name="check-circle" size={13} color={colors.success} /><Text style={styles.verifiedText}>Verified</Text></View> : null}</View>}
      <View style={styles.hospital}><Feather name="map-pin" size={16} color={colors.primary} /><View style={styles.copy}><Text style={styles.strong}>{request.hospitalName}</Text>{!compact ? <Text style={styles.meta}>{request.city}</Text> : null}</View></View>
      {compact ? <Text style={styles.meta}>{request.distanceKm !== undefined ? `Approx. ${request.distanceKm.toFixed(1)} km · ` : ''}{deadlineLabel(request.requiredBefore)}</Text> : null}
    </View>{compact ? <Action icon="chevron-right" label={`View ${request.bloodGroup} request at ${request.hospitalName}`} onPress={onPress} iconOnly /> : null}</View>
    {!compact ? <><Text style={styles.units}>{request.unitsRequired} {request.unitsRequired === 1 ? 'unit' : 'units'} needed</Text><Text style={styles.meta}>{deadlineLabel(request.requiredBefore)}{request.distanceKm !== undefined ? ` · Approx. ${request.distanceKm.toFixed(1)} km` : ''}</Text><View style={styles.statusRow}><StatusBadge label={request.requestStatus} positive={request.requestStatus === 'Partially Fulfilled' || request.requestStatus === 'Completed' || request.requestStatus === 'Fulfilled'} /></View></> : null}
    {showProgress ? <RequestProgress arranged={request.unitsArranged} required={request.unitsRequired} /> : null}
    {variant === 'active' && request.acceptedDonors !== undefined ? <View style={styles.accepted}><Feather name="users" size={19} color={colors.primary} /><Text style={styles.meta}>{request.acceptedDonors} {request.acceptedDonors === 1 ? 'donor accepted' : 'donors accepted'}</Text></View> : null}
    {!compact ? <View style={styles.actionRow}><Action label={variant === 'active' ? 'Track request' : 'View request'} icon="chevron-right" onPress={onPress} underline /></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, backgroundColor: 'rgba(255,251,249,0.72)', padding: 16, gap: 5 },
  compact: { padding: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, copy: { flex: 1, minWidth: 0 },
  group: { width: 55, height: 55, borderRadius: 28, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' }, groupText: { fontFamily: fonts.bold, fontSize: 25, color: colors.burgundy },
  strong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.text }, meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
  badges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5, marginBottom: 7 }, badge: { backgroundColor: colors.blush, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' }, badgeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  positive: { backgroundColor: colors.successSurface }, positiveText: { color: colors.success }, verified: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.successSurface, borderRadius: 9, paddingHorizontal: 5, paddingVertical: 4 }, verifiedText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.success },
  hospital: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 }, units: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, marginTop: 4 }, statusRow: { paddingTop: 3 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6, flexWrap: 'wrap' }, progressTrack: { flexGrow: 1, flexBasis: 125, height: 10, borderRadius: radii.pill, backgroundColor: colors.divider, overflow: 'hidden' }, progressFill: { height: 10, backgroundColor: colors.primary, borderRadius: radii.pill }, progressText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.muted },
  accepted: { flexDirection: 'row', alignItems: 'center', gap: 7 }, actionRow: { alignItems: 'flex-end' },
});
