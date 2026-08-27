import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { WebTopNav } from '@/components/web-top-nav';
import { palette } from '@/constants/dropdex';
import { useWebLayout } from '@/hooks/use-web-layout';

const TAB_BAR_CORE = 52;

export default function TabLayout() {
  const { isDesktopWeb, isMobileWeb } = useWebLayout();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, isMobileWeb ? 8 : 12);
  const tabBarHeight = TAB_BAR_CORE + bottomInset;

  const tabBarStyle = isDesktopWeb
    ? {
        display: 'none' as const,
        height: 0,
        overflow: 'hidden' as const,
      }
    : Platform.OS === 'web'
      ? {
          backgroundColor: palette.blackRaised,
          borderTopColor: palette.blackSoft,
          borderTopWidth: 1,
          bottom: 0,
          height: tabBarHeight,
          left: 0,
          paddingBottom: bottomInset,
          paddingTop: 6,
          position: 'fixed' as const,
          right: 0,
          zIndex: 40,
        }
      : {
          backgroundColor: palette.blackRaised,
          borderTopColor: palette.blackSoft,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
        };

  return (
    <View style={{ flex: 1, backgroundColor: palette.black }}>
      <WebTopNav />
      <Tabs
        screenOptions={{
          animation: 'none',
          freezeOnBlur: Platform.OS === 'web',
          lazy: Platform.OS === 'web',
          tabBarActiveTintColor: palette.red,
          tabBarInactiveTintColor: palette.whiteShadow,
          tabBarStyle,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '900',
            letterSpacing: 0.8,
            marginTop: 2,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'power' : 'power-outline'} size={22} />
            ),
          }}
        />
        <Tabs.Screen
          name="stock"
          options={{
            title: 'Stock',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'cube' : 'cube-outline'} size={22} />
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
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="region"
          options={{
            title: 'Region',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'globe' : 'globe-outline'} size={22} />
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
                size={22}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
