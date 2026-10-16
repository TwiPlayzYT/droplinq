import { StyleSheet, Text, View } from 'react-native';

import { passwordRules } from '@/lib/password-rules';

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <View accessibilityLabel="Password requirements" style={styles.list}>
      {passwordRules(password).map((rule) => (
        <View key={rule.id} style={styles.row}>
          <View style={[styles.dot, rule.met ? styles.dotMet : styles.dotUnmet]} />
          <Text style={[styles.label, rule.met ? styles.labelMet : styles.labelUnmet]}>{rule.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 6,
    marginBottom: 12,
    marginTop: 2,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    borderRadius: 4,
    borderWidth: 1.5,
    height: 8,
    width: 8,
  },
  dotMet: {
    backgroundColor: '#F7F5F2',
    borderColor: '#F7F5F2',
  },
  dotUnmet: {
    backgroundColor: 'transparent',
    borderColor: '#8A8680',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelMet: {
    color: '#F7F5F2',
  },
  labelUnmet: {
    color: '#8A8680',
  },
});
