import React from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { layout, radius, shadows, spacing } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/** Floating action button. Sits above the tab bar + home indicator. */
export function FAB({
  icon = 'add',
  label,
  onPress,
}: {
  icon?: IconName;
  label?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + layout.tabBarHeight + spacing.lg;

  return (
    <View style={{ position: 'absolute', right: spacing.xl, bottom }} pointerEvents="box-none">
      <Pressable
        onPress={() => {
          haptic.medium();
          onPress?.();
        }}
        style={({ pressed }) => [shadows.primaryGlow, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        <LinearGradient
          colors={[...colors.brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 56,
            minWidth: 56,
            borderRadius: radius.pill,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingHorizontal: label ? spacing.xl : 0,
          }}
        >
          <Icon name={icon} size={26} color={colors.onPrimary} />
          {label ? (
            <Text variant="button" style={{ color: colors.onPrimary }}>
              {label}
            </Text>
          ) : null}
        </LinearGradient>
      </Pressable>
    </View>
  );
}
