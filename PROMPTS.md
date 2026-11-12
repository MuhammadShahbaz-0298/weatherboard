# PROMPTS.md

**IDE used:** OpenCode

Prompts are listed in the order I sent them. Prompt 1 is the full master prompt. The agent asked questions at two points, and my answers are prompts 4 and 5.

---

## Prompt 1: Master prompt

````markdown
# WeatherBoard: Master Prompt

You are building **WeatherBoard**, a responsive, installable weather dashboard, for a frontend hiring challenge. It must feel like a polished consumer product, not a tutorial project. Read this whole prompt before writing any code.

---

## 1. Tech Stack (fixed)

- React with `.jsx` and `.js` files only. No TypeScript.
- Vite as the build tool.
- Redux through **Rematch** (`@rematch/core` and `react-redux`), using the exact model style shown in section 4.
- Plain CSS files (one per component, plus one global file for variables). No CSS framework.
- Native `fetch` wrapped in one small request helper.
- The service worker is written by hand in `public/sw.js`.
- Environment: one variable only, `VITE_OPENWEATHER_API_KEY`, read with `import.meta.env`. Use exactly this name.

**Stop and ask me before adding anything not listed above.** That includes any npm package, any server, any serverless function, any cron job, any paid service. Do not decide this yourself. Do not install "just one small library".

---

## 2. Rules That Must Never Be Broken

1. **Easy code.** No clever or high-level patterns. A beginner must be able to read every file. Prefer plain `if`, `map`, and `async/await`. No nested ternaries, no reduce chains, no advanced generics, no render props, no HOCs.
2. **Everything reusable.** If a feature is needed later, I should be able to copy an existing file and change a few names. Build small generic pieces (Button, Input, Modal, Banner, Spinner, Card, request helper, storage helper, validators, debounce hook) and reuse them everywhere. Never copy-paste logic inside the app. Extract it.
3. **No mess.** One responsibility per file. Short files. Clear names. Consistent folder structure. No dead code, no unused imports, no leftover console logs.
4. **No AI-style comments.** No "// This function does X", no section banners, no emoji, no explanations of obvious code. Write self-explaining names instead. A comment is allowed only for a non-obvious reason (for example, why a browser workaround exists), and at most one line.
5. **Secure.**
   - API keys live in `.env` (Vite `VITE_` variables). Commit `.env.example` with empty values. `.env` is in `.gitignore`.
   - Never use `dangerouslySetInnerHTML`, `eval`, or `innerHTML`.
   - Encode every user value placed in a URL with `encodeURIComponent`.
   - Trim and length-limit all text input.
   - Validate and shape every API response before using it. Never assume fields exist.
   - Parse localStorage with try/catch and check the shape of what comes back.
   - Add security headers for the deploy target (`vercel.json` or `netlify.toml`): Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, X-Frame-Options.
   - Be honest in the README that a client-only app exposes its API keys in the bundle, and say how this is reduced (key restrictions, free-tier keys only).
6. **Redux (Rematch) for all shared state**, in exactly the style of section 4. Local UI state (an open modal, a typed input value) may stay in `useState`.

---

## 3. Folder Structure

```
src/
  components/
    common/        Button, Input, Modal, Banner, Spinner, Card, EmptyState, Toggle
    search/        SearchBar, SuggestionList
    weather/       CurrentWeather, ForecastList, ForecastDay, WeatherIcon
    favourites/    FavouritesPanel, FavouriteButton
    notifications/ ReminderSettings, PermissionExplainer
    layout/        Header, Footer, OfflineBanner
  hooks/           useDebounce, useOnlineStatus, useStorage
  store/
    index.js
    models/        city.js, weather.js, favourites.js, settings.js, reminder.js, alert.js
  services/        request.js, geoService.js, weatherService.js, notificationService.js
  utils/           validators.js, storage.js, formatters.js, constants.js, weatherMapper.js
  styles/          variables.css, global.css
  App.jsx
  main.jsx
public/
  sw.js
  manifest.webmanifest
  icons/           icon-192.png, icon-512.png, plus a maskable icon
```

Each model lives in its own file. Each service holds only API calls. Components never call `fetch` directly.

---

## 4. Redux Reference (follow this exact structure)

Every model has `state`, `reducers`, and `effects`, written like this:

