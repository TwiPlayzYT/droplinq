import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/dropdex';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  label?: string;
};

export function ConsentCheckbox({ checked, onChange, children, label }: Props) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Ionicons color={palette.white} name="checkmark" size={16} /> : null}
      </View>
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  box: {
    alignItems: 'center',
    borderColor: palette.blackSoft,
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22,
  },
  boxOn: { backgroundColor: palette.red, borderColor: palette.red },
  text: {
    color: palette.whiteDim,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  pressed: { opacity: 0.88 },
});
