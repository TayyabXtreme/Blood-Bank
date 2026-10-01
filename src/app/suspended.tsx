import { Button, Empty, Screen } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
export default function Suspended() {
  const { signOut, showToast } = useApp();
  return (
    <Screen title="Account paused">
      <Empty
        title="Contact your coordinator"
        body="An administrator suspended this account. You can sign out and contact the platform team for a review."
        action={
          <Button
            title="Sign out"
            onPress={() => signOut().catch((e: Error) => showToast(e.message))}
          />
        }
      />
    </Screen>
  );
}
