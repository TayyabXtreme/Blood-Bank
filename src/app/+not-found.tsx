import { router } from 'expo-router';
import { Button, Empty, Screen } from '@/components/ui';
export default function NotFound() {
  return (
    <Screen title="Page not found">
      <Empty
        title="Let’s get you back"
        body="This link may have moved or no longer be available."
        action={<Button title="Go home" onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}
