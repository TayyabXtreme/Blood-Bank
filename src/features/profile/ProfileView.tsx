import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Button, Field, Notice } from '@/components/auth/ui';
import { bloodGroups } from '@/components/blood/model';
import { Action, BloodHeader, BloodScreen, BloodSheet, InfoLine, ui, FocusPressable as Pressable, type BloodIcon } from '@/components/blood/ui';
import { cityRules, validateDonationDate, validatePhone } from '@/features/onboarding/validation';
import { colors, fonts, radii } from '@/theme/tokens';
import type { BloodGroup, Role } from '../../../convex/lib/validators';

export type PersonalProfile = { name: string; email: string; phone?: string; city: string; role: Role };
export type DonorProfile = { bloodGroup: BloodGroup; lastDonationDate?: number; neverDonated: boolean; available: boolean };
export type ProfileChanges = { name: string; phone: string; city: string };
export type DonorChanges = { bloodGroup: BloodGroup; lastDonationDate?: number; neverDonated: boolean };
type EditValues = ProfileChanges & { bloodGroup: BloodGroup; lastDonation: string; neverDonated: boolean };

function dateValue(timestamp?: number) {
  if (!timestamp) return '';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: '2-digit', year: 'numeric' }).format(timestamp);
  return parts.replaceAll('/', ' / ');
}
function dateLabel(timestamp?: number) {
  return timestamp ? new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'long', year: 'numeric' }).format(timestamp) : 'Not recorded';
}

