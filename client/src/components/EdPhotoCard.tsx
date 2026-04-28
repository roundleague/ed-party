interface Props {
  src: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  caption?: string;
  rotate?: boolean;
}

const SIZE_MAP = {
  sm:  'w-24 h-24',
  md:  'w-36 h-36',
  lg:  'w-52 h-52',
  xl:  'w-72 h-72',
};

// Subtle random tilt so photos feel candid / pinned-up
const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', 'rotate-3', '-rotate-3'];

export default function EdPhotoCard({ src, size = 'md', className = '', caption, rotate = false }: Props) {
  const tilt = rotate ? ROTATIONS[Math.floor(src.length % ROTATIONS.length)] : '';

  return (
    <div className={`relative inline-flex flex-col items-center ${tilt} transition-transform hover:rotate-0 hover:scale-105 duration-200 ${className}`}>
      <div className={`${SIZE_MAP[size]} rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border-4 border-white/10`}>
        <img
          src={src}
          alt="Ed"
          className="w-full h-full object-cover object-top"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      {caption && (
        <div className="mt-2 px-3 py-1 bg-black/60 rounded-full text-xs text-white/70 font-medium backdrop-blur-sm">
          {caption}
        </div>
      )}
    </div>
  );
}
