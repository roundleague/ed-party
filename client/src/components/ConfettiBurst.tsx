import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  trigger: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export default function ConfettiBurst({ trigger, intensity = 'high' }: Props) {
  useEffect(() => {
    if (!trigger) return;

    const configs: Record<string, confetti.Options[]> = {
      low: [{ particleCount: 60, spread: 60, origin: { y: 0.6 } }],
      medium: [
        { particleCount: 80, spread: 70, origin: { x: 0.3, y: 0.6 } },
        { particleCount: 80, spread: 70, origin: { x: 0.7, y: 0.6 } },
      ],
      high: [
        { particleCount: 120, spread: 90, origin: { x: 0.2, y: 0.65 }, angle: 60 },
        { particleCount: 120, spread: 90, origin: { x: 0.8, y: 0.65 }, angle: 120 },
        { particleCount: 80, spread: 120, origin: { x: 0.5, y: 0.5 } },
      ],
    };

    const options = configs[intensity];
    let delay = 0;
    options.forEach((opts) => {
      setTimeout(() => {
        confetti({
          ...opts,
          colors: ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
          shapes: ['circle', 'square'],
          gravity: 0.8,
          scalar: 1.2,
        });
      }, delay);
      delay += 200;
    });

    // Second burst for high intensity
    if (intensity === 'high') {
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 180,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
          shapes: ['star'],
          scalar: 1.5,
        });
      }, 600);
    }
  }, [trigger, intensity]);

  return null;
}
