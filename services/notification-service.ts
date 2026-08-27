import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { AlertPreferences, Product } from '@/types/dropdex';

const DROP_CATEGORY = 'dropalert';
const OPEN_ACTION = 'openproduct';
const ACKNOWLEDGE_ACTION = 'acknowledge';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldPlaySound: notification.request.content.sound !== undefined,
    shouldSetBadge: true,
    shouldShowBanner: notification.request.content.data?.soundOnly !== true,
    shouldShowList: notification.request.content.data?.soundOnly !== true,
  }),
});

/** Web unlocks AudioContext/speech from a gesture; native needs no unlock. */
export async function unlockAlertAudio() {}

export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('drop-alerts', {
      name: 'Drop alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 100, 250, 100, 500],
      lightColor: '#D20D1E',
      sound: 'default',
    });
  }

  await Notifications.setNotificationCategoryAsync(DROP_CATEGORY, [
    {
      identifier: OPEN_ACTION,
      buttonTitle: 'Open product',
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACKNOWLEDGE_ACTION,
      buttonTitle: 'Acknowledge',
      options: { opensAppToForeground: false },
    },
  ]);
}

export async function getExpoPushToken(): Promise<string | undefined> {
  if (!Device.isDevice) return undefined;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    status = (
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      })
    ).status;
  }

  if (status !== 'granted') return undefined;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) return undefined;

  // Token creation can briefly fail while APNs/FCM registration settles.
  // Retry before registering the installation without remote alerts.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 750 * 2 ** attempt));
      }
    }
  }

  return undefined;
}

export async function deliverProductAlert(product: Product, settings: AlertPreferences) {
  const tasks: Promise<unknown>[] = [];

  if (settings.push || settings.sound) {
    tasks.push(
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'DROP DETECTED',
          body: product.title,
          sound: settings.sound ? 'default' : undefined,
          badge: 1,
          categoryIdentifier: DROP_CATEGORY,
          data: {
            product,
            productId: product.id,
            source: 'dropdex-local',
            url: product.url,
            soundOnly: !settings.push,
          },
        },
        trigger: null,
      }),
    );
  }

  if (settings.vibration) {
    tasks.push(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }

  if (settings.speech) {
    Speech.stop();
    Speech.speak(`Drop detected. ${product.title}`, {
      rate: 0.92,
      pitch: 0.9,
      volume: 1,
    });
  }

  await Promise.allSettled(tasks);
}

export async function stopAlertSignals() {
  Speech.stop();
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

export function subscribeToIncomingProductAlerts(onProduct: (product: Product) => void) {
  const readProduct = (notification: Notifications.Notification) => {
    const product = notification.request.content.data?.product as Product | undefined;
    if (
      product &&
      typeof product.id === 'string' &&
      typeof product.title === 'string' &&
      typeof product.url === 'string'
    ) {
      return product;
    }
    return undefined;
  };

  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    // A local notification is emitted by processProduct after the in-app
    // alert already exists. Processing it again would duplicate the alert.
    if (notification.request.content.data?.source === 'dropdex-local') return;
    const product = readProduct(notification);
    if (product) onProduct(product);
  });

  const handleResponse = async (response: Notifications.NotificationResponse) => {
    if (response.actionIdentifier === ACKNOWLEDGE_ACTION) {
      await Notifications.dismissNotificationAsync(
        response.notification.request.identifier,
      ).catch(() => undefined);
      await Notifications.setBadgeCountAsync(0).catch(() => undefined);
      return;
    }

    const product = readProduct(response.notification);
    if (product) onProduct(product);
    await Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
  };

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(handleResponse);

  // Handles a notification that launched the app from a terminated state.
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) return handleResponse(response);
    })
    .catch(() => undefined);

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
