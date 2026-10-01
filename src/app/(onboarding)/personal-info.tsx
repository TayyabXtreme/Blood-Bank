import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button, Field } from '@/components/auth/ui';
import { FieldLabel, OnboardingScreen, onboardingStyles } from '@/components/onboarding/ui';
import { updateOnboarding, useOnboarding } from '@/features/onboarding/store';
import { cityRules, validatePhone } from '@/features/onboarding/validation';

export default function PersonalInfo() {
  const draft = useOnboarding();
  const { control, handleSubmit, setFocus } = useForm({ defaultValues: { name: draft.name, phone: draft.phone, city: draft.city }, mode: 'onTouched' });
  const next = handleSubmit(({ name, phone, city }) => {
    updateOnboarding({ name: name.trim(), phone: phone.trim(), city: city.trim() });
    router.push(draft.role === 'donor' ? '/donor-details' : '/location');
  });
  return <OnboardingScreen step={2} title={'Tell us about\nyourself'} description={'This helps us connect you with\nrelevant requests in your area.'} footer={<Button label="Continue" onPress={next} />}>
    <View style={onboardingStyles.form}>
      <View><FieldLabel>Full name</FieldLabel><Controller control={control} name="name" rules={{ required: 'Enter your full name.', validate: (value) => value.trim().length >= 2 || 'Enter at least 2 characters.', maxLength: { value: 100, message: 'Use a name of 100 characters or fewer.' } }} render={({ field, fieldState }) => <Field label="Full name" icon="user" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} autoCapitalize="words" autoComplete="name" returnKeyType="next" onSubmitEditing={() => setFocus('phone')} />} /></View>
      <View><FieldLabel>Phone number (optional)</FieldLabel><Controller control={control} name="phone" rules={{ validate: validatePhone }} render={({ field, fieldState }) => <Field label="Phone number" icon="phone" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} keyboardType="phone-pad" autoComplete="tel" returnKeyType="next" onSubmitEditing={() => setFocus('city')} />} /></View>
      <View><FieldLabel>City</FieldLabel><Controller control={control} name="city" rules={cityRules} render={({ field, fieldState }) => <Field label="City" icon="map-pin" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} autoCapitalize="words" returnKeyType="done" onSubmitEditing={next} />} /></View>
    </View>
  </OnboardingScreen>;
}
