import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card, Chip, Icon, Input, ModalHeader, Screen, SectionHeader, Text, Toggle } from '@/components';
import { useRule, useStore } from '@/data/store';
import type { ReplyTone, Target } from '@/data/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const TONES: ReplyTone[] = ['friendly', 'professional', 'concise', 'warm'];

export default function AutoReplyEditor() {
  const { id, groupId } = useLocalSearchParams<{ id?: string; groupId?: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const existing = useRule(id);
  const groups = useStore((s) => s.groups);
  const knowledge = useStore((s) => s.knowledge);
  const business = useStore((s) => s.business);
  const upsertRule = useStore((s) => s.upsertRule);
  const deleteRule = useStore((s) => s.deleteRule);

  const [name, setName] = useState(existing?.name ?? '');
  const [targetId, setTargetId] = useState<string>(
    existing?.target.type === 'group' ? existing.target.groupId : groupId ?? (existing?.target.type === 'group' ? '' : 'all'),
  );
  const [instruction, setInstruction] = useState(existing?.instruction ?? '');
  const [tone, setTone] = useState<ReplyTone>(existing?.tone ?? 'friendly');
  const [businessHoursOnly, setBusinessHoursOnly] = useState(existing?.businessHoursOnly ?? false);
  const [afterHours, setAfterHours] = useState(existing?.afterHoursMessage ?? '');
  const [requireApproval, setRequireApproval] = useState(existing?.requireApproval ?? false);
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);

  const activeDocs = knowledge.filter((k) => k.enabled).length;

  const save = () => {
    const target: Target = targetId === 'all' ? { type: 'all' } : { type: 'group', groupId: targetId };
    upsertRule({
      id: existing?.id,
      name: name.trim() || 'Untitled rule',
      target,
      channel: business.defaultChannel,
      instruction: instruction.trim(),
      tone,
      businessHoursOnly,
      afterHoursMessage: businessHoursOnly ? afterHours.trim() || undefined : undefined,
      requireApproval,
      enabled,
    });
    router.back();
  };

  const remove = () => {
    if (existing) deleteRule(existing.id);
    router.back();
  };

  return (
    <Screen header={<ModalHeader title={existing ? 'Edit auto-reply' : 'New auto-reply'} onSave={save} saveDisabled={!instruction.trim()} />}>
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Booking assistant" />

      <SectionHeader title="Applies to" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Chip label="Everyone" icon="globe" selected={targetId === 'all'} onPress={() => setTargetId('all')} />
        {groups.map((g) => (
          <Chip key={g.id} label={`${g.emoji} ${g.name}`} selected={targetId === g.id} onPress={() => setTargetId(g.id)} />
        ))}
      </View>

      <SectionHeader title="How should the AI reply?" />
      <Input value={instruction} onChangeText={setInstruction} placeholder="e.g. Answer booking & pricing questions, offer the next opening, and ask them to confirm." multiline />

      <SectionHeader title="Tone" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {TONES.map((t) => (
          <Chip key={t} label={t[0]!.toUpperCase() + t.slice(1)} selected={tone === t} onPress={() => setTone(t)} />
        ))}
      </View>

      {/* Knowledge note */}
      <Pressable onPress={() => router.push('/knowledge')} style={{ marginTop: spacing.lg }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="library" size={19} color="warning" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="subhead">Grounded in your knowledge base</Text>
            <Text variant="footnote" color="textSecondary">{activeDocs} active {activeDocs === 1 ? 'document' : 'documents'}</Text>
          </View>
          <Icon name="chevron-forward" size={18} color="textMuted" />
        </Card>
      </Pressable>

      <SectionHeader title="Options" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text variant="bodyStrong">Require my approval</Text>
            <Text variant="footnote" color="textSecondary">Review each AI draft before it sends</Text>
          </View>
          <Toggle value={requireApproval} onValueChange={setRequireApproval} />
        </View>
        <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: spacing.md }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text variant="bodyStrong">Business hours only</Text>
            <Text variant="footnote" color="textSecondary">Outside hours, send a set message instead</Text>
          </View>
          <Toggle value={businessHoursOnly} onValueChange={setBusinessHoursOnly} />
        </View>
        {businessHoursOnly && (
          <Input
            value={afterHours}
            onChangeText={setAfterHours}
            placeholder="We’re closed right now but will reply first thing!"
            multiline
            containerStyle={{ marginTop: spacing.md }}
          />
        )}
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Enabled</Text>
          <Text variant="footnote" color="textSecondary">Turn this rule on or off</Text>
        </View>
        <Toggle value={enabled} onValueChange={setEnabled} />
      </View>

      {existing && <Button label="Delete rule" variant="ghost" onPress={remove} style={{ marginTop: spacing.xl }} />}
    </Screen>
  );
}
