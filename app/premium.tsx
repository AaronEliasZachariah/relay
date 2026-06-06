import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components';
import type { IconName } from '@/components/Icon';
import { useStore } from '@/data/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';

const PERKS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'infinite', title: 'Unlimited automations', body: 'As many groups, campaigns and rules as you need.' },
  { icon: 'sparkles', title: '24/7 AI auto-reply', body: 'Never miss a customer — Relay answers instantly, day or night.' },
  { icon: 'logo-whatsapp', title: 'WhatsApp Business', body: 'Reach customers on SMS and WhatsApp from one inbox.' },
  { icon: 'shield-checkmark', title: 'Approval workflow', body: 'Review AI drafts before they send when it matters.' },
  { icon: 'flash', title: 'Priority delivery', body: 'Faster sending and priority support when you need it.' },
];

export default function Premium() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const setPlan = useStore((s) => s.setPlan);
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');

  const subscribe = () => {
    setPlan('pro');
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.xl }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ alignSelf: 'flex-end' }}>
          <Icon name="close" size={26} color="textMuted" />
        </Pressable>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
        <LinearGradient
          colors={[...colors.brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ width: 68, height: 68, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }, shadows.primaryGlow]}
        >
          <Icon name="diamond" size={32} color={colors.onPrimary} />
        </LinearGradient>

        <Text variant="display" style={{ marginTop: spacing.xl }}>
          Relay Pro
        </Text>
        <Text variant="h2" color="textSecondary" style={{ marginTop: spacing.xs }}>
          Grow faster on autopilot.
        </Text>

        <View style={{ marginTop: spacing['2xl'], gap: spacing.lg }}>
          {PERKS.map((p) => (
            <View key={p.title} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
              <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={p.icon} size={19} color="primary" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{p.title}</Text>
                <Text variant="footnote" color="textSecondary" style={{ marginTop: 1 }}>
                  {p.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Pricing + CTA */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <PlanCard
            selected={billing === 'annual'}
            onPress={() => setBilling('annual')}
            title="Annual"
            price="$99/yr"
            note="2 months free"
            badge="Best value"
          />
          <PlanCard
            selected={billing === 'monthly'}
            onPress={() => setBilling('monthly')}
            title="Monthly"
            price="$12/mo"
            note="Billed monthly"
          />
        </View>
        <Button label="Start 7-day free trial" onPress={subscribe} />
        <Text variant="caption" color="textMuted" center>
          Cancel anytime. {billing === 'annual' ? '$99 billed yearly' : '$12 billed monthly'} after trial.
        </Text>
      </View>
    </View>
  );
}

function PlanCard({
  selected,
  onPress,
  title,
  price,
  note,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  price: string;
  note: string;
  badge?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: radius.xl,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primarySoft : colors.bgElevated,
        padding: spacing.lg,
      }}
    >
      {badge ? (
        <View style={{ alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, marginBottom: spacing.sm }}>
          <Text variant="overline" style={{ color: colors.onPrimary }}>
            {badge}
          </Text>
        </View>
      ) : null}
      <Text variant="subhead" color="textSecondary">
        {title}
      </Text>
      <Text variant="h2" style={{ marginTop: 2 }}>
        {price}
      </Text>
      <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
        {note}
      </Text>
    </Pressable>
  );
}
