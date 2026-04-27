import { useState } from 'react';
import PlayerAvatar from './PlayerAvatar';
import type { Player } from '../games/gamesConfig';

interface Props {
  players: Player[];
  title?: string;
  highlightId?: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ players, title = 'Leaderboard', highlightId }: Props) {
  // Sort by score descending (already sorted from server but re-sort for safety)
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const [visible, setVisible] = useState(true);
  void setVisible;

  return (
    <div className="w-full max-w-xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-black text-center mb-6 gradient-text">{title}</h2>
      <div className="space-y-3">
        {sorted.map((player, idx) => (
          <div
            key={player.id}
            className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300 ${
              player.id === highlightId
                ? 'bg-yellow-500/20 border border-yellow-500/50'
                : idx === 0
                ? 'bg-gradient-to-r from-yellow-600/20 to-amber-600/10 border border-yellow-500/30'
                : 'glass'
            }`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Rank */}
            <div className="w-10 text-2xl text-center font-black">
              {idx < 3 ? MEDALS[idx] : <span className="text-white/40 text-lg">#{idx + 1}</span>}
            </div>

            {/* Avatar */}
            <PlayerAvatar player={player} size="sm" showName={false} />

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-lg truncate ${
                player.id === highlightId ? 'text-yellow-300' : 'text-white'
              }`}>
                {player.name}
              </div>
              {!player.connected && (
                <div className="text-xs text-white/40">disconnected</div>
              )}
            </div>

            {/* Score */}
            <div className="text-right">
              <div className={`text-2xl font-black ${idx === 0 ? 'text-yellow-400' : 'text-white/80'}`}>
                {player.score}
              </div>
              <div className="text-xs text-white/40 uppercase tracking-wider">pts</div>
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="text-center text-white/40 py-8">No players yet</div>
        )}
      </div>
    </div>
  );
}
