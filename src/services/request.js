import { REQUEST_TIMEOUT_MS } from '../utils/constants';

export class RequestError extends Error {
  constructor(type, message, status = 0) {
    super(message);
    this.name = 'RequestError';
    this.type = type;
    this.status = status;
  }
}

function createResponseError(status) {
  if (status === 401 || status === 403) {
    return new RequestError(
      'auth',
      'The weather API key was rejected. Check VITE_OPENWEATHER_API_KEY and restart the app.',
      status
    );
  }
  if (status === 404) {
    return new RequestError(
      'not_found',
      'The requested weather data was not found. Try another nearby city.',
      status
    );
  }
  if (status === 429) {
    return new RequestError(
      'rate_limit',
      'Too many requests right now. Wait a minute and try again.',
      status
    );
  }
  if (status >= 500) {
    return new RequestError(
      'server',
      'The weather service is having trouble right now. Try again in a moment.',
      status
    );
  }
  return new RequestError(
    'server',
    'The weather service rejected the request. Try again in a moment.',
    status
  );
}

export async function requestJson(url, options = {}) {
  const { timeout = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new RequestError('offline', 'You are offline. Reconnect to load fresh weather.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
    if (!response.ok) {
      throw createResponseError(response.status);
    }
    try {
      return await response.json();
    } catch (err) {
      throw new RequestError(
        'server',
        'The weather service returned data the app could not read. Try again.'
      );
    }
  } catch (err) {
    if (err instanceof RequestError) {
      throw err;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new RequestError('offline', 'You are offline. Reconnect to load fresh weather.');
    }
    if (err && err.name === 'AbortError') {
      throw new RequestError(
        'network',
        'The weather service took too long to respond. Check your connection and try again.'
      );
    }
    throw new RequestError(
      'network',
      'Could not reach the weather service. Check your connection and try again.'
    );
  } finally {
    clearTimeout(timer);
  }
}
