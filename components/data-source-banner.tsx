import { StyleSheet, Text, View } from 'react-native';

import { isMockData } from '@/config/app-config';
import { palette } from '@/constants/dropdex';

export function DataSourceBanner() {
  if (!isMockData) return null;
  return (
    <View accessibilityRole="text" style={styles.banner}>
      <Text style={styles.title}>DEV DATA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignSelf: 'flex-start',
    backgroundColor: palette.blackRaised,
    borderColor: palette.redDark,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  title: {
    color: palette.red,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
});
