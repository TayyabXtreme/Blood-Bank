import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Body, Brand, Button, Field, Notice, Screen } from './ui';
import { signInSchema, signUpSchema } from '@/domain/validation';
import { useApp } from '@/providers/AppProvider';

export function SignInForm() {
  const app = useApp(),
    [error, setError] = useState('');
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  return (
    <Screen title="Welcome back." subtitle="A small act. An extraordinary impact." back>
      <Brand small />
      <View className="mb-6 mt-8 gap-5">
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Field
              label="Email address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="current-password"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>
      {error ? <Body className="mb-4 text-blood">{error}</Body> : null}
      {app.mode === 'demo' && (
        <Notice>
          Sample sign-in: donor@demo.bloodbank.test with any 8-character password. Demo does not
          authenticate or store passwords.
        </Notice>
      )}
      <Button
        className="mt-5"
        title="Sign in"
        busy={isSubmitting}
        onPress={handleSubmit(async (input) => {
          setError('');
          try {
            await app.signIn(input.email.trim(), input.password);
            router.replace('/');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to sign in.');
          }
        })}
      />
      <Button
        title="Forgot password?"
        variant="ghost"
        onPress={() => router.push('/(auth)/forgot-password')}
      />
      <Button
        title="Create an account"
        variant="secondary"
        onPress={() => router.push('/(auth)/sign-up')}
      />
    </Screen>
  );
}
export function SignUpForm() {
  const app = useApp(),
    [error, setError] = useState('');
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  return (
    <Screen
      title="Be someone’s lifeline."
      subtitle="Create an account and find your place in the community."
      back
    >
      <View className="mb-6 gap-5">
        {(['name', 'email', 'password', 'confirmPassword'] as const).map((name) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field, fieldState }) => (
              <Field
                label={
                  {
                    name: 'Full name',
                    email: 'Email address',
                    password: 'Password',
                    confirmPassword: 'Confirm password',
                  }[name]
                }
                placeholder={name === 'email' ? 'you@example.com' : undefined}
                autoCapitalize={name === 'name' ? 'words' : 'none'}
                keyboardType={name === 'email' ? 'email-address' : 'default'}
                secureTextEntry={name.includes('assword')}
                autoComplete={
                  name === 'email' ? 'email' : name === 'password' ? 'new-password' : 'off'
                }
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        ))}
      </View>
      {error ? <Body className="mb-4 text-blood">{error}</Body> : null}
      {app.mode === 'demo' && (
        <Notice>
          This creates a temporary demo profile. Passwords are never stored or sent in demo mode.
        </Notice>
      )}
      <Button
        className="mt-4"
        title="Create account"
        busy={isSubmitting}
        onPress={handleSubmit(async (input) => {
          setError('');
          try {
            await app.signUp(input.name.trim(), input.email.trim(), input.password);
            router.replace('/');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to create account.');
          }
        })}
      />
      <Body className="mt-4 text-center text-xs">
        Your contact information stays private. Only share what is needed to coordinate a donation.
      </Body>
      <Button
        title="Already have an account? Sign in"
        variant="ghost"
        onPress={() => router.push('/(auth)/sign-in')}
      />
    </Screen>
  );
}
