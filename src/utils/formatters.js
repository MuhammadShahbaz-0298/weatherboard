export function capitalize(value) {
  const text = String(value || '');
  if (!text) {
    return '';
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function convertTemperature(celsius, unit) {
  if (unit === 'fahrenheit') {
    return celsius * 1.8 + 32;
  }
  return celsius;
}

export function formatTemperature(celsius, unit) {
  const value = convertTemperature(celsius, unit);
  return `${Math.round(value)}°`;
}

export function formatTemperaturePair(min, max, unit) {
  return `${formatTemperature(min, unit)} / ${formatTemperature(max, unit)}`;
}

export function temperatureUnitLabel(unit) {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatWind(speed) {
  return `${Math.round(speed)} km/h`;
}

export function formatHumidity(value) {
  return `${Math.round(value)}%`;
}

export function formatCityLabel(city) {
  if (!city) {
    return '';
  }
  const parts = [city.name];
  if (city.state) {
    parts.push(city.state);
  }
  if (city.country) {
    parts.push(city.country);
  }
  return parts.join(', ');
}

export function formatCitySecondary(city) {
  if (!city) {
    return '';
  }
  const parts = [];
  if (city.state) {
    parts.push(city.state);
  }
  if (city.country) {
    parts.push(city.country);
  }
  return parts.join(', ');
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return 'Update time unavailable';
  }
  const elapsed = Date.now() - timestamp;
  if (elapsed < 60 * 1000) {
    return 'Updated just now';
  }
  const minutes = Math.floor(elapsed / (60 * 1000));
  if (minutes < 60) {
    return `Updated ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.floor(hours / 24);
  return `Updated ${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function formatWeekday(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date);
}

export function formatMonthDay(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}
