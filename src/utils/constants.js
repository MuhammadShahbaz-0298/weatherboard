const configuredApiKey = ((import.meta.env && import.meta.env.VITE_OPENWEATHER_API_KEY) || '').trim();

export const OPEN_WEATHER_API_KEY = configuredApiKey.length === 32 ? configuredApiKey : '';

export const STORAGE_KEYS = {
  favourites: 'weatherboard-favourites',
  settings: 'weatherboard-settings',
  reminder: 'weatherboard-reminder',
  lastWeather: 'weatherboard-last-weather',
  favouritesPanelOpen: 'weatherboard-favourites-open'
};

export const MAX_FAVOURITES = 5;
export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 60;
export const SEARCH_DEBOUNCE_MS = 300;
export const REQUEST_TIMEOUT_MS = 12000;

export const OPEN_WEATHER_GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
export const OPEN_WEATHER_CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';
export const OPEN_WEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
export const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export const THEMES = ['system', 'light', 'dark'];
export const UNITS = ['celsius', 'fahrenheit'];
export const DEFAULT_REMINDER_TIME = '08:00';

export const REMINDER_SYNC_TAG = 'weatherboard-daily-reminder';
export const REMINDER_NOTIFICATION_TAG = 'weatherboard-reminder';
export const REMINDER_CACHE = 'weatherboard-reminder-v1';
export const REMINDER_CONFIG_URL = '/__weatherboard-reminder-config__';
export const REMINDER_SYNC_MIN_INTERVAL = 24 * 60 * 60 * 1000;
export const FOREGROUND_CHECK_INTERVAL_MS = 30 * 1000;

export const CONDITION_LABELS = {
  clear: 'Clear',
  clouds: 'Cloudy',
  drizzle: 'Drizzle',
  rain: 'Rain',
  snow: 'Snow',
  thunder: 'Thunderstorm',
  mist: 'Mist'
};

export const CONDITION_CODES = Object.keys(CONDITION_LABELS);
