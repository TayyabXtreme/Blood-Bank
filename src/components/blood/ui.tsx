import Feather from '@expo/vector-icons/Feather';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import { Brand, ScreenShell } from '@/components/auth/ui';
import { colors, fonts, radii } from '@/theme/tokens';

export type BloodIcon = ComponentProps<typeof Feather>['name'];

/** Native focus events supply keyboard focus; Pressable's style state only exposes presses/hover. */
export function FocusPressable({ style, onFocus, onBlur, ...props }: Omit<ComponentProps<typeof Pressable>, 'style'> & { style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType & { focused: boolean }) => StyleProp<ViewStyle>) }) {
  const [focused, setFocused] = useState(false);
  return <Pressable {...props} onFocus={(event) => { setFocused(true); onFocus?.(event); }} onBlur={(event) => { setFocused(false); onBlur?.(event); }} style={typeof style === 'function' ? (state) => style({ ...state, focused }) : style} />;
}

export function BloodScreen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return <ScreenShell scroll={scroll} contentStyle={{ paddingHorizontal: 18, paddingBottom: 16 }}>{children}</ScreenShell>;
}

export function BloodHeader({ city, back }: { city?: string; back?: () => void }) {
  return <View style={ui.header}>{back ? <Action label="Back" icon="arrow-left" onPress={back} iconOnly /> : null}<View style={ui.brand}><Brand size="small" layout="horizontal" /></View>{city && !back ? <View style={ui.location}><Feather name="map-pin" size={14} color={colors.primary} /><Text style={ui.city} numberOfLines={1}>{city}</Text></View> : null}</View>;
}

export function Action({ label, onPress, icon, iconOnly = false, underline = false, disabled = false, style }: { label: string; onPress: () => void; icon?: BloodIcon; iconOnly?: boolean; underline?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed, hovered }) => [ui.action, (pressed || hovered) && { opacity: 0.7 }, focused && ui.focus, disabled && { opacity: 0.45 }, style]}>{!iconOnly ? <Text style={[ui.actionText, underline && { textDecorationLine: 'underline' }]}>{label}</Text> : null}{icon ? <Feather name={icon} size={iconOnly ? 23 : 18} color={colors.primary} /> : null}</Pressable>;
}

export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={ui.sectionTitle}><Text style={ui.section}>{title}</Text>{action && onPress ? <Action label={action} onPress={onPress} /> : null}</View>;
}

export function Segment({ values, selected, onSelect }: { values: readonly { key: string; label: string }[]; selected: string; onSelect: (key: string) => void }) {
  return <View accessibilityRole="tablist" style={ui.segment}>{values.map((item) => <FocusPressable key={item.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: selected === item.key }} onPress={() => onSelect(item.key)} style={({ pressed, hovered, focused }) => [ui.segmentItem, selected === item.key && { backgroundColor: colors.primary }, (pressed || hovered) && { opacity: 0.8 }, focused && ui.focus]}><Text style={[ui.segmentText, selected === item.key && { color: colors.white }]}>{item.label}</Text></FocusPressable>)}</View>;
}

export function EmptyState({ title, message, icon = 'inbox', action, onPress }: { title: string; message: string; icon?: BloodIcon; action?: string; onPress?: () => void }) {
  return <View style={ui.empty}><View style={ui.emptyIcon}><Feather name={icon} size={28} color={colors.primary} /></View><Text style={ui.section}>{title}</Text><Text style={[ui.body, { textAlign: 'center' }]}>{message}</Text>{action && onPress ? <Action label={action} onPress={onPress} underline /> : null}</View>;
}

export function LoadingState({ label }: { label: string }) {
  return <View style={ui.empty} accessibilityLiveRegion="polite"><ActivityIndicator color={colors.primary} /><Text style={ui.body}>{label}</Text></View>;
}

/** App-owned native sheet; Modal owns platform focus containment and back/Escape dismissal. */
export function BloodSheet({ title, visible, onClose, children }: { title: string; visible: boolean; onClose: () => void; children: ReactNode }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal><View style={ui.scrim}><Pressable accessibilityLabel="Close dialog" accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} /><View style={ui.sheet} role="dialog" aria-modal aria-label={title}><View style={ui.sheetHeader}><Text style={ui.section}>{title}</Text><Action label="Close" icon="x" iconOnly onPress={onClose} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.sheetContent}>{children}</ScrollView></View></View></Modal>;
}

export function InfoLine({ children, positive = false }: { children: ReactNode; positive?: boolean }) {
  return <View style={[ui.info, positive && { backgroundColor: colors.successSurface }]} accessibilityLiveRegion="polite"><Feather name={positive ? 'check-circle' : 'info'} size={19} color={positive ? colors.success : colors.burgundy} /><Text style={ui.infoText}>{children}</Text></View>;
}

export const ui = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 72, marginBottom: 7 }, brand: { flexShrink: 1 }, location: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto', flexShrink: 1 }, city: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, flexShrink: 1 },
  title: { fontFamily: fonts.bold, fontSize: 31, lineHeight: 36, letterSpacing: -0.6, color: colors.burgundy }, body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, color: colors.text }, muted: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
  section: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, color: colors.text }, sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 8 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 44, minWidth: 44, paddingHorizontal: 3, borderRadius: 10 }, actionText: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.primary }, focus: { outlineWidth: 2, outlineColor: colors.primary, outlineOffset: 2 },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, overflow: 'hidden', marginVertical: 14 }, segmentItem: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, paddingHorizontal: 6 }, segmentText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primary },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 }, emptyIcon: { backgroundColor: colors.blush, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(45,5,8,0.3)' }, sheet: { width: '100%', maxWidth: 440, maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.background, padding: 18 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sheetContent: { gap: 12, paddingBottom: 24 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: 'rgba(251,225,223,0.55)', padding: 12 }, infoText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.text },
});
