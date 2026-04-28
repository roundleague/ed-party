import { useEffect, useRef, useState, useCallback } from 'react';

export function useClips() {
  const [clips, setClips] = useState<string[]>([]);
  const lastPlayedRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const base = `${window.location.protocol}//${window.location.hostname}:3001`;
    fetch(`${base}/api/clips`)
      .then((r) => r.json())
      .then(({ clips }: { clips: string[] }) => setClips(clips))
      .catch(() => setClips([]));
  }, []);

  const playRandomClip = useCallback(() => {
    if (clips.length === 0) return;

    // Don't repeat the same clip back-to-back
    const pool = clips.length > 1
      ? clips.filter((c) => c !== lastPlayedRef.current)
      : clips;
    const clip = pool[Math.floor(Math.random() * pool.length)];

    // Stop any currently playing clip
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(clip);
    audio.volume = 0.8;
    audioRef.current = audio;
    lastPlayedRef.current = clip;
    audio.play().catch(() => {}); // fail silently if browser blocks autoplay
  }, [clips]);

  const stopClip = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { playRandomClip, stopClip, clipsReady: clips.length > 0 };
}
