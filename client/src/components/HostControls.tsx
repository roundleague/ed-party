import { useEffect } from 'react';

interface Props {
  onNext: () => void;
  onReset: () => void;
  onLeaderboard?: () => void;
  nextLabel?: string;
  showNext?: boolean;
}

export default function HostControls({
  onNext,
  onReset,
  nextLabel = 'Next →',
  showNext = true,
}: Props) {
  // Keyboard shortcuts for the host
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
        e.preventDefault();
        if (showNext) onNext();
      }
      if (e.code === 'KeyR') {
        if (e.shiftKey || e.metaKey) {
          e.preventDefault();
          if (window.confirm('Reset the entire game? This cannot be undone.')) onReset();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext, onReset, showNext]);

  return (
    <div className="fixed bottom-6 right-6 flex gap-3 z-50">
      <button
        onClick={() => {
          if (window.confirm('Reset the entire game?')) onReset();
        }}
        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white text-sm font-medium transition-all"
        title="Shift+R to reset"
      >
        ↺ Reset
      </button>

      {showNext && (
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-base shadow-lg shadow-violet-500/30 transition-all active:scale-95"
          title="Space or → to advance"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