```js
const favourites = {
  state: {
    list: [],
    success: '',
    error: '',
    loading: false
  },
  reducers: {
    setList(state, payload) {
      return { ...state, list: payload };
    },
    setSuccess(state, payload) {
      return { ...state, success: payload };
    },
    setError(state, payload) {
      return { ...state, error: payload };
    },
    setLoading(state, payload) {
      return { ...state, loading: payload };
    }
  },
  effects: (dispatch) => {
    return {
      async loadFavourites() {
        this.setLoading(true);
        this.resetMessages();
        try {
          const list = readStorage('favourites', []);
          this.setList(list);
        } catch (err) {
          this.setError(err.message || 'Could not load your saved cities.');
          dispatch.alert.error({ msg: err.message });
        } finally {
          this.setLoading(false);
        }
      },
      resetMessages() {
        this.setSuccess('');
        this.setError('');
      }
    };
  }
};

export default favourites;
```

Rules for every model:

- Reducers are one-liners that set one field, named `setSomething`.
- Effects call `this.setSomething(...)` and `dispatch.otherModel.effect(...)`.
- Every effect that does async work uses `try / catch / finally`, sets loading on and off, and calls `this.resetMessages()` first.
- In a `catch`, only use the caught `err`. Never read a variable that is declared inside the `try` block.
- Show feedback to the user through a shared `alert` model (`dispatch.alert.success({ msg })` and `dispatch.alert.error({ msg })`).
- Every model exposes `resetMessages()`.

---

## 5. Features (all are required)

### 01. City Search with Autocomplete
- Use **OpenWeatherMap's Geocoding API** (`/geo/1.0/direct` with `q` and `limit=5`) with the same key as the weather calls. Do not use GeoDB or RapidAPI. The key comes from `.env`.
- Suggestions appear within 300 ms of the user pausing. Use a reusable `useDebounce` hook set to 300 ms.
- Do not fire a request for fewer than 2 characters. Cancel or ignore stale responses so old results never overwrite new ones. The free tier is rate limited, so handle HTTP 429 with a clear message.
- Show a loading indicator inside the suggestion list while fetching.
- Show a visible **no results** state ("No city found for 'xyz'. Check the spelling or try a nearby larger city.").
- Show a visible **API error** state that says what failed and offers a Retry button.
- Support keyboard use: arrow keys, Enter to select, Escape to close. Add proper ARIA (`role="combobox"`, `aria-expanded`, `role="listbox"`).
- Selecting a city loads its weather.

### 02. Weather Data Display
- Primary source: **OpenWeatherMap** (current weather and 5-day forecast). Use latitude and longitude from the selected city.
- Fallback source: **Open-Meteo** (no key). Switch to it automatically when OpenWeatherMap fails with a rate limit (429), an auth error, or a server error. Tell the user quietly when the fallback is in use.
- Show current temperature, humidity, wind speed, and a condition icon with a text label.
- Show a 5-day forecast. OpenWeatherMap returns 3-hour steps, so group them by day in `weatherMapper.js` and pick min and max temperature and a representative condition per day.
- Map both APIs into **one common shape** in `weatherMapper.js`, so components never know which API supplied the data.
- Data must be real. No mocked or hardcoded weather.
- Every fetch has a loading state (skeleton or spinner) and a specific error message with a retry action.

### 03. Form Validation
- All validation functions live in `utils/validators.js` and are reusable (`validateRequired`, `validateMinLength`, `validateTime`, and so on). Each returns an error string or an empty string.
- Every input validates **on blur** and on submit, and shows an inline error under the field with `aria-describedby`.
- Handle at least: empty city field, city not selected from suggestions, API returning no results, network failure, invalid reminder time.
- Error messages say what failed and what the user can do. Never use "Something went wrong".
- Distinguish error causes: offline, rate limited, invalid key, server down, and city not found. Each gets its own message.

### 04. Favourite Cities
- Save up to **5** favourites in localStorage across sessions, using the reusable `utils/storage.js` helper.
- Quick-access panel: clicking a favourite loads its weather.
- Adding a sixth shows a clear message ("You can save up to 5 cities. Remove one to add another."). Block duplicates.
- Removing a favourite opens a reusable confirmation Modal. It must be focus-trapped and closable with Escape.
- If localStorage is unavailable (private mode, blocked, quota full), the app keeps working with in-memory state and shows a small notice that favourites will not be saved after closing.

### 05. Progressive Web App
- `manifest.webmanifest` with `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color`, and icons at 192 px and 512 px (plus a maskable icon).
- Hand-written `public/sw.js` that:
  - Caches the app shell on install.
  - Caches the last-viewed city's weather response.
  - Uses cache-first for static files and network-first with cache fallback for weather data.
  - Cleans old caches on activate using a versioned cache name.
