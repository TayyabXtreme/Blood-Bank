import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Brand, Button, Divider, Field, Notice, ScreenShell, TextLink, authStyles } from '@/components/auth/ui';
import { emailRules } from '@/features/auth/preview-context';

export default function SignIn() {
  const { height } = useWindowDimensions();
  const [preview, setPreview] = useState(false);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email: '', password: '' }, mode: 'onTouched' });
  const submit = handleSubmit(() => { setPreview(true); });
  return <ScreenShell contentStyle={{ paddingTop: height > 800 ? 75 : 35 }}>
    <Brand size="medium" />
    <View style={styles.heading}><Text accessibilityRole="header" style={authStyles.title}>Welcome back</Text><Text style={authStyles.body}>Sign in to continue saving lives.</Text></View>
    <View style={authStyles.form}>
      <Controller control={control} name="email" rules={emailRules} render={({ field, fieldState }) => <Field label="Email address" icon="mail" inputRef={field.ref} value={field.value} onChangeText={(v) => { field.onChange(v.trim()); setPreview(false); }} onBlur={field.onBlur} error={fieldState.error?.message} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" returnKeyType="next" />} />
      <Controller control={control} name="password" rules={{ required: 'Enter your password.' }} render={({ field, fieldState }) => <Field label="Password" icon="lock" inputRef={field.ref} value={field.value} onChangeText={(v) => { field.onChange(v); setPreview(false); }} onBlur={field.onBlur} error={fieldState.error?.message} secure autoCapitalize="none" autoComplete="current-password" onSubmitEditing={submit} returnKeyType="go" />} />
    </View>
    <TextLink label="Forgot password?" onPress={() => router.push('/forgot-password')} style={{ alignSelf: 'flex-end', marginTop: 5 }} />
    <Button label="Sign in" busy={isSubmitting} onPress={submit} style={{ marginTop: 35 }} />
    {preview ? <View style={{ marginTop: 18 }}><Notice title="Authentication preview" message="Your form is ready. Sign in will be available when the authentication service is connected." /></View> : null}
    <Divider />
    <Button label="Create account" variant="outline" onPress={() => router.push('/sign-up')} />
  </ScreenShell>;
}

const styles = StyleSheet.create({ heading: { gap: 4, marginTop: 55, marginBottom: 30 } });
