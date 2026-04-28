import { useEffect, useState, useCallback } from 'react';

export function useEdPhotos() {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const base = `${window.location.protocol}//${window.location.hostname}:3001`;
    fetch(`${base}/api/photos`)
      .then((r) => r.json())
      .then(({ photos }: { photos: string[] }) => setPhotos(photos))
      .catch(() => setPhotos([]));
  }, []);

  const random = useCallback(
    (exclude?: string): string | null => {
      if (photos.length === 0) return null;
      const pool = exclude ? photos.filter((p) => p !== exclude) : photos;
      return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : photos[0];
    },
    [photos]
  );

  return { photos, random };
}
