import { Pressable, Text, View } from 'react-native';
import { Heart, ArrowRight, ShieldCheck, Users, Activity, Droplet } from 'lucide-react-native';
import { router } from 'expo-router';
import { Body, Brand, Button, colors, Eyebrow, Screen } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { demoAccounts } from '@/data/demo';
export default function Welcome() {
  const { mode, enterDemo } = useApp();
  return (
    <Screen>
      <View className="mb-8 mt-1 flex-row items-center justify-between">
        <Brand small />
        <View className="rounded-full border border-line px-3 py-2">
          <Eyebrow className="text-[8px] tracking-[1px]">
            {mode === 'demo' ? 'DEMO EXPERIENCE' : 'GIVE. CONNECT. SAVE.'}
          </Eyebrow>
        </View>
      </View>
      <View className="mb-8 h-60 items-center justify-center overflow-hidden rounded-[36px] bg-[#F4E8E6]">
        <View className="absolute h-52 w-52 rounded-full border border-[#E8CECE]" />
        <View className="absolute h-40 w-40 rounded-full border border-[#E8CECE]" />
        <View
          className="h-28 w-28 items-center justify-center rounded-[36px] bg-blood"
          style={{ transform: [{ rotate: '-9deg' }] }}
        >
          <Droplet size={72} color="white" fill="white" strokeWidth={1} />
          <Heart
            size={25}
            color={colors.blood}
            fill={colors.blood}
            style={{ position: 'absolute', bottom: 32 }}
          />
        </View>
        <View className="absolute bottom-5 right-5 flex-row items-center gap-2 rounded-full bg-white px-4 py-2.5">
          <View className="h-2 w-2 rounded-full bg-[#2D7865]" />
          <Text className="font-bold text-[10px] text-ink">A community that cares</Text>
        </View>
        <Activity size={30} color="#CE9DA7" style={{ position: 'absolute', left: 23, top: 34 }} />
      </View>
      <Eyebrow className="mb-3 text-blood">YOU HAVE THE POWER TO HELP</Eyebrow>
      <Text className="font-display text-[42px] leading-[49px] text-ink">Someone’s life.</Text>
      <Text className="font-display text-[42px] leading-[49px] text-ink">
        Your <Text className="text-blood">lifeline.</Text>
      </Text>
      <Body className="mb-7 mt-4 text-[15px] leading-6">
        Connect with nearby donors, request blood, and turn a moment of kindness into a second
        chance.
      </Body>
      <Button
        title="Get started"
        icon={<ArrowRight size={18} color="white" />}
        onPress={() => router.push('/(auth)/sign-up')}
      />
      <Button
        className="mt-2"
        variant="ghost"
        title="Already a member? Sign in"
        onPress={() => router.push('/(auth)/sign-in')}
      />
      <View className="mt-5 flex-row items-center justify-center gap-5">
        <View className="flex-row items-center gap-1.5">
          <ShieldCheck size={15} color={colors.green} />
          <Body className="text-[10px]">Privacy first</Body>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Users size={15} color={colors.green} />
          <Body className="text-[10px]">People powered</Body>
        </View>
      </View>
      {mode === 'demo' && (
        <View className="mt-8 border-t border-line pt-5">
          <Eyebrow className="mb-3">EXPLORE WITH SAMPLE DATA</Eyebrow>
          <View className="flex-row flex-wrap gap-2">
            {demoAccounts.map((account) => (
              <Pressable
                key={account.role}
                accessibilityRole="button"
                onPress={() => {
                  enterDemo(account.role);
                  router.replace('/');
                }}
                className="min-h-[44px] rounded-2xl border border-line bg-white px-3 py-3"
              >
                <Text className="font-bold text-[11px] text-ink">
                  {account.label} <Text className="text-blood">↗</Text>
                </Text>
              </Pressable>
            ))}
          </View>
          <Body className="mt-3 text-[10px]">
            Fictional sample data. No real requests or messages are sent. Demo changes reset when
            the app restarts.
          </Body>
        </View>
      )}
    </Screen>
  );
}
