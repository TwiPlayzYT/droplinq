import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { palette } from '@/constants/dropdex';
import { legalHref, legalNav } from '@/constants/legal';

export function AuthLegalLinks() {
  const router = useRouter();

  return (
    <View style={styles.row}>
      {legalNav.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="link"
          onPress={() => router.push(legalHref(item.href))}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
          <Text style={styles.text}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 18,
  },
  chip: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  text: {
    color: palette.whiteDim,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pressed: { opacity: 0.82 },
});
