import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Card, Chip, Icon, Input, ModalHeader, Screen, SectionHeader, Text, Toggle } from '@/components';
import { useCampaign, useStore } from '@/data/store';
import type { Frequency, Schedule, Target } from '@/data/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { applyMerge, firstName } from '@/utils/format';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const TAGS = ['{name}', '{business}'];

function to12(hour24: number) {
  const ampm: 'AM' | 'PM' = hour24 < 12 ? 'AM' : 'PM';
  const h = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { h, ampm };
}
function to24(h12: number, ampm: 'AM' | 'PM') {
  const h = h12 % 12;
  return ampm === 'PM' ? h + 12 : h;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export default function AutoSendEditor() {
  const { id, groupId } = useLocalSearchParams<{ id?: string; groupId?: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const existing = useCampaign(id);
  const groups = useStore((s) => s.groups);
  const business = useStore((s) => s.business);
  const upsertCampaign = useStore((s) => s.upsertCampaign);
  const deleteCampaign = useStore((s) => s.deleteCampaign);

  const initSchedule = existing?.schedule;
  const initTime = initSchedule?.kind === 'recurring' ? to12(initSchedule.hour) : { h: 9, ampm: 'AM' as const };

  const [name, setName] = useState(existing?.name ?? '');
  const [targetId, setTargetId] = useState<string>(
    existing?.target.type === 'group' ? existing.target.groupId : groupId ?? (existing?.target.type === 'all' ? 'all' : groups[0]?.id ?? 'all'),
  );
  const [message, setMessage] = useState(existing?.message ?? '');
  const [frequency, setFrequency] = useState<Frequency>(
    initSchedule?.kind === 'recurring' ? initSchedule.frequency : 'weekly',
  );
  const [weekdays, setWeekdays] = useState<Set<number>>(
    new Set(initSchedule?.kind === 'recurring' ? initSchedule.weekdays ?? [5] : [5]),
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    String(initSchedule?.kind === 'recurring' ? initSchedule.dayOfMonth ?? 1 : 1),
  );
  const [h12, setH12] = useState(String(initTime.h));
  const [minute, setMinute] = useState(String(initSchedule?.kind === 'recurring' ? initSchedule.minute : 0).padStart(2, '0'));
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initTime.ampm);
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);

  const preview = useMemo(() => applyMerge(message || 'Your message will appear here…', business, 'Sarah'), [message, business]);
  const segments = useMemo(() => {
    const len = message.length;
    return len === 0 ? 0 : len <= 160 ? 1 : Math.ceil(len / 153);
  }, [message]);

  const toggleWeekday = (i: number) =>
    setWeekdays((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const insertTag = (tag: string) => setMessage((m) => (m ? `${m} ${tag}` : tag));

  const save = () => {
    const hour = to24(clamp(parseInt(h12, 10) || 9, 1, 12), ampm);
    const min = clamp(parseInt(minute, 10) || 0, 0, 59);
    const startsAt = initSchedule?.kind === 'recurring' ? initSchedule.startsAt : Date.now();
    const schedule: Schedule = {
      kind: 'recurring',
      hour,
      minute: min,
      frequency,
      startsAt,
      ...(frequency === 'weekly' ? { weekdays: [...weekdays].sort() } : {}),
      ...(frequency === 'monthly' ? { dayOfMonth: clamp(parseInt(dayOfMonth, 10) || 1, 1, 31) } : {}),
    };
    const target: Target = targetId === 'all' ? { type: 'all' } : { type: 'group', groupId: targetId };
    upsertCampaign({
      id: existing?.id,
      name: name.trim() || 'Untitled campaign',
      target,
      channel: business.defaultChannel,
      message: message.trim(),
      schedule,
      enabled,
    });
    router.back();
  };

  const remove = () => {
    if (existing) deleteCampaign(existing.id);
    router.back();
  };

  return (
    <Screen header={<ModalHeader title={existing ? 'Edit auto-send' : 'New auto-send'} onSave={save} saveDisabled={!message.trim()} />}>
      <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. VIP Friday Treat" />

      <SectionHeader title="Send to" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Chip label="Everyone" icon="globe" selected={targetId === 'all'} onPress={() => setTargetId('all')} />
        {groups.map((g) => (
          <Chip key={g.id} label={`${g.emoji} ${g.name}`} selected={targetId === g.id} onPress={() => setTargetId(g.id)} />
        ))}
      </View>

      <SectionHeader title="Message" />
      <Input value={message} onChangeText={setMessage} placeholder="Hi {name}! …" multiline />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
        {TAGS.map((t) => (
          <Chip key={t} label={t} onPress={() => insertTag(t)} />
        ))}
        <View style={{ flex: 1 }} />
        <Text variant="caption" color="textMuted">
          {message.length} chars · {segments} SMS
        </Text>
      </View>

      {/* Live preview */}
      <Card style={{ marginTop: spacing.md, backgroundColor: colors.primarySoft }} variant="plain">
        <Text variant="overline" color="primary" uppercase style={{ marginBottom: spacing.sm }}>
          Preview
        </Text>
        <View style={{ backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: spacing.md, alignSelf: 'flex-start', maxWidth: '92%' }}>
          <Text variant="callout">{preview}</Text>
        </View>
      </Card>

      <SectionHeader title="Schedule" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(['daily', 'weekly', 'monthly'] as Frequency[]).map((f) => (
          <Chip key={f} label={f[0]!.toUpperCase() + f.slice(1)} selected={frequency === f} onPress={() => setFrequency(f)} />
        ))}
      </View>

      {frequency === 'weekly' && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.md }}>
          {WEEKDAYS.map((w, i) => {
            const on = weekdays.has(i);
            return (
              <Pressable
                key={i}
                onPress={() => toggleWeekday(i)}
                style={{ flex: 1, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.primary : colors.bgMuted }}
              >
                <Text variant="caption" style={{ color: on ? colors.onPrimary : colors.textSecondary }}>
                  {w}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {frequency === 'monthly' && (
        <Input label="Day of month" value={dayOfMonth} onChangeText={setDayOfMonth} keyboardType="number-pad" maxLength={2} containerStyle={{ marginTop: spacing.md, width: 140 }} />
      )}

      {/* Time */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.lg }}>
        <Input label="Time" value={h12} onChangeText={setH12} keyboardType="number-pad" maxLength={2} containerStyle={{ width: 72 }} />
        <Text variant="h2" color="textMuted" style={{ paddingBottom: 10 }}>:</Text>
        <Input value={minute} onChangeText={setMinute} keyboardType="number-pad" maxLength={2} containerStyle={{ width: 72 }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingBottom: 2 }}>
          <Chip label="AM" selected={ampm === 'AM'} onPress={() => setAmpm('AM')} />
          <Chip label="PM" selected={ampm === 'PM'} onPress={() => setAmpm('PM')} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Enabled</Text>
          <Text variant="footnote" color="textSecondary">Turn the campaign on or off</Text>
        </View>
        <Toggle value={enabled} onValueChange={setEnabled} />
      </View>

      {existing && (
        <Button label="Delete campaign" variant="ghost" onPress={remove} style={{ marginTop: spacing.xl }} />
      )}
    </Screen>
  );
}
