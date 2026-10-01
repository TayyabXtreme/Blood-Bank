import Feather from '@expo/vector-icons/Feather';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, Image, Keyboard, StyleSheet, Text, View } from 'react-native';
import { Button, Field, Notice, TextLink } from '@/components/auth/ui';
import { OnboardingChoice } from '@/components/onboarding/ui';
import { colors, fonts, radii } from '@/theme/tokens';
import { RequestConfirmationSheet, RequestError, RequestFlowScreen, RequestIconButton, requestFlowStyles as ui } from './components/request-flow-ui';
import { REQUEST_BLOOD_GROUPS, buildRequestInput, formatRequestDate, newRequestDraft, parseRequestDeadline, requestDateFields, validateRequestDraft,
  type RequestFlowDraft, type RequestFlowInput, type RequestHospital, type RequestUrgency } from './request-flow-model';

const STEP_FIELDS: (keyof RequestFlowDraft)[][] = [
  ['bloodGroup', 'unitsRequired'], ['hospitalId', 'location'],
  ['urgency', 'requiredDate', 'requiredTime', 'description'],
  ['bloodGroup', 'unitsRequired', 'hospitalId', 'location', 'urgency', 'requiredDate', 'requiredTime', 'description'],
];
const HEADINGS = ['What blood is needed?', 'Where is blood needed?', 'When is it needed?', 'Review your request'];
const DESCRIPTIONS = ['Choose the blood group and units required.', 'Select the receiving hospital.', 'Set the urgency and required time.', 'Check the details before submitting.'];

