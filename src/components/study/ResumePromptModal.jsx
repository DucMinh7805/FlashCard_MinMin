import React, { useState } from 'react';
import { BookmarkCheck, RotateCcw, Play, X, Check } from 'lucide-react';

/**
 * ResumePromptModal: Hộp thoại hỏi xem có tiếp tục ôn câu đang học dở không,
 * kèm check box tròn theo yêu cầu của người dùng.
 */
export default function ResumePromptModal({
  isOpen,
  sessionData,
  onResume,
  onRestart,
  onClose,
}) {
  const [selectedOption, setSelectedOption] = useState('resume'); // 'resume' | 'restart'

  if (!isOpen || !sessionData) return null;

  const currentNum = (sessionData.currentIndex || 0) + 1;
  const total = sessionData.queue?.length || 0;
  const pct = total > 0 ? Math.round((sessionData.currentIndex / total) * 100) : 0;

  const handleConfirm = () => {
    if (selectedOption === 'resume') {
      onResume(sessionData);
    } else {
      onRestart();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/95 space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-300/80 flex items-center justify-center text-sky-600 shrink-0 shadow-xs">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                Tiếp tục bài học dở dang?
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5" title={sessionData.title}>
                {sessionData.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Checkbox Tròn Options */}
        <div className="space-y-2.5 pt-1">
          {/* Lựa chọn 1: Tiếp tục ở câu X (Mặc định) */}
          <div
            onClick={() => setSelectedOption('resume')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all flex items-start gap-3 ${
              selectedOption === 'resume'
                ? 'bg-sky-50/80 border-sky-300 shadow-xs'
                : 'bg-white/60 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {/* Checkbox tròn */}
            <div
              className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                selectedOption === 'resume'
                  ? 'border-sky-500 bg-sky-500 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedOption === 'resume' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-bold text-slate-800">
                  Tiếp tục ở câu {currentNum} / {total}
                </span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100/90 px-2 py-0.5 rounded-full border border-sky-200">
                  {pct}% đã học
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Giữ nguyên tiến độ bài học bạn đang làm dở
              </p>
            </div>
          </div>

          {/* Lựa chọn 2: Học lại từ đầu */}
          <div
            onClick={() => setSelectedOption('restart')}
            className={`cursor-pointer rounded-2xl p-3.5 border transition-all flex items-start gap-3 ${
              selectedOption === 'restart'
                ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                : 'bg-white/60 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {/* Checkbox tròn */}
            <div
              className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                selectedOption === 'restart'
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedOption === 'restart' && <Check className="w-3 h-3 stroke-[3]" />}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-800">
                Bắt đầu lại từ đầu (Câu 1)
              </span>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Bỏ qua tiến độ cũ và ôn lại từ thẻ đầu tiên
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-1.5"
          >
            {selectedOption === 'resume' ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tiếp tục học</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Học từ đầu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