function ProfileRow({ icon, label, value, onPress }: { icon: BloodIcon; label: string; value: string; onPress?: () => void }) {
  const contents = <><Feather name={icon} size={19} color={colors.burgundy} /><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text>{onPress ? <Feather name="edit-2" size={15} color={colors.primary} /> : null}</>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label}: ${value}`} onPress={onPress} style={({ pressed, hovered, focused }) => [styles.row, (pressed || hovered) && { opacity: 0.7 }, focused && ui.focus]}>{contents}</Pressable> : <View style={styles.row}>{contents}</View>;
}

export default function ProfileView({ profile, donor, preview, saveProfile, saveDonor, changeAvailability, signOut }: {
  profile: PersonalProfile; donor?: DonorProfile | null; preview: boolean;
  saveProfile: (changes: ProfileChanges) => Promise<void>; saveDonor: (changes: DonorChanges) => Promise<void>;
  changeAvailability: (available: boolean) => Promise<void>; signOut: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<'personal' | 'donor' | null>(null);
  const [discard, setDiscard] = useState(false);
  const [failure, setFailure] = useState('');
  const [feedback, setFeedback] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const form = useForm<EditValues>({ defaultValues: { name: profile.name, phone: profile.phone || '', city: profile.city, bloodGroup: donor?.bloodGroup || 'B+', lastDonation: dateValue(donor?.lastDonationDate), neverDonated: donor?.neverDonated || false } });
  const neverDonated = useWatch({ control: form.control, name: 'neverDonated' });
  const startEditing = (section: 'personal' | 'donor') => { form.reset({ name: profile.name, phone: profile.phone || '', city: profile.city, bloodGroup: donor?.bloodGroup || 'B+', lastDonation: dateValue(donor?.lastDonationDate), neverDonated: donor?.neverDonated || false }); setFailure(''); setEditing(section); };
  const close = () => { if (form.formState.isSubmitting) return; if (form.formState.isDirty && !discard) setDiscard(true); else { setEditing(null); setDiscard(false); } };
  const save = form.handleSubmit(async (values) => {
    setFailure(''); setFeedback('');
    try {
      if (editing === 'personal') await saveProfile({ name: values.name.trim(), phone: values.phone.trim(), city: values.city.trim() });
      else { const [day, month, year] = values.lastDonation.split('/').map((part) => Number(part.trim())); const timestamp = values.neverDonated ? undefined : Date.parse(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+05:00`); await saveDonor({ bloodGroup: values.bloodGroup, neverDonated: values.neverDonated, lastDonationDate: timestamp }); }
      setEditing(null); form.reset(values); setFeedback(preview ? 'Profile updated in the sample environment.' : 'Your profile changes are saved.');
    } catch { setFailure('Your changes were not saved. Please try again.'); }
  });
  const toggleAvailability = async (available: boolean) => { if (savingAvailability) return; setSavingAvailability(true); setFailure(''); try { await changeAvailability(available); } catch { setFailure('Availability could not update. Please try again.'); } finally { setSavingAvailability(false); } };
  const leave = async () => { if (signingOut) return; setSigningOut(true); setFailure(''); try { await signOut(); } catch { setFailure('Could not sign out. Please try again.'); } finally { setSigningOut(false); } };

  return <BloodScreen><BloodHeader city={profile.city} /><Text style={ui.title}>My profile</Text>{preview ? <View style={styles.note}><InfoLine>Demo mode · profile changes apply to the sample environment.</InfoLine></View> : null}
    <View style={styles.summary}><View style={styles.avatar}><Feather name="user" size={34} color={colors.burgundy} /></View><View style={styles.summaryCopy}><Text style={styles.name}>{profile.name}</Text><Text style={styles.role}>{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</Text></View><Action label="Edit" icon="edit-2" underline onPress={() => startEditing('personal')} /></View>
    {failure && !editing ? <Notice title="Profile could not update" message={failure} tone="error" /> : null}{feedback ? <InfoLine positive>{feedback}</InfoLine> : null}
    <Text style={styles.section}>Personal information</Text><View style={styles.group}><ProfileRow icon="user" label="Full name" value={profile.name} onPress={() => startEditing('personal')} /><ProfileRow icon="mail" label="Email" value={profile.email} /><ProfileRow icon="phone" label="Phone (optional)" value={profile.phone || 'Not added'} onPress={() => startEditing('personal')} /><ProfileRow icon="map-pin" label="City" value={profile.city} onPress={() => startEditing('personal')} /></View>
    {profile.role === 'donor' && donor ? <><Text style={styles.section}>Donor details</Text><View style={styles.group}><ProfileRow icon="droplet" label="Blood group" value={donor.bloodGroup} onPress={() => startEditing('donor')} /><ProfileRow icon="calendar" label="Last donation" value={donor.neverDonated ? 'Never donated' : dateLabel(donor.lastDonationDate)} onPress={() => startEditing('donor')} /><View style={styles.row}><Feather name="clock" size={19} color={colors.burgundy} /><Text style={styles.rowLabel}>Availability</Text><Text style={[styles.rowValue, { color: donor.available ? colors.success : colors.muted }]}>{donor.available ? 'Available' : 'Unavailable'}</Text><Switch accessibilityLabel="Available for donation" value={donor.available} onValueChange={(value) => void toggleAvailability(value)} disabled={savingAvailability} trackColor={{ false: colors.divider, true: colors.primary }} thumbColor={colors.white} /></View></View><View style={styles.note}><InfoLine>Eligibility is preliminary. Final screening is performed by the hospital.</InfoLine></View></> : null}
    <Pressable accessibilityRole="button" onPress={() => router.push('/profile/notifications')} style={({ pressed, hovered, focused }) => [styles.preference, (pressed || hovered) && { opacity: 0.75 }, focused && ui.focus]}><Feather name="bell" size={20} color={colors.primary} /><Text style={styles.preferenceText}>Notification preferences</Text><Feather name="chevron-right" size={20} color={colors.primary} /></Pressable><Pressable accessibilityRole="button" onPress={() => router.push('/profile/privacy')} style={({ pressed, hovered, focused }) => [styles.preference, (pressed || hovered) && { opacity: 0.75 }, focused && ui.focus]}><Feather name="shield" size={20} color={colors.primary} /><Text style={styles.preferenceText}>Privacy & medical disclaimer</Text><Feather name="chevron-right" size={20} color={colors.primary} /></Pressable><Button label="Sign out" variant="outline" onPress={() => void leave()} busy={signingOut} style={styles.signOut} />
    <BloodSheet title={discard ? 'Discard unsaved changes?' : editing === 'donor' ? 'Edit donor details' : 'Edit personal information'} visible={editing !== null} onClose={close}>{discard ? <><Text style={ui.body}>Your profile changes have not been saved.</Text><Button label="Keep editing" onPress={() => setDiscard(false)} /><Button label="Discard changes" variant="outline" onPress={() => { setEditing(null); setDiscard(false); }} /></> : <>{editing === 'personal' ? <>
      <Controller control={form.control} name="name" rules={{ required: 'Enter your full name.', validate: (value) => value.trim().length >= 2 || 'Enter at least 2 characters.', maxLength: { value: 100, message: 'Use 100 characters or fewer.' } }} render={({ field, fieldState }) => <Field label="Full name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} icon="user" autoComplete="name" />} />
      <Field label="Email" value={profile.email} editable={false} hint="Your sign-in email is managed with your account." icon="mail" />
      <Controller control={form.control} name="phone" rules={{ validate: validatePhone }} render={({ field, fieldState }) => <Field label="Phone (optional)" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} icon="phone" keyboardType="phone-pad" autoComplete="tel" />} />
      <Controller control={form.control} name="city" rules={cityRules} render={({ field, fieldState }) => <Field label="City" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} icon="map-pin" />} />
    </> : <><Text style={ui.section}>Blood group</Text><Controller control={form.control} name="bloodGroup" render={({ field }) => <View style={styles.bloodGroups}>{bloodGroups.map((group) => <Pressable key={group} accessibilityRole="radio" accessibilityLabel={group} accessibilityState={{ checked: field.value === group }} onPress={() => field.onChange(group)} style={({ pressed, focused }) => [styles.bloodOption, field.value === group && { backgroundColor: colors.primary }, pressed && { opacity: 0.7 }, focused && ui.focus]}><Text style={[styles.bloodText, field.value === group && { color: colors.white }]}>{group}</Text></Pressable>)}</View>} />
      <Controller control={form.control} name="neverDonated" render={({ field }) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: field.value }} onPress={() => field.onChange(!field.value)} style={({ pressed, focused }) => [styles.checkbox, pressed && { opacity: 0.7 }, focused && ui.focus]}><Feather name={field.value ? 'check-square' : 'square'} size={22} color={colors.primary} /><Text style={ui.body}>I haven’t donated before</Text></Pressable>} />
      {!neverDonated ? <Controller control={form.control} name="lastDonation" rules={{ validate: (value) => form.getValues('neverDonated') || validateDonationDate(value) }} render={({ field, fieldState }) => <Field label="Last donation date" placeholder="DD / MM / YYYY" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} icon="calendar" keyboardType="numbers-and-punctuation" hint="Enter the date as DD / MM / YYYY." />} /> : null}<InfoLine>Final eligibility is determined by the receiving hospital.</InfoLine></>}
      {failure ? <Notice title="Changes were not saved" message={failure} tone="error" /> : null}<Button label={preview ? 'Save demo changes' : 'Save changes'} onPress={() => void save()} busy={form.formState.isSubmitting} /><Action label="Cancel" onPress={close} disabled={form.formState.isSubmitting} />
    </>}</BloodSheet>
  </BloodScreen>;
}

const styles = StyleSheet.create({
  summary: { marginTop: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,251,249,0.55)' }, avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' }, summaryCopy: { flex: 1, gap: 5 }, name: { fontFamily: fonts.bold, fontSize: 20, color: colors.text }, role: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary, backgroundColor: colors.blush, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  section: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text, marginTop: 15, marginBottom: 8 }, group: { borderWidth: 1, borderColor: colors.divider, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,251,249,0.65)' }, row: { minHeight: 48, borderBottomWidth: 1, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 8, flexWrap: 'wrap' }, rowLabel: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.text, flexGrow: 1 }, rowValue: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.text, flexShrink: 1, maxWidth: '61%' }, note: { marginTop: 10 }, preference: { minHeight: 50, borderWidth: 1, borderColor: colors.divider, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginVertical: 10 }, preferenceText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, flex: 1 }, signOut: { minHeight: 48, paddingVertical: 8, marginBottom: 7 },
  bloodGroups: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, bloodOption: { width: '22%', flexGrow: 1, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, bloodText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primary }, checkbox: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
});
