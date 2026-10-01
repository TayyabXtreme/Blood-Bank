import Feather from '@expo/vector-icons/Feather';
import { type ComponentProps, type ReactNode, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, ScreenShell } from '@/components/auth/ui';
import { colors, fonts, radii } from '@/theme/tokens';

type IconName = ComponentProps<typeof Feather>['name'];
export function RequestFlowScreen({ title, description, step, onBack, children, footer }: {
  title: string; description?: string; step?: number; onBack: () => void; children: ReactNode; footer?: ReactNode;
}) {
  return <ScreenShell contentStyle={requestFlowStyles.screen}>
    <View style={requestFlowStyles.header}>
      <RequestIconButton label="Back" icon="arrow-left" onPress={onBack} />
      <Brand size="small" layout="horizontal" />
      <View style={{ width: 44 }} />
    </View>
    {step ? <View style={requestFlowStyles.progress} accessible accessibilityLabel={'Step ' + step + ' of 4'}>
      <View style={requestFlowStyles.segments}>{[1, 2, 3, 4].map((item) => <View key={item} style={[requestFlowStyles.segment, item <= step && { backgroundColor: colors.primary }]} />)}</View>
      <Text style={requestFlowStyles.caption}>{'Step ' + step + ' of 4'}</Text>
    </View> : null}
    <View style={requestFlowStyles.heading}>
      <Text accessibilityRole="header" style={requestFlowStyles.title}>{title}</Text>
      {description ? <Text style={requestFlowStyles.body}>{description}</Text> : null}
    </View>
    {children}
    {footer ? <View style={requestFlowStyles.footer}>{footer}</View> : null}
  </ScreenShell>;
}

export function RequestIconButton({ label, icon, onPress, disabled = false }: {
  label: string; icon: IconName; onPress: () => void; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [requestFlowStyles.iconButton, focused && requestFlowStyles.focus, (pressed || disabled) && { opacity: 0.5 }]}>
    <Feather name={icon} size={24} color={colors.primary} />
  </Pressable>;
}

export function RequestError({ children }: { children?: string }) {
  return children ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={requestFlowStyles.error}>{children}</Text> : null;
}

export function RequestConfirmationSheet({ visible, title, description, children, onClose, busy = false }: {
  visible: boolean; title: string; description: string; children: ReactNode; onClose: () => void; busy?: boolean;
}) {
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { if (!busy) onClose(); }}>
    <View style={requestFlowStyles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!busy) onClose(); }} accessible={false} />
      <View style={requestFlowStyles.sheet} accessibilityViewIsModal>
        <SafeAreaView edges={['bottom']}>
          <View style={requestFlowStyles.handle} />
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={requestFlowStyles.title}>{title}</Text>
            <Text style={requestFlowStyles.body}>{description}</Text>
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  </Modal>;
}

export const requestFlowStyles = StyleSheet.create({
  screen: { paddingTop: 12, paddingHorizontal: 22, paddingBottom: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  iconButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  focus: { outlineColor: colors.primary, outlineWidth: 2, outlineOffset: 3 },
  progress: { alignItems: 'center', gap: 10, marginBottom: 24 },
  segments: { flexDirection: 'row', gap: 5 },
  segment: { width: 35, height: 8, borderRadius: radii.pill, backgroundColor: colors.divider },
  heading: { gap: 8, marginBottom: 25 },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, color: colors.burgundy, letterSpacing: -0.7 },
  body: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 24, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted },
  label: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, color: colors.text, marginBottom: 7 },
  error: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.error, marginTop: 6 },
  footer: { marginTop: 'auto', paddingTop: 22, gap: 12 },
  card: { padding: 16, borderRadius: radii.card, borderWidth: 1, borderColor: colors.primary, backgroundColor: 'rgba(255,251,249,0.75)' },
  overlay: { flex: 1, backgroundColor: 'rgba(45,20,20,0.35)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 440, maxHeight: '85%', backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  handle: { width: 50, height: 5, borderRadius: radii.pill, backgroundColor: colors.divider, marginTop: 12, alignSelf: 'center' },
});
