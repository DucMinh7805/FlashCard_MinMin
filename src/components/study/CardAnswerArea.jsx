import React from 'react';

export default function CardAnswerArea({ session, card, useReverse }) {
  if (!session.isFlipped) return null;

  return (
    <div className="pt-4 border-t border-slate-200/80 space-y-3 text-left max-w-2xl mx-auto animate-fadeIn">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-emerald-700 font-bold mb-1">
          Đáp án / Mặt sau
        </p>
        <div className="text-base sm:text-lg text-slate-900 font-semibold leading-relaxed whitespace-pre-line">
          {useReverse ? card.front : card.back}
        </div>
      </div>
      {card.extra && card.extra.trim() && (
        <div className="glass-card rounded-2xl p-3 border-l-4 border-l-sky-500 bg-sky-50/60">
          <p className="text-[11px] uppercase tracking-wider text-sky-700 font-bold mb-0.5">
            Giải thích thêm / Ghi chú
          </p>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {card.extra}
          </div>
        </div>
      )}
    </div>
  );
}
