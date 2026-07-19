// ---------------------------------------------------------------------------
// Notification permission + delivery. Web push without a server can't wake a
// closed tab, so v1 fires notifications while the app is open or backgrounded
// via the service worker registration (falling back to the Notification API).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';

type Perm = NotificationPermission | 'unsupported';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<Perm>(() =>
    notificationsSupported() ? Notification.permission : 'unsupported',
  );

  const request = useCallback(async () => {
    if (!notificationsSupported()) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  useEffect(() => {
    if (notificationsSupported()) setPermission(Notification.permission);
  }, []);

  return { permission, request, supported: notificationsSupported() };
}

export async function showNotification(
  title: string,
  options: NotificationOptions & { tag: string },
): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const opts: NotificationOptions = {
    icon: '/icons/pwa-192.png',
    badge: '/icons/pwa-192.png',
    ...options,
  };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, opts);
      return;
    }
  } catch {
    // fall through
  }
  try {
    new Notification(title, opts);
  } catch {
    // Some browsers only allow SW notifications; ignore.
  }
}
