import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, #00C896, #009970)',
          borderRadius: 8,
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Top-left square */}
        <div style={{ position: 'absolute', left: 4, top: 4, width: 10, height: 10, background: '#080F1E', borderRadius: 2 }} />
        {/* Top-right square (dimmed) */}
        <div style={{ position: 'absolute', right: 4, top: 4, width: 10, height: 10, background: 'rgba(8,15,30,0.55)', borderRadius: 2 }} />
        {/* Bottom-left square (dimmed) */}
        <div style={{ position: 'absolute', left: 4, bottom: 4, width: 10, height: 10, background: 'rgba(8,15,30,0.55)', borderRadius: 2 }} />
        {/* Gold circle (bottom-right) */}
        <div style={{ position: 'absolute', right: 4, bottom: 4, width: 10, height: 10, background: '#F5A623', borderRadius: '50%' }} />
      </div>
    ),
    { ...size },
  );
}
