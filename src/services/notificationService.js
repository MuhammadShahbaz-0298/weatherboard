export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isServiceWorkerSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.requestPermission();
}

export async function showTestNotification() {
  if (!isNotificationSupported() || !isServiceWorkerSupported()) {
    throw new Error('This browser does not support notifications with a service worker.');
  }
  if (Notification.permission !== 'granted') {
    throw new Error('Enable notifications before sending a test notification.');
  }

  const activeRegistration = await navigator.serviceWorker.getRegistration();
  if (!activeRegistration) {
    throw new Error('Test notifications need the production build. Run npm run build and npm run preview.');
  }

  const registration = await navigator.serviceWorker.ready;
  if (!registration || typeof registration.showNotification !== 'function') {
    throw new Error('This browser cannot show notifications from the installed app.');
  }

  await registration.showNotification('WeatherBoard', {
    body: 'Test notification sent. Notifications are working in this browser.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'weatherboard-test'
  });
}
