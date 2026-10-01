import { useState } from 'react';
import { Platform } from 'react-native';
import { Body, Button, Field, Notice, Screen } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { authClient } from '@/lib/auth-client';
export default function VerifyEmail() {
  const { mode } = useApp(),
    [email, setEmail] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Screen title="Verify your email." subtitle="Help keep our community trusted." back>
      <Field
        label="Email address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Notice>
        Email verification is optional for this MVP. Real emails require a connected email provider.
      </Notice>
      {message && <Body className="mt-3">{message}</Body>}
      <Button
        className="mt-5"
        title="Send verification email"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          try {
            if (mode === 'demo') {
              setMessage('Demo preview only. No email was sent.');
              return;
            }
            const result = await authClient.sendVerificationEmail({
              email,
              callbackURL: Platform.OS === 'web' ? window.location.origin : 'bloodbank://',
            });
            if (result.error) throw new Error(result.error.message);
            setMessage('Check your email for a verification link.');
          } catch (e) {
            setMessage(e instanceof Error ? e.message : 'Unable to send email.');
          } finally {
            setBusy(false);
          }
        }}
      />
    </Screen>
  );
}
