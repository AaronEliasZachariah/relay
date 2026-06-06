import React, { type ReactNode } from 'react';
import {
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/theme/ThemeProvider';
import { layout, spacing } from '@/theme/tokens';

export type ScreenProps = {
  children: ReactNode;
  /** Scrollable body (default) or a fixed flex container. */
  scroll?: boolean;
  /** Apply the standard horizontal screen padding. */
  padded?: boolean;
  /** Sticky element rendered above the body (a custom header). */
  header?: ReactNode;
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  onRefresh?: () => void;
  refreshing?: boolean;
};

/**
 * Page chrome: themed background, top safe-area inset, optional sticky header,
 * and a scroll body whose bottom padding clears the tab bar + home indicator.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  header,
  background,
  contentStyle,
  style,
  onRefresh,
  refreshing,
}: ScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const padH = padded ? layout.screenPadding : 0;
  // Clear the floating tab bar + home indicator so nothing hides behind it.
  const bottomPad = insets.bottom + layout.tabBarHeight + spacing.xl;

  return (
    <View style={[{ flex: 1, backgroundColor: background ?? colors.bg }, style]}>
      <View style={{ height: insets.top }} />
      {header}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            { paddingHorizontal: padH, paddingBottom: bottomPad },
            contentStyle,
          ]}
          refreshControl={
            onRefresh
              ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
              : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: padH }, contentStyle]}>{children}</View>
      )}
    </View>
  );
}
