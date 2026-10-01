import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Brand, Button, Divider, Field, ScreenShell, authStyles } from '@/components/auth/ui';
import { emailRules, useAuthPreview } from '@/features/auth/preview-context';

export default function SignUp() {
  const { setEmail } = useAuthPreview();
  const { control, handleSubmit, resetField, formState: { isSubmitting } } = useForm({ defaultValues: { name: '', email: '', password: '' }, mode: 'onTouched' });
  const submit = handleSubmit(({ email }) => { setEmail(email); resetField('password'); router.push('/verify-email'); });
  return <ScreenShell contentStyle={{ paddingTop: 37 }}>
    <Brand />
    <View style={styles.heading}><Text accessibilityRole="header" style={authStyles.title}>Create your account</Text><Text style={authStyles.body}>Join our community and{ '\n' }help save lives.</Text></View>
    <View style={authStyles.form}>
      <Controller control={control} name="name" rules={{ required: 'Enter your full name.', validate: (v) => v.trim().length >= 2 || 'Enter at least 2 characters.' }} render={({ field, fieldState }) => <Field label="Full name" icon="user" inputRef={field.ref} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} autoCapitalize="words" autoComplete="name" returnKeyType="next" />} />
      <Controller control={control} name="email" rules={emailRules} render={({ field, fieldState }) => <Field label="Email address" icon="mail" inputRef={field.ref} value={field.value} onChangeText={(v) => field.onChange(v.trim())} onBlur={field.onBlur} error={fieldState.error?.message} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" returnKeyType="next" />} />
      <Controller control={control} name="password" rules={{ required: 'Create a password.', minLength: { value: 8, message: 'Use at least 8 characters.' } }} render={({ field, fieldState }) => <Field label="Password" icon="lock" inputRef={field.ref} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} hint="Use at least 8 characters" secure autoCapitalize="none" autoComplete="new-password" returnKeyType="go" onSubmitEditing={submit} />} />
    </View>
    <Button label="Create account" busy={isSubmitting} onPress={submit} style={{ marginTop: 36 }} />
    <Divider />
    <Button label="Sign in" variant="outline" onPress={() => router.replace('/sign-in')} />
    <Text style={[authStyles.small, { textAlign: 'center', marginTop: 16 }]}>Local preview · account creation is not connected yet.</Text>
  </ScreenShell>;
}

const styles = StyleSheet.create({ heading: { gap: 4, marginTop: 34, marginBottom: 27 } });
