export function limitText(value, maxLength) {
  const text = String(value === undefined || value === null ? '' : value);
  return text.slice(0, maxLength).trimStart();
}

export function validateRequired(value, label) {
  if (!String(value || '').trim()) {
    return `${label} is required.`;
  }
  return '';
}

export function validateMinLength(value, minLength, label) {
  if (String(value || '').trim().length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }
  return '';
}

export function validateMaxLength(value, maxLength, label) {
  if (String(value || '').length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return '';
}

export function validateTime(value) {
  if (!value) {
    return 'Choose a reminder time, for example 08:00.';
  }
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return 'Enter the time as HH:MM, for example 08:00.';
  }
  const parts = value.split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (hours > 23 || minutes > 59) {
    return 'Enter a real time between 00:00 and 23:59.';
  }
  return '';
}

export function isCityShape(city) {
  if (!city || typeof city !== 'object') {
    return false;
  }
  return (
    typeof city.name === 'string' &&
    city.name.trim().length > 0 &&
    typeof city.lat === 'number' &&
    Number.isFinite(city.lat) &&
    city.lat >= -90 &&
    city.lat <= 90 &&
    typeof city.lon === 'number' &&
    Number.isFinite(city.lon) &&
    city.lon >= -180 &&
    city.lon <= 180 &&
    (typeof city.state === 'undefined' || typeof city.state === 'string') &&
    typeof city.country === 'string' &&
    city.country.trim().length > 0
  );
}

export function validateSelectedCity(city) {
  if (!isCityShape(city)) {
    return 'Select a city from the suggestions.';
  }
  return '';
}

export function validateCity(query, selectedCity, suggestions) {
  if (!String(query || '').trim()) {
    return 'City is required.';
  }
  if (String(query || '').trim().length < MIN_SEARCH_LENGTH) {
    return `City must be at least ${MIN_SEARCH_LENGTH} characters.`;
  }
  if (String(query || '').trim().length > MAX_SEARCH_LENGTH) {
    return `City must be ${MAX_SEARCH_LENGTH} characters or fewer.`;
  }
  if (!selectedCity || query.trim() !== selectedCity) {
    return 'Select a city from the suggestions.';
  }
  return '';
}

export function isFavouriteShape(favourite) {
  return isCityShape(favourite) && typeof favourite.id === 'string' && favourite.id.length > 0;
}
