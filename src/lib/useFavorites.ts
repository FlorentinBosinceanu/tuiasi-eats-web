import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'tuiasi-eats-favorites';

function getFavorites(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(getFavorites);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setFavorites(getFavorites());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites]
  );

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id];
      saveFavorites(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
