import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Switch, Text, View } from 'react-native';
import { Button, Notice } from '@/components/auth/ui';
import { BloodHeader, BloodScreen, InfoLine, LoadingState, ui } from '@/components/blood/ui';
import { useApp } from '@/features/app/AppProvider';
import { colors } from '@/theme/tokens';

export default function NotificationPreferences() {
  const { data, command, mode } = useApp();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [feedback, setFeedback] = useState('');
  if (!data?.user) return <BloodScreen><LoadingState label="Loading preferences…" /></BloodScreen>;
  const enabled = data.user.notificationEnabled !== false;
  async function change(notificationEnabled: boolean) {
    if (busy) return;
    setBusy(true); setFailure(''); setFeedback('');
    try { await command('updateProfile', { notificationEnabled }); setFeedback('Notification preference saved.'); }
    catch (problem) { setFailure(problem instanceof Error ? problem.message : 'Could not save your preference.'); }
    finally { setBusy(false); }
  }
  return <BloodScreen><BloodHeader back={() => router.back()} /><Text style={ui.title}>Notifications</Text><View style={{ gap: 20, paddingVertical: 24 }}>{mode !== 'live' ? <InfoLine>Demo preferences apply to sample notifications only.</InfoLine> : null}<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><View style={{ flex: 1 }}><Text style={ui.section}>Blood request notifications</Text><Text style={ui.muted}>Receive request updates and, for donors, matching alerts.</Text></View><Switch accessibilityLabel="Blood request notifications" value={enabled} onValueChange={(value) => void change(value)} disabled={busy} trackColor={{ false: colors.divider, true: colors.primary }} thumbColor={colors.white} /></View><InfoLine>In-app alerts remain available in the Alerts tab. Phone notification permission is controlled separately by your device.</InfoLine>{failure ? <Notice title="Preference not saved" message={failure} tone="error" /> : null}{feedback ? <InfoLine positive>{feedback}</InfoLine> : null}<Button label="Open device settings" variant="outline" onPress={() => { void Linking.openSettings().catch(() => setFailure('Open your phone settings and find Blood Bank to manage permissions.')); }} /></View></BloodScreen>;
}
