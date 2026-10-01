import { useState } from 'react';
import { z } from 'zod';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { Body, Button, Field, Notice, Screen } from '@/components/ui';
import { authClient } from '@/lib/auth-client';
import { useApp } from '@/providers/AppProvider';
export default function ForgotPassword() {
  const { mode } = useApp(),
    [email, setEmail] = useState(''),
    [error, setError] = useState(''),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <Screen
      title="Let’s get you back in."
      subtitle="We’ll send a secure reset link to your email."
      back
    >
      {sent ? (
        <>
          <Notice>
            If an account exists for that email, a reset link will arrive shortly. Check your spam
            folder too.
          </Notice>
          <Button
            className="mt-6"
            title="Back to sign in"
            onPress={() => router.replace('/(auth)/sign-in')}
          />
        </>
      ) : (
        <>
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          {error && <Body className="mt-3 text-blood">{error}</Body>}
          {mode === 'demo' && (
            <Notice>
              Email is not sent in demo mode. Connect the email service for real password recovery.
            </Notice>
          )}
          <Button
            className="mt-6"
            title={mode === 'demo' ? 'Preview recovery confirmation' : 'Send reset link'}
            busy={busy}
            onPress={async () => {
              setError('');
              if (!z.email().safeParse(email).success) {
                setError('Enter a valid email address.');
                return;
              }
              setBusy(true);
              try {
                if (mode === 'live') {
                  const result = await authClient.requestPasswordReset({
                    email,
                    redirectTo:
                      Platform.OS === 'web'
                        ? `${window.location.origin}/reset-password`
                        : 'bloodbank://reset-password',
                  });
                  if (result.error)
                    throw new Error(result.error.message ?? 'Unable to send reset email.');
                }
                setSent(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Unable to send reset email.');
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      )}
    </Screen>
  );
}
