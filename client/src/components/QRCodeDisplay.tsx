import { QRCodeSVG } from 'qrcode.react';

interface Props {
  url: string;
  size?: number;
}

export default function QRCodeDisplay({ url, size = 180 }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-2xl p-3 bg-white shadow-xl"
        style={{ lineHeight: 0 }}
      >
        <QRCodeSVG
          value={url}
          size={size}
          bgColor="#ffffff"
          fgColor="#0f0f1a"
          level="M"
        />
      </div>
      <div className="text-sm text-white/50 break-all text-center max-w-[200px]">{url}</div>
    </div>
  );
}
