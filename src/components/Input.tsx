import React, { useState } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, type as typeScale } from '@/theme/tokens';
import { Text } from './Text';

export type InputProps = TextInputProps & {
  label?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({ label, helper, multiline, style, containerStyle, onFocus, onBlur, ...rest }: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="subhead" color="textSecondary" style={{ marginBottom: spacing.sm }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={colors.textMuted}
        style={[
          {
            backgroundColor: colors.bgInput,
            borderWidth: 1.5,
            borderColor: focused ? colors.primary : colors.border,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.lg,
            paddingVertical: multiline ? spacing.md : 14,
            minHeight: multiline ? 112 : 52,
            textAlignVertical: multiline ? 'top' : 'center',
            color: colors.text,
            fontFamily: typeScale.body.fontFamily,
            fontSize: typeScale.body.fontSize,
          },
          style,
        ]}
      />
      {helper ? (
        <Text variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
