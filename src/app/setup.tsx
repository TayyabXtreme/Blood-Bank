import { router } from 'expo-router';
import { Body, Brand, Button, Card, Notice, Screen, Section } from '@/components/ui';
export default function Setup() {
  return (
    <Screen title="Connect BloodBank" back>
      <Brand />
      <Body className="mb-6 mt-5">Your app is ready for service configuration.</Body>
      <Card>
        <Section title="1. Create your Convex project" />
        <Body>
          Start Convex development, then copy your deployment’s cloud and site URLs into your local
          environment file.
        </Body>
        <Section title="2. Configure authentication" />
        <Body>
          Set the Better Auth secret on Convex. Connect your email provider for reset and
          verification emails.
        </Body>
        <Section title="3. Enable live mode" />
        <Body>
          Set EXPO_PUBLIC_APP_MODE to live and restart Expo. Follow the setup guide included in the
          project.
        </Body>
      </Card>
      <Notice>
        To explore without credentials, set EXPO_PUBLIC_APP_MODE to demo. Sample data is separate
        from the live database.
      </Notice>
      <Button className="mt-6" title="Back to start" onPress={() => router.replace('/')} />
    </Screen>
  );
}
