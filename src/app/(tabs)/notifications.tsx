import { FlatList, Pressable, View } from 'react-native';
import { Bell, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { Body, colors, Empty, Label, Screen } from '@/components/ui';
import { useApp, useCommand } from '@/providers/AppProvider';
export default function Notifications() {
  const { data } = useApp(),
    { run, busy } = useCommand();
  return (
    <Screen
      title="Your community inbox."
      subtitle="Small updates that bring help closer."
      scroll={false}
      right={
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => run({ kind: 'readAllNotifications' })}
          className="min-h-[44px] justify-center px-2"
        >
          <Body className="text-xs text-blood">Read all</Body>
        </Pressable>
      }
    >
      <FlatList
        data={[...data.notifications].sort((a, b) => b.createdAt - a.createdAt)}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const result = await run({ kind: 'readNotification', notificationId: item.id });
              if (result.ok && item.requestId)
                router.push({ pathname: '/request/[id]', params: { id: item.requestId } });
            }}
            className={`mb-3 flex-row items-start gap-3 rounded-[22px] border p-4 ${item.read ? 'border-line bg-white' : 'border-[#EECAD2] bg-blush'}`}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <Bell size={18} color={colors.blood} />
            </View>
            <View className="flex-1">
              <Label className="text-[13px] leading-5">{item.title}</Label>
              <Body className="mt-1 text-xs">{item.body}</Body>
              <Body className="mt-2 text-[10px]">
                {formatDistanceToNow(item.createdAt, { addSuffix: true })}
              </Body>
            </View>
            {!item.read && <View className="mt-2 h-2 w-2 rounded-full bg-blood" />}
            {item.requestId && <ChevronRight size={14} color={colors.muted} />}
          </Pressable>
        )}
        ListEmptyComponent={
          <Empty
            title="You’re all caught up"
            body="Request updates and matching donor alerts will appear here."
          />
        }
      />
    </Screen>
  );
}
