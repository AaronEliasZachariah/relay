/* eslint-disable @typescript-eslint/no-var-requires */

// Persisted store → in-memory AsyncStorage.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Haptics are no-ops in tests.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

// Render gradients / blur as plain views.
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));
jest.mock('expo-blur', () => ({ BlurView: require('react-native').View }));

// Icon fonts → text stand-ins (avoids the expo-font/expo-asset native chain).
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name }) => React.createElement(Text, null, name);
  return new Proxy({}, { get: () => Icon });
});

// Router — hooks return no-op fns; layout components render nothing.
jest.mock('expo-router', () => {
  const React = require('react');
  const passthrough = ({ children }) => children ?? null;
  const Nav = Object.assign(passthrough, { Screen: () => null });
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn() }),
    useLocalSearchParams: () => globalThis.__expoParams ?? {},
    usePathname: () => '/',
    Link: passthrough,
    Redirect: () => null,
    Stack: Nav,
    Tabs: Nav,
  };
});
