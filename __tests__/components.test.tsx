import React, { type ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { ThemeProvider } from '@/theme/ThemeProvider';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// RNTL v14: render is async.
const wrap = (ui: ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );

describe('design-system primitives', () => {
  it('Text renders its children', async () => {
    await wrap(<Text>Hello world</Text>);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('Button fires onPress', async () => {
    const onPress = jest.fn();
    await wrap(<Button label="Tap me" onPress={onPress} />);
    await fireEvent.press(screen.getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Button does not fire when disabled', async () => {
    const onPress = jest.fn();
    await wrap(<Button label="Nope" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByText('Nope'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('Badge shows its label', async () => {
    await wrap(<Badge label="New" tone="primary" />);
    expect(screen.getByText('New')).toBeTruthy();
  });

  it('Avatar renders initials from a name', async () => {
    await wrap(<Avatar name="Sarah Mitchell" />);
    expect(screen.getByText('SM')).toBeTruthy();
  });

  it('Avatar renders an emoji glyph for groups', async () => {
    await wrap(<Avatar emoji="💎" accent="#8B5CF6" />);
    expect(screen.getByText('💎')).toBeTruthy();
  });

  it('Chip fires onPress', async () => {
    const onPress = jest.fn();
    await wrap(<Chip label="All" selected onPress={onPress} />);
    await fireEvent.press(screen.getByText('All'));
    expect(onPress).toHaveBeenCalled();
  });
});
