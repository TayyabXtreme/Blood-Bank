import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Brand, Dots, ScreenShell } from '@/components/auth/ui';
import { colors, fonts } from '@/theme/tokens';
import { useApp } from '@/features/app/AppProvider';

export default function Splash() {
  const { data, loading } = useApp();
  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => router.replace(data?.user ? '/(tabs)' : '/welcome'), 1000);
    return () => clearTimeout(timeout);
  }, [loading, data?.user]);

  return <ScreenShell variant="splash" scroll={false} contentStyle={styles.screen}>
    <View style={styles.identity}>
      <Brand size="large" />
      <Text style={styles.tagline}>Together for a healthier tomorrow.</Text>
      <View style={styles.progress}><Dots /></View>
    </View>
  </ScreenShell>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  identity: { width: '100%', alignItems: 'center', paddingBottom: 40 },
  tagline: { color: colors.text, fontFamily: fonts.regular, fontSize: 19, lineHeight: 26, textAlign: 'center', marginTop: 2 },
  progress: { marginTop: 46 },
});
