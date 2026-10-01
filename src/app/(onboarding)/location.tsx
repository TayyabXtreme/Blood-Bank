import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button, Divider, Field, Notice } from '@/components/auth/ui';
import { FieldLabel, OnboardingScreen, onboardingStyles } from '@/components/onboarding/ui';
import { updateOnboarding, useOnboarding } from '@/features/onboarding/store';
import { cityRules } from '@/features/onboarding/validation';
import { requestDeviceCity } from '@/features/onboarding/device-location';

export default function LocationSetup() {
  const draft = useOnboarding();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const attempt = useRef(0);
  const pending = useRef(false);
  useEffect(() => () => { attempt.current += 1; }, []);
  const { control, handleSubmit } = useForm({ defaultValues: { city: draft.city }, mode: 'onTouched' });
  const next = () => {
    void handleSubmit(({ city }) => {
      attempt.current += 1;
      pending.current = false;
      setBusy(false);
      updateOnboarding({ city: city.trim(), locationSource: 'manual', latitude: undefined, longitude: undefined });
      router.push('/permissions');
    })();
  };
  const useLocation = async () => {
    if (pending.current) return;
    pending.current = true;
    const currentAttempt = ++attempt.current;
    setBusy(true);
    setMessage('');
    try {
      const result = await requestDeviceCity();
      if (currentAttempt !== attempt.current) return;
      updateOnboarding({ locationPermission: result.permission });
      if (result.city) {
        updateOnboarding({ city: result.city, locationSource: 'device', latitude: result.latitude, longitude: result.longitude });
        router.push('/permissions');
      } else {
        setMessage(result.permission === 'denied' ? 'Location access was not allowed. Enter your city below to continue.' : result.permission === 'unavailable' ? 'Location services are unavailable. Turn them on and retry, or enter your city below.' : 'Location access is allowed, but we couldn’t find your city. Enter it below to continue.');
      }
    } catch {
      if (currentAttempt !== attempt.current) return;
      setMessage('Device location could not be opened. Enter your city below to continue.');
    } finally {
      if (currentAttempt === attempt.current) {
        pending.current = false;
        setBusy(false);
      }
    }
  };
  return <OnboardingScreen step={4} title={'Find requests\nnear you'} description={'We’ll show you blood requests from\nhospitals near your location.'}>
    <Image source={require('../../../assets/onboarding/nearby-hospital.png')} style={styles.art} resizeMode="contain" accessible={false} />
    <Text style={[onboardingStyles.small, styles.privacy]}>Your exact location stays private.</Text>
    <Button label="Use my location" busy={busy} onPress={useLocation} />
    {message ? <View style={styles.notice}><Notice title="Choose your city" message={message} /></View> : null}
    <Divider />
    <View><FieldLabel>Select city manually</FieldLabel><Controller control={control} name="city" rules={cityRules} render={({ field, fieldState }) => <Field label="City" icon="map-pin" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} inputRef={field.ref} error={fieldState.error?.message} autoCapitalize="words" returnKeyType="done" onSubmitEditing={next} />} /></View>
    <Button label="Continue with city" variant="outline" onPress={next} style={{ marginTop: 18 }} />
  </OnboardingScreen>;
}

const styles = StyleSheet.create({ art: { width: '100%', height: 180 }, privacy: { textAlign: 'center', marginTop: 11, marginBottom: 21 }, notice: { marginTop: 14 } });
