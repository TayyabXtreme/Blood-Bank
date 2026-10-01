import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Brand, Button, Notice, ScreenShell, TextLink, authStyles } from '@/components/auth/ui';
import { useAuthPreview } from '@/features/auth/preview-context';
import { colors, fonts } from '@/theme/tokens';

export default function VerifyEmail() {
  const { email } = useAuthPreview();
  const [notice, setNotice] = useState('');
  return <ScreenShell contentStyle={{ paddingTop: 37 }}>
    <Brand />
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={authStyles.title}>Verify your email</Text>
      <Text style={authStyles.body}>Your verification link will be sent to{ '\n' }<Text style={{ fontFamily: fonts.semibold, color: '#171313' }}>{email || 'yourname@example.com'}.</Text></Text>
      <Text style={authStyles.body}>Please open the link in your email{ '\n' }to verify your account.</Text>
    </View>
    <Image source={require('../../../assets/auth/verification-art.png')} resizeMode="contain" style={styles.art} accessible={false} />
    <Button label="I’ve verified my email" onPress={() => setNotice('Email verification cannot be checked until the authentication service is connected. You can explore onboarding in this local preview.')} />
    {notice ? <View style={{ marginTop: 18 }}><Notice title="Local preview" message={notice} /><TextLink label="Preview onboarding" onPress={() => router.push('/select-role')} /></View> : null}
    <TextLink label="Resend email" onPress={() => setNotice('Resend is ready for integration. No email was sent from this local preview.')} style={{ marginTop: 22 }} />
    <TextLink label="Change email" onPress={() => router.replace('/sign-up')} />
    <Text style={[authStyles.small, styles.preview]}>Local preview · no verification email has been sent.</Text>
  </ScreenShell>;
}

const styles = StyleSheet.create({
  heading: { gap: 6, marginTop: 35 },
  art: { width: '100%', height: 238, marginTop: 18, marginBottom: 18 },
  preview: { textAlign: 'center', marginTop: 12, color: colors.muted },
});
