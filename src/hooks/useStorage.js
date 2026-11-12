import { useState } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

export default function useStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStorage(key, initialValue));

  function setStoredValue(nextValue) {
    setValue(nextValue);
    writeStorage(key, nextValue);
  }

  return [value, setStoredValue];
}
