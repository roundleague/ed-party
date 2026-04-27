// ─── Asset utilities ──────────────────────────────────────────────────────────
// All paths reference /public/assets/. Add real files at these paths.

export const PLAYER_ICONS = Array.from(
  { length: 12 },
  (_, i) => `/assets/players/icons/player-${i + 1}.png`
);

export const ED_PHOTOS = {
  hero: '/assets/ed/photos/ed-hero.jpg',
  funny1: '/assets/ed/photos/ed-funny-1.jpg',
  funny2: '/assets/ed/photos/ed-funny-2.jpg',
  childhood: '/assets/ed/photos/ed-childhood.jpg',
};

// Fallback avatar SVG (shown when icon file is missing)
export function avatarFallbackSvg(name: string, size = 64): string {
  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="hsl(${hue},60%,40%)"/>
    <text x="${size / 2}" y="${size / 2 + size * 0.14}" text-anchor="middle" fill="white"
      font-family="Inter,sans-serif" font-weight="800" font-size="${size * 0.38}">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ─── Sound effects ─────────────────────────────────────────────────────────────
// Files are optional – plays silently if missing.

type SfxName = 'correct' | 'wrong' | 'reveal' | 'winner' | 'click';

const audioCache = new Map<string, HTMLAudioElement>();

export function playSound(name: SfxName) {
  try {
    const path = `/assets/sfx/${name}.mp3`;
    let audio = audioCache.get(path);
    if (!audio) {
      audio = new Audio(path);
      audio.volume = 0.5;
      audioCache.set(path, audio);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {}); // fail silently
  } catch {
    // ignore
  }
}
