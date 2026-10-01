import { router } from 'expo-router';
import { useApp } from '@/features/app/AppProvider';
import ProfileView from '@/features/profile/ProfileView';
import { BloodScreen, LoadingState } from '@/components/blood/ui';

export default function ProfileScreen() {
  const { data, command, signOut, mode } = useApp();
  if (!data?.user) return <BloodScreen><LoadingState label="Loading your profile…" /></BloodScreen>;
  return <ProfileView profile={data.user} donor={data.donor} preview={mode !== 'live'} saveProfile={async (payload) => { await command('updateProfile', payload); }} saveDonor={async (payload) => { await command('updateDonorProfile', payload); }} changeAvailability={async (available) => { await command('setAvailability', { available }); }} signOut={async () => { await signOut(); router.replace('/(auth)/welcome'); }} />;
}
