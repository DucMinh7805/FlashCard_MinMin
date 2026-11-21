import React from 'react';
import { SlidersHorizontal, X, FileText, Shuffle, Edit3, RotateCcw } from 'lucide-react';

export default function StudyOptionsSheet({
  isOpen,
  onClose,
  session,
  allSessionCards,
  isComplete,
  card,
  onChangeFilter,
  onChangeDirection,
  onViewDeckNote,
  onShuffle,
  onEditCard,
  onRestartSession,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Action Sheet Panel */}
      <div className="relative w-full sm:max-w-md bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-white/90 space-y-4 max-h-[85vh] overflow-y-auto z-10 transition-transform">
        {/* Grab handle for mobile touch feel */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden -mt-1 mb-2" />

        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-800">Tùy chọn học & Lọc thẻ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Mode */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
            Bộ lọc thẻ ôn tập
          </label>
          <select
            value={session.filterMode}
            onChange={(e) => {
              onChangeFilter(e.target.value);
              onClose();
            }}
            className="w-full glass-input rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800"
          >
            <option value="all">Tất cả thẻ bài học ({allSessionCards.length} thẻ)</option>
            <option value="due">Đến hạn & Chưa nhớ (Spaced Repetition)</option>
            <option value="red_yellow">Chỉ thẻ Đỏ & Vàng (Chưa thuộc)</option>
            <option value="chunk20">Chia chặng 20 thẻ một lần</option>
          </select>
        </div>

        {/* Direction */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
            Chiều lật thẻ
          </label>
          <select
            value={session.direction}
            onChange={(e) => {
              onChangeDirection(e.target.value);
              onClose();
            }}
            className="w-full glass-input rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800"
          >
            <option value="front_to_back">Thuận (Trước → Sau)</option>
            <option value="back_to_front">Ngược (Sau → Trước)</option>
            <option value="mixed">Trộn chiều ngẫu nhiên</option>
          </select>
        </div>

        {/* Actions: Shuffle & Quick Edit */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {session.deckNote && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewDeckNote?.();
              }}
              className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition border border-amber-200"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Xem ghi chú bài học (Study Note)</span>
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onShuffle();
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Shuffle className="w-3.5 h-3.5 text-sky-600" />
              <span>Trộn ngẫu nhiên</span>
            </button>
            {!isComplete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                  onEditCard(card);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>Sửa thẻ này</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onRestartSession?.('all');
            }}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Bắt đầu lại bài học từ đầu (Câu 1)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm mt-1 active:scale-95 transition"
        >
          Xong
        </button>
      </div>
    </div>
  );
}
