import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { palette } from '@/constants/dropdex';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        freezeOnBlur: true,
        lazy: false,
        tabBarActiveTintColor: palette.red,
        tabBarInactiveTintColor: palette.whiteShadow,
        tabBarStyle: {
          backgroundColor: palette.blackRaised,
          borderTopColor: palette.blackSoft,
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 20,
          paddingTop: 8,
        },
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
  );
}
