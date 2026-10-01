import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import { Brand, ScreenShell } from '@/components/auth/ui';
import { colors, fonts } from '@/theme/tokens';

export function OnboardingScreen({ step, title, description, children, footer }: {
  step: number; title: string; description: string; children: ReactNode; footer?: ReactNode;
}) {
  return <ScreenShell contentStyle={onboardingStyles.screen}>
    <Brand size="small" layout="horizontal" />
    <OnboardingProgress step={step} />
    <View style={onboardingStyles.heading}>
      <Text accessibilityRole="header" style={onboardingStyles.title}>{title}</Text>
      <Text style={onboardingStyles.body}>{description}</Text>
    </View>
    {children}
    {footer ? <View style={onboardingStyles.footer}>{footer}</View> : null}
  </ScreenShell>;
}

export function OnboardingProgress({ step }: { step: number }) {
  const progress = [0.75, 1.75, 2.75, 3, 3.65, 4][Math.min(Math.max(step - 1, 0), 5)];
  return <View style={onboardingStyles.progress} accessible accessibilityLabel={step >= 6 ? 'Profile setup complete' : `Profile setup, step ${step} of 5`}>
    {[0, 1, 2, 3].map((segment) => <View key={segment} style={onboardingStyles.progressSegment}><View style={{ height: '100%', width: `${Math.min(Math.max(progress - segment, 0), 1) * 100}%`, borderRadius: 20, backgroundColor: colors.primary }} /></View>)}
  </View>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={onboardingStyles.label}>{children}</Text>;
}

export function OnboardingChoice({ children, label, checked, role = 'radio', onPress, style }: {
  children: ReactNode; label: string; checked: boolean; role?: AccessibilityRole;
  onPress: () => void; style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole={role} accessibilityLabel={label} accessibilityState={{ checked }} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed, hovered }) => [style, (pressed || hovered) && { opacity: 0.85 }, focused && { outlineWidth: 2, outlineColor: colors.primary, outlineOffset: 3 }]}>{children}</Pressable>;
}

export const onboardingStyles = StyleSheet.create({
  screen: { paddingTop: 16, paddingBottom: 26 },
  progress: { flexDirection: 'row', alignSelf: 'center', gap: 5, marginTop: 20, marginBottom: 30 },
  progressSegment: { height: 8, width: 35, borderRadius: 20, backgroundColor: colors.divider, overflow: 'hidden' },
  heading: { gap: 8, marginBottom: 29 },
  title: { fontFamily: fonts.display, color: colors.primary, fontSize: 36, lineHeight: 39, letterSpacing: -0.9 },
  body: { fontFamily: fonts.regular, color: colors.text, fontSize: 19, lineHeight: 25 },
  label: { fontFamily: fonts.semibold, color: colors.text, fontSize: 18, lineHeight: 23, marginBottom: 7 },
  footer: { marginTop: 'auto', paddingTop: 28, gap: 12 },
  form: { gap: 22 },
  small: { fontFamily: fonts.regular, color: colors.text, fontSize: 16, lineHeight: 22 },
  error: { fontFamily: fonts.regular, color: colors.error, fontSize: 15, lineHeight: 21, marginTop: 8 },
});
