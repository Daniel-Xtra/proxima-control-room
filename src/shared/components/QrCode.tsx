import { QRCodeSVG } from "qrcode.react";

interface QrCodeProps {
  value: string;
  label: string;
  size?: number;
}

/** Always dark on white, even in dark mode, so phone cameras can read it. The 4-module margin is the quiet zone scanners need. */
export function QrCode({ value, label, size = 208 }: QrCodeProps) {
  return (
    <div className="inline-flex rounded-md border border-border bg-white">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={4}
        bgColor="white"
        fgColor="black"
        title={label}
      />
    </div>
  );
}
