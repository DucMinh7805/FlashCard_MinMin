import React from 'react';
import { Play } from 'lucide-react';

export default function ResumeBanner({ resumeCandidate, onDismiss, onResume }) {
  if (!resumeCandidate) return null;

  return (
    <div className="glass-panel rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-sm border-l-4 border-l-sky-500">
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
          Đang học dở: {resumeCandidate.title}
        </p>
        <p className="text-[11px] text-slate-500">
          Đã học {resumeCandidate.currentIndex} / {resumeCandidate.queue.length} thẻ
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="glass-pill px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800"
        >
          Bỏ qua
        </button>
        <button
          type="button"
          onClick={onResume}
          className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Tiếp tục học</span>
        </button>
      </div>
    </div>
  );
}
