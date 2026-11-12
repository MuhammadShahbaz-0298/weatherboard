import { OPEN_WEATHER_API_KEY, OPEN_WEATHER_GEO_URL } from '../utils/constants';
import { mapGeoCities } from '../utils/weatherMapper';
import { RequestError, requestJson } from './request';

export async function searchCities(query) {
  if (!OPEN_WEATHER_API_KEY) {
    throw new RequestError(
      'auth',
      'City search needs an OpenWeatherMap API key. Add VITE_OPENWEATHER_API_KEY to your .env file and restart the app.'
    );
  }

  const url =
    `${OPEN_WEATHER_GEO_URL}?q=${encodeURIComponent(query)}` +
    `&limit=5&appid=${encodeURIComponent(OPEN_WEATHER_API_KEY)}`;

  const data = await requestJson(url);
  return mapGeoCities(data);
}
