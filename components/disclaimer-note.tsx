import { StyleSheet, Text, View } from 'react-native';

import { brand } from '@/config/app-config';
import { palette } from '@/constants/dropdex';

export function DisclaimerNote() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{brand.disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.blackRaised,
    borderColor: palette.blackSoft,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  text: {
    color: palette.whiteShadow,
    fontSize: 10,
    lineHeight: 15,
  },
});
