import { CONDITION_CODES, CONDITION_LABELS } from './constants';
import { capitalize } from './formatters';
import { isCityShape } from './validators';

function readNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function requireNumber(value, message) {
  const number = readNumber(value);
  if (number === null) {
    throw new Error(message);
  }
  return number;
}

function getOwmGroup(id) {
  if (typeof id !== 'number' || !Number.isFinite(id)) {
    return null;
  }
  if (id >= 200 && id < 300) {
    return 'thunder';
  }
  if (id >= 300 && id < 400) {
    return 'drizzle';
  }
  if (id >= 500 && id < 600) {
    return 'rain';
  }
  if (id >= 600 && id < 700) {
    return 'snow';
  }
  if (id >= 700 && id < 800) {
    return 'mist';
  }
  if (id === 800) {
    return 'clear';
  }
  return 'clouds';
}

function getOwmCondition(weather) {
  if (!weather || typeof weather !== 'object') {
    throw new Error('The weather service returned an incomplete condition. Try again.');
  }
  const code = getOwmGroup(readNumber(weather.id));
  if (!code) {
    throw new Error('The weather service returned an incomplete condition. Try again.');
  }
  const text = typeof weather.description === 'string' && weather.description.trim()
    ? capitalize(weather.description.trim())
    : CONDITION_LABELS[code];
  return { code, text };
}

function getOpenMeteoCondition(weatherCode) {
  const code = readNumber(weatherCode);
  if (code === null) {
    throw new Error('The fallback weather service returned an incomplete condition. Try again.');
  }
  if (code === 0) {
    return { code: 'clear', text: 'Clear' };
  }
  if (code === 1) {
    return { code: 'clear', text: 'Mainly clear' };
  }
  if (code === 2) {
    return { code: 'clouds', text: 'Partly cloudy' };
  }
  if (code === 3) {
    return { code: 'clouds', text: 'Overcast' };
  }
  if (code === 45 || code === 48) {
    return { code: 'mist', text: 'Fog' };
  }
  if (code >= 51 && code <= 57) {
    return { code: 'drizzle', text: 'Drizzle' };
  }
  if (code >= 61 && code <= 67) {
    return { code: 'rain', text: 'Rain' };
  }
  if (code >= 71 && code <= 77) {
    return { code: 'snow', text: 'Snow' };
  }
  if (code >= 80 && code <= 82) {
    return { code: 'rain', text: 'Rain showers' };
  }
  if (code === 85 || code === 86) {
    return { code: 'snow', text: 'Snow showers' };
  }
  if (code >= 95 && code <= 99) {
    return { code: 'thunder', text: 'Thunderstorm' };
  }
  return { code: 'clouds', text: CONDITION_LABELS.clouds };
}

function readForecastTemperature(item, key) {
  const value = item && item.main ? item.main[key] : null;
  return readNumber(value);
}

function pickRepresentative(items) {
  const counts = {};
  for (const item of items) {
    const weather = Array.isArray(item.weather) ? item.weather[0] : null;
    const code = getOwmGroup(readNumber(weather ? weather.id : null));
    if (!code) {
      continue;
    }
    if (counts[code]) {
      counts[code] += 1;
    } else {
      counts[code] = 1;
    }
  }

  let bestCode = null;
  let bestCount = 0;
  for (const code of Object.keys(counts)) {
    if (counts[code] > bestCount) {
      bestCode = code;
      bestCount = counts[code];
    }
  }

  if (!bestCode) {
    throw new Error('The weather service returned an unreadable forecast. Try again.');
  }

  for (const item of items) {
    const weather = Array.isArray(item.weather) ? item.weather[0] : null;
    if (getOwmGroup(readNumber(weather ? weather.id : null)) === bestCode) {
      return item;
    }
  }

  throw new Error('The weather service returned an unreadable forecast. Try again.');
}

