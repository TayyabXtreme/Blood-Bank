import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Body, Button, Field, Notice, Screen } from '@/components/ui';
import { authClient } from '@/lib/auth-client';
import { useApp } from '@/providers/AppProvider';
export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>(),
    { mode } = useApp(),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Screen title="A fresh start." subtitle="Choose a new password for your account." back>
      {!token && <Notice>Open the reset link from your email to use this screen.</Notice>}
      <Field label="New password" secureTextEntry value={password} onChangeText={setPassword} />
      <Field label="Confirm password" secureTextEntry value={confirm} onChangeText={setConfirm} />
      {error && <Body className="mt-3 text-blood">{error}</Body>}
      <Button
        className="mt-6"
        title="Reset password"
        disabled={!token || mode === 'demo'}
        busy={busy}
        onPress={async () => {
          if (password.length < 8 || password !== confirm) {
            setError('Use at least 8 characters and match both passwords.');
            return;
          }
          setBusy(true);
          try {
            const result = await authClient.resetPassword({ token, newPassword: password });
            if (result.error) throw new Error(result.error.message ?? 'Reset link expired.');
            router.replace('/(auth)/sign-in');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to reset password.');
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
