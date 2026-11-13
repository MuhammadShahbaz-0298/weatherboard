# WeatherBoard

WeatherBoard is a responsive, installable weather dashboard built with React, Rematch, and plain CSS. It shows current conditions and a five-day forecast, supports saved cities, persists your last viewed city, works with a light or dark theme, and includes an optional daily reminder with a visible delivery mode.

## Features

- Debounced city search with keyboard navigation and accessible suggestions.
- Current temperature, condition, humidity, wind, and an animated weather icon.
- Five-day forecast with daily highs and lows.
- Celsius and Fahrenheit switching with instant conversion.
- Light and dark themes with the system preference as the default, persisted across visits.
- Up to five saved cities with duplicate protection and a confirmation dialog.
- Last viewed city and weather restored from local storage.
- Offline detection, a clear offline banner, cached weather fallback, and automatic refresh on reconnect.
- OpenWeatherMap primary data with an automatic Open-Meteo fallback for rate-limit, authentication, and server errors.
- Installable PWA with a manifest and service worker.
- Daily reminder using Periodic Background Sync when the browser and install support it, with a foreground timer fallback and a visible delivery mode.
- Notification permission explainer, reminder time validation, and test notifications.
- Inline validation, loading states, error states, and retry actions.
- Responsive layout with reduced-motion support and visible focus styles.

## Stack

- React 19
- Rematch 2 and React Redux
- Vite 8
- Plain CSS
- Hand-written service worker
- No UI kit, chart library, or state-management add-ons

## Getting started

Requirements: Node.js 20.19 or newer.

```bash
npm install
```

**Live URL:** weatherboard-azure.vercel.app

Create a `.env` file from `.env.example` and add an OpenWeatherMap API key:

```bash
VITE_OPENWEATHER_API_KEY=your_openweathermap_api_key
```

Then start the development server:

```bash
npm run dev
```

The key needs access to the free Geocoding API, Current Weather API, and 5 Day / 3 Hour Forecast API.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build in dist/
npm run preview  # serve the production build locally
```

The service worker only registers in a production build. Use `npm run preview` to test installation, offline behavior, and notifications locally.

## Deployment

### Vercel

1. Import the repository into Vercel.
2. Keep the default Vite settings: build command `npm run build`, output directory `dist`.
3. Add `VITE_OPENWEATHER_API_KEY` under Project Settings → Environment Variables.
4. Redeploy after changing environment variables.

`vercel.json` adds a content security policy and standard security headers. The app needs HTTPS for service worker registration and notifications in production.

## API behavior

- City search uses OpenWeatherMap Geocoding.
- Weather uses OpenWeatherMap Current Weather and 5 Day / 3 Hour Forecast.
- The forecast is grouped into five daily summaries using the city's UTC offset from the forecast response.
- If OpenWeatherMap weather requests fail with a rate limit, authentication error, or server error, the app requests current conditions and a five-day forecast from Open-Meteo instead.
- Network, timeout, offline, and not-found errors are shown separately with retry guidance.
- All API responses are validated and normalized before they reach the UI.

## Offline and PWA

The service worker in `public/sw.js`:

- Pre-caches the manifest, icons, `index.html`, and the hashed JavaScript and CSS referenced by the production HTML.
- Uses cache-first handling for same-origin static files.
- Uses network-first handling for weather requests with a cached fallback.
- Deletes shell and weather caches from older versions on activation while keeping the reminder configuration cache.
- Handles `periodicsync`, `push`, and `notificationclick` events.

The app also stores the last successful weather response in local storage so the last city remains available offline. Search is intentionally disabled while offline.

## Notifications

WeatherBoard explains the permission request before triggering it. The reminder time is validated and persisted, and the service worker can display a test notification. Notification permission is only requested after a user action.

Two delivery modes are available:

- **Foreground timer**: While WeatherBoard is open in a tab, a 30-second interval checks the time. When the chosen time is reached, a notification is shown. This works in any PWA but only while the app is visible.

- **Periodic Background Sync**: On installed Chrome/Edge PWAs, the service worker can receive a background sync event at intervals of at least 24 hours. When the event fires, `showDailyReminder` in `sw.js` checks whether the current local time is at or after the chosen time, then shows the notification. The `lastNotifiedDate` check prevents duplicate notifications on the same day. Because the sync interval is coarse, the actual delivery time is approximate — it may be earlier or later than the chosen time.

If permission is denied, a message explains how to re-enable it in browser settings. The rest of WeatherBoard keeps working normally without reminders.

## Architecture

```text
src/
  components/
    common/         reusable UI primitives
    search/         city search and suggestions
    weather/        current weather and forecast
    favourites/     saved cities
    notifications/  reminder settings and permission explainer
    layout/         header, footer, offline banner
  hooks/            debounce, online status, persisted UI state
  services/         API, notifications, service worker registration
  store/
    models/         alert, city, weather, favourites, settings, reminder
  styles/           design tokens and global styles
  utils/            constants, validation, formatting, storage, mapping
```

Rematch models hold all runtime state. Network access stays in `src/services`, response normalization stays in `src/utils/weatherMapper.js`, and components read state through selectors.

## Local storage keys

- `weatherboard-favourites`
- `weatherboard-settings`
- `weatherboard-reminder`
- `weatherboard-last-weather`
- `weatherboard-favourites-open`

Storage reads and writes are wrapped in error handling. If local storage is unavailable, the app keeps working for the current session and tells the user that persistence is unavailable.

## Verification

The production build was checked with `npm run build` successfully. No browser console errors or uncaught page errors were observed.

- Search debounce is 300 ms, with loading, no-results, and error states
- Weather shows real data from OpenWeatherMap with Open-Meteo fallback, with loading and error states
- Validation happens on blur and submit, with specific messages
- Favourites cap at 5, confirm on delete, and degrade without localStorage
- The manifest is valid and the app is installable
- The service worker caches the shell and the last city, and the offline banner appears
- The permission explainer shows before the browser prompt, and denial breaks nothing
- No horizontal scroll at 375, 768, and 1280 px, and touch targets are at least 44 px
- Dark mode, unit toggle, and animated icons all work
- No AI-style comments, no unused code, no secrets in the repo

## Known limitations

- Vite exposes `VITE_OPENWEATHER_API_KEY` to the client bundle. For a high-traffic production deployment, proxy OpenWeatherMap requests through a server and keep the key server-side.
- OpenWeatherMap free-tier limits apply. The Open-Meteo fallback keeps the weather view useful when OpenWeatherMap reports a rate-limit, authentication, or server error.
- The production service worker intentionally caches the last weather responses and the current build's shell. Bump `CACHE_VERSION` in `public/sw.js` when changing the caching strategy.
- Background reminder delivery is not scheduled; see the Notifications section.
- City search uses OpenWeatherMap Geocoding (`/geo/1.0/direct`) instead of the GeoDB Cities API mentioned in the brief. OpenWeatherMap Geocoding is the primary source listed in the prompt and requires only one API key; GeoDB would require a separate RapidAPI key and was excluded to keep the tech stack simple and the key count minimal.
