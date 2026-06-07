import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Avatar, Card, Divider, Icon, Input, ModalHeader, Screen, SectionHeader, Text } from '@/components';
import { accents } from '@/data/seed';
import { useGroup, useStore } from '@/data/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const EMOJIS = ['💎', '✂️', '✨', '🌙', '⏳', '💜', '🔥', '🌸', '☕', '🛍️', '📅', '⭐', '🎁', '👑', '🌿', '🧖'];
const SWATCHES = Object.values(accents);

export default function GroupEditor() {
  const { id, } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const existing = useGroup(id);
  const contacts = useStore((s) => s.contacts);
  const upsertGroup = useStore((s) => s.upsertGroup);

  const [name, setName] = useState(existing?.name ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? EMOJIS[0]!);
  const [accent, setAccent] = useState(existing?.accent ?? SWATCHES[0]!);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(existing?.contactIds ?? []));

  const toggle = (cid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });

  const save = () => {
    upsertGroup({
      id: existing?.id,
      name: name.trim(),
      emoji,
      accent,
      description: description.trim() || undefined,
      contactIds: [...selected],
    });
    router.back();
  };

  return (
    <Screen header={<ModalHeader title={existing ? 'Edit group' : 'New group'} onSave={save} saveDisabled={!name.trim()} />}>
      {/* Avatar preview */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Avatar emoji={emoji} accent={accent} size={84} />
      </View>

      <Input label="Group name" value={name} onChangeText={setName} placeholder="e.g. VIP Clients" />

      <View style={{ height: spacing.lg }} />
      <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional — what this group is for" />

      <SectionHeader title="Icon" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => setEmoji(e)}
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: emoji === e ? colors.primarySoft : colors.bgMuted,
              borderWidth: 1.5,
              borderColor: emoji === e ? colors.primary : 'transparent',
            }}
          >
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Color" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {SWATCHES.map((c) => (
          <Pressable key={c} onPress={() => setAccent(c)} style={{ width: 38, height: 38, borderRadius: radius.pill, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
            {accent === c && <Icon name="checkmark" size={18} color="#FFFFFF" />}
          </Pressable>
        ))}
      </View>

      <SectionHeader title={`Members${selected.size ? ` · ${selected.size}` : ''}`} />
      <Card padded={false}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {contacts.map((c, i) => {
            const on = selected.has(c.id);
            return (
              <View key={c.id}>
                {i > 0 && <Divider inset={56} />}
                <Pressable onPress={() => toggle(c.id)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, minHeight: 56 }}>
                    <Avatar name={c.name} accent={c.accent} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{c.name}</Text>
                      <Text variant="footnote" color="textSecondary">{c.phone}</Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: on ? colors.primary : colors.borderStrong,
                        backgroundColor: on ? colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {on && <Icon name="checkmark" size={15} color="#FFFFFF" />}
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}
