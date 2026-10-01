import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/auth/ui';
import { OnboardingChoice, OnboardingScreen, onboardingStyles } from '@/components/onboarding/ui';
import { updateOnboarding, useOnboarding, type OnboardingRole } from '@/features/onboarding/store';
import { colors, fonts } from '@/theme/tokens';

const roles = [
  { role: 'requester' as const, title: 'I need blood', description: 'Post a request and\nfind donors near you.', image: require('../../../assets/onboarding/requester-hands.png') },
  { role: 'donor' as const, title: 'I want to donate', description: 'Help save lives by\ndonating blood.', image: require('../../../assets/onboarding/donor-hands.png') },
];

export default function SelectRole() {
  const draft = useOnboarding();
  const [role, setRole] = useState<OnboardingRole | null>(draft.role);
  const [error, setError] = useState(false);
  const next = () => {
    if (!role) { setError(true); return; }
    updateOnboarding({ role });
    router.push('/personal-info');
  };
  return <OnboardingScreen step={1} title={'How would you\nlike to help?'} description={'Join our community and\nbe part of a healthier tomorrow.'} footer={<Button label="Continue" onPress={next} />}>
    <View style={styles.roles}>
      {roles.map((item) => <OnboardingChoice key={item.role} label={item.title} checked={role === item.role} onPress={() => { setRole(item.role); setError(false); }} style={[styles.card, role === item.role && styles.selected]}>
        <Image source={item.image} style={styles.art} resizeMode="contain" accessible={false} />
        <View style={styles.copy}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardBody}>{item.description}</Text></View>
        <Feather name={role === item.role ? 'check-circle' : 'chevron-right'} color={colors.primary} size={24} />
      </OnboardingChoice>)}
    </View>
    {error ? <Text accessibilityLiveRegion="polite" style={onboardingStyles.error}>Choose how you would like to help.</Text> : null}
  </OnboardingScreen>;
}

const styles = StyleSheet.create({
  roles: { gap: 21 },
  card: { flexDirection: 'row', alignItems: 'center', minHeight: 148, borderWidth: 1, borderColor: colors.primary, borderRadius: 24, padding: 14, gap: 13, backgroundColor: 'rgba(255,251,249,0.6)' },
  selected: { borderWidth: 2, padding: 13, backgroundColor: '#fff0ef' },
  art: { width: 93, height: 108 },
  copy: { flex: 1, gap: 6 },
  cardTitle: { fontFamily: fonts.bold, color: colors.burgundy, fontSize: 22, lineHeight: 25 },
  cardBody: { fontFamily: fonts.regular, color: colors.text, fontSize: 16, lineHeight: 22 },
});
