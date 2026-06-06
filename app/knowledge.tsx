import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, EmptyState, Header, Icon, Screen, Text, Toggle } from '@/components';
import { useStore } from '@/data/store';
import { spacing } from '@/theme/tokens';

export default function Knowledge() {
  const router = useRouter();
  const knowledge = useStore((s) => s.knowledge);
  const toggleKnowledge = useStore((s) => s.toggleKnowledge);

  return (
    <Screen
      header={
        <Header
          title="Knowledge base"
          subtitle="What your AI knows about your business"
          large
          showBack
          right={
            <Pressable onPress={() => router.push('/knowledge-edit')} hitSlop={10}>
              <Icon name="add" size={26} color="primary" />
            </Pressable>
          }
        />
      }
    >
      {knowledge.length === 0 ? (
        <EmptyState
          icon="library"
          title="No documents yet"
          message="Add hours, pricing, FAQs or policies so the AI answers like you would."
          actionLabel="Add document"
          onAction={() => router.push('/knowledge-edit')}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {knowledge.map((k) => (
            <Card key={k.id} onPress={() => router.push(`/knowledge-edit?id=${k.id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {k.title}
                  </Text>
                  <Text variant="footnote" color="textSecondary" numberOfLines={2} style={{ marginTop: 2 }}>
                    {k.content}
                  </Text>
                  <Text variant="caption" color="textMuted" style={{ marginTop: spacing.sm }}>
                    {k.content.length.toLocaleString()} characters
                  </Text>
                </View>
                <Toggle value={k.enabled} onValueChange={() => toggleKnowledge(k.id)} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
