import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Input, ModalHeader, Screen, Text, Toggle } from '@/components';
import { useKnowledgeDoc, useStore } from '@/data/store';
import { spacing } from '@/theme/tokens';

export default function KnowledgeEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const existing = useKnowledgeDoc(id);
  const upsertKnowledge = useStore((s) => s.upsertKnowledge);
  const deleteKnowledge = useStore((s) => s.deleteKnowledge);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);

  const save = () => {
    upsertKnowledge({ id: existing?.id, title: title.trim() || 'Untitled', content: content.trim(), enabled });
    router.back();
  };

  const remove = () => {
    if (existing) deleteKnowledge(existing.id);
    router.back();
  };

  return (
    <Screen header={<ModalHeader title={existing ? 'Edit document' : 'New document'} onSave={save} saveDisabled={!content.trim()} />}>
      <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Services & Pricing" />

      <View style={{ height: spacing.lg }} />
      <Input
        label="Content"
        value={content}
        onChangeText={setContent}
        placeholder="Write anything the AI should know — hours, pricing, policies, FAQs…"
        multiline
        style={{ minHeight: 240 }}
        helper={`${content.length.toLocaleString()} characters`}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Active</Text>
          <Text variant="footnote" color="textSecondary">Include this in AI replies</Text>
        </View>
        <Toggle value={enabled} onValueChange={setEnabled} />
      </View>

      {existing && <Button label="Delete document" variant="ghost" onPress={remove} style={{ marginTop: spacing.xl }} />}
    </Screen>
  );
}
