import { useState, useEffect } from "react";

const BASE = "/api";

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/push/vapid-public-key`);
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    return data.publicKey ?? null;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeUser(registration: ServiceWorkerRegistration, vapidPublicKey: string): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });
    return subscription;
  } catch {
    return null;
  }
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const subJson = subscription.toJSON();
  await fetch(`${BASE}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subJson.keys?.["p256dh"] ?? "",
        auth: subJson.keys?.["auth"] ?? "",
      },
    }),
  });
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;

    const result = await Notification.requestPermission();
    setPermission(result as PushPermission);

    if (result !== "granted") return false;

    try {
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await subscribeUser(registration, vapidKey);
      if (!subscription) return false;

      await sendSubscriptionToServer(subscription);
      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    }
  };

  const unsubscribe = async (): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch(`${BASE}/push/subscribe`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch {
      // ignore
    }
  };

  return { permission, isSubscribed, requestPermission, unsubscribe };
}
