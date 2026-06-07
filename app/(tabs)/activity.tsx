import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Avatar, Badge, Button, Card, Chip, EmptyState, Header, Screen, Text } from '@/components';
import { useStore } from '@/data/store';
import type { MessageActivity } from '@/data/types';
import { spacing } from '@/theme/tokens';
import { dayBucket, relativeTime, statusMeta } from '@/utils/format';

type Filter = 'all' | 'approval' | 'replies' | 'sent';

export default function Activity() {
  const activity = useStore((s) => s.activity);
  const contacts = useStore((s) => s.contacts);
  const resolveDraft = useStore((s) => s.resolveDraft);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const byTime = [...activity].sort((a, b) => b.timestamp - a.timestamp);
    switch (filter) {
      case 'approval':
        return byTime.filter((a) => a.status === 'awaiting-approval');
      case 'replies':
        return byTime.filter((a) => a.kind === 'auto-reply');
      case 'sent':
        return byTime.filter((a) => a.direction === 'outbound');
      default:
        return byTime;
    }
  }, [activity, filter]);

  const buckets = useMemo(() => {
    const map = new Map<string, MessageActivity[]>();
    for (const a of filtered) {
      const key = dayBucket(a.timestamp);
      (map.get(key) ?? map.set(key, []).get(key)!).push(a);
    }
    return [...map.entries()];
  }, [filtered]);

  const nameOf = (id: string) => contacts.find((c) => c.id === id)?.name ?? 'Unknown';
  const accentOf = (id: string) => contacts.find((c) => c.id === id)?.accent;

  return (
    <Screen header={<Header title="Activity" subtitle="Every message Relay sends & receives" large />}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
      >
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Needs approval" selected={filter === 'approval'} onPress={() => setFilter('approval')} />
        <Chip label="AI replies" selected={filter === 'replies'} onPress={() => setFilter('replies')} />
        <Chip label="Outbound" selected={filter === 'sent'} onPress={() => setFilter('sent')} />
      </ScrollView>

      {filtered.length === 0 ? (
        <EmptyState icon="pulse" title="Nothing here yet" message="Messages will appear here as your automations run." />
      ) : (
        buckets.map(([bucket, items]) => (
          <View key={bucket}>
            <Text variant="overline" color="textMuted" uppercase style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
              {bucket}
            </Text>
            <View style={{ gap: spacing.md }}>
              {items.map((a) => {
                const meta = statusMeta(a.status);
                const inbound = a.direction === 'inbound';
                return (
                  <Card key={a.id}>
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                      <Avatar name={nameOf(a.contactId)} accent={accentOf(a.contactId)} size={42} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                            {nameOf(a.contactId)}
                          </Text>
                          <Text variant="caption" color="textMuted">
                            {relativeTime(a.timestamp)}
                          </Text>
                        </View>
                        <Text variant="footnote" color={inbound ? 'text' : 'textSecondary'} style={{ marginTop: 3 }} numberOfLines={3}>
                          {inbound ? '' : ''}
                          {a.body}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
                          <Badge tone={meta.tone} icon={meta.icon} label={meta.label} />
                          {a.kind === 'auto-reply' && <Badge tone="primary" label="AI" />}
                          {a.kind === 'auto-send' && <Badge tone="neutral" label="Campaign" />}
                        </View>

                        {a.status === 'awaiting-approval' && (
                          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                            <Button label="Approve & send" size="sm" icon="checkmark" full={false} onPress={() => resolveDraft(a.id, true)} style={{ flex: 1 }} />
                            <Button label="Discard" size="sm" variant="secondary" full={false} onPress={() => resolveDraft(a.id, false)} style={{ flex: 1 }} />
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
