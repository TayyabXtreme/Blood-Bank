import Feather from '@expo/vector-icons/Feather';
import React, { type ComponentProps, type ReactNode, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];

export function ScreenShell({ children, variant = 'form', contentStyle, scroll = true }: {
  children: ReactNode; variant?: 'form' | 'welcome' | 'splash';
  contentStyle?: StyleProp<ViewStyle>; scroll?: boolean;
}) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <View style={styles.outer}>
      <View style={styles.frame}>
        <Image source={variant === 'splash' ? require('../../../assets/auth/auth-background.png') : require('../../../assets/auth/form-background.png')} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors accessible={false} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{content}</ScrollView> : content}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

export function Brand({ size = 'small', layout = 'vertical' }: { size?: 'small' | 'medium' | 'large'; layout?: 'vertical' | 'horizontal' }) {
  const large = size === 'large';
  const medium = size === 'medium';
  return <View style={[styles.brand, layout === 'horizontal' && { flexDirection: 'row', gap: 8 }]} accessibilityLabel="Blood Bank" accessible>
    <Image source={require('../../../assets/auth/blood-drop.png')} resizeMode="contain" style={{ width: layout === 'horizontal' ? 42 : large ? 99 : medium ? 67 : 56, height: layout === 'horizontal' ? 55 : large ? 129 : medium ? 85 : 70 }} accessible={false} />
    <Text style={[styles.brandTitle, { fontSize: large ? 46 : medium ? 34 : 28, lineHeight: large ? 58 : medium ? 42 : 35 }]}>Blood Bank</Text>
  </View>;
}

export function Button({ label, onPress, variant = 'solid', busy = false, disabled = false, style }: {
  label: string; onPress: () => void; variant?: 'solid' | 'outline';
  busy?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed, hovered }) => [styles.button, variant === 'outline' ? styles.buttonOutline : styles.buttonSolid, (pressed || hovered) && { opacity: 0.87 }, (disabled || busy) && { opacity: 0.6 }, focused && styles.focus, style]}>
    {busy ? <ActivityIndicator color={variant === 'solid' ? colors.white : colors.primary} /> : <Text style={[styles.buttonLabel, { color: variant === 'solid' ? colors.white : colors.primary }]}>{label}</Text>}
  </Pressable>;
}

export function TextLink({ label, onPress, style, icon }: { label: string; onPress: () => void; style?: StyleProp<ViewStyle>; icon?: IconName }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="link" onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed, hovered }) => [styles.link, (pressed || hovered) && { opacity: 0.7 }, focused && styles.focus, style]}>
    {icon ? <Feather name={icon} size={23} color={colors.primary} /> : null}
    <Text style={styles.linkText}>{label}</Text>
  </Pressable>;
}

