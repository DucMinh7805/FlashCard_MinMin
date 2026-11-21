import React from 'react';

/**
 * StudyGestureHintBar: Thanh chỉ dẫn vuốt & chạm đồng nhất trên cả 2 mặt thẻ.
 * Giúp người dùng biết rõ: Vuốt trái (Chưa nhớ), Chạm (Lật/Xem đáp án), Vuốt phải (Đã thuộc).
 */
export default function StudyGestureHintBar({ isFlipped }) {
  return (
    <div className="w-full flex items-center justify-between px-2 text-[10px] sm:text-[11px] font-semibold select-none shrink-0 min-h-[22px]">
      <span className="flex items-center gap-1 text-rose-600 font-semibold">
        <span className="text-sm leading-none">←</span> Vuốt: Chưa nhớ
      </span>
      <span className="px-2.5 py-0.5 rounded-full bg-white/85 border border-slate-200/90 shadow-xs text-sky-800 font-semibold flex items-center gap-1 text-[11px]">
        <span>👆</span>
        <span>{isFlipped ? 'Chạm: Lật câu hỏi' : 'Chạm: Xem đáp án'}</span>
        <span className="text-amber-700 font-semibold hidden sm:inline">• ↕ Tạm hiểu</span>
      </span>
      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
        Vuốt: Đã thuộc <span className="text-sm leading-none">→</span>
      </span>
    </div>
  );
}
