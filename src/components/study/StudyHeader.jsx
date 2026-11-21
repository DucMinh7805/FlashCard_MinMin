import React from 'react';
import { ArrowLeft, Undo2, MoreHorizontal } from 'lucide-react';

export default function StudyHeader({
  session,
  isComplete,
  pct,
  st,
  undoCount,
  onExit,
  onUndo,
  setOptionsOpen,
}) {
  return (
    <div className="shrink-0 z-30 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xs transition-all relative overflow-hidden mb-1 sm:mb-2">
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 gap-2">
        {/* Back button */}
        <button
          type="button"
          onClick={onExit}
          className="glass-pill px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition shrink-0 active:scale-95"
          title="Quay lại danh sách bài học"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quay lại</span>
        </button>

        {/* Centered Title & Card Counter */}
        <div className="flex items-center gap-2 min-w-0 justify-center">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[150px] sm:max-w-xs text-center">
            {session.title}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100/90 text-slate-700 font-bold text-[11px] shrink-0 border border-slate-200/60">
            {isComplete
              ? `${session.queue.length} / ${session.queue.length}`
              : `${session.currentIndex + 1} / ${session.queue.length}`}
          </span>
          <div className="hidden md:flex items-center gap-2 text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> {st.red}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> {st.yellow}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {st.green}
            </span>
          </div>
        </div>

        {/* Right actions: Undo + iOS Action Sheet Trigger (⋯) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={undoCount === 0}
            onClick={onUndo}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 transition active:scale-95"
            title="Hoàn tác thẻ vừa chấm (Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setOptionsOpen(true)}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition active:scale-95"
            title="Tùy chọn học & Lọc thẻ"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3px edge-to-edge Progress Bar attached to the bottom rim */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-200/80 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
