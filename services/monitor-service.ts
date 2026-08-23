import {
  AlertPreferences,
  FilterPreferences,
  Product,
  RegionId,
} from '@/types/dropdex';

export type WebPushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export type MonitorRegistration = {
  installationId: string;
  enabled: boolean;
  region: RegionId;
  expoPushToken?: string;
  webPushSubscription?: WebPushSubscriptionPayload;
  filters: FilterPreferences;
  alerts: AlertPreferences;
};

export interface MonitorService {
  register(registration: MonitorRegistration): Promise<void>;
  getWebPushPublicKey(): Promise<string | undefined>;
  reportObservations(products: Product[]): Promise<void>;
}

class RemoteMonitorService implements MonitorService {
  constructor(private readonly baseUrl: string) {}

  async register(registration: MonitorRegistration) {
    const response = await fetch(`${this.baseUrl}/v1/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Monitor registration failed (${response.status}) ${detail}`.trim());
    }
  }

  async getWebPushPublicKey() {
    const response = await fetch(`${this.baseUrl}/v1/web-push/config`);
    if (!response.ok) throw new Error(`Web Push configuration failed (${response.status})`);
    const config = (await response.json()) as { enabled?: boolean; publicKey?: string };
    return config.enabled && typeof config.publicKey === 'string' ? config.publicKey : undefined;
  }

  async reportObservations(products: Product[]) {
    const response = await fetch(`${this.baseUrl}/v1/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'expo-go-device',
        products,
        complete: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Observation sync failed (${response.status})`);
    }
  }
}

class DevelopmentMonitorService implements MonitorService {
  async register() {}
  async getWebPushPublicKey() {
    return undefined;
  }
  async reportObservations() {}
}

const apiUrl =
  process.env.EXPO_PUBLIC_MONITOR_API_URL ??
  (typeof window !== 'undefined' ? window.location.origin : undefined);

export const remoteMonitorConfigured = Boolean(apiUrl);

export const monitorService: MonitorService = apiUrl
  ? new RemoteMonitorService(apiUrl.replace(/\/$/, ''))
  : new DevelopmentMonitorService();
