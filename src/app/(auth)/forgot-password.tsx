import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Brand, Button, Field, Notice, ScreenShell, TextLink, authStyles } from '@/components/auth/ui';
import { emailRules } from '@/features/auth/preview-context';

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email: '' }, mode: 'onTouched' });
  const submit = handleSubmit(() => setSent(true));
  return <ScreenShell contentStyle={{ paddingTop: 37 }}>
    <Brand />
    <View style={styles.heading}><Text accessibilityRole="header" style={authStyles.title}>Reset your password</Text><Text style={authStyles.body}>Enter your email address and{ '\n' }we’ll send you a link to reset{ '\n' }your password.</Text></View>
    <Controller control={control} name="email" rules={emailRules} render={({ field, fieldState }) => <Field label="Email address" icon="mail" inputRef={field.ref} value={field.value} onChangeText={(v) => { field.onChange(v.trim()); setSent(false); }} onBlur={field.onBlur} error={fieldState.error?.message} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" returnKeyType="go" onSubmitEditing={submit} />} />
    <Button label="Send reset link" busy={isSubmitting} onPress={submit} style={{ marginTop: 24 }} />
    <View style={styles.feedback}>{sent ? <Notice tone="success" title="Check your email" message="Preview only — no email was sent. In the connected app, an existing account will receive a password reset link." /> : null}</View>
    <TextLink label="Back to sign in" icon="arrow-left" onPress={() => router.replace('/sign-in')} style={{ marginTop: 34 }} />
    {!sent ? <Text style={[authStyles.small, { textAlign: 'center', marginTop: 14 }]}>Local preview · email delivery is not connected yet.</Text> : null}
  </ScreenShell>;
}

const styles = StyleSheet.create({ heading: { gap: 5, marginTop: 35, marginBottom: 37 }, feedback: { minHeight: 142, marginTop: 28 } });
