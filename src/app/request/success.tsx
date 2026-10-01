import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/auth/ui';
import { BloodHeader, BloodScreen, InfoLine, ui } from '@/components/blood/ui';
import { useApp } from '@/features/app/AppProvider';
import { colors } from '@/theme/tokens';

export default function RequestSuccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mode } = useApp();
  return <BloodScreen><BloodHeader /><View style={{ alignItems: 'center', gap: 18, paddingVertical: 45 }}><Feather name="check-circle" color={colors.success} size={78} /><Text style={ui.title}>Request received</Text><Text style={[ui.body, { textAlign: 'center' }]}>Your request is pending hospital verification. Track its progress and donor responses here.</Text></View>{mode !== 'live' ? <InfoLine>Demo request created in the sample environment. No real hospital or donor has been notified.</InfoLine> : <InfoLine>Your contact details are shared only when needed to coordinate an accepted request.</InfoLine>}<View style={{ gap: 14, marginTop: 30 }}><Button label="Track request" onPress={() => router.replace({ pathname: '/request/[id]', params: { id } })} /><Button label="Back to home" variant="outline" onPress={() => router.replace('/(tabs)')} /></View></BloodScreen>;
}
