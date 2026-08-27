import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PreferredDevice } from '@/components/notification-setup-guide';

export const PREFERRED_DEVICE_KEY = '@droplinq/preferred-device';
/** Set after the post-terms phone/desktop prompt finishes (or is skipped). */
export const DEVICE_PROMPT_DONE_KEY = '@droplinq/device-prompt-done';

export type { PreferredDevice };

let devicePromptDoneMemory = false;
const listeners = new Set<(done: boolean) => void>();

export function isDevicePromptDoneMemory() {
  return devicePromptDoneMemory;
}

export function subscribeDevicePromptDone(listener: (done: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function markDevicePromptDone() {
  devicePromptDoneMemory = true;
  listeners.forEach((listener) => listener(true));
  await AsyncStorage.setItem(DEVICE_PROMPT_DONE_KEY, '1');
}
