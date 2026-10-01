import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button, Notice } from '@/components/auth/ui';
import { OnboardingScreen, onboardingStyles } from '@/components/onboarding/ui';
import { updateOnboarding, useOnboarding } from '@/features/onboarding/store';
import { colors, fonts } from '@/theme/tokens';

export default function NotificationPermission() {
  const draft = useOnboarding();
  const [unavailable, setUnavailable] = useState(false);
  const enable = () => {
    updateOnboarding({ notifications: 'unavailable' });
    setUnavailable(true);
  };
  const finish = () => {
    if (!unavailable) updateOnboarding({ notifications: 'skipped' });
    router.push('/onboarding-complete');
  };
  return <OnboardingScreen step={5} title={'Be there when\nit matters'} description={'Get notified about urgent blood\nrequests near you.'} footer={<><Button label="Enable notifications" onPress={enable} /><Button label={unavailable ? 'Continue without notifications' : 'Not now'} variant="outline" onPress={finish} /></>}>
    <Image source={require('../../../assets/onboarding/notification-drop.png')} style={styles.art} resizeMode="contain" accessible={false} />
    <View style={styles.notification} accessible accessibilityLabel="Example notification: urgent blood request, 2 units needed. This is an example, not a live request.">
      <View style={styles.icon}><Image source={require('../../../assets/auth/blood-drop.png')} style={styles.drop} resizeMode="contain" accessible={false} /></View>
      <View style={styles.notificationCopy}><View style={styles.notificationTitleRow}><Text style={styles.notificationTitle}>Urgent blood request</Text><Text style={styles.example}>Example</Text></View><Text style={styles.notificationBody}>2 units needed</Text><View style={styles.place}><Feather name="map-pin" size={14} color={colors.burgundy} /><Text style={styles.notificationPlace}>A hospital near you{draft.city ? ` · ${draft.city}` : ''}</Text></View></View>
    </View>
    <Text style={[onboardingStyles.small, styles.preferences]}>You can change your notification{ '\n' }preferences anytime.</Text>
    {unavailable ? <Notice title="Notifications aren’t connected yet" message="This preview cannot enable emergency push alerts. Continue without notifications to explore the setup." /> : null}
  </OnboardingScreen>;
}

const styles = StyleSheet.create({
  art: { width: '100%', height: 200 },
  notification: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 19, borderWidth: 1, borderColor: '#f0e1df', padding: 16, boxShadow: '0 4px 12px rgba(99,25,28,0.05)' },
  icon: { width: 42, height: 42, borderRadius: 22, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  drop: { width: 24, height: 33 },
  notificationCopy: { flex: 1, gap: 3 },
  notificationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, color: colors.text, flex: 1 },
  example: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  notificationBody: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 19, color: colors.text },
  place: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  notificationPlace: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, flex: 1 },
  preferences: { textAlign: 'center', marginTop: 22, marginBottom: 22 },
});
