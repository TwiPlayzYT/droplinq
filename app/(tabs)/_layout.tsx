import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { WebTopNav } from '@/components/web-top-nav';
import { palette } from '@/constants/dropdex';
import { useMobileWebChrome } from '@/hooks/use-mobile-web-chrome';
import { useWebLayout } from '@/hooks/use-web-layout';

export default function TabLayout() {
  const { isDesktopWeb } = useWebLayout();
  const { tabBarHeight } = useMobileWebChrome();

  const tabBarStyle = isDesktopWeb
    ? {
        display: 'none' as const,
        height: 0,
        overflow: 'hidden' as const,
      }
    : {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 0,
        height: tabBarHeight,
        left: 0,
        position: 'absolute' as const,
        right: 0,
        bottom: 0,
        overflow: 'visible' as const,
        zIndex: 50,
        ...(Platform.OS === 'web'
          ? ({
              position: 'fixed' as unknown as 'absolute',
            } as object)
          : null),
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
        safeAreaInsets={
          isDesktopWeb
            ? { top: 0, right: 0, bottom: 0, left: 0 }
            : // Padding already applied via tabBarStyle.paddingBottom from real insets.
              { top: 0, right: 0, bottom: 0, left: 0 }
        }
        screenOptions={{
          animation: 'none',
          freezeOnBlur: Platform.OS === 'web',
          lazy: Platform.OS === 'web',
          tabBarActiveTintColor: palette.red,
          tabBarInactiveTintColor: palette.whiteShadow,
          tabBar: (props) => (isDesktopWeb ? null : <FloatingTabBar {...props} />),
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
