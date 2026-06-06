import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Avatar, Badge, Button, Card, Divider, Header, Icon, ListRow, Screen, SectionHeader, Text, Toggle } from '@/components';
import type { IconName } from '@/components/Icon';
import { contactsInGroup, useGroup, useStore } from '@/data/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { scheduleSummary } from '@/utils/format';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const group = useGroup(id);
  const contacts = useStore((s) => s.contacts);
  const campaigns = useStore((s) => s.campaigns);
  const rules = useStore((s) => s.rules);
  const toggleCampaign = useStore((s) => s.toggleCampaign);
  const toggleRule = useStore((s) => s.toggleRule);

  if (!group) {
    return (
      <Screen header={<Header title="Group" showBack />}>
        <Text variant="body" color="textSecondary" center style={{ marginTop: spacing['4xl'] }}>
          This group no longer exists.
        </Text>
      </Screen>
    );
  }

  const members = contactsInGroup(contacts, group);
  const groupCampaigns = campaigns.filter((c) => c.target.type === 'group' && c.target.groupId === group.id);
  const groupRules = rules.filter((r) => r.target.type === 'group' && r.target.groupId === group.id);

  return (
    <Screen
      header={
        <Header
          title={group.name}
          showBack
          right={
            <Icon name="create-outline" size={22} color="textSecondary" />
          }
        />
      }
    >
      {/* Hero */}
      <View style={{ alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.lg }}>
        <Avatar emoji={group.emoji} accent={group.accent} size={84} />
        <Text variant="h2" style={{ marginTop: spacing.md }}>
          {group.name}
        </Text>
        {group.description ? (
          <Text variant="callout" color="textSecondary" center style={{ marginTop: 4, maxWidth: 300 }}>
            {group.description}
          </Text>
        ) : null}
        <Text variant="footnote" color="textMuted" style={{ marginTop: spacing.sm }}>
          {members.length} {members.length === 1 ? 'contact' : 'contacts'}
        </Text>
      </View>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Button label="Auto-send" variant="secondary" icon="flash" full={false} style={{ flex: 1 }} onPress={() => router.push(`/automation/send?groupId=${group.id}`)} />
        <Button label="Auto-reply" variant="secondary" icon="sparkles" full={false} style={{ flex: 1 }} onPress={() => router.push(`/automation/reply?groupId=${group.id}`)} />
      </View>

      {/* Automations */}
      <SectionHeader title="Automations" />
      {groupCampaigns.length + groupRules.length === 0 ? (
        <Card>
          <Text variant="subhead" color="textSecondary" center>
            No automations for this group yet.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          {groupCampaigns.map((c) => (
            <AutoRow
              key={c.id}
              icon="flash"
              title={c.name}
              subtitle={scheduleSummary(c.schedule)}
              enabled={c.enabled}
              onToggle={() => toggleCampaign(c.id)}
              onPress={() => router.push(`/automation/send?id=${c.id}`)}
            />
          ))}
          {groupRules.map((r) => (
            <AutoRow
              key={r.id}
              icon="sparkles"
              title={r.name}
              subtitle={`AI reply · ${r.tone}`}
              enabled={r.enabled}
              onToggle={() => toggleRule(r.id)}
              onPress={() => router.push(`/automation/reply?id=${r.id}`)}
            />
          ))}
        </View>
      )}

      {/* Members */}
      <SectionHeader title="Members" action="Manage" onAction={() => router.push(`/group/new?id=${group.id}`)} />
      <Card padded={false}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {members.length === 0 ? (
            <Text variant="subhead" color="textSecondary" style={{ paddingVertical: spacing.lg }}>
              No contacts yet — tap Manage to add some.
            </Text>
          ) : (
            members.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <Divider inset={56} />}
                <ListRow
                  title={c.name}
                  subtitle={c.phone}
                  leading={<Avatar name={c.name} accent={c.accent} size={40} />}
                />
              </View>
            ))
          )}
        </View>
      </Card>
    </Screen>
  );
}

function AutoRow({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  onPress,
}: {
  icon: IconName;
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
        <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: enabled ? colors.primarySoft : colors.bgMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={19} color={enabled ? 'primary' : 'textMuted'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="footnote" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Toggle value={enabled} onValueChange={onToggle} />
      </View>
    </Card>
  );
}
