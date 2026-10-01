import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Field } from '@/components/auth/ui';
import { FieldLabel, OnboardingChoice, OnboardingScreen, onboardingStyles } from '@/components/onboarding/ui';
import { updateOnboarding, useOnboarding, type BloodGroup } from '@/features/onboarding/store';
import { validateDonationDate } from '@/features/onboarding/validation';
import { colors, fonts } from '@/theme/tokens';

const bloodGroups: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export default function DonorDetails() {
  const draft = useOnboarding();
  const { control, handleSubmit, setFocus, clearErrors } = useForm({ defaultValues: { bloodGroup: draft.bloodGroup, age: draft.age, lastDonationDate: draft.lastDonationDate, neverDonated: draft.neverDonated }, mode: 'onTouched' });
  const neverDonated = useWatch({ control, name: 'neverDonated' });
  const next = handleSubmit(({ bloodGroup, age, lastDonationDate, neverDonated: never }) => {
    updateOnboarding({ bloodGroup, age, lastDonationDate: never ? '' : lastDonationDate.trim(), neverDonated: never });
    router.push('/location');
  });
  return <OnboardingScreen step={3} title={'Your donation\ndetails'} description={'This helps us match you with\nsuitable requests.'} footer={<Button label="Continue" onPress={next} />}>
    <View style={styles.form}>
      <View><FieldLabel>Blood group</FieldLabel><Controller control={control} name="bloodGroup" rules={{ required: 'Choose your blood group.' }} render={({ field, fieldState }) => <><View style={styles.groups}>{bloodGroups.map((group) => <OnboardingChoice key={group} label={`Blood group ${group}`} checked={field.value === group} onPress={() => field.onChange(group)} style={[styles.group, field.value === group && styles.groupSelected]}><Text style={[styles.groupText, field.value === group && { color: colors.white }]}>{group.replace('-', '−')}</Text></OnboardingChoice>)}</View>{fieldState.error ? <Text accessibilityLiveRegion="polite" style={onboardingStyles.error}>{fieldState.error.message}</Text> : null}</>} /></View>
      <View><FieldLabel>Age</FieldLabel><Controller control={control} name="age" rules={{ required: 'Enter your age.', validate: (value) => (/^\d{1,3}$/.test(value) && Number(value) >= 1 && Number(value) <= 120) || 'Enter your age in whole years.' }} render={({ field, fieldState }) => <Field label="Age in years" icon="calendar" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} keyboardType="number-pad" maxLength={3} returnKeyType="next" onSubmitEditing={() => { if (!neverDonated) setFocus('lastDonationDate'); }} />} /></View>
      <View><FieldLabel>Last donation date</FieldLabel><Controller control={control} name="lastDonationDate" rules={{ validate: (value) => neverDonated || validateDonationDate(value) }} render={({ field, fieldState }) => <Field label="Last donation date" placeholder={neverDonated ? 'No previous donation' : 'DD / MM / YYYY'} icon="calendar" value={neverDonated ? '' : field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} editable={!neverDonated} keyboardType="numbers-and-punctuation" maxLength={14} returnKeyType="done" onSubmitEditing={next} />} /></View>
      <Controller control={control} name="neverDonated" render={({ field }) => <OnboardingChoice role="checkbox" label="I haven't donated before" checked={field.value} onPress={() => { field.onChange(!field.value); clearErrors('lastDonationDate'); }} style={styles.checkboxRow}><View style={[styles.checkbox, field.value && { backgroundColor: colors.primary }]}>{field.value ? <Feather name="check" size={17} color={colors.white} /> : null}</View><Text style={onboardingStyles.small}>I haven’t donated before</Text></OnboardingChoice>} />
      <View style={styles.disclaimer}><Feather name="info" size={25} color={colors.burgundy} /><Text style={styles.disclaimerText}>Eligibility is preliminary. Final screening is performed by the receiving hospital.</Text></View>
    </View>
  </OnboardingScreen>;
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  group: { width: '23%', minHeight: 45, borderWidth: 1, borderColor: colors.primary, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,251,249,0.65)' },
  groupSelected: { backgroundColor: colors.primary },
  groupText: { fontFamily: fonts.semibold, fontSize: 19, color: colors.burgundy },
  checkboxRow: { flexDirection: 'row', gap: 13, alignItems: 'center', minHeight: 44 },
  checkbox: { height: 23, width: 23, borderWidth: 1, borderColor: colors.burgundy, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 17, borderRadius: 20, backgroundColor: '#fff0e7' },
  disclaimerText: { fontFamily: fonts.regular, color: colors.text, fontSize: 14, lineHeight: 19, flex: 1 },
});
