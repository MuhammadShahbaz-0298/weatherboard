import {
  OPEN_METEO_URL,
  OPEN_WEATHER_API_KEY,
  OPEN_WEATHER_CURRENT_URL,
  OPEN_WEATHER_FORECAST_URL
} from '../utils/constants';
import { mapOpenMeteoData, mapOpenWeatherData } from '../utils/weatherMapper';
import { RequestError, requestJson } from './request';

function buildOpenWeatherUrl(baseUrl, city) {
  return (
    `${baseUrl}?lat=${encodeURIComponent(city.lat)}` +
    `&lon=${encodeURIComponent(city.lon)}` +
    `&units=metric&appid=${encodeURIComponent(OPEN_WEATHER_API_KEY)}`
  );
}

async function getOpenWeatherWeather(city) {
  if (!OPEN_WEATHER_API_KEY) {
    throw new RequestError(
      'auth',
      'OpenWeatherMap is not configured. Add VITE_OPENWEATHER_API_KEY to your .env file and restart the app.'
    );
  }

  const currentUrl = buildOpenWeatherUrl(OPEN_WEATHER_CURRENT_URL, city);
  const forecastUrl = buildOpenWeatherUrl(OPEN_WEATHER_FORECAST_URL, city);
  const responses = await Promise.all([requestJson(currentUrl), requestJson(forecastUrl)]);
  return mapOpenWeatherData(responses[0], responses[1], city);
}

async function getOpenMeteoWeather(city) {
  const url =
    `${OPEN_METEO_URL}?latitude=${encodeURIComponent(city.lat)}` +
    `&longitude=${encodeURIComponent(city.lon)}` +
    '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min,weather_code' +
    '&timezone=auto&forecast_days=5';

  const data = await requestJson(url);
  return mapOpenMeteoData(data, city);
}

export async function fetchWeather(city) {
  try {
    return await getOpenWeatherWeather(city);
  } catch (err) {
    const shouldFallback =
      err.type === 'rate_limit' || err.type === 'auth' || err.type === 'server';
    if (!shouldFallback) {
      throw err;
    }
    return getOpenMeteoWeather(city);
  }
}