- Register the service worker from a small `registerServiceWorker.js` module. Production only.
- The app also saves the last-viewed city's weather in localStorage so it can render even before the service worker answers.
- Detect offline with the `useOnlineStatus` hook (`online` and `offline` events) and show an **Offline mode** banner. When offline, show the last cached city and mark the data with its age ("Updated 2 hours ago").
- Disable the search box with a helpful message while offline instead of letting it fail.
- It must pass the browser's installability check.

### 06. Push Notifications
- Daily morning reminder with a **user-chosen time** (time input with validation).
- **Explain first**: show a `PermissionExplainer` panel describing why notifications are wanted and what will be sent. Only call `Notification.requestPermission()` after the user clicks "Enable reminders".
- The service worker handles the `push` and `notificationclick` events and shows the notification.
- Fallbacks:
  - Browser does not support notifications or service workers: show a clear message, and hide nothing else.
  - Permission denied: show a message explaining how to re-enable it in browser settings. The rest of the app keeps working.
  - Permission not yet decided: show the explainer.
- Persist the chosen time and enabled state.

**Important conflict: stop and ask me before building the scheduling part.** The brief says client-only, but a reminder that fires while the tab is closed normally needs either a push server or a browser feature with limited support. Build everything else in this section first (UI, explainer, permission flow, time picker, service worker handlers, fallbacks), then present me the options with trade-offs and wait for my decision. Do not add a backend, serverless function, or cron without my approval.

### 07. Responsive Design
- Mobile-first CSS. Must work correctly at **375 px, 768 px, and 1280 px**.
- No horizontal scroll at any width. Test long city names and long suggestion lists.
- Touch targets at least **44 x 44 px** on mobile (buttons, list rows, toggles, close icons).
- Use CSS variables for spacing, colours, and font sizes. Use `rem`, flexbox, and grid.
- Visible focus styles. Respect `prefers-reduced-motion`.

---

## 6. Bonus Features (also build these)

1. **Dark / light mode** with system preference detection (`prefers-color-scheme`), a manual toggle, and the choice persisted. Implemented with CSS variables on a `data-theme` attribute.
2. **Unit toggle (°C / °F)** persisted across sessions. It converts the already-fetched data instantly, with no refetch and no page reload.
3. **Animated weather icons** using CSS animations only (sun rotation, floating clouds, falling rain). No extra libraries. Disable animation under `prefers-reduced-motion`.

---

## 7. Design Direction

- Calm, confident, uncluttered. Think Linear's tight typography, Vercel's status indicators, Mercury's dashboard cards, Stripe's inline error patterns.
- Do not copy any of them. Build an original look.
- Clear hierarchy: the current temperature is the largest element, then condition, then details.
- Good empty states: first visit with no city, no favourites yet, no results.
- Subtle motion only (fades, short transitions).
- One neutral palette plus one accent colour, with enough contrast in both themes (WCAG AA).
- Loading uses skeleton blocks shaped like the final content.

---

## 8. Reusable Building Blocks (build these first)

1. `request.js`: one function wrapper around `fetch` with timeout, JSON parsing, status checks, and a typed error object (`type: 'offline' | 'rate_limit' | 'auth' | 'not_found' | 'server' | 'network'`, plus a human message).
2. `storage.js`: `readStorage(key, fallback)`, `writeStorage(key, value)`, `removeStorage(key)`, each wrapped in try/catch, plus an `isStorageAvailable()` check.
3. `validators.js`: small pure functions.
4. `useDebounce`, `useOnlineStatus`, `useStorage` hooks.
5. `Button`, `Input` (label, error, hint), `Modal`, `Banner` (info, warning, error), `Spinner`, `Card`, `EmptyState`, `Toggle`.
6. `alert` model plus a small toast component driven by it.

Build the pieces in this order so each step can be tested: store and utilities, then common components, then search, then weather, then favourites, then settings, then PWA, then notifications, then polish.

---

## 9. Deployment and Repository Files

- Ready for Vercel or Netlify with the security headers config file.
- Add `.env.example` with `VITE_OPENWEATHER_API_KEY=` left empty. It is the only variable.
- Create **README.md** containing: what the app is, live URL placeholder, setup steps, environment variables, scripts, architecture decisions (why Rematch, why the common request helper, why one weather shape), APIs used (state clearly that city search uses OpenWeatherMap Geocoding instead of the GeoDB Cities API named in the brief, and why), how fallback works, how offline works, how notifications work, security notes, and **known limitations written honestly**.
- Do **not** write PROMPTS.md. I will keep my own prompt history.

---

## 10. Working Method

