import { useState } from 'react';
import { avatarFallbackSvg } from '../utils/assets';
import type { Player } from '../games/gamesConfig';

interface Props {
  player: Player;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showScore?: boolean;
  highlight?: boolean;
  rank?: number;
}

const SIZE_MAP = {
  sm: { img: 'w-10 h-10', text: 'text-xs', wrap: 'gap-1' },
  md: { img: 'w-14 h-14', text: 'text-sm', wrap: 'gap-1.5' },
  lg: { img: 'w-20 h-20', text: 'text-base', wrap: 'gap-2' },
  xl: { img: 'w-28 h-28', text: 'text-xl', wrap: 'gap-3' },
};

export default function PlayerAvatar({
  player,
  size = 'md',
  showName = true,
  showScore = false,
  highlight = false,
  rank,
}: Props) {
  const [imgSrc, setImgSrc] = useState(player.iconUrl);
  const s = SIZE_MAP[size];

  return (
    <div className={`flex flex-col items-center ${s.wrap} ${!player.connected ? 'opacity-40' : ''}`}>
      <div className={`relative ${s.img}`}>
        {rank !== undefined && rank <= 2 && (
          <div className="absolute -top-2 -right-2 z-10 text-lg leading-none">
            {rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}
          </div>
        )}
        <img
          src={imgSrc}
          alt={player.name}
          onError={() => setImgSrc(avatarFallbackSvg(player.name, 112))}
          className={`${s.img} rounded-full object-cover ${
            highlight
              ? 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/30'
              : 'ring-2 ring-white/10'
          }`}
        />
        {!player.connected && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <span className="text-xs">✗</span>
          </div>
        )}
      </div>
      {showName && (
        <span className={`${s.text} font-bold text-white/90 text-center max-w-[7rem] truncate`}>
          {player.name}
        </span>
      )}
      {showScore && (
        <span className={`${s.text} font-black text-yellow-400`}>{player.score} pts</span>
      )}
    </div>
  );
}
