import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { termsOfService } from '@/constants/legal';
import { palette } from '@/constants/dropdex';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons color={palette.white} name="chevron-back" size={22} />
        </Pressable>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.copy}>{termsOfService}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: palette.black, flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { color: palette.white, fontSize: 16, fontWeight: '900' },
  body: { paddingBottom: 40, paddingHorizontal: 20 },
  copy: { color: palette.whiteDim, fontSize: 13, lineHeight: 20 },
});
