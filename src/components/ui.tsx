import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Droplet, Heart, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useApp } from '@/providers/AppProvider';

export const colors = {
  blood: '#BC2846',
  ink: '#242326',
  muted: '#77717A',
  canvas: '#FBF8F6',
  green: '#2D7865',
  line: '#EDE5E3',
};
export function Body({
  children,
  className = '',
  ...props
}: {
  children: ReactNode;
  className?: string;
  numberOfLines?: number;
}) {
  return (
    <Text className={`font-sans text-[14px] leading-[22px] text-muted ${className}`} {...props}>
      {children}
    </Text>
  );
}
export function Title({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Text className={`font-display text-[28px] leading-[36px] text-ink ${className}`}>
      {children}
    </Text>
  );
}
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Text className={`font-bold text-[15px] text-ink ${className}`}>{children}</Text>;
}
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Text className={`font-bold text-[10px] tracking-[2px] text-muted ${className}`}>
      {children}
    </Text>
  );
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-[24px] border border-line bg-white p-5 ${className}`}>
      {children}
    </View>
  );
}
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View
        className={`${small ? 'h-9 w-9' : 'h-12 w-12'} items-center justify-center rounded-2xl bg-blood`}
      >
        <Droplet size={small ? 21 : 28} color="white" fill="white" strokeWidth={1.5} />
      </View>
      <View>
        <Text className={`font-display text-ink ${small ? 'text-xl' : 'text-2xl'}`}>
          BloodBank<Text className="text-blood">.</Text>
        </Text>
        {!small && (
          <Eyebrow className="mt-0.5 text-[8px]">A LITTLE OF YOU. A LIFE FOR SOMEONE.</Eyebrow>
        )}
      </View>
    </View>
  );
}
export function Button({
  title,
  onPress,
  variant = 'primary',
  busy = false,
  disabled = false,
  icon,
  className = '',
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  busy?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const background = {
    primary: 'bg-blood',
    secondary: 'border border-line bg-white',
    ghost: 'bg-transparent',
    danger: 'bg-blush',
  }[variant];
  const textColor = {
    primary: 'text-white',
    secondary: 'text-ink',
    ghost: 'text-blood',
    danger: 'text-blood',
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || busy}
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 active:opacity-75 ${background} ${disabled || busy ? 'opacity-50' : ''} ${className}`}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : colors.blood} />
      ) : (
        <>
          {icon}
          <Text className={`font-bold text-[14px] ${textColor}`}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View className="gap-2">
      <Label className="text-[12px]">{label}</Label>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#A69EA5"
        className={`min-h-[54px] rounded-2xl border bg-white px-4 py-3 font-sans text-[15px] text-ink ${error ? 'border-blood' : 'border-line'}`}
        {...props}
      />
      {error && <Body className="text-xs text-blood">{error}</Body>}
    </View>
  );
}
export function Pill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'red' | 'green' | 'amber';
}) {
  const bg = {
    neutral: 'bg-[#F4F0EE]',
    red: 'bg-blush',
    green: 'bg-[#EAF5EF]',
    amber: 'bg-[#FFF5DE]',
  }[tone];
  const fg = {
    neutral: 'text-muted',
    red: 'text-blood',
    green: 'text-[#2D7865]',
    amber: 'text-[#986824]',
  }[tone];
  return (
    <View className={`self-start rounded-full px-3 py-1.5 ${bg}`}>
      <Text className={`font-bold text-[10px] ${fg}`}>{children}</Text>
    </View>
  );
}
export function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-[44px] items-center justify-center rounded-full border px-4 py-2 ${selected ? 'border-blood bg-blood' : 'border-line bg-white'}`}
    >
      <Text className={`font-bold text-[12px] ${selected ? 'text-white' : 'text-muted'}`}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between">
      <Label className="text-[18px]">{title}</Label>
      {action && (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          className="min-h-[44px] flex-row items-center gap-1 px-1"
        >
          <Text className="font-bold text-[11px] text-blood">{action}</Text>
          <ChevronRight size={14} color={colors.blood} />
        </Pressable>
      )}
    </View>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  back = false,
  scroll = true,
  refresh = false,
  right,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  scroll?: boolean;
  refresh?: boolean;
  right?: ReactNode;
}) {
  const app = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const header = title ? (
    <View className="mb-6">
      {back && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="mb-4 h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
        >
          <ArrowLeft size={20} color={colors.ink} />
        </Pressable>
      )}
      <View className="flex-row items-center justify-between">
        <Title className="flex-1">{title}</Title>
        {right}
      </View>
      {subtitle && <Body className="mt-1">{subtitle}</Body>}
    </View>
  ) : null;
  const refreshControl = refresh ? (
    <RefreshControl
      tintColor={colors.blood}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        try {
          await app.refresh();
        } finally {
          setRefreshing(false);
        }
      }}
    />
  ) : undefined;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}
          >
            {header}
            {children}
          </ScrollView>
        ) : (
          <View className="flex-1 px-6 pt-5">
            {header}
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center rounded-[24px] border border-dashed border-line bg-white px-6 py-10">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-blush">
        <Heart size={24} color={colors.blood} />
      </View>
      <Label>{title}</Label>
      <Body className="mt-2 text-center">{body}</Body>
      {action && <View className="mt-5 w-full">{action}</View>}
    </View>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-2xl border border-[#E8E2D7] bg-[#F6F2E8] px-4 py-3">
      <Body className="text-xs text-[#7D725B]">{children}</Body>
    </View>
  );
}
export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <Brand />
      <ActivityIndicator className="mt-8" color={colors.blood} />
      <Body className="mt-3">Getting things ready…</Body>
    </View>
  );
}
export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" accessibilityLabel="Close dialog" onPress={onCancel} />
        <SafeAreaView edges={['bottom']} className="rounded-t-[32px] bg-canvas p-6">
          <Title>{title}</Title>
          <Body className="mb-6 mt-3">{body}</Body>
          <Button title={confirmLabel} onPress={onConfirm} busy={busy} />
          <Button title="Go back" onPress={onCancel} variant="ghost" />
        </SafeAreaView>
      </View>
    </Modal>
  );
}
export function Toast() {
  const { toast, showToast } = useApp();
  if (!toast) return null;
  return (
    <View
      className="absolute bottom-24 left-5 right-5 z-50 flex-row items-center rounded-2xl bg-ink px-4 py-3"
      accessibilityLiveRegion="polite"
    >
      <Text className="flex-1 font-sans text-[12px] leading-5 text-white">{toast}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss message"
        onPress={() => showToast(null)}
        className="h-11 w-11 items-center justify-center"
      >
        <X size={17} color="white" />
      </Pressable>
    </View>
  );
}
