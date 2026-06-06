import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Thin haptics wrapper — no-ops on web so calls can stay unconditional. */
export const haptic = {
  light: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  success: () => {
    if (Platform.OS !== 'web')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning: () => {
    if (Platform.OS !== 'web')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  selection: () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  },
};
