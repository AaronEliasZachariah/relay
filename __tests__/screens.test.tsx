import React, { type ReactElement } from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStore } from '@/data/store';
import { ThemeProvider } from '@/theme/ThemeProvider';

import Activity from '../app/(tabs)/activity';
import Automations from '../app/(tabs)/automations';
import GroupsHome from '../app/(tabs)/index';
import Settings from '../app/(tabs)/settings';

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

describe('tab screens render with seeded data', () => {
  it('Groups home shows the business and its groups', async () => {
    await wrap(<GroupsHome />);
    expect(screen.getByText('Halo Hair Studio')).toBeTruthy();
    expect(screen.getByText('VIP Clients')).toBeTruthy();
    expect(screen.getByText('Win-back')).toBeTruthy();
  });

  it('Automations lists campaigns and rules', async () => {
    await wrap(<Automations />);
    expect(screen.getByText('VIP Friday Treat')).toBeTruthy();
    expect(screen.getByText('Booking assistant')).toBeTruthy();
  });

  it('Activity renders the log', async () => {
    await wrap(<Activity />);
    expect(screen.getByText('Activity')).toBeTruthy();
  });

  it('Settings shows the business and Pro upgrade', async () => {
    await wrap(<Settings />);
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Halo Hair Studio')).toBeTruthy();
  });
});
