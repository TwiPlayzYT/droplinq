import type { WebPushSubscriptionPayload } from './monitor-service';

export type WebPushState =
  | 'checking'
  | 'install-required'
  | 'ready'
  | 'subscribed'
  | 'denied'
  | 'unsupported'
  | 'error';

export async function registerWebServiceWorker() {
  return undefined;
}

export async function getWebPushState(): Promise<WebPushState> {
  return 'unsupported';
}

export async function getExistingWebPushSubscription(): Promise<
  WebPushSubscriptionPayload | undefined
> {
  return undefined;
}

export async function subscribeToWebPush(
  _vapidPublicKey: string,
): Promise<WebPushSubscriptionPayload> {
  throw new Error('Web Push is only available in the web app.');
}
