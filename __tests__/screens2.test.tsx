import React, { type ReactElement } from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStore } from '@/data/store';
import { ThemeProvider } from '@/theme/ThemeProvider';

import AutoReply from '../app/automation/reply';
import AutoSend from '../app/automation/send';
import Business from '../app/business';
import GroupDetail from '../app/group/[id]';
import GroupNew from '../app/group/new';
import KnowledgeEdit from '../app/knowledge-edit';
import Knowledge from '../app/knowledge';
import Onboarding from '../app/onboarding';
import Premium from '../app/premium';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const wrap = (ui: ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

beforeEach(() => {
  useStore.getState().resetDemo();
});
afterEach(() => {
  delete (globalThis as { __expoParams?: unknown }).__expoParams;
});

describe('detail, editor & modal screens render', () => {
  it('Onboarding', async () => {
    await wrap(<Onboarding />);
    expect(screen.getByText('Relay')).toBeTruthy();
    expect(screen.getByText('Get started')).toBeTruthy();
  });

  it('Premium paywall', async () => {
    await wrap(<Premium />);
    expect(screen.getByText('Relay Pro')).toBeTruthy();
  });

  it('Group detail (with a real group id)', async () => {
    const g = useStore.getState().groups[0]!;
    (globalThis as { __expoParams?: unknown }).__expoParams = { id: g.id };
    await wrap(<GroupDetail />);
    expect(screen.getAllByText(g.name).length).toBeGreaterThan(0);
  });

  it('New group editor', async () => {
    await wrap(<GroupNew />);
    expect(screen.getByText('New group')).toBeTruthy();
  });

  it('New auto-send editor', async () => {
    await wrap(<AutoSend />);
    expect(screen.getByText('New auto-send')).toBeTruthy();
  });

  it('New auto-reply editor', async () => {
    await wrap(<AutoReply />);
    expect(screen.getByText('New auto-reply')).toBeTruthy();
  });

  it('Business editor', async () => {
    await wrap(<Business />);
    expect(screen.getByText('Business')).toBeTruthy();
  });

  it('Knowledge base list', async () => {
    await wrap(<Knowledge />);
    expect(screen.getByText('Knowledge base')).toBeTruthy();
  });

  it('New knowledge document editor', async () => {
    await wrap(<KnowledgeEdit />);
    expect(screen.getByText('New document')).toBeTruthy();
  });
});
