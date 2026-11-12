export function isStorageAvailable() {
  try {
    const testKey = '__weatherboard_test__';
    window.localStorage.setItem(testKey, 'ok');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    return false;
  }
}

export function readStorage(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) {
      return fallback;
    }
    return JSON.parse(rawValue);
  } catch (err) {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    return false;
  }
}
