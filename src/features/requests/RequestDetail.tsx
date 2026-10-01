import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Field, Notice } from '@/components/auth/ui';
import { BloodGroupBadge, RequestProgress, StatusBadge } from '@/components/blood/RequestCard';
import { closedRequestStatuses } from '@/components/blood/model';
import { Action, BloodHeader, BloodScreen, BloodSheet, EmptyState, InfoLine, LoadingState, SectionTitle, ui } from '@/components/blood/ui';
import { useApp } from '@/features/app/AppProvider';
import { formatRequestDate } from './request-flow-model';
import { colors, fonts, radii } from '@/theme/tokens';

const stages = ['Pending Verification', 'Active', 'Donors Contacted', 'Partially Fulfilled', 'Fulfilled', 'Completed'];
const reasons = ['Incorrect information', 'Duplicate request', 'Suspicious activity', 'Other'];

export default function RequestDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, command, assist, refresh, mode } = useApp();
  const [sheet, setSheet] = useState<'cancel' | 'complete' | 'report' | 'reject' | null>(null);
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState('');
  const [failure, setFailure] = useState('');
  const [feedback, setFeedback] = useState('');
  const [units, setUnits] = useState('1');
  const [assistance, setAssistance] = useState<{ available: boolean; source: string; summary: string; message?: string } | null>(null);
  const request = data?.requests.find((item) => item.id === params.id);
  const back = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/requests');
  if (!request) return <BloodScreen><BloodHeader back={back} />{loading ? <LoadingState label="Loading this request…" /> : <EmptyState title="Request unavailable" message={error || 'This request is no longer available or you do not have access.'} action="Try again" onPress={() => void refresh()} />}</BloodScreen>;
  const owner = request.requesterId === data?.user?.id;
  const staff = data?.user?.role === 'admin' || (data?.user?.role === 'coordinator' && data.user.hospitalId === request.hospitalId);
  const donor = data?.user?.role === 'donor';
  const closed = closedRequestStatuses.has(request.requestStatus);
  const hospital = data?.hospitals.find((item) => item.id === request.hospitalId);
  const responses = data?.responses.filter((item) => item.requestId === request.id) || [];
  const ownResponse = responses.find((item) => item.donorId === data?.donor?.id);
  const canRespond = donor && !owner && request.verified && !closed && request.requestStatus !== 'Fulfilled' && !!ownResponse && !ownResponse.donationConfirmed && ownResponse.responseStatus !== 'Cancelled';
  const canAccept = canRespond && data?.donor?.available && data.donor.eligibilityStatus === 'PreliminaryEligible';
  const stage = stages.indexOf(request.requestStatus);

  async function act(operation: string, payload: Record<string, unknown>, success: string) {
    if (busy) return;
    setBusy(operation); setFailure(''); setFeedback('');
    try { const result = await command(operation, payload); if (result?.ok === false) throw new Error(result.message || 'This action could not complete. Refresh the request and try again.'); setSheet(null); setFeedback(success); }
    catch (problem) { setFailure(problem instanceof Error ? problem.message : 'This action could not complete. Please try again.'); }
    finally { setBusy(''); }
  }
  async function directions() {
    const query = hospital?.latitude !== undefined && hospital?.longitude !== undefined ? `${hospital.latitude},${hospital.longitude}` : `${hospital?.address || request?.hospitalName}, ${request?.city}`;
    try { await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`); }
    catch { setFailure('Could not open maps. Use the hospital address below for directions.'); }
  }
  async function summarize() {
    if (busy || !request) return;
    setBusy('assist'); setFailure('');
    try { const result = await assist(request.id); setAssistance({ available: result.available, source: result.source, summary: result.summary || '', message: result.message }); }
    catch (problem) { setFailure(problem instanceof Error ? problem.message : 'Request summary could not be generated. Please retry.'); }
    finally { setBusy(''); }
  }
  return <BloodScreen><BloodHeader back={back} /><Text style={ui.title}>Request details</Text>
    <View style={styles.stack}>
      {mode !== 'live' ? <InfoLine>Demo mode · all requests, donors and updates shown here are sample data.</InfoLine> : null}
      {failure ? <Notice title="Action could not complete" message={failure} tone="error" /> : null}
      {feedback ? <InfoLine positive>{feedback}</InfoLine> : null}
      {request.requestStatus === 'Rejected' && request.rejectionReason ? <Notice title="Request was rejected" message={request.rejectionReason} tone="error" /> : null}
      <View style={styles.card}><View style={styles.row}><BloodGroupBadge group={request.bloodGroup} /><View style={{ flex: 1, gap: 6 }}><Text style={styles.heading}>{request.unitsRequired} units needed</Text><View style={styles.badges}><StatusBadge label={request.urgency} />{request.verified ? <StatusBadge label="Hospital verified" positive /> : <StatusBadge label="Unverified" />}</View></View></View><StatusBadge label={request.requestStatus} positive={request.requestStatus === 'Fulfilled' || request.requestStatus === 'Completed'} /><RequestProgress arranged={request.unitsArranged} required={request.unitsRequired} /><Text style={ui.muted}>{request.acceptedDonors || 0} donors accepted · Units count only after hospital confirmation.</Text></View>
      <View style={styles.card}><Text style={ui.section}>{request.hospitalName}</Text><Text style={ui.body}>{hospital?.address || request.city}</Text><Text style={ui.muted}>{request.city}</Text><Action label="Hospital directions" icon="navigation" onPress={() => void directions()} underline />{hospital?.contact ? <Action label="Call receiving hospital" icon="phone" onPress={() => { void Linking.openURL(`tel:${hospital.contact}`).catch(() => setFailure('Could not open the phone app.')); }} /> : null}<Text style={ui.section}>Required by</Text><Text style={ui.body}>{formatRequestDate(request.requiredBefore)}</Text>{request.description ? <><Text style={ui.section}>Request notes</Text><Text style={ui.body}>{request.description}</Text></> : null}{request.aiSummary ? <><Text style={ui.section}>Assisted summary</Text><Text style={ui.body}>{request.aiSummary}</Text><Text style={ui.muted}>A coordination summary. Hospital screening and verification remain required.</Text></> : null}</View>
      {(owner || staff) ? <View style={styles.card}><Text style={ui.section}>Coordination summary</Text><Text style={ui.muted}>Generate a short summary to help coordinate this request. Medical decisions stay with the hospital.</Text><Button label="Generate request summary" variant="outline" busy={busy === 'assist'} disabled={!!busy} onPress={() => void summarize()} />{assistance ? <><Notice title={assistance.available ? 'AI summary generated' : 'AI summary unavailable'} message={assistance.message || (assistance.available ? 'Review this assisted summary before sharing.' : 'The AI service is unavailable. A summary based on the request fields is shown below.')} tone={assistance.available ? 'success' : 'info'} />{assistance.summary ? <Text style={ui.body}>{assistance.summary}</Text> : null}<Text style={ui.muted}>Source: {assistance.source}</Text></> : null}</View> : null}
      <SectionTitle title="Request progress" />
      {(owner || staff) ? <View style={[styles.card, styles.row]}><View style={styles.metric}><Text style={styles.heading}>{responses.length}</Text><Text style={ui.muted}>Donors contacted</Text></View><View style={styles.metric}><Text style={styles.heading}>{request.acceptedDonors || 0}</Text><Text style={ui.muted}>Accepted</Text></View><View style={styles.metric}><Text style={styles.heading}>{responses.filter((item) => item.responseStatus === 'Notified' || item.responseStatus === 'NoResponse').length}</Text><Text style={ui.muted}>Awaiting response</Text></View></View> : null}
      <View style={styles.card}>{closed && request.requestStatus !== 'Completed' ? <InfoLine>This request is {request.requestStatus.toLowerCase()}. Further donor alerts are stopped.</InfoLine> : stages.map((label, index) => <View key={label} style={styles.timeline}><Feather name={index <= stage ? 'check-circle' : 'circle'} size={22} color={index <= stage ? colors.success : colors.muted} /><View style={{ flex: 1 }}><Text style={[ui.body, index === stage && { fontFamily: fonts.semibold }]}>{label}</Text>{index === stage ? <Text style={ui.muted}>Current status</Text> : null}</View></View>)}<Text style={ui.muted}>Created {formatRequestDate(request.createdAt)}</Text></View>
      {canRespond ? <><SectionTitle title={ownResponse?.responseStatus === 'Accepted' ? 'You accepted this request' : 'Can you help?'} /><InfoLine>Accept only if you can attend the receiving hospital. Final donation eligibility requires hospital screening.</InfoLine>{ownResponse?.responseStatus !== 'Accepted' ? <><Button label="Accept request" busy={busy === 'respondRequest'} disabled={!!busy || !canAccept} onPress={() => void act('respondRequest', { requestId: request.id, response: 'Accepted' }, 'Your acceptance is recorded. Coordinate with the receiving hospital before visiting.')} />{!canAccept ? <Text style={ui.muted}>Your donor availability or preliminary eligibility needs attention. Review your donor profile before accepting.</Text> : null}</> : null}<Button label={ownResponse?.responseStatus === 'Accepted' ? 'Withdraw acceptance' : 'Decline request'} variant="outline" disabled={!!busy || ownResponse?.responseStatus === 'Declined'} onPress={() => void act('respondRequest', { requestId: request.id, response: 'Declined' }, 'Your response is recorded.')} /></> : donor && !closed && !ownResponse ? <InfoLine>You can respond after the hospital verifies and matches this request to your donor profile.</InfoLine> : null}
      {(owner || staff || donor) && responses.length > 0 ? <><SectionTitle title="Donor responses" />{responses.map((response) => <View key={response.id} style={styles.card}><View style={styles.row}><Feather name="user" size={23} color={colors.primary} /><Text style={[ui.section, { flex: 1 }]}>{response.donorName || 'Donor'}</Text><StatusBadge label={response.responseStatus} positive={response.responseStatus === 'Accepted'} /></View>{response.donationConfirmed ? <InfoLine positive>{response.confirmedUnits} units confirmed by the hospital</InfoLine> : <Text style={ui.muted}>Donation has not been confirmed.</Text>}{response.phone && response.responseStatus === 'Accepted' ? <Action label="Call accepted donor" icon="phone" onPress={() => { void Linking.openURL(`tel:${response.phone}`).catch(() => setFailure('Could not open the phone app.')); }} /> : null}{staff && response.responseStatus === 'Accepted' && !response.donationConfirmed && !closed ? <><Field label="Units to confirm" value={units} onChangeText={setUnits} keyboardType="number-pad" maxLength={2} /><Button label="Confirm screened donation" disabled={!!busy || !/^\d+$/.test(units) || Number(units) < 1 || Number(units) > request.unitsRequired - request.unitsArranged} busy={busy === 'confirmDonation'} onPress={() => void act('confirmDonation', { responseId: response.id, units: Number(units) }, 'Donation confirmed and request progress updated.')} /></> : null}</View>)}</> : null}
      {staff && request.requestStatus === 'Pending Verification' ? <><SectionTitle title="Hospital verification" /><InfoLine>Confirm blood group, units and receiving hospital before approving.</InfoLine><Button label="Verify request" busy={busy === 'verifyRequest'} disabled={!!busy} onPress={() => void act('verifyRequest', { requestId: request.id }, 'Request verified. The matching process can notify suitable donors.')} /><Button label="Reject request" variant="outline" disabled={!!busy} onPress={() => { setDetails(''); setSheet('reject'); }} /></> : null}
      {request.canComplete && (owner || staff) ? <Button label="Mark request complete" disabled={!!busy} onPress={() => setSheet('complete')} /> : null}
      {request.canCancel && (owner || staff) ? <Button label="Cancel request" variant="outline" disabled={!!busy} onPress={() => setSheet('cancel')} /> : null}
      <InfoLine>For immediate medical care, contact your hospital. This service supports coordination; it does not guarantee blood availability or determine medical eligibility.</InfoLine>
      <Action label="Report this request" icon="flag" onPress={() => { setDetails(''); setSheet('report'); }} underline />
    </View>
    <BloodSheet visible={sheet !== null} title={sheet === 'cancel' ? 'Cancel this request?' : sheet === 'complete' ? 'Complete this request?' : sheet === 'reject' ? 'Reject request' : 'Report this request'} onClose={() => { if (!busy) setSheet(null); }}>
      {sheet === 'cancel' ? <><Text style={ui.body}>Donors will stop receiving alerts. Cancel only if blood is no longer needed.</Text><Button label="Keep request" onPress={() => setSheet(null)} disabled={!!busy} /><Button label="Confirm cancellation" variant="outline" busy={busy === 'cancelRequest'} onPress={() => void act('cancelRequest', { requestId: request.id }, 'Request cancelled. Donor alerts have stopped.')} /></> : sheet === 'complete' ? <><Text style={ui.body}>Confirm that the required units have been arranged and coordination is finished.</Text><Button label="Confirm completion" busy={busy === 'completeRequest'} onPress={() => void act('completeRequest', { requestId: request.id }, 'Request completed. Thank you for keeping the community updated.')} /></> : <>
        <Text style={ui.body}>{sheet === 'reject' ? 'Provide a reason for rejecting this request.' : 'Help the moderation team understand the issue. Avoid private medical or contact details.'}</Text>
        {sheet === 'report' ? reasons.map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: reason === item }} onPress={() => setReason(item)} style={styles.reason}><Feather name={reason === item ? 'check-circle' : 'circle'} color={colors.primary} size={22} /><Text style={ui.body}>{item}</Text></Pressable>) : null}
        <Field label={sheet === 'reject' ? 'Rejection reason' : 'Additional details (optional)'} value={details} onChangeText={setDetails} multiline maxLength={500} style={{ minHeight: 100, textAlignVertical: 'top', fontSize: 16 }} />
        {failure ? <Notice title="Could not submit" message={failure} tone="error" /> : null}
        <Button label={sheet === 'reject' ? 'Reject request' : 'Submit report'} busy={!!busy} disabled={sheet === 'reject' && details.trim().length < 3} onPress={() => void act(sheet === 'reject' ? 'rejectRequest' : 'reportRequest', { requestId: request.id, reason: sheet === 'reject' ? details.trim() : reason, ...(sheet === 'report' ? { details: details.trim() } : {}) }, sheet === 'reject' ? 'Request rejected.' : 'Report submitted for moderation.')} />
      </>}
    </BloodSheet>
  </BloodScreen>;
}

const styles = StyleSheet.create({
  stack: { gap: 14, paddingVertical: 18 }, card: { borderWidth: 1, borderColor: colors.divider, borderRadius: radii.card, padding: 16, gap: 12, backgroundColor: colors.surface },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }, heading: { fontFamily: fonts.bold, fontSize: 22, color: colors.burgundy }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 42 }, reason: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  metric: { flex: 1, minWidth: 75, gap: 5, alignItems: 'center' },
});
