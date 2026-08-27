import { Ionicons } from '@expo/vector-icons';
import React, { PropsWithChildren, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type PressableProps,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/dropdex';
import { useMobileWebChrome } from '@/hooks/use-mobile-web-chrome';
import { useWebLayout } from '@/hooks/use-web-layout';


/** Zero press-in delay so taps feel immediate across the app. */
export function InstantPressable({ unstable_pressDelay = 0, ...props }: PressableProps) {
  return <Pressable {...props} unstable_pressDelay={unstable_pressDelay} />;
}

export function Screen({
  children,
  scroll = true,
  style,
  refreshing,
  onRefresh,
  wide = false,
}: PropsWithChildren<{
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Full desktop canvas (Home / Stock). Other tabs stay narrower so cards don’t stretch. */
  wide?: boolean;
}>) {
  const { isDesktopWeb, isMobileWeb } = useWebLayout();
  const { scrollBottomPad } = useMobileWebChrome();
  const safeEdges = isDesktopWeb ? ([] as const) : isMobileWeb ? ([] as const) : (['top'] as const);
  const contentStyle = [
    styles.screenContent,
    isDesktopWeb && (wide ? styles.screenContentDesktopWide : styles.screenContentDesktop),
    isMobileWeb && [styles.screenContentMobileWeb, { paddingBottom: scrollBottomPad }],
    style,
  ];

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      {...(Platform.OS === 'web'
        ? ({
            style: {
              flex: 1,
              height: '100%',
              overflowY: 'auto' as unknown as undefined,
              WebkitOverflowScrolling: 'touch',
            },
          } as object)
        : null)}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            colors={[palette.red]}
            onRefresh={onRefresh}
            refreshing={!!refreshing}
            tintColor={palette.red}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[contentStyle, styles.fill]}>{children}</View>
  );

  return (
    <SafeAreaView edges={[...safeEdges]} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function BrandHeader({ eyebrow }: { eyebrow: string }) {
  const { isDesktopWeb } = useWebLayout();

  // Desktop web uses the top nav brand — show a page title instead of duplicating DROPLINQ.
  if (isDesktopWeb) {
    return (
      <View style={styles.webPageHeader}>
        <Text style={styles.webPageEyebrow}>DROPLINQ</Text>
        <Text style={styles.webPageTitle}>{eyebrow}</Text>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
        <Text style={styles.brand}>DROPLINQ</Text>
      </View>
      <View style={styles.headerBall}>
        <View style={styles.headerBallTop} />
        <View style={styles.headerBallLine} />
        <View style={styles.headerBallButton} />
      </View>
    </View>
  );
}

export function Panel({
  children,
  tone = 'light',
  style,
}: PropsWithChildren<{
  tone?: 'light' | 'dark' | 'red';
  style?: StyleProp<ViewStyle>;
}>) {
  return (
    <View style={[styles.panelShadow, style]}>
      <View style={[styles.panel, styles[`${tone}Panel`]]}>{children}</View>
    </View>
  );
}

export function SectionTitle({
  title,
  caption,
  light = false,
}: {
  title: string;
  caption?: string;
  light?: boolean;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, light && styles.lightText]}>{title}</Text>
      {caption ? (
        <Text style={[styles.sectionCaption, light && styles.dimLightText]}>{caption}</Text>
      ) : null}
    </View>
  );
}

export function MechanicalToggle({
  label,
  caption,
  value,
  onChange,
  light = false,
}: {
  label: string;
  caption?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  light?: boolean;
}) {
  return (
    <InstantPressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={[styles.toggleLabel, light && styles.lightText]}>{label}</Text>
        {caption ? (
          <Text style={[styles.toggleCaption, light && styles.dimLightText]}>{caption}</Text>
        ) : null}
      </View>
      <View style={[styles.switchWell, value && styles.switchWellOn]}>
        <View style={[styles.switchKnob, value && styles.switchKnobOn]}>
          <View style={styles.switchHighlight} />
        </View>
      </View>
    </InstantPressable>
  );
}

