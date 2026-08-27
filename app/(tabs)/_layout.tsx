import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { WebTopNav } from '@/components/web-top-nav';
import { palette } from '@/constants/dropdex';
import { useWebLayout } from '@/hooks/use-web-layout';

export default function TabLayout() {
  const { isDesktopWeb, isMobileWeb } = useWebLayout();

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
          height: isMobileWeb ? 64 : 82,
          left: 0,
          paddingBottom: isMobileWeb ? 10 : 20,
          paddingTop: 8,
          position: 'fixed' as const,
          right: 0,
          zIndex: 40,
        }
      : {
          backgroundColor: palette.blackRaised,
          borderTopColor: palette.blackSoft,
          borderTopWidth: 1,
          height: isMobileWeb ? 64 : 82,
          paddingBottom: isMobileWeb ? 10 : 20,
          paddingTop: 8,
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
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'power' : 'power-outline'} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="stock"
          options={{
            title: 'Stock',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'cube' : 'cube-outline'} size={24} />
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
                size={24}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="region"
          options={{
            title: 'Region',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? 'globe' : 'globe-outline'} size={24} />
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
                size={24}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
