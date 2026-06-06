import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components';
import { useStore } from '@/data/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';
import type { IconName } from '@/components/Icon';

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'people', title: 'Organize by group', body: 'Sort customers into groups like VIPs, regulars and leads — just like a group chat.' },
  { icon: 'flash', title: 'Send on autopilot', body: 'Schedule promos, reminders and check-ins to a whole group at the right time.' },
  { icon: 'sparkles', title: 'AI replies, 24/7', body: 'Let Relay answer booking questions instantly so you never miss a customer.' },
];

export default function Onboarding() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const start = () => {
    completeOnboarding({});
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing['3xl'], paddingHorizontal: spacing.xl }}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={[...colors.brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            { width: 76, height: 76, borderRadius: radius['2xl'], alignItems: 'center', justifyContent: 'center', marginBottom: spacing['2xl'] },
            shadows.primaryGlow,
          ]}
        >
          <Icon name="paper-plane" size={36} color={colors.onPrimary} />
        </LinearGradient>

        <Text variant="display">Relay</Text>
        <Text variant="h2" color="textSecondary" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
          Automated texts & AI replies for your business.
        </Text>

        <View style={{ marginTop: spacing['4xl'], gap: spacing.xl }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: radius.lg,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={f.icon} size={22} color="primary" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{f.title}</Text>
                <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>
                  {f.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingBottom: insets.bottom + spacing.lg, gap: spacing.md }}>
        <Button label="Get started" icon="arrow-forward" onPress={start} />
        <Text variant="caption" color="textMuted" center style={{ paddingHorizontal: spacing.xl }}>
          By continuing you agree to Relay’s Terms & Privacy Policy.
        </Text>
      </View>
    </View>
  );
}