export function TagInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value || values.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    onChange([...values, value]);
    setDraft('');
  };

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <View style={styles.inputWell}>
        <TextInput
          autoCapitalize="none"
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder={placeholder}
          placeholderTextColor={palette.whiteShadow}
          returnKeyType="done"
          style={styles.input}
          value={draft}
        />
        <InstantPressable accessibilityLabel={`Add ${label}`} onPress={add} style={styles.inputButton}>
          <Ionicons color={palette.white} name="add" size={22} />
        </InstantPressable>
      </View>
      {values.length > 0 ? (
        <View style={styles.tags}>
          {values.map((value) => (
            <InstantPressable
              key={value}
              onPress={() => onChange(values.filter((item) => item !== value))}
              style={styles.tag}>
              <Text numberOfLines={1} style={styles.tagText}>{value}</Text>
              <Ionicons color={palette.white} name="close" size={14} />
            </InstantPressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <InstantPressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.choiceChip, selected && styles.choiceChipSelected]}>
      <View style={[styles.choiceLamp, selected && styles.choiceLampSelected]} />
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </InstantPressable>
  );
}

export function MetalButton({
  label,
  onPress,
  icon = 'flash',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  return (
    <InstantPressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.metalButton, pressed && styles.pressed, disabled && { opacity: 0.5 }]}>
      <View style={styles.metalButtonFace}>
        <Ionicons color={palette.black} name={icon} size={18} />
        <Text style={styles.metalButtonText}>{label.toUpperCase()}</Text>
      </View>
    </InstantPressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.black },
  fill: { flex: 1 },
  screenContent: {
    backgroundColor: palette.black,
    flexGrow: 1,
    paddingBottom: 28,
    paddingHorizontal: 18,
  },
  screenContentMobileWeb: {
    flexGrow: 0,
  },
  screenContentDesktop: {
    alignSelf: 'center',
    maxWidth: 720,
    paddingBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 8,
    width: '100%',
  },
  screenContentDesktopWide: {
    alignSelf: 'center',
    maxWidth: 1440,
    paddingBottom: 40,
    paddingHorizontal: 32,
    paddingTop: 8,
    width: '100%',
  },
  webPageHeader: {
    marginBottom: 16,
    marginTop: 4,
  },
  webPageEyebrow: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  webPageTitle: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingTop: 8,
  },
  eyebrow: {
    color: palette.whiteShadow,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.4,
    marginBottom: 6,
  },
  brand: { color: palette.white, fontSize: 30, fontWeight: '900', letterSpacing: 0.6 },
  headerBall: {
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 25,
    borderWidth: 3,
    height: 50,
    overflow: 'hidden',
    shadowColor: palette.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    width: 50,
  },
  headerBallTop: { backgroundColor: palette.red, height: 22 },
  headerBallLine: { backgroundColor: palette.black, height: 6 },
  headerBallButton: {
    backgroundColor: palette.white,
    borderColor: palette.black,
    borderRadius: 8,
    borderWidth: 4,
    height: 16,
    left: 14,
    position: 'absolute',
    top: 17,
    width: 16,
  },
  panelShadow: {
    backgroundColor: palette.black,
    borderRadius: 26,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
  },
  panel: {
    borderRadius: 24,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderTopWidth: 1,
    padding: 18,
  },
  lightPanel: { backgroundColor: palette.white },
  darkPanel: { backgroundColor: palette.blackRaised, borderColor: palette.blackSoft, borderWidth: 1 },
  redPanel: { backgroundColor: palette.red, borderColor: palette.redLight, borderWidth: 1 },
  sectionHeading: { marginBottom: 14 },
  sectionTitle: { color: palette.black, fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  sectionCaption: { color: palette.blackSoft, fontSize: 12, lineHeight: 18, marginTop: 6 },
  lightText: { color: palette.white },
  dimLightText: { color: palette.whiteDim },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 56,
  },
  toggleCopy: { flex: 1, paddingRight: 4 },
  toggleLabel: { color: palette.black, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  toggleCaption: { color: palette.blackSoft, fontSize: 11, lineHeight: 16, marginTop: 5 },
  switchWell: {
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 18,
    borderWidth: 2,
    height: 34,
    padding: 3,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    width: 58,
  },
  switchWellOn: { backgroundColor: palette.redDark, borderColor: palette.red },
  switchKnob: {
    backgroundColor: palette.whiteDim,
    borderRadius: 12,
    height: 24,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    width: 24,
  },
  switchKnobOn: { backgroundColor: palette.white, transform: [{ translateX: 24 }] },
  switchHighlight: {
    backgroundColor: palette.white,
    borderRadius: 8,
    height: 8,
    left: 5,
    opacity: 0.7,
    position: 'absolute',
    top: 3,
    width: 12,
  },
  fieldGroup: { marginTop: 14 },
  fieldLabel: { color: palette.blackSoft, fontSize: 10, fontWeight: '900', letterSpacing: 1.7, marginBottom: 7 },
  inputWell: {
    alignItems: 'center',
    backgroundColor: palette.black,
    borderColor: palette.blackSoft,
    borderRadius: 13,
    borderWidth: 2,
    flexDirection: 'row',
    minHeight: 48,
    paddingLeft: 13,
  },
  input: { color: palette.white, flex: 1, fontSize: 15, paddingVertical: 12 },
  inputButton: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 9,
    height: 36,
    justifyContent: 'center',
    marginRight: 5,
    width: 40,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  tag: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderColor: palette.redLight,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: { color: palette.white, flexShrink: 1, fontSize: 12, fontWeight: '800' },
  choiceChip: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.whiteShadow,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  choiceChipSelected: { backgroundColor: palette.white, borderColor: palette.red, borderWidth: 2 },
  choiceLamp: { backgroundColor: palette.whiteShadow, borderRadius: 4, height: 8, width: 8 },
  choiceLampSelected: {
    backgroundColor: palette.red,
    shadowColor: palette.red,
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  choiceText: { color: palette.blackSoft, fontSize: 12, fontWeight: '800' },
  choiceTextSelected: { color: palette.black },
  metalButton: {
    backgroundColor: palette.whiteShadow,
    borderRadius: 16,
    marginTop: 12,
    paddingBottom: 4,
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
  },
  metalButtonFace: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderColor: palette.whiteDim,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 46,
  },
  metalButtonText: { color: palette.black, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  pressed: { opacity: 0.88 },
});
