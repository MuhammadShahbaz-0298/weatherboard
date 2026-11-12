import {
  FOREGROUND_CHECK_INTERVAL_MS,
  REMINDER_CACHE,
  REMINDER_CONFIG_URL,
  REMINDER_NOTIFICATION_TAG,
  REMINDER_SYNC_MIN_INTERVAL,
  REMINDER_SYNC_TAG
} from '../utils/constants';
import {
  convertTemperature,
  formatCityLabel,
  temperatureUnitLabel
} from '../utils/formatters';
import { getNotificationPermission, isServiceWorkerSupported } from './notificationService';

const FRESH_WEATHER_MS = 12 * 60 * 60 * 1000;

let activeConfig = null;
let timerId = null;
let checking = false;
let writeQueue = Promise.resolve();

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseReminderTime(time) {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const [hours, minutes] = time.split(':').map(Number);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function isAtOrAfterReminderTime(time, now = new Date()) {
  const target = parseReminderTime(time);
  if (target === null) {
    return false;
  }
  return now.getHours() * 60 + now.getMinutes() >= target;
}

function hasFreshWeather(config) {
  return (
    config &&
    typeof config.weatherUpdatedAt === 'number' &&
    Date.now() - config.weatherUpdatedAt < FRESH_WEATHER_MS
  );
}

export function buildReminderBody(config) {
  const weatherText =
    config && typeof config.weatherText === 'string' ? config.weatherText.trim() : '';
  if (weatherText && hasFreshWeather(config)) {
    return `${weatherText} Open WeatherBoard for the full forecast.`;
  }
  return 'Your daily weather reminder is ready. Open WeatherBoard for the latest forecast.';
}

async function readReminderConfig() {
  try {
    const cache = await caches.open(REMINDER_CACHE);
    const response = await cache.match(REMINDER_CONFIG_URL);
    if (!response) {
      return null;
    }
    const data = await response.json();
    return data && typeof data === 'object' ? data : null;
  } catch (err) {
    return null;
  }
}

async function writeReminderConfig(config) {
  try {
    const cache = await caches.open(REMINDER_CACHE);
    await cache.put(
      REMINDER_CONFIG_URL,
      new Response(JSON.stringify(config), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    activeConfig = config;
    return true;
  } catch (err) {
    activeConfig = config;
    return false;
  }
}

function updateReminderConfig(updater) {
  const run = writeQueue.then(async () => {
    const existing = (await readReminderConfig()) || activeConfig || {};
    const next = updater(existing);
    const saved = await writeReminderConfig(next);
    return { config: next, saved };
  });

  writeQueue = run.catch(() => undefined);
  return run;
}

async function getActiveRegistration() {
  if (!isServiceWorkerSupported() || !import.meta.env.PROD) {
    return null;
  }

  const existing = await navigator.serviceWorker.getRegistration();
  if (existing && existing.active) {
    return existing;
  }

  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 3000);

    navigator.serviceWorker.ready
      .then((registration) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(registration);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(null);
        }
      });
  });
}

async function tryRegisterPeriodicSync() {
  const registration = await getActiveRegistration();
  if (!registration) {
    return {
      mode: 'foreground',
      detail: 'The service worker is not active in this build.'
    };
  }

  if (!('periodicSync' in registration)) {
    return {
      mode: 'foreground',
      detail: 'Periodic Background Sync is unavailable in this browser.'
    };
  }

  try {
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (status.state === 'denied') {
      return {
        mode: 'foreground',
        detail: 'Background sync permission is blocked.'
      };
    }
  } catch (err) {
    return {
      mode: 'foreground',
      detail: 'Periodic Background Sync is unavailable in this browser.'
    };
  }

  try {
    await registration.periodicSync.register(REMINDER_SYNC_TAG, {
      minInterval: REMINDER_SYNC_MIN_INTERVAL
    });
    return { mode: 'periodic', detail: '' };
  } catch (err) {
    return {
      mode: 'foreground',
      detail:
        err && err.name === 'NotAllowedError'
          ? 'Periodic Background Sync is unavailable for this install.'
          : 'Background sync could not be registered.'
    };
  }
}

