import React from 'react';
import { Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';
import { Text } from './Text';

type TabMeta = { label: string; on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap };

const TABS: Record<string, TabMeta> = {
  index: { label: 'Groups', on: 'people', off: 'people-outline' },
  automations: { label: 'Automations', on: 'flash', off: 'flash-outline' },
  activity: { label: 'Activity', on: 'pulse', off: 'pulse-outline' },
  settings: { label: 'Settings', on: 'settings', off: 'settings-outline' },
};

/** The bits of the bottom-tab-bar props we use (avoids a nav types dependency). */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

/** Floating, frosted tab bar — the signature piece of the app's chrome. */
export function TabBar({ state, navigation }: TabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom + 8,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            width: '100%',
            maxWidth: 420,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.tabBar,
            overflow: 'hidden',
          },
          shadows.lg,
        ]}
      >
        <BlurView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {state.routes.map((route, i) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          const onPress = () => {
            haptic.selection();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 3 }}
            >
              <Ionicons
                name={focused ? meta.on : meta.off}
                size={23}
                color={focused ? colors.tabActive : colors.tabInactive}
              />
              <Text variant="caption" style={{ color: focused ? colors.tabActive : colors.tabInactive, fontSize: 11 }}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
