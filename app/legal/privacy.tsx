import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { privacyPolicy } from '@/constants/legal';
import { palette } from '@/constants/dropdex';
import { useWebLayout } from '@/hooks/use-web-layout';

export default function PrivacyScreen() {
  const router = useRouter();
  const { isWeb } = useWebLayout();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isWeb && styles.scrollWeb]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, isWeb && styles.cardWeb]}>
          <Pressable
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
            <Ionicons color={palette.whiteDim} name="chevron-back" size={18} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.brandBlock}>
            <Text style={styles.brand}>DROPLINQ</Text>
            <Text style={styles.tagline}>Monitor · Alert · Secure</Text>
          </View>

          <Text style={styles.sectionLabel}>Legal</Text>
          <Text style={styles.heading}>Privacy Policy</Text>
          <Text style={styles.copy}>{privacyPolicy}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#000000', flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scrollWeb: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#111111',
    borderColor: '#2A2A2A',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    width: '100%',
  },
  cardWeb: {
    maxWidth: 520,
  },
  backRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 18,
  },
  backText: {
    color: palette.whiteDim,
    fontSize: 14,
    fontWeight: '700',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brand: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  tagline: {
    color: palette.whiteShadow,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sectionLabel: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  heading: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
  },
  copy: {
    color: palette.whiteDim,
    fontSize: 13,
    lineHeight: 21,
  },
  pressed: { opacity: 0.85 },
});
