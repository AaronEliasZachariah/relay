import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Badge, Button, Card, Chip, Divider, Header, Icon, ListRow, Screen, SectionHeader, Text } from '@/components';
import type { IconName } from '@/components/Icon';
import { useStore } from '@/data/store';
import { useTheme } from '@/theme/ThemeProvider';
import type { SchemePref } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';

export default function Settings() {
  const router = useRouter();
  const { colors, scheme, setScheme } = useTheme();

  const business = useStore((s) => s.business);
  const plan = useStore((s) => s.plan);
  const knowledge = useStore((s) => s.knowledge);
  const resetDemo = useStore((s) => s.resetDemo);

  const enabledDocs = knowledge.filter((k) => k.enabled).length;

  return (
    <Screen header={<Header title="Settings" large />}>
      {/* Business profile */}
      <Card onPress={() => router.push('/business')} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <LinearGradient
          colors={[...colors.brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="storefront" size={24} color={colors.onPrimary} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {business.name}
          </Text>
          <Text variant="footnote" color="textSecondary" numberOfLines={1}>
            {business.category} · {business.number ?? 'No number yet'}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color="textMuted" />
      </Card>

      {/* Plan */}
      <View style={{ marginTop: spacing.md }}>
        {plan === 'pro' ? (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Icon name="diamond" size={22} color="primary" />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Relay Pro</Text>
              <Text variant="footnote" color="textSecondary">Thanks for supporting Relay 💜</Text>
            </View>
            <Badge tone="primary" label="Active" />
          </Card>
        ) : (
          <LinearGradient
            colors={[...colors.brandGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ borderRadius: radius.xl, padding: spacing.lg }, shadows.primaryGlow]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="diamond" size={18} color="#FFFFFF" />
              <Text variant="bodyStrong" style={{ color: '#FFFFFF' }}>
                Relay Pro
              </Text>
            </View>
            <Text variant="footnote" style={{ color: '#FFFFFF', opacity: 0.9, marginTop: 4, marginBottom: spacing.md }}>
              Unlimited automations, AI replies & WhatsApp channel.
            </Text>
            <Button label="Upgrade" variant="secondary" onPress={() => router.push('/premium')} />
          </LinearGradient>
        )}
      </View>

      {/* Messaging */}
      <SectionHeader title="Messaging" />
      <Card padded={false}>
        <Group>
          <Row icon="chatbubbles" tint={colors.infoSoft} fg={colors.info} title="Default channel" value={business.defaultChannel === 'sms' ? 'SMS' : 'WhatsApp'} onPress={() => router.push('/business')} />
          <Divider inset={68} />
          <Row icon="time" tint={colors.successSoft} fg={colors.success} title="Business hours" value="Set" onPress={() => router.push('/business')} />
          <Divider inset={68} />
          <Row icon="call" tint={colors.primarySoft} fg={colors.primary} title="Sending number" value={business.number ?? 'Add'} onPress={() => router.push('/business')} />
        </Group>
      </Card>

      {/* AI */}
      <SectionHeader title="AI" />
      <Card padded={false}>
        <Group>
          <Row icon="library" tint={colors.warningSoft} fg={colors.warning} title="Knowledge base" value={`${enabledDocs} active`} onPress={() => router.push('/knowledge')} />
        </Group>
      </Card>

      {/* Appearance */}
      <SectionHeader title="Appearance" />
      <Card>
        <Text variant="subhead" color="textSecondary" style={{ marginBottom: spacing.md }}>
          Theme
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['system', 'light', 'dark'] as SchemePref[]).map((s) => (
            <Chip key={s} label={s[0]!.toUpperCase() + s.slice(1)} selected={scheme === s} onPress={() => setScheme(s)} />
          ))}
        </View>
      </Card>

      {/* About */}
      <SectionHeader title="About" />
      <Card padded={false}>
        <Group>
          <Row icon="shield-checkmark" tint={colors.bgMuted} fg={colors.textSecondary} title="Privacy policy" onPress={() => {}} chevron />
          <Divider inset={68} />
          <Row icon="document-text" tint={colors.bgMuted} fg={colors.textSecondary} title="Terms of service" onPress={() => {}} chevron />
          <Divider inset={68} />
          <Row icon="information-circle" tint={colors.bgMuted} fg={colors.textSecondary} title="Version" value="1.0.0" />
        </Group>
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Reset demo data" variant="ghost" onPress={resetDemo} />
      </View>
    </Screen>
  );
}

function Group({ children }: { children: ReactNode }) {
  return <View style={{ paddingHorizontal: spacing.lg }}>{children}</View>;
}

function Row({
  icon,
  tint,
  fg,
  title,
  value,
  onPress,
  chevron,
}: {
  icon: IconName;
  tint: string;
  fg: string;
  title: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <ListRow
      title={title}
      onPress={onPress}
      showChevron={chevron ?? !!onPress}
      leading={
        <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={19} color={fg} />
        </View>
      }
      trailing={value ? <Text variant="subhead" color="textMuted">{value}</Text> : undefined}
    />
  );
}
