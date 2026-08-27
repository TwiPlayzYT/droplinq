import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { WebTopNav } from '@/components/web-top-nav';
import { palette } from '@/constants/dropdex';
import { useMobileWebChrome } from '@/hooks/use-mobile-web-chrome';
import { useWebLayout } from '@/hooks/use-web-layout';

export default function TabLayout() {
  const { isDesktopWeb, isMobileWeb } = useWebLayout();
  const { bottomInset, tabBarHeight } = useMobileWebChrome();

  const tabBarStyle = isDesktopWeb
    ? {
        display: 'none' as const,
        height: 0,
        overflow: 'hidden' as const,
      }
    : Platform.OS === 'web' && isMobileWeb
      ? ({
          backgroundColor: palette.blackRaised,
          borderTopColor: palette.blackSoft,
          borderTopWidth: 1,
          // Keep height + safe-area padding in sync via CSS so iOS never clips labels.
          height:
            'calc(56px + max(34px, env(safe-area-inset-bottom, 0px)))' as unknown as number,
          paddingBottom: 'max(34px, env(safe-area-inset-bottom, 0px))' as unknown as number,
          paddingTop: 6,
          zIndex: 50,
        } as object)
      : {
          backgroundColor: palette.blackRaised,
          borderTopColor: palette.blackSoft,
          borderTopWidth: 1,
          // Explicit numeric height so React Navigation's getTabBarHeight picks it up.
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
        };

  return (
    <View
      style={{
        backgroundColor: palette.black,
        flex: 1,
        ...(Platform.OS === 'web'
          ? ({ height: '100%', maxHeight: '100%', overflow: 'hidden' } as object)
          : null),
      }}>
      <WebTopNav />
      <Tabs
        safeAreaInsets={
          isDesktopWeb
            ? { top: 0, right: 0, bottom: 0, left: 0 }
            : isMobileWeb
              ? { bottom: bottomInset }
              : undefined
        }
        screenOptions={{
          animation: 'none',
          freezeOnBlur: Platform.OS === 'web',
          lazy: Platform.OS === 'web',
          tabBarActiveTintColor: palette.red,
          tabBarInactiveTintColor: palette.whiteShadow,
          tabBarStyle,
          tabBarItemStyle: {
            paddingVertical: 0,
          },
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: '900',
            letterSpacing: 0.6,
            marginBottom: 0,
            marginTop: 1,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        } as object}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'power' : 'power-outline'} size={21} />
            ),
          }}
        />
        <Tabs.Screen
          name="stock"
          options={{
            title: 'Stock',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'cube' : 'cube-outline'} size={21} />
            ),
          }}
        />
        <Tabs.Screen
          name="filter"
          options={{
            title: 'Filter',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                color={color}
                name={focused ? 'options' : 'options-outline'}
                size={21}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="region"
          options={{
            title: 'Region',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'globe' : 'globe-outline'} size={21} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                color={color}
                name={focused ? 'settings' : 'settings-outline'}
                size={21}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