function getForecastDate(item, timezoneOffsetSeconds) {
  if (
    item &&
    typeof item.dt === 'number' &&
    Number.isFinite(item.dt) &&
    typeof timezoneOffsetSeconds === 'number' &&
    Number.isFinite(timezoneOffsetSeconds)
  ) {
    return new Date((item.dt + timezoneOffsetSeconds) * 1000).toISOString().slice(0, 10);
  }
  if (item && typeof item.dt_txt === 'string' && item.dt_txt.length >= 10) {
    return item.dt_txt.slice(0, 10);
  }
  return '';
}

function groupForecastByDay(list, timezoneOffsetSeconds) {
  const groups = [];
  for (const item of list) {
    const date = getForecastDate(item, timezoneOffsetSeconds);
    if (!date) {
      continue;
    }
    let group = groups.find((entry) => entry.date === date);
    if (!group) {
      group = { date, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups.slice(0, 5);
}

function mapOwmForecast(list, timezoneOffsetSeconds) {
  if (!Array.isArray(list)) {
    throw new Error('The weather service returned an unreadable forecast. Try again.');
  }

  const days = [];
  const groups = groupForecastByDay(list, timezoneOffsetSeconds);
  for (const group of groups) {
    let min = null;
    let max = null;
    for (const item of group.items) {
      const itemMin = readForecastTemperature(item, 'temp_min');
      const itemMax = readForecastTemperature(item, 'temp_max');
      const itemTemp = readForecastTemperature(item, 'temp');
      const candidateMin = itemMin === null ? itemTemp : itemMin;
      const candidateMax = itemMax === null ? itemTemp : itemMax;
      if (candidateMin !== null && (min === null || candidateMin < min)) {
        min = candidateMin;
      }
      if (candidateMax !== null && (max === null || candidateMax > max)) {
        max = candidateMax;
      }
    }

    if (min === null || max === null) {
      throw new Error('The weather service returned an unreadable forecast. Try again.');
    }

    const representative = pickRepresentative(group.items);
    const weather = Array.isArray(representative.weather) ? representative.weather[0] : null;
    const condition = getOwmCondition(weather);
    days.push({
      date: group.date,
      min,
      max,
      condition: condition.text,
      conditionCode: condition.code
    });
  }

  if (days.length === 0) {
    throw new Error('The weather service returned an empty forecast. Try again.');
  }

  return days;
}

function normalizeCity(city) {
  if (!isCityShape(city)) {
    throw new Error('The selected city is incomplete. Search for it again.');
  }
  return {
    id: city.id || `${city.lat.toFixed(4)}:${city.lon.toFixed(4)}`,
    name: city.name.trim(),
    state: typeof city.state === 'string' ? city.state.trim() : '',
    country: city.country.trim(),
    lat: city.lat,
    lon: city.lon
  };
}

export function mapOpenWeatherData(currentData, forecastData, city) {
  if (!currentData || typeof currentData !== 'object') {
    throw new Error('The weather service returned an unexpected response. Try again.');
  }
  if (!currentData.main || typeof currentData.main !== 'object') {
    throw new Error('The weather service returned incomplete weather details. Try again.');
  }
  if (!Array.isArray(currentData.weather) || !currentData.weather[0]) {
    throw new Error('The weather service returned an incomplete condition. Try again.');
  }

  const temperature = requireNumber(
    currentData.main.temp,
    'The weather service returned an unreadable temperature. Try again.'
  );
  const humidity = requireNumber(
    currentData.main.humidity,
    'The weather service returned unreadable humidity. Try again.'
  );
  const windSpeed = requireNumber(
    currentData.wind ? currentData.wind.speed : null,
    'The weather service returned unreadable wind data. Try again.'
  );
  const condition = getOwmCondition(currentData.weather[0]);
  const timezoneOffset = forecastData && forecastData.city
    ? readNumber(forecastData.city.timezone)
    : null;

  return {
    city: normalizeCity(city),
    current: {
      temperature,
      humidity,
      windSpeed: windSpeed * 3.6,
      condition: condition.text,
      conditionCode: condition.code
    },
    forecast: mapOwmForecast(forecastData && forecastData.list, timezoneOffset),
    source: 'openweather',
    updatedAt: Date.now()
  };
}

export function mapOpenMeteoData(data, city) {
  if (!data || typeof data !== 'object' || !data.current || typeof data.current !== 'object') {
    throw new Error('The fallback weather service returned an unexpected response. Try again.');
  }
  if (!data.daily || typeof data.daily !== 'object') {
    throw new Error('The fallback weather service returned an unreadable forecast. Try again.');
  }

  const current = data.current;
  const daily = data.daily;
  const condition = getOpenMeteoCondition(current.weather_code);

  if (!Array.isArray(daily.time) || !Array.isArray(daily.temperature_2m_max) || !Array.isArray(daily.temperature_2m_min) || !Array.isArray(daily.weather_code)) {
    throw new Error('The fallback weather service returned an unreadable forecast. Try again.');
  }

  const totalDays = Math.min(5, daily.time.length);
  const forecast = [];
  for (let index = 0; index < totalDays; index += 1) {
    const date = daily.time[index];
    const min = readNumber(daily.temperature_2m_min[index]);
    const max = readNumber(daily.temperature_2m_max[index]);
    if (typeof date !== 'string' || min === null || max === null) {
      throw new Error('The fallback weather service returned an unreadable forecast. Try again.');
    }
    const dayCondition = getOpenMeteoCondition(daily.weather_code[index]);
    forecast.push({
      date,
      min,
      max,
      condition: dayCondition.text,
      conditionCode: dayCondition.code
    });
  }

  if (forecast.length === 0) {
    throw new Error('The fallback weather service returned an empty forecast. Try again.');
  }

  return {
    city: normalizeCity(city),
    current: {
      temperature: requireNumber(
        current.temperature_2m,
        'The fallback weather service returned an unreadable temperature. Try again.'
      ),
      humidity: requireNumber(
        current.relative_humidity_2m,
        'The fallback weather service returned unreadable humidity. Try again.'
      ),
      windSpeed: requireNumber(
        current.wind_speed_10m,
        'The fallback weather service returned unreadable wind data. Try again.'
      ),
      condition: condition.text,
      conditionCode: condition.code
    },
    forecast,
    source: 'open-meteo',
    updatedAt: Date.now()
  };
}

export function mapGeoCities(data) {
  if (!Array.isArray(data)) {
    throw new Error('The city search service returned an unexpected response. Try again.');
  }

  const cities = [];
  const seen = {};
  for (const result of data) {
    if (!result || typeof result !== 'object') {
      continue;
    }
    const name = typeof result.name === 'string' ? result.name.trim() : '';
    const country = typeof result.country === 'string' ? result.country.trim() : '';
    const state = typeof result.state === 'string' ? result.state.trim() : '';
    const lat = readNumber(result.lat);
    const lon = readNumber(result.lon);
    if (!name || !country || lat === null || lon === null) {
      continue;
    }
    const id = `${lat.toFixed(4)}:${lon.toFixed(4)}`;
    const labelKey = `${name.toLowerCase()}|${state.toLowerCase()}|${country.toLowerCase()}`;
    if (!seen[labelKey]) {
      seen[labelKey] = true;
      cities.push({ id, name, country, state, lat, lon });
    }
    if (cities.length === 5) {
      break;
    }
  }
  return cities;
}

export function isWeatherData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  if (!isCityShape(data.city)) {
    return false;
  }
  if (!data.current || typeof data.current !== 'object') {
    return false;
  }
  if (
    readNumber(data.current.temperature) === null ||
    readNumber(data.current.humidity) === null ||
    readNumber(data.current.windSpeed) === null ||
    typeof data.current.condition !== 'string' ||
    !CONDITION_CODES.includes(data.current.conditionCode)
  ) {
    return false;
  }
  if (!Array.isArray(data.forecast) || data.forecast.length === 0) {
    return false;
  }
  for (const day of data.forecast) {
    if (!day || typeof day.date !== 'string') {
      return false;
    }
    if (readNumber(day.min) === null || readNumber(day.max) === null) {
      return false;
    }
    if (typeof day.condition !== 'string' || !CONDITION_CODES.includes(day.conditionCode)) {
      return false;
    }
  }
  if (data.source !== 'openweather' && data.source !== 'open-meteo') {
    return false;
  }
  return readNumber(data.updatedAt) !== null;
}
