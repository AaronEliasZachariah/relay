import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Avatar, Badge, Card, FAB, Icon, Screen, SectionHeader, Text } from '@/components';
import { contactsInGroup, useStore } from '@/data/store';
import type { Group } from '@/data/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';
import { firstName, nextRunLabel } from '@/utils/format';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function GroupsHome() {
  const router = useRouter();
  const { colors } = useTheme();

  const business = useStore((s) => s.business);
  const groups = useStore((s) => s.groups);
  const contacts = useStore((s) => s.contacts);
  const campaigns = useStore((s) => s.campaigns);
  const rules = useStore((s) => s.rules);
  const activity = useStore((s) => s.activity);
  const plan = useStore((s) => s.plan);

  const stats = useMemo(() => {
    const sent = activity.filter(
      (a) => a.direction === 'outbound' && (a.status === 'sent' || a.status === 'delivered'),
    ).length;
    const live = campaigns.filter((c) => c.enabled).length + rules.filter((r) => r.enabled).length;
    const replies = activity.filter(
      (a) => a.kind === 'auto-reply' && (a.status === 'sent' || a.status === 'delivered'),
    ).length;
    const pending = activity.filter((a) => a.status === 'awaiting-approval').length;
    return { sent, live, replies, pending };
  }, [activity, campaigns, rules]);

  return (
    <Screen padded={false}>
      {/* Greeting header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text variant="subhead" color="textSecondary">
            {greeting()}
          </Text>
          <Text variant="h1" numberOfLines={1} style={{ marginTop: 2 }}>
            {business.name}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/settings')}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.pill,
            backgroundColor: colors.bgElevated,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="person" size={20} color="textSecondary" />
        </Pressable>
      </View>

      {/* Hero stats */}
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
        <LinearGradient
          colors={[...colors.brandGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: radius['2xl'], padding: spacing.xl }, shadows.primaryGlow]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="pulse" size={15} color="#FFFFFF" />
            <Text variant="overline" uppercase style={{ color: '#FFFFFF', opacity: 0.85 }}>
              This month
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
            <Stat value={stats.sent} label="Messages sent" />
            <Stat value={stats.replies} label="AI replies" />
            <Stat value={stats.live} label="Live automations" />
          </View>
        </LinearGradient>
      </View>

      {/* Needs-approval nudge */}
      {stats.pending > 0 && (
        <Pressable onPress={() => router.push('/(tabs)/activity')} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
          <Card variant="outlined" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.warningSoft, borderColor: 'transparent' }}>
            <Icon name="sparkles" size={20} color="warning" />
            <Text variant="subhead" style={{ flex: 1, color: colors.text }}>
              {stats.pending} AI {stats.pending === 1 ? 'reply needs' : 'replies need'} your approval
            </Text>
            <Icon name="chevron-forward" size={18} color="warning" />
          </Card>
        </Pressable>
      )}

      {/* Upgrade banner (free plan) */}
      {plan === 'free' && (
        <Pressable onPress={() => router.push('/premium')} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="diamond" size={18} color="primary" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="subhead">Unlock Relay Pro</Text>
              <Text variant="footnote" color="textSecondary">Unlimited automations & AI replies</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="textMuted" />
          </Card>
        </Pressable>
      )}

      {/* Groups */}
      <View style={{ paddingHorizontal: spacing.xl }}>
        <SectionHeader title="Your groups" action="New" onAction={() => router.push('/group/new')} />
        <View style={{ gap: spacing.md }}>
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              count={contactsInGroup(contacts, g).length}
              sends={campaigns.filter((c) => c.target.type === 'group' && c.target.groupId === g.id && c.enabled).length}
              replies={rules.filter((r) => r.target.type === 'group' && r.target.groupId === g.id && r.enabled).length}
              nextRun={campaigns
                .filter((c) => c.target.type === 'group' && c.target.groupId === g.id && c.enabled)
                .map((c) => c.nextRunAt)
                .filter((t): t is number => !!t)
                .sort((a, b) => a - b)[0]}
              onPress={() => router.push(`/group/${g.id}`)}
            />
          ))}
        </View>
      </View>

      <FAB icon="add" onPress={() => router.push('/group/new')} />
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="display" style={{ color: '#FFFFFF', fontSize: 30, lineHeight: 34 }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: '#FFFFFF', opacity: 0.85, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function GroupCard({
  group,
  count,
  sends,
  replies,
  nextRun,
  onPress,
}: {
  group: Group;
  count: number;
  sends: number;
  replies: number;
  nextRun?: number;
  onPress: () => void;
}) {
  const next = nextRunLabel(nextRun);
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar emoji={group.emoji} accent={group.accent} size={50} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {group.name}
          </Text>
          <Text variant="footnote" color="textSecondary" numberOfLines={1} style={{ marginTop: 1 }}>
            {count} {count === 1 ? 'contact' : 'contacts'}
            {next ? ` · next send ${next}` : ''}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color="textMuted" />
      </View>
      {(sends > 0 || replies > 0) && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          {sends > 0 && <Badge tone="primary" icon="flash" label={sends > 1 ? `${sends} auto-sends` : 'Auto-send'} />}
          {replies > 0 && <Badge tone="success" icon="sparkles" label="AI replies on" />}
        </View>
      )}
    </Card>
  );
}
