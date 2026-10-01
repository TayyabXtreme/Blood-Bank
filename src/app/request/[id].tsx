import { useState } from 'react';
import { Linking, Share, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock3, MapPin, ShieldCheck, Share2, Navigation, Phone } from 'lucide-react-native';
import { format } from 'date-fns';
import {
  Body,
  Button,
  Card,
  colors,
  ConfirmSheet,
  Empty,
  Eyebrow,
  Field,
  Label,
  Notice,
  Pill,
  Screen,
  Section,
} from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
import { compatibility, isOpen, medicalNotice, statusLabels } from '@/domain/rules';
import { timeRemaining } from '@/components/RequestCard';
import HospitalMap from '@/components/HospitalMap';
import { useNow } from '@/hooks/useNow';
export default function RequestDetails() {
  const now = useNow();
  const { id } = useLocalSearchParams<{ id: string }>(),
    { data, showToast } = useApp(),
    { run, busy } = useCommand();
  const [confirmAction, setConfirmAction] = useState<
      'cancel' | 'accept' | 'decline' | 'complete' | string | null
    >(null),
    [rejectReason, setRejectReason] = useState(''),
    [reporting, setReporting] = useState(false),
    [reportReason, setReportReason] = useState('');
  const request = data.requests.find((r) => r.id === id),
    hospital = data.hospitals.find((h) => h.id === request?.hospitalId),
    responses = data.responses.filter((r) => r.requestId === id),
    offer = responses.find((r) => r.donorUserId === data.user?.id);
  if (!request)
    return (
      <Screen title="Request unavailable" back>
        <Empty
          title="We couldn’t find this request"
          body="It may be private, closed, or unavailable to this account."
          action={
            <Button title="Browse requests" onPress={() => router.replace('/(tabs)/requests')} />
          }
        />
      </Screen>
    );
  const owner = request.requesterId === data.user?.id,
    manager =
      data.user?.role === 'admin' ||
      (data.user?.role === 'coordinator' && data.user.hospitalId === request.hospitalId),
    active = isOpen(request.status) && request.requiredBefore > now;
  const accepted = responses.filter((r) => r.status === 'accepted' && !r.donationConfirmed).length;
  const steps = [
    'Verification',
    'Finding donors',
    'Donors accepted',
    'Units confirmed',
    'Completed',
  ];
  const currentStep =
    request.status === 'completed'
      ? 5
      : request.status === 'fulfilled'
        ? 4
        : request.unitsArranged > 0
          ? 3
          : accepted > 0
            ? 2
            : request.verification === 'verified'
              ? 1
              : 0;
  const terminal = ['cancelled', 'expired', 'rejected'].includes(request.status);
  const confirm = async () => {
    const command =
      confirmAction === 'cancel'
        ? { kind: 'cancelRequest' as const, requestId: id }
        : confirmAction === 'accept' || confirmAction === 'decline'
          ? { kind: 'respond' as const, responseId: offer!.id, accept: confirmAction === 'accept' }
          : confirmAction === 'complete'
            ? { kind: 'completeRequest' as const, requestId: id }
            : { kind: 'confirmDonation' as const, responseId: confirmAction! };
    const result = await run(
      command,
      confirmAction === 'accept'
        ? 'Thank you. The hospital is ready to coordinate with you.'
        : 'Request updated.',
    );
    if (result.ok) setConfirmAction(null);
  };
  return (
    <Screen
      title="A chance to help."
      back
      right={
        request.verification === 'verified' ? (
          <Button
            title="Share"
            variant="ghost"
            icon={<Share2 size={17} color={colors.blood} />}
            onPress={async () => {
              try {
                await Share.share({
                  message: `${request.bloodGroup} blood needed at ${hospital?.name}, ${hospital?.city}. ${request.unitsRequired - request.unitsArranged} units still needed. Required by ${format(request.requiredBefore, 'dd MMM, h:mm a')}. Open in BloodBank: bloodbank://request/${id}`,
                });
              } catch {
                showToast('Unable to share this request.');
              }
            }}
          />
        ) : undefined
      }
    >
      <Card>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Pill tone={request.urgency === 'critical' ? 'red' : 'amber'}>
              {request.urgency.toUpperCase()}
            </Pill>
            <Label className="mt-4 text-xl">{hospital?.name ?? 'Hospital'}</Label>
            <View className="mt-2 flex-row items-center gap-1.5">
              <MapPin size={13} color={colors.muted} />
              <Body className="text-xs">
                {hospital?.city}
                {offer ? ` · about ${offer.distanceKm} km away` : ''}
              </Body>
            </View>
          </View>
          <View className="ml-3 h-20 w-20 items-center justify-center rounded-[24px] bg-blush">
            <Text className="font-display text-3xl text-blood">{request.bloodGroup}</Text>
          </View>
        </View>
        <View className="my-5 h-[1px] bg-line" />
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-display text-[29px] text-ink">
              {request.unitsArranged}
              <Text className="text-lg text-muted"> / {request.unitsRequired}</Text>
            </Text>
            <Body className="text-xs">units confirmed</Body>
          </View>
          <View className="items-end">
            <Clock3 size={19} color={colors.blood} />
            <Body className="mt-1 text-xs">{timeRemaining(request.requiredBefore)}</Body>
          </View>
        </View>
        <View className="mt-4 h-2 overflow-hidden rounded-full bg-[#F4EFED]">
          <View
            className="h-full bg-blood"
            style={{
              width: `${Math.min(100, (request.unitsArranged / request.unitsRequired) * 100)}%`,
            }}
          />
        </View>
        <View className="mt-4 flex-row items-center gap-2">
          <ShieldCheck
            size={15}
            color={request.verification === 'verified' ? colors.green : colors.muted}
          />
          <Body className="text-xs">
            {request.verification === 'verified'
              ? 'Verified by the care team'
              : 'Awaiting hospital verification'}
          </Body>
        </View>
      </Card>
      <Section title="Request journey" />
      <Card>
        <Pill tone={terminal ? 'red' : 'green'}>{statusLabels[request.status]}</Pill>
        <View className="mt-5 gap-4">
          {steps.map((label, index) => (
            <View key={label} className="flex-row items-center gap-3">
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${index < currentStep ? 'bg-[#EAF5EF]' : index === currentStep && !terminal ? 'bg-blush' : 'bg-[#F4F0EE]'}`}
              >
                {index < currentStep ? (
                  <Check size={14} color={colors.green} />
                ) : (
                  <Text
                    className={`font-bold text-[11px] ${index === currentStep ? 'text-blood' : 'text-muted'}`}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Body className={index === currentStep ? 'font-bold text-ink' : ''}>{label}</Body>
            </View>
          ))}
        </View>
        <Body className="mt-5 text-[11px]">
          {accepted} donor{accepted === 1 ? '' : 's'} accepted · {request.unitsArranged} confirmed
          units
        </Body>
      </Card>
      {request.rejectionReason && (
        <View className="mt-4">
          <Notice>Verification note: {request.rejectionReason}</Notice>
        </View>
      )}
      <Section title="The details" />
      <Card>
        <Eyebrow>REQUIRED BY</Eyebrow>
        <Body className="mb-4 mt-1 text-ink">
          {format(request.requiredBefore, 'EEEE, dd MMM · h:mm a')}
        </Body>
        <Eyebrow>COMPATIBLE DONOR GROUPS</Eyebrow>
        <View className="mb-4 mt-2 flex-row flex-wrap gap-2">
          {compatibility[request.bloodGroup].map((group) => (
            <Pill key={group} tone="red">
              {group}
            </Pill>
          ))}
        </View>
        {request.aiSummary && (
          <>
            <Eyebrow>REQUEST SUMMARY</Eyebrow>
            <Body className="mt-1">{request.aiSummary}</Body>
          </>
        )}
        {(owner || manager) && request.description && (
          <>
            <Eyebrow className="mt-4">PRIVATE CARE TEAM NOTES</Eyebrow>
            <Body className="mt-1">{request.description}</Body>
          </>
        )}
      </Card>
      {hospital && (
        <>
          <Section title="Receiving hospital" />
          <Body>{hospital.address}</Body>
          <HospitalMap hospital={hospital} />
          <Button
            title="Get directions"
            variant="secondary"
            icon={<Navigation size={17} color={colors.blood} />}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`,
              ).catch(() => showToast('Unable to open maps.'))
            }
          />
        </>
      )}
      {offer && (
        <>
          <Section title="Your donor response" />
          <Card>
            <View className="mb-3 flex-row items-center justify-between">
              <Label>
                {offer.donationConfirmed
                  ? 'Donation confirmed. Thank you!'
                  : offer.status === 'accepted'
                    ? 'You’re someone’s lifeline.'
                    : offer.status === 'notified'
                      ? 'You are a compatible match'
                      : `Response: ${offer.status.replace('_', ' ')}`}
              </Label>
              <Pill tone="green">{offer.matchScore}% match</Pill>
            </View>
            <Body className="text-xs">
              {offer.status === 'accepted'
                ? 'Please contact the receiving hospital and arrive before the required-by time. Acceptance is not a donation confirmation.'
                : 'Matching uses blood compatibility, distance, readiness, and availability.'}
            </Body>
            {offer.status === 'accepted' && hospital?.contact && (
              <Button
                className="mt-4"
                title="Call the hospital"
                variant="secondary"
                icon={<Phone size={16} color={colors.blood} />}
                onPress={() =>
                  Linking.openURL(`tel:${hospital.contact?.replace(/[^+\d]/g, '')}`).catch(() =>
                    showToast('Calling is unavailable on this device.'),
                  )
                }
              />
            )}
          </Card>
          {offer.status === 'notified' && active && (
            <View className="mt-4 flex-row gap-3">
              <Button
                className="flex-1"
                title="Decline"
                variant="secondary"
                busy={busy}
                onPress={() => setConfirmAction('decline')}
              />
              <Button
                className="flex-1"
                title="Accept request"
                busy={busy}
                onPress={() => setConfirmAction('accept')}
              />
            </View>
          )}
        </>
      )}
      {data.donor && !offer && active && (
        <View className="mt-5">
          <Notice>
            Matching contacts eligible donors in ranked batches. Keep your availability on to
            receive a matching offer.
          </Notice>
        </View>
      )}
      {(owner || manager) && (
        <>
          <Section title="Donor responses" />
          {responses.length === 0 ? (
            <Empty
              title="Help is on its way"
              body="Once verified, eligible donors are contacted in ranked batches. Their responses appear here."
            />
          ) : (
            responses.map((response) => (
              <Card key={response.id} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Label className="text-sm">{response.donorName ?? 'Compatible donor'}</Label>
                    <Body className="text-xs">
                      About {response.distanceKm} km · {response.matchScore}% match
                    </Body>
                  </View>
                  <Pill tone={response.status === 'accepted' ? 'green' : 'neutral'}>
                    {response.donationConfirmed
                      ? 'CONFIRMED'
                      : response.status.toUpperCase().replace('_', ' ')}
                  </Pill>
                </View>
                {response.contact && (
                  <Button
                    className="mt-3"
                    title="Call donor"
                    variant="secondary"
                    onPress={() =>
                      Linking.openURL(`tel:${response.contact?.replace(/[^+\d]/g, '')}`).catch(() =>
                        showToast('Calling is unavailable.'),
                      )
                    }
                  />
                )}
                {manager &&
                  response.status === 'accepted' &&
                  !response.donationConfirmed &&
                  active && (
                    <Button
                      className="mt-4"
                      title="Confirm screened donation"
                      busy={busy}
                      onPress={() => setConfirmAction(response.id)}
                    />
                  )}
              </Card>
            ))
          )}
        </>
      )}
      {manager && request.status === 'pending' && (
        <>
          <Section title="Care team verification" />
          <Notice>
            Verify the hospital, blood group, unit count, and deadline before notifying donors.
          </Notice>
          <Button
            className="mt-4"
            title="Verify and begin matching"
            busy={busy}
            onPress={() =>
              run(
                { kind: 'verify', requestId: id, approve: true },
                'Request verified. Matching has started.',
              )
            }
          />
          <View className="mt-4">
            <Field
              label="Rejection reason"
              value={rejectReason}
              onChangeText={setRejectReason}
              maxLength={300}
            />
          </View>
          <Button
            className="mt-3"
            title="Reject request"
            variant="danger"
            disabled={!rejectReason.trim()}
            busy={busy}
            onPress={() =>
              run(
                { kind: 'verify', requestId: id, approve: false, reason: rejectReason },
                'Request rejected.',
              )
            }
          />
        </>
      )}
      {(owner || manager) && request.status === 'fulfilled' && (
        <Button
          className="mt-6"
          title="Mark request completed"
          busy={busy}
          onPress={() => setConfirmAction('complete')}
        />
      )}
      {(owner || manager) && (active || request.status === 'pending') && (
        <Button
          className="mt-5"
          title="Cancel this request"
          variant="ghost"
          onPress={() => setConfirmAction('cancel')}
        />
      )}
      <View className="mt-6">
        <Notice>{medicalNotice}</Notice>
      </View>
      <Button title="Report a concern" variant="ghost" onPress={() => setReporting(!reporting)} />
      {reporting && (
        <Card>
          <Field
            label="What needs review?"
            placeholder="Inaccurate information, duplicate, or other concern"
            value={reportReason}
            onChangeText={setReportReason}
            maxLength={100}
          />
          <Button
            className="mt-4"
            title="Send report"
            busy={busy}
            disabled={!reportReason.trim()}
            onPress={async () => {
              const result = await run(
                { kind: 'report', requestId: id, reason: reportReason },
                'Report sent for administrator review.',
              );
              if (result.ok) setReporting(false);
            }}
          />
        </Card>
      )}
      <ConfirmSheet
        visible={!!confirmAction}
        title={
          confirmAction === 'accept'
            ? 'Ready to lend a hand?'
            : confirmAction === 'cancel'
              ? 'Cancel this request?'
              : confirmAction === 'decline'
                ? 'Decline this offer?'
                : confirmAction === 'complete'
                  ? 'Close this request?'
                  : 'Confirm a completed donation?'
        }
        body={
          confirmAction === 'accept'
            ? 'You’re committing to coordinate with the hospital before the deadline. Final medical screening happens at the facility.'
            : confirmAction === 'cancel'
              ? 'Matching will stop and accepted donors will be notified. Confirmed donations remain in the history.'
              : confirmAction === 'decline'
                ? 'Your decision will be recorded so matching can move on to another donor.'
                : confirmAction === 'complete'
                  ? 'All required units have been confirmed. This closes the completed request.'
                  : 'Confirm only after medical screening and an actual donation at your hospital. This records one unit and updates the donor’s last donation date.'
        }
        confirmLabel={confirmAction === 'accept' ? 'Yes, I can help' : 'Confirm'}
        busy={busy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={confirm}
      />
    </Screen>
  );
}
