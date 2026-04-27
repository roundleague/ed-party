import { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  onSubmit: (imageData: string) => void;
  disabled?: boolean;
  prompt?: string;
}

export default function DrawingCanvas({ onSubmit, disabled = false, prompt }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(6);
  const [submitted, setSubmitted] = useState(false);

  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled || submitted) return;
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current!;
    const point = 'touches' in e ? e.touches[0] : e;
    lastPos.current = getPos(point, canvas);
  }, [disabled, submitted]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current || disabled || submitted) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const point = 'touches' in e ? e.touches[0] : e;
    const pos = getPos(point, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [color, brushSize, disabled, submitted]);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fill background
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mouse events
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    // Touch events
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('mouseleave', stopDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current!;
    const imageData = canvas.toDataURL('image/png');
    setSubmitted(true);
    onSubmit(imageData);
  };

  const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#000000'];

  return (
    <div className="flex flex-col gap-3 w-full">
      {prompt && (
        <p className="text-white/70 text-sm text-center font-medium">{prompt}</p>
      )}

      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className={`w-full rounded-2xl border-2 ${
          submitted ? 'border-green-500/50 opacity-60' : 'border-white/20'
        } touch-none`}
        style={{ cursor: submitted ? 'not-allowed' : 'crosshair' }}
      />

      {!submitted && (
        <>
          {/* Color palette */}
          <div className="flex gap-2 justify-center flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c ? 'border-white scale-125' : 'border-white/20'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Brush size */}
          <div className="flex gap-2 items-center justify-center">
            {[3, 6, 12, 20].map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={`rounded-full bg-white transition-all ${brushSize === s ? 'opacity-100' : 'opacity-30'}`}
                style={{ width: s * 2 + 8, height: s * 2 + 8 }}
              />
            ))}
            <button
              onClick={clearCanvas}
              className="ml-2 px-3 py-1 rounded-lg bg-white/10 text-white/60 text-sm hover:bg-white/20 transition-all"
            >
              Clear
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="phone-btn bg-gradient-to-r from-pink-600 to-rose-600 text-white py-4 text-xl mt-1"
          >
            Submit Drawing ✓
          </button>
        </>
      )}

      {submitted && (
        <div className="text-center text-green-400 font-bold text-lg py-2">
          ✓ Drawing submitted! Waiting for others...
        </div>
      )}
    </div>
  );
}