export function RequestFlowCreate({ hospitals, loading = false, facilityError, onRetry, onSubmit, onExit, preview = false, canSubmit = false, unavailableReason }: {
  hospitals: RequestHospital[]; loading?: boolean; facilityError?: string; onRetry?: () => void;
  onSubmit: (input: RequestFlowInput) => Promise<void>; onExit: () => void; preview?: boolean; canSubmit?: boolean; unavailableReason?: string;
}) {
  const [initialDraft] = useState(newRequestDraft);
  const { control, getValues, setValue, setError, clearErrors, setFocus, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<RequestFlowDraft>({
    defaultValues: initialDraft, mode: 'onTouched',
  });
  const draft = useWatch({ control }) as RequestFlowDraft;
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState('');
  const [failure, setFailure] = useState('');
  const [discard, setDiscard] = useState(false);
  const submitLock = useRef(false);
  const hospitalIds = hospitals.map((item) => item.id);
  const selectedHospital = hospitals.find((item) => item.id === draft.hospitalId);
  const filteredHospitals = hospitals.filter((item) => (item.name + ' ' + item.city).toLowerCase().includes(search.trim().toLowerCase()));
  const deadline = parseRequestDeadline(draft.requiredDate, draft.requiredTime);

  function validateStep(all = false) {
    const fields = all ? STEP_FIELDS[3] : STEP_FIELDS[step];
    const validation = validateRequestDraft(getValues(), hospitalIds);
    clearErrors(fields);
    const invalidFields = fields.filter((field) => validation[field]);
    invalidFields.forEach((field) => setError(field, { type: 'validate', message: validation[field] }));
    const first = invalidFields[0];
    if (first) {
      const firstStep = STEP_FIELDS.slice(0, 3).findIndex((fields) => fields.includes(first));
      if (all) setStep(firstStep);
      if (['unitsRequired', 'location', 'requiredDate', 'requiredTime', 'description'].includes(first)) setTimeout(() => setFocus(first), 0);
      return false;
    }
    return true;
  }

  const submit = () => handleSubmit(async () => {
    if (submitLock.current || !canSubmit) return;
    if (!validateStep(true)) return;
    submitLock.current = true;
    setFailure('');
    try { await onSubmit(buildRequestInput(getValues(), hospitalIds)); }
    catch (error) { setFailure(error instanceof Error ? error.message : 'Your request could not be submitted. Check your connection and try again.'); }
    finally { submitLock.current = false; }
  })();

  function back() {
    if (isSubmitting) return;
    if (step > 0) { setStep((value) => value - 1); setFailure(''); }
    else if (isDirty) setDiscard(true);
    else onExit();
  }

  return <RequestFlowScreen step={step + 1} title={HEADINGS[step]} description={DESCRIPTIONS[step]} onBack={back}
    footer={<>
      {failure ? <Notice title="Request not submitted" message={failure} tone="error" /> : null}
      {(!canSubmit || preview) ? <Notice title={preview ? 'Demo mode' : 'Submission unavailable'} message={unavailableReason ?? 'Demo changes stay within the demo. No real donors will be notified.'} /> : null}
      <Button label={step === 3 ? preview ? 'Create demo request' : 'Submit request' : step === 2 ? 'Review request' : 'Continue'} busy={isSubmitting} disabled={step === 3 && !canSubmit}
        onPress={step === 3 ? submit : () => { if (validateStep()) { Keyboard.dismiss(); setStep((value) => value + 1); setFailure(''); } }} />
    </>}>
    {step === 0 ? <View style={styles.form}>
      <View><Text style={ui.label}>Blood group</Text>
        <Controller control={control} name="bloodGroup" render={({ field }) => <View style={styles.chips}>{REQUEST_BLOOD_GROUPS.map((group) =>
          <OnboardingChoice key={group} label={'Blood group ' + group} checked={field.value === group} onPress={() => { field.onChange(group); clearErrors('bloodGroup'); }}
            style={[styles.chip, field.value === group && styles.selectedChip]}>
            <Text style={[styles.chipText, field.value === group && styles.selectedText]}>{group.replace('-', '−')}</Text>
          </OnboardingChoice>)}</View>} />
        <RequestError>{errors.bloodGroup?.message}</RequestError>
      </View>
      <View><Text style={ui.label}>Units required</Text><View style={styles.units}>
        <RequestIconButton label="Decrease units" icon="minus" disabled={Number(draft.unitsRequired) <= 1} onPress={() => { setValue('unitsRequired', String(Math.max(1, (Number(getValues('unitsRequired')) || 1) - 1)), { shouldDirty: true }); clearErrors('unitsRequired'); }} />
        <Controller control={control} name="unitsRequired" render={({ field }) => <Field label="Units required" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref}
          keyboardType="number-pad" selectTextOnFocus maxLength={6} style={styles.unitInput} />} />
        <RequestIconButton label="Increase units" icon="plus" onPress={() => { setValue('unitsRequired', String((Number(getValues('unitsRequired')) || 0) + 1), { shouldDirty: true }); clearErrors('unitsRequired'); }} />
      </View><RequestError>{errors.unitsRequired?.message}</RequestError><Text style={ui.caption}>Enter the units requested by the hospital.</Text></View>
      <Image source={require('../../../assets/onboarding/requester-hands.png')} style={styles.art} resizeMode="contain" accessible={false} />
    </View> : null}
    {step === 1 ? <View style={styles.form}>
      <View><Text style={ui.label}>Hospital</Text><View style={styles.search}>
        <View style={{ flex: 1 }}><Field label="Search hospitals" icon="search" value={search} onChangeText={setSearch} placeholder="Search hospitals" autoCorrect={false} /></View>
        {search ? <RequestIconButton label="Clear hospital search" icon="x" onPress={() => setSearch('')} /> : null}
      </View></View>
      {loading ? <ActivityIndicator color={colors.primary} accessibilityLabel="Loading hospitals" /> : facilityError ? <View style={{ gap: 10 }}>
        <Notice title="Hospitals unavailable" message={facilityError} tone="error" />{onRetry ? <Button label="Try again" variant="outline" onPress={onRetry} /> : null}
      </View> : filteredHospitals.length === 0 ? <Notice title={search ? 'No matching hospitals' : 'No hospitals available'} message={search ? 'Try another hospital name or city.' : 'A receiving hospital must be available before a request can be submitted.'} /> :
        <View style={{ gap: 10 }}>{filteredHospitals.map((hospital) => <OnboardingChoice key={hospital.id} label={hospital.name + ', ' + hospital.city} checked={draft.hospitalId === hospital.id}
          onPress={() => { setValue('hospitalId', hospital.id, { shouldDirty: true }); setValue('location', hospital.city, { shouldDirty: true }); clearErrors(['hospitalId', 'location']); }}
          style={[ui.card, styles.hospital, draft.hospitalId !== hospital.id && { borderColor: colors.divider }]}>
          <View style={styles.hospitalIcon}><Feather name="plus-square" color={colors.primary} size={29} /></View>
          <View style={{ flex: 1 }}><Text style={styles.strong}>{hospital.name}</Text><Text style={ui.caption}>{hospital.city}</Text></View>
          <Feather name={draft.hospitalId === hospital.id ? 'check-circle' : 'circle'} size={24} color={colors.primary} />
        </OnboardingChoice>)}</View>}
      <RequestError>{errors.hospitalId?.message}</RequestError>
      <View><Text style={ui.label}>Location</Text><Controller control={control} name="location" render={({ field }) => <Field label="Hospital location" placeholder="Choose a receiving hospital" icon="map-pin" value={field.value} editable={false}
        onBlur={field.onBlur} inputRef={field.ref} error={errors.location?.message} hint="Matching uses the receiving hospital location." />} /></View>
      {preview ? <Text style={ui.caption}>Sample hospitals for the demo.</Text> : null}
      <Image source={require('../../../assets/onboarding/nearby-hospital.png')} style={styles.art} resizeMode="contain" accessible={false} />
    </View> : null}
    {step === 2 ? <View style={styles.form}>
      <View><Text style={ui.label}>Urgency</Text><Controller control={control} name="urgency" render={({ field }) => <View style={styles.urgencies}>
        {(['Normal', 'Urgent', 'Critical'] as RequestUrgency[]).map((urgency) => <OnboardingChoice key={urgency} label={urgency + ' urgency'} checked={field.value === urgency}
          onPress={() => field.onChange(urgency)} style={[styles.urgency, field.value === urgency && styles.selectedChip]}>
          <Text style={[styles.chipText, field.value === urgency && styles.selectedText]}>{urgency}</Text>
        </OnboardingChoice>)}
      </View>} /><RequestError>{errors.urgency?.message}</RequestError></View>
      <View><Text style={ui.label}>Required by</Text><View style={styles.dateRow}>
        <View style={{ flex: 1.4 }}><Controller control={control} name="requiredDate" render={({ field }) => <Field label="Required date in YYYY-MM-DD format" placeholder="YYYY-MM-DD" value={field.value} onChangeText={field.onChange}
          onBlur={field.onBlur} inputRef={field.ref} maxLength={10} keyboardType="numbers-and-punctuation" style={styles.dateInput} returnKeyType="next" onSubmitEditing={() => setFocus('requiredTime')} />} /></View>
        <View style={{ flex: 1 }}><Controller control={control} name="requiredTime" render={({ field }) => <Field label="Required time in HH:MM 24-hour format" placeholder="HH:MM" value={field.value} onChangeText={field.onChange}
          onBlur={field.onBlur} inputRef={field.ref} maxLength={5} keyboardType="numbers-and-punctuation" style={styles.dateInput} returnKeyType="next" onSubmitEditing={() => setFocus('description')} />} /></View>
      </View><RequestError>{errors.requiredDate?.message ?? errors.requiredTime?.message}</RequestError>
        <Text style={ui.caption}>YYYY-MM-DD · HH:MM · Pakistan time (PKT)</Text>
        <TextLink label="Set to within 6 hours" onPress={() => { const next = requestDateFields(Date.now() + 6 * 60 * 60 * 1000); setValue('requiredDate', next.requiredDate, { shouldDirty: true }); setValue('requiredTime', next.requiredTime, { shouldDirty: true }); clearErrors(['requiredDate', 'requiredTime']); }} />
      </View>
      <View><Text style={ui.label}>Description <Text style={{ fontFamily: fonts.regular }}>(optional)</Text></Text>
        <Controller control={control} name="description" render={({ field }) => <Field label="Optional request description" placeholder="Describe the request briefly" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
          inputRef={field.ref} multiline numberOfLines={3} maxLength={200} style={styles.description} error={errors.description?.message} />} />
        <Text style={[ui.caption, { textAlign: 'right' }]}>{draft.description.length}/200</Text><Text style={ui.caption}>Avoid names or private medical details.</Text>
      </View>
      <Image source={require('../../../assets/onboarding/donor-hands.png')} style={[styles.art, { height: 135 }]} resizeMode="contain" accessible={false} />
    </View> : null}
    {step === 3 ? <View style={styles.form}>
      <View style={[ui.card, { gap: 14 }]}><View style={styles.summaryTop}>
        <View style={styles.bloodBadge}><Text style={styles.bloodBadgeText}>{draft.bloodGroup}</Text></View>
        <Text style={styles.strong}>{draft.unitsRequired} units required</Text><View style={styles.urgencyBadge}><Text style={styles.urgencyBadgeText}>{draft.urgency}</Text></View>
      </View>
        <SummaryRow icon="plus-square" label="Hospital" value={selectedHospital?.name ?? 'Select hospital'} />
        <SummaryRow icon="map-pin" label="Location" value={draft.location} />
        <SummaryRow icon="clock" label="Required by" value={deadline ? formatRequestDate(deadline) : 'Set required time'} />
        {draft.description.trim() ? <SummaryRow icon="file-text" label="Description" value={draft.description.trim()} /> : null}
        <TextLink label="Edit details" icon="edit" onPress={() => { setStep(0); setFailure(''); }} style={{ alignSelf: 'flex-start' }} />
      </View>
      <Notice title="Pending verification" message="Your request will be sent to a coordinator for verification before donors are notified." />
    </View> : null}
    <RequestConfirmationSheet visible={discard} title="Discard this request?" description="The details entered in this form will be lost." onClose={() => setDiscard(false)}>
      <Button label="Keep editing" onPress={() => setDiscard(false)} />
      <Button label="Discard request" variant="outline" onPress={() => { setDiscard(false); onExit(); }} />
    </RequestConfirmationSheet>
  </RequestFlowScreen>;
}

