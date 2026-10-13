import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { WebTopNav } from '@/components/web-top-nav';
import { palette } from '@/constants/dropdex';
import { useWebLayout } from '@/hooks/use-web-layout';

export default function TabLayout() {
  const { isDesktopWeb } = useWebLayout();

  const tabBarStyle = {
    display: 'none' as const,
    height: 0,
    overflow: 'hidden' as const,
  };

  return (
    <View
      style={{
        backgroundColor: palette.black,
        flex: 1,
        ...(Platform.OS === 'web'
          ? ({ height: '100%', maxHeight: '100%' } as object)
          : null),
      }}>
      <WebTopNav />
      <Tabs
        safeAreaInsets={{ top: 0, right: 0, bottom: 0, left: 0 }}
        tabBar={(props) => (isDesktopWeb ? null : <FloatingTabBar {...props} />)}
        screenOptions={{
          animation: 'none',
          freezeOnBlur: Platform.OS === 'web',
          lazy: Platform.OS === 'web',
          tabBarShowLabel: false,
          tabBarActiveTintColor: palette.red,
          tabBarInactiveTintColor: palette.whiteShadow,
          tabBarStyle,
          headerShown: false,
        } as object}>
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="stock" options={{ title: 'Stock' }} />
        <Tabs.Screen name="filter" options={{ title: 'Filter' }} />
        <Tabs.Screen name="region" options={{ title: 'Region' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}
