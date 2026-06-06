import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Chip, Divider, Header, Input, Screen, SectionHeader, Text, Toggle } from '@/components';
import { useStore } from '@/data/store';
import type { BusinessHours, Channel } from '@/data/types';
import { spacing } from '@/theme/tokens';

const DAYS: { key: keyof BusinessHours; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

export default function BusinessProfileEditor() {
  const router = useRouter();
  const business = useStore((s) => s.business);
  const updateBusiness = useStore((s) => s.updateBusiness);

  const [name, setName] = useState(business.name);
  const [category, setCategory] = useState(business.category);
  const [number, setNumber] = useState(business.number ?? '');
  const [signature, setSignature] = useState(business.signature ?? '');
  const [channel, setChannel] = useState<Channel>(business.defaultChannel);
  const [hours, setHours] = useState<BusinessHours>(business.hours);

  const setDay = (key: keyof BusinessHours, patch: Partial<BusinessHours[keyof BusinessHours]>) =>
    setHours((h) => ({ ...h, [key]: { ...h[key], ...patch } }));

  const save = () => {
    updateBusiness({
      name: name.trim(),
      category: category.trim(),
      number: number.trim() || undefined,
      signature: signature.trim() || undefined,
      defaultChannel: channel,
      hours,
    });
    router.back();
  };

  return (
    <Screen
      header={
        <Header
          title="Business"
          showBack
          right={
            <Pressable onPress={save} hitSlop={10}>
              <Text variant="bodyStrong" color="primary">
                Save
              </Text>
            </Pressable>
          }
        />
      }
    >
      <Input label="Business name" value={name} onChangeText={setName} placeholder="Your business name" />
      <View style={{ height: spacing.lg }} />
      <Input label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Hair Salon" />
      <View style={{ height: spacing.lg }} />
      <Input label="Sending number" value={number} onChangeText={setNumber} placeholder="+1 (415) 555-0142" keyboardType="phone-pad" helper="Messages send from this Relay business number." />
      <View style={{ height: spacing.lg }} />
      <Input label="Signature" value={signature} onChangeText={setSignature} placeholder="— Your business" helper="Appended to outbound messages where used." />

      <SectionHeader title="Default channel" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Chip label="SMS" icon="chatbubble" selected={channel === 'sms'} onPress={() => setChannel('sms')} />
        <Chip label="WhatsApp" icon="logo-whatsapp" selected={channel === 'whatsapp'} onPress={() => setChannel('whatsapp')} />
      </View>

      <SectionHeader title="Business hours" />
      <Card padded={false}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          {DAYS.map((d, i) => {
            const day = hours[d.key];
            const open = !day.closed;
            return (
              <View key={d.key}>
                {i > 0 && <Divider />}
                <View style={{ paddingVertical: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="bodyStrong" style={{ flex: 1 }}>
                      {d.label}
                    </Text>
                    <Toggle value={open} onValueChange={(v) => setDay(d.key, { closed: !v })} />
                  </View>
                  {open && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
                      <Input value={day.open} onChangeText={(t) => setDay(d.key, { open: t })} placeholder="09:00" containerStyle={{ flex: 1 }} />
                      <Text variant="subhead" color="textMuted">to</Text>
                      <Input value={day.close} onChangeText={(t) => setDay(d.key, { close: t })} placeholder="17:00" containerStyle={{ flex: 1 }} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}