function SummaryRow({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  return <View style={styles.summaryRow}><Feather name={icon} size={22} color={colors.primary} /><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  form: { gap: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { width: '23.3%', minHeight: 48, borderWidth: 1, borderColor: colors.primary, borderRadius: 17, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,251,249,0.55)' },
  chipText: { fontFamily: fonts.semibold, fontSize: 18, color: colors.burgundy },
  selectedChip: { backgroundColor: colors.primary }, selectedText: { color: colors.white },
  units: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  unitInput: { width: 70, fontSize: 27, textAlign: 'center', fontFamily: fonts.bold, color: colors.burgundy },
  art: { width: '100%', height: 190 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hospital: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 84 },
  hospitalIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  strong: { fontFamily: fonts.semibold, color: colors.text, fontSize: 17, lineHeight: 23 },
  urgencies: { flexDirection: 'row', gap: 8 },
  urgency: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.primary, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: { fontSize: 16 }, description: { minHeight: 100, textAlignVertical: 'top', fontSize: 16 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: colors.divider },
  bloodBadge: { minWidth: 59, padding: 10, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' },
  bloodBadgeText: { fontFamily: fonts.bold, color: colors.white, fontSize: 22 },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill },
  urgencyBadgeText: { fontFamily: fonts.semibold, color: colors.primary, fontSize: 13 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  summaryLabel: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted, width: 85 },
  summaryValue: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text, textAlign: 'right' },
});
