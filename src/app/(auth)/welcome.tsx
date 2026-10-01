import { router } from 'expo-router';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Button, Dots, Notice, ScreenShell } from '@/components/auth/ui';
import { colors, fonts } from '@/theme/tokens';
import { useState } from 'react';
import { useApp } from '@/features/app/AppProvider';
import { BloodSheet, InfoLine } from '@/components/blood/ui';
import type { Role } from '../../../convex/lib/validators';

export default function Welcome() {
  const { height } = useWindowDimensions();
  const { startDemo } = useApp();
  const [roles, setRoles] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function open(role: Role) {
    setBusy(role); setError('');
    try { await startDemo(role); setRoles(false); router.replace('/(tabs)'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not connect.'); }
    finally { setBusy(''); }
  }
  return <ScreenShell variant="welcome" scroll={false} contentStyle={styles.content}>
    <View style={[styles.intro, { paddingTop: height > 800 ? 79 : 44 }]}>
      <Text accessibilityRole="header" style={styles.title}>EVERYONE{ '\n' }CAN BE A HERO</Text>
      <Text style={styles.body}>Connect with donors.{ '\n' }Help save lives.</Text>
      <View style={styles.dots}><Dots /></View>
    </View>
    <Image source={require('../../../assets/auth/welcome-art.png')} resizeMode="contain" style={[styles.art, { top: height > 800 ? 220 : 195 }]} accessible={false} />
    <View style={styles.actions}>
      <Button label="Explore the app" onPress={() => setRoles(true)} />
      <Button label="Set up my demo profile" variant="outline" onPress={() => router.push('/select-role')} />
    </View>
    <BloodSheet visible={roles} title="Choose a demo profile" onClose={() => { if (!busy) setRoles(false); }}>
      <InfoLine>Connected demo · sample data shared across test roles. Sign-in will be enabled after the core workflows are tested.</InfoLine>
      {error ? <Notice title="Could not connect" message={error} tone="error" /> : null}
      {([{ role: 'requester', label: 'I need blood' }, { role: 'donor', label: 'I want to donate' }, { role: 'coordinator', label: 'Hospital coordinator' }, { role: 'admin', label: 'Platform administrator' }] as {role: Role; label: string}[]).map(item => <Button key={item.role} label={item.label} disabled={!!busy} busy={busy === item.role} onPress={() => void open(item.role)} />)}
    </BloodSheet>
  </ScreenShell>;
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 25, paddingBottom: 28, minHeight: 620 },
  intro: { zIndex: 1, paddingLeft: 5 },
  title: { color: colors.primary, fontFamily: fonts.display, fontSize: 43, lineHeight: 44, letterSpacing: -0.8 },
  body: { color: '#171313', fontFamily: fonts.regular, fontSize: 25, lineHeight: 29, marginTop: 10 },
  dots: { alignSelf: 'flex-start', paddingLeft: 42, marginTop: 25 },
  art: { position: 'absolute', left: -25, right: -25, bottom: 90, width: 'auto', height: 'auto' },
  actions: { marginTop: 'auto', gap: 9, zIndex: 2 },
});