async function unregisterPeriodicSync() {
  const registration = await getActiveRegistration();
  if (!registration || !('periodicSync' in registration)) {
    return;
  }

  try {
    const tags = await registration.periodicSync.getTags();
    if (tags.includes(REMINDER_SYNC_TAG)) {
      await registration.periodicSync.unregister(REMINDER_SYNC_TAG);
    }
  } catch (err) {
    return;
  }
}

async function showReminderNotification(body) {
  const registration = await getActiveRegistration();
  if (!registration || typeof registration.showNotification !== 'function') {
    throw new Error('Reminder notifications need an active service worker.');
  }

  await registration.showNotification('WeatherBoard daily reminder', {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: REMINDER_NOTIFICATION_TAG,
    data: { url: '/' }
  });
}

async function checkForegroundReminder() {
  if (checking) {
    return;
  }
  checking = true;

  try {
    if (getNotificationPermission() !== 'granted') {
      return;
    }

    const stored = await readReminderConfig();
    const config = stored || activeConfig;
    if (!config || config.enabled !== true) {
      return;
    }

    const now = new Date();
    if (!isAtOrAfterReminderTime(config.time, now)) {
      return;
    }

    const today = formatLocalDate(now);
    if (config.lastNotifiedDate === today) {
      return;
    }

    await showReminderNotification(buildReminderBody(config));

    const latest = (await readReminderConfig()) || config;
    await updateReminderConfig((current) => ({
      ...(latest || current),
      lastNotifiedDate: today,
      lastNotifiedAt: Date.now()
    }));
  } catch (err) {
    return;
  } finally {
    checking = false;
  }
}

function handleFocus() {
  checkForegroundReminder();
}

function handleVisibility() {
  if (document.visibilityState === 'visible') {
    checkForegroundReminder();
  }
}

function stopForegroundTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
  document.removeEventListener('visibilitychange', handleVisibility);
  window.removeEventListener('focus', handleFocus);
}

function startForegroundTimer() {
  stopForegroundTimer();
  timerId = window.setInterval(checkForegroundReminder, FOREGROUND_CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('focus', handleFocus);
  checkForegroundReminder();
}

export async function configureReminderSync({ enabled, time, suppressToday = false }) {
  const today = formatLocalDate(new Date());
  const result = await updateReminderConfig((existing) => {
    const next = {
      ...existing,
      enabled: enabled === true,
      time,
      updatedAt: Date.now()
    };
    if (next.enabled && suppressToday) {
      next.lastNotifiedDate = today;
    }
    return next;
  });

  if (!result.config.enabled) {
    stopForegroundTimer();
    await unregisterPeriodicSync();
    return { mode: 'off', detail: '' };
  }

  const periodic = await tryRegisterPeriodicSync();
  if (periodic.mode === 'periodic' && result.saved) {
    stopForegroundTimer();
    return periodic;
  }

  if (periodic.mode === 'periodic' && !result.saved) {
    await unregisterPeriodicSync();
    startForegroundTimer();
    return {
      mode: 'foreground',
      detail: 'Reminder settings could not be stored for background delivery.'
    };
  }

  await unregisterPeriodicSync();
  startForegroundTimer();
  return periodic;
}

export async function updateReminderWeather({ city, current, unit, updatedAt }) {
  if (!city || !current) {
    return;
  }

  const weatherText =
    `${formatCityLabel(city)}: ` +
    `${Math.round(convertTemperature(current.temperature, unit))}` +
    `${temperatureUnitLabel(unit)}, ${current.condition}.`;

  await updateReminderConfig((existing) => ({
    ...existing,
    weatherText,
    weatherUpdatedAt: updatedAt || Date.now(),
    updatedAt: Date.now()
  }));
}