export function Field({ label, placeholder, icon, error, hint, secure = false, style, onFocus, onBlur, inputRef, ...props }: TextInputProps & {
  label: string; icon?: IconName; error?: string; hint?: string; secure?: boolean;
  inputRef?: React.Ref<TextInput>;
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return <View>
    <View style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}>
      {icon ? <Feather name={icon} size={24} color={colors.burgundy} /> : null}
      <TextInput {...props} ref={inputRef} accessibilityLabel={label} aria-invalid={!!error} placeholder={placeholder ?? label} placeholderTextColor={colors.muted} style={[styles.input, style]} secureTextEntry={secure && !visible} selectionColor={colors.primary} underlineColorAndroid="transparent" onFocus={(event) => { setFocused(true); onFocus?.(event); }} onBlur={(event) => { setFocused(false); onBlur?.(event); }} />
      {secure ? <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Hide password' : 'Show password'} accessibilityState={{ checked: visible }} hitSlop={6} onPress={() => setVisible((v) => !v)} style={styles.eye}><Feather name={visible ? 'eye' : 'eye-off'} size={23} color={colors.burgundy} /></Pressable> : null}
    </View>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>;
}

export function Notice({ title, message, tone = 'info' }: { title: string; message: string; tone?: 'info' | 'success' | 'error' }) {
  return <View accessibilityLiveRegion="polite" style={[styles.notice, tone === 'success' ? styles.noticeSuccess : tone === 'error' ? styles.noticeError : styles.noticeInfo]}>
    <View style={[styles.noticeIcon, { backgroundColor: tone === 'success' ? colors.success : colors.primary }]}><Feather name={tone === 'success' ? 'check' : tone === 'error' ? 'alert-circle' : 'info'} size={21} color={colors.white} /></View>
    <View style={styles.noticeCopy}><Text style={styles.noticeTitle}>{title}</Text><Text style={styles.noticeBody}>{message}</Text></View>
  </View>;
}

export function Dots({ active = 0 }: { active?: number }) {
  return <View style={styles.dots} accessible accessibilityLabel={`Page ${active + 1} of 2`}><View style={[styles.dot, active === 0 && styles.activeDot]} /><View style={[styles.dot, active === 1 && styles.activeDot]} /></View>;
}

export function Divider() {
  return <View style={styles.divider}><View style={styles.rule} /><Text style={styles.or}>or</Text><View style={styles.rule} /></View>;
}

export const authStyles = StyleSheet.create({
  title: { color: colors.burgundy, fontFamily: fonts.bold, fontSize: 35, lineHeight: 42, letterSpacing: -1.15 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 21, lineHeight: 28 },
  small: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  form: { gap: 16 },
});

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#eee5e2', alignItems: 'center' },
  frame: { width: '100%', maxWidth: 440, flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 28 },
  brand: { alignItems: 'center', gap: 0 },
  brandTitle: { color: colors.burgundy, fontFamily: fonts.display, letterSpacing: -1.05 },
  button: { minHeight: 62, paddingHorizontal: 20, paddingVertical: 15, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  buttonSolid: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonOutline: { borderColor: colors.burgundy, backgroundColor: 'rgba(255,251,249,0.65)' },
  buttonLabel: { fontFamily: fonts.semibold, fontSize: 21, lineHeight: 29, textAlign: 'center' },
  focus: { outlineWidth: 2, outlineColor: colors.primary, outlineOffset: 4 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, alignSelf: 'center' },
  linkText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 19, lineHeight: 26, textDecorationLine: 'underline' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 64, borderWidth: 1, borderColor: colors.border, borderRadius: radii.field, backgroundColor: 'rgba(255,251,249,0.55)', paddingHorizontal: 18 },
  fieldFocused: { borderWidth: 2, paddingHorizontal: 17, borderColor: colors.primary, backgroundColor: colors.surface },
  fieldError: { borderColor: colors.error },
  input: { flex: 1, minWidth: 0, paddingVertical: 16, fontFamily: fonts.regular, fontSize: 18, color: colors.text },
  eye: { width: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.error, lineHeight: 19, marginTop: 5 },
  hint: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, lineHeight: 19, marginTop: 6 },
  notice: { flexDirection: 'row', gap: 16, padding: 18, borderWidth: 1, borderRadius: radii.card, alignItems: 'flex-start' },
  noticeSuccess: { backgroundColor: colors.successSurface, borderColor: '#d6e5d3' },
  noticeError: { backgroundColor: '#fff0ee', borderColor: '#e4bdb8' },
  noticeInfo: { backgroundColor: '#fff5ee', borderColor: colors.divider },
  noticeIcon: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  noticeCopy: { flex: 1, gap: 6 },
  noticeTitle: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 25, color: colors.text },
  noticeBody: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 23, color: colors.text },
  dots: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  dot: { height: 9, width: 30, borderRadius: radii.pill, backgroundColor: colors.blush },
  activeDot: { backgroundColor: colors.primary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 25 },
  rule: { height: 1, flex: 1, backgroundColor: colors.divider },
  or: { fontFamily: fonts.regular, fontSize: 17, color: colors.muted },
});
