import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Badge, Card, EmptyState, Header, Icon, Screen, SectionHeader, Text, Toggle } from '@/components';
import type { IconName } from '@/components/Icon';
import { useStore } from '@/data/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { scheduleSummary, targetEmoji, targetLabel } from '@/utils/format';

export default function Automations() {
  const router = useRouter();

  const groups = useStore((s) => s.groups);
  const contacts = useStore((s) => s.contacts);
  const campaigns = useStore((s) => s.campaigns);
  const rules = useStore((s) => s.rules);
  const toggleCampaign = useStore((s) => s.toggleCampaign);
  const toggleRule = useStore((s) => s.toggleRule);

  const empty = campaigns.length === 0 && rules.length === 0;

  return (
    <Screen header={<Header title="Automations" subtitle="Send and reply on autopilot" large />}>
      {empty ? (
        <EmptyState
          icon="flash"
          title="No automations yet"
          message="Create your first auto-send campaign or AI auto-reply to get started."
          actionLabel="New auto-send"
          onAction={() => router.push('/automation/send')}
        />
      ) : (
        <>
          <SectionHeader title="Auto-send" action="Add" onAction={() => router.push('/automation/send')} />
          <View style={{ gap: spacing.md }}>
            {campaigns.map((c) => (
              <AutomationRow
                key={c.id}
                icon="flash"
                emoji={targetEmoji(c.target, groups)}
                title={c.name}
                subtitle={`${targetLabel(c.target, groups, contacts)} · ${scheduleSummary(c.schedule)}`}
                enabled={c.enabled}
                onToggle={() => toggleCampaign(c.id)}
                onPress={() => router.push(`/automation/send?id=${c.id}`)}
              />
            ))}
          </View>

          <SectionHeader title="Auto-reply" action="Add" onAction={() => router.push('/automation/reply')} />
          <View style={{ gap: spacing.md }}>
            {rules.map((r) => (
              <AutomationRow
                key={r.id}
                icon="sparkles"
                emoji={targetEmoji(r.target, groups)}
                title={r.name}
                subtitle={`${targetLabel(r.target, groups, contacts)} · ${r.tone}${r.requireApproval ? ' · needs approval' : ''}`}
                enabled={r.enabled}
                onToggle={() => toggleRule(r.id)}
                onPress={() => router.push(`/automation/reply?id=${r.id}`)}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function AutomationRow({
  icon,
  emoji,
  title,
  subtitle,
  enabled,
  onToggle,
  onPress,
}: {
  icon: IconName;
  emoji?: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: radius.md,
            backgroundColor: enabled ? colors.primarySoft : colors.bgMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={enabled ? 'primary' : 'textMuted'} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {emoji ? <Text style={{ fontSize: 14 }}>{emoji}</Text> : null}
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {title}
            </Text>
          </View>
          <Text variant="footnote" color="textSecondary" numberOfLines={1} style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        </View>
        <Toggle value={enabled} onValueChange={onToggle} />
      </View>
    </Card>
  );
}
