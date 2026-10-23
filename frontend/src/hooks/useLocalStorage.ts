'use client';

import { useState, useEffect } from 'react';

/**
 * Hook đọc/ghi localStorage an toàn (SSR-safe).
 * Sử dụng: const [value, setValue] = useLocalStorage('key', defaultValue);
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Lỗi đọc localStorage với khóa "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Lỗi ghi localStorage với khóa "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
