import React from 'react';

export default function SwipeStamps({ dragOffset, exitDirection }) {
  const showRight = (dragOffset.x > 25 && !exitDirection) || exitDirection === 'right';
  const showLeft = (dragOffset.x < -25 && !exitDirection) || exitDirection === 'left';
  const showVertical =
    ((Math.abs(dragOffset.y) > 25 && Math.abs(dragOffset.y) > Math.abs(dragOffset.x)) && !exitDirection) ||
    exitDirection === 'up' ||
    exitDirection === 'down';

  return (
    <>
      {/* Stamp: ĐÃ THUỘC (Vuốt phải) */}
      {showRight && (
        <div
          style={{
            opacity: exitDirection === 'right' ? 1 : Math.min(1, Math.max(0, (dragOffset.x - 25) / 55)),
          }}
          className="absolute top-6 left-6 z-30 pointer-events-none px-3.5 py-1.5 rounded-2xl border-3 border-emerald-500 bg-emerald-50/95 text-emerald-700 font-black text-sm sm:text-base uppercase tracking-wider -rotate-12 shadow-xl flex items-center gap-1.5"
        >
          <span>✓</span>
          <span>ĐÃ THUỘC</span>
        </div>
      )}

      {/* Stamp: CHƯA NHỚ (Vuốt trái) */}
      {showLeft && (
        <div
          style={{
            opacity: exitDirection === 'left' ? 1 : Math.min(1, Math.max(0, (-dragOffset.x - 25) / 55)),
          }}
          className="absolute top-6 right-6 z-30 pointer-events-none px-3.5 py-1.5 rounded-2xl border-3 border-rose-500 bg-rose-50/95 text-rose-700 font-black text-sm sm:text-base uppercase tracking-wider rotate-12 shadow-xl flex items-center gap-1.5"
        >
          <span>✕</span>
          <span>CHƯA NHỚ</span>
        </div>
      )}

      {/* Stamp: TẠM HIỂU (Vuốt lên / xuống) */}
      {showVertical && (
        <div
          style={{
            opacity:
              exitDirection === 'up' || exitDirection === 'down'
                ? 1
                : Math.min(1, Math.max(0, (Math.abs(dragOffset.y) - 25) / 55)),
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none px-4 py-2 rounded-2xl border-3 border-amber-500 bg-amber-50/95 text-amber-800 font-black text-sm sm:text-base uppercase tracking-wider shadow-2xl flex items-center gap-1.5"
        >
          <span>⚡</span>
          <span>TẠM HIỂU</span>
        </div>
      )}
    </>
  );
}
