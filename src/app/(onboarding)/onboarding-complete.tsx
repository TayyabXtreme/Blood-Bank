import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button, Notice, TextLink } from '@/components/auth/ui';
import { OnboardingScreen } from '@/components/onboarding/ui';
import { useOnboarding } from '@/features/onboarding/store';
import { useApp } from '@/features/app/AppProvider';
import { colors, fonts, radii } from '@/theme/tokens';

export default function OnboardingComplete() {
  const draft = useOnboarding();
  const { startDemo, command } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hasProfile = !!draft.role && !!draft.name.trim() && !!draft.city.trim();
  const summary = [draft.role === 'donor' ? 'Donor' : draft.role === 'requester' ? 'Requester' : 'Your profile', draft.role === 'donor' ? draft.bloodGroup : null, draft.city.trim()].filter(Boolean).join(' · ');
  async function finish() {
    if (!hasProfile || !draft.role) { router.replace('/select-role'); return; }
    setBusy(true); setError('');
    try {
      await startDemo(draft.role);
      await command('updateProfile', { name: draft.name.trim(), phone: draft.phone.trim(), city: draft.city.trim() });
      if (draft.role === 'donor') {
        const [day, month, year] = draft.lastDonationDate.split('/').map(part => Number(part.trim()));
        await command('updateDonorProfile', { bloodGroup: draft.bloodGroup, age: Number(draft.age), neverDonated: draft.neverDonated, ...(draft.latitude !== undefined && draft.longitude !== undefined ? { latitude: draft.latitude, longitude: draft.longitude } : {}), ...(draft.neverDonated ? {} : { lastDonationDate: Date.parse(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00+05:00`) }) });
      }
      router.replace('/(tabs)');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save your profile.'); }
    finally { setBusy(false); }
  }

  return <OnboardingScreen step={6} title={hasProfile ? 'You’re ready\nto help' : 'Join our\ncommunity'} description={hasProfile ? 'Thank you for joining Blood Bank.\nTogether we can save lives.' : 'Complete your details to explore\nBlood Bank with your own profile.'} footer={<>
    {error ? <Notice title="Could not open your dashboard" message={error} tone="error" /> : null}
    <Button label={hasProfile ? 'Go to home' : 'Complete my profile'} busy={busy} onPress={() => void finish()} />
    <TextLink label="Review my details" onPress={() => router.push('/personal-info')} />
  </>}>
    <Image source={require('../../../assets/onboarding/completion-hands.png')} style={styles.art} resizeMode="contain" accessible={false} />
    <View style={styles.profile}>
      <View style={styles.avatar}><Feather name="user" size={37} color={colors.burgundy} /></View>
      <View style={styles.copy}>
        <Text style={styles.summary}>{summary}</Text>
        <Text style={styles.body}>{hasProfile ? 'Your profile details are ready for this preview.' : 'Your profile details will appear here.'}</Text>
      </View>
    </View>
  </OnboardingScreen>;
}

const styles = StyleSheet.create({
  art: { alignSelf: 'stretch', height: 250, marginHorizontal: -25, marginTop: -15, marginBottom: 16 },
  profile: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 17, backgroundColor: 'rgba(255,251,249,0.55)' },
  avatar: { width: 67, height: 67, borderRadius: 34, backgroundColor: colors.blush, justifyContent: 'center', alignItems: 'center' },
  copy: { flex: 1, gap: 6 },
  summary: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 25, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.text },
});
