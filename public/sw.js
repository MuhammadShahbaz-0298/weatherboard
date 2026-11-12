const CACHE_VERSION = 'v4';
const SHELL_CACHE = `weatherboard-shell-${CACHE_VERSION}`;
const WEATHER_CACHE = `weatherboard-weather-${CACHE_VERSION}`;
const REMINDER_CACHE = 'weatherboard-reminder-v1';
const REMINDER_CONFIG_URL = '/__weatherboard-reminder-config__';
const REMINDER_SYNC_TAG = 'weatherboard-daily-reminder';
const REMINDER_NOTIFICATION_TAG = 'weatherboard-reminder';
const FRESH_WEATHER_MS = 12 * 60 * 60 * 1000;
const SHELL_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png'
];

async function cacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  await cache.addAll(SHELL_ASSETS);

  const indexResponse = await fetch('/index.html', { cache: 'reload' });
  if (!indexResponse.ok) {
    throw new Error('Could not cache the app shell.');
  }

  const html = await indexResponse.clone().text();
  await cache.put('/index.html', indexResponse);

  const assetUrls = new Set();
  const assetPattern = /(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g;
  let match = assetPattern.exec(html);
  while (match) {
    assetUrls.add(match[1]);
    match = assetPattern.exec(html);
  }

  await Promise.all(
    [...assetUrls].map(async (assetUrl) => {
      try {
        const assetResponse = await fetch(assetUrl, { cache: 'reload' });
        if (assetResponse.ok) {
          await cache.put(assetUrl, assetResponse);
        }
      } catch (err) {
        return;
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== SHELL_CACHE && key !== WEATHER_CACHE && key !== REMINDER_CACHE) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

function isWeatherRequest(url) {
  if (url.hostname === 'api.openweathermap.org') {
    return !url.pathname.startsWith('/geo/1.0/');
  }
  return url.hostname === 'api.open-meteo.com';
}

function getWeatherCacheKey(url) {
  const params = new URLSearchParams(url.search);
  params.delete('appid');
  const keyUrl =
    `${self.location.origin}/__weather-cache__/` +
    `${encodeURIComponent(url.hostname)}${url.pathname}?${params.toString()}`;
  return new Request(keyUrl);
}

async function handleWeatherRequest(request, url) {
  const cacheKey = getWeatherCacheKey(url);
  const cache = await caches.open(WEATHER_CACHE);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
    throw err;
  }
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match('/index.html');
    if (cached) {
      return cached;
    }
    const root = await caches.match('/');
    if (root) {
      return root;
    }
    throw err;
  }
}

async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(SHELL_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (isWeatherRequest(url)) {
    event.respondWith(handleWeatherRequest(request, url));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(handleStatic(request));
  }
});

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  } catch (err) {
    return;
  }
}

function buildReminderBody(config) {
  const weatherText =
    config && typeof config.weatherText === 'string' ? config.weatherText.trim() : '';
  const freshWeather =
    config &&
    typeof config.weatherUpdatedAt === 'number' &&
    Date.now() - config.weatherUpdatedAt < FRESH_WEATHER_MS;

  if (weatherText && freshWeather) {
    return `${weatherText} Open WeatherBoard for the full forecast.`;
  }
  return 'Your daily weather reminder is ready. Open WeatherBoard for the latest forecast.';
}

function isTimeReached(configTime) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = parseInt(configTime.slice(0, 2)) * 60 + parseInt(configTime.slice(3, 5));
  return nowMinutes >= targetMinutes;
}

async function showDailyReminder() {
  const config = await readReminderConfig();
  if (!config || config.enabled !== true) {
    return;
  }

  const today = formatLocalDate(new Date());
  if (config.lastNotifiedDate === today) {
    return;
  }

  if (!isTimeReached(config.time)) {
    return;
  }

  try {
    await self.registration.showNotification('WeatherBoard daily reminder', {
      body: buildReminderBody(config),
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: REMINDER_NOTIFICATION_TAG,
      data: { url: '/' }
    });
  } catch (err) {
    return;
  }

  const latest = (await readReminderConfig()) || config;
  await writeReminderConfig({
    ...latest,
    lastNotifiedDate: today,
    lastNotifiedAt: Date.now()
  });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === REMINDER_SYNC_TAG) {
    event.waitUntil(showDailyReminder());
  }
});

self.addEventListener('push', (event) => {
  let title = 'WeatherBoard';
  let body = 'Your daily weather reminder is ready.';
  let targetUrl = '/';

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload && typeof payload.title === 'string') {
        title = payload.title;
      }
      if (payload && typeof payload.body === 'string') {
        body = payload.body;
      }
      if (payload && typeof payload.url === 'string') {
        targetUrl = payload.url;
      }
    } catch (err) {
      body = 'Your daily weather reminder is ready.';
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'weatherboard-reminder',
      data: { url: targetUrl }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data && typeof event.notification.data.url === 'string'
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin)) {
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