1. Show me a short plan (file list and build order) first and wait for my approval.
2. Build one step at a time, as in section 8. After each step, tell me in two or three plain sentences what was built and how to test it.
3. If anything in this prompt is unclear or needs a technology not listed, **ask me**. Do not guess.
4. When finished, run through this checklist and report the result of each item:
   - Search debounce is 300 ms, with loading, no-results, and error states.
   - Weather shows real data, with loading and error states, and the Open-Meteo fallback works.
   - Validation happens on blur and submit, with specific messages.
   - Favourites cap at 5, confirm on delete, and degrade without localStorage.
   - The manifest is valid and the app is installable.
   - The service worker caches the shell and the last city, and the offline banner appears.
   - The permission explainer shows before the browser prompt, and denial breaks nothing.
   - No horizontal scroll at 375, 768, and 1280 px, and touch targets are at least 44 px.
   - Dark mode, unit toggle, and animated icons all work.
   - No AI-style comments, no unused code, no secrets in the repo.
````

---

## Prompt 2: Environment variable

My `.env` uses `VITE_OPENWEATHER_API_KEY`. Use exactly this name and generate `.env.example` with an empty value.

---

## Prompt 3: City search change

Use OpenWeatherMap's Geocoding API (`/geo/1.0/direct`) for city autocomplete with the same API key. Do not use GeoDB or RapidAPI. Only `VITE_OPENWEATHER_API_KEY` is needed.

---

## Prompt 4: Answer to the reminder scheduling question

Use Periodic Background Sync as the main method, so reminders can fire when the tab is closed on installed Chromium PWAs. Add the foreground timer as a fallback when Periodic Background Sync isn't supported or permission isn't granted. No backend and no new dependencies. Show the user which mode is active and document the limitations honestly in the README.

---

## Prompt 5: Confirmation

Option 1: keep both the foreground timer and the periodic sync attempt. Make sure the UI shows which mode is active and warns clearly about the limitations, and document them in the README.

---

## Prompt 6: Fixes after review

Before we call it done, fix these four things. Keep all existing rules: simple code, reusable, no comments.

1. `PermissionExplainer.jsx`: the text says background delivery isn't included. Rewrite it to explain why we ask for permission and what will happen: a reminder at the chosen time, delivered in the background by Periodic Background Sync on installed Chrome/Edge PWAs (time is approximate), otherwise by the foreground timer while the app is open.
2. `public/sw.js`, `showDailyReminder`: only show the notification when the current local time is at or after `config.time`. Keep the `lastNotifiedDate` check.
3. `SearchBar.jsx`: `handleBlur` and `handleSubmit` repeat the same validation. Move it into one function in `utils/validators.js` and use it in both.
4. `README.md`: update Notifications and Known limitations to describe periodic sync plus the foreground timer honestly, including the skipped-day trade-off from the time check. State that city search uses OpenWeatherMap Geocoding instead of the GeoDB Cities API named in the brief, and why. Add a "Live URL" line with a placeholder. In Verification, keep only what was actually tested.

Then run `npm run build` and summarize what changed.

---

## Prompt 7: Reminder card alignment

In the reminder card, the "Save time" button is not vertically aligned with the time input. It lines up with the hint text below the input. Align the button with the input field itself, at both 375 px and desktop widths, and keep the 44 px minimum height. Change only the CSS in `ReminderSettings.css` (and `PermissionExplainer.css` if it has the same issue).

---

## Prompt 8: Softer fallback wording

In the reminder card, the message "Background sync permission is blocked" sounds like something is wrong. Change it to "Background sync isn't available for this install yet." Keep the behavior the same: the foreground timer fallback must still activate and the amber notice must still show.

---

## What the agent got wrong and how I handled it

- **Outdated explainer and README.** After I chose periodic sync plus a foreground timer, the permission explainer and README still said background delivery was not included. I asked for both to be rewritten to match the real behaviour.
- **Reminder ignored the chosen time in the background.** The service worker showed the notification whenever the browser woke it. I asked for a check against the chosen time, and for the trade-off (a skipped day if the browser wakes it early) to be documented.
- **Repeated validation.** Search validation was duplicated in two handlers, which broke my reuse rule. I asked for one shared function.
- **Misaligned button and alarming wording.** In the live app, the "Save time" button sat lower than the time field, and the fallback message made a normal browser limitation sound like an error. I asked for the layout fix and a calmer message.
- **Decisions I made myself.**
  - I replaced GeoDB with OpenWeatherMap Geocoding to use a single key, and documented the deviation.
  - I chose periodic sync with a foreground fallback over a backend, to keep the app client-only as the brief requires.z