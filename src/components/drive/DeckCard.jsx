import React from 'react';
import { GripVertical, BookOpen, FileText, MoreVertical, Play } from 'lucide-react';
import { computeStatsForCards } from '../../lib/spacedRepetition';

export default function DeckCard({
  deck,
  progressMap,
  openMenuDeckId,
  setOpenMenuDeckId,
  setDraggedItem,
  setDragOverFolderId,
  onViewNote,
  onStartStudy,
}) {
  const st = computeStatsForCards(deck.cards, progressMap);
  const isMenuOpen = openMenuDeckId === deck.id;

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ type: 'deck', id: deck.id, name: deck.name })
        );
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ type: 'deck', id: deck.id, name: deck.name });
      }}
      onDragEnd={() => {
        setDraggedItem(null);
        setDragOverFolderId(null);
      }}
      className={`glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-sky-300 transition cursor-grab active:cursor-grabbing ${
        isMenuOpen ? 'relative z-40' : 'relative z-10'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <GripVertical
              className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab hover:text-sky-600 transition"
              title="Kéo bài học này thả vào thư mục khác (trên điện thoại: dùng menu ⋮ Di chuyển)"
            />
            <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base line-clamp-2 leading-snug break-words">
              {deck.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">
              {st.total} thẻ •{' '}
              {st.due > 0 ? (
                <span className="text-amber-700 font-semibold">{st.due} cần ôn</span>
              ) : (
                <span className="text-emerald-700 font-semibold">Đã xong hôm nay</span>
              )}
              {(st.newCount || 0) > 0 && <span className="text-slate-400"> • {st.newCount} mới</span>}
            </span>

            {deck.note?.trim() && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewNote(deck);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200/80 transition"
                title="Bấm để xem ghi chú bài học"
              >
                <FileText className="w-3 h-3 text-amber-600" />
                <span>Xem Note</span>
              </button>
            )}
          </div>
        </div>

        {/* Single 3-dot Action Menu button */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuDeckId(deck.id);
            }}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
            title="Tùy chọn bài học"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Color Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden flex shadow-inner">
        {st.total > 0 && st.green > 0 && (
          <div
            className="bg-emerald-500 h-full shrink-0"
            style={{ width: `${(st.green / st.total) * 100}%` }}
            title={`Đã thuộc: ${st.green}`}
          />
        )}
        {st.total > 0 && st.yellow > 0 && (
          <div
            className="bg-amber-400 h-full shrink-0"
            style={{ width: `${(st.yellow / st.total) * 100}%` }}
            title={`Tạm hiểu: ${st.yellow}`}
          />
        )}
        {st.total > 0 && st.red > 0 && (
          <div
            className="bg-rose-500 h-full shrink-0"
            style={{ width: `${(st.red / st.total) * 100}%` }}
            title={`Chưa nhớ: ${st.red}`}
          />
        )}
        {st.total > 0 && (st.newCount || 0) > 0 && (
          <div
            className="bg-slate-300 h-full shrink-0"
            style={{ width: `${((st.newCount || 0) / st.total) * 100}%` }}
            title={`Chưa học: ${st.newCount || 0}`}
          />
        )}
      </div>

      {/* Bottom Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px] text-slate-500">
          {st.due > 0 ? (
            <>
              Hôm nay cần ôn: <strong className="text-amber-700 font-bold">{st.due} thẻ</strong>
            </>
          ) : (
            <span className="text-emerald-700 font-semibold">Tất cả đều thuộc</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          {st.red + st.yellow > 0 && (
            <button
              type="button"
              onClick={() =>
                onStartStudy({
                  title: deck.name,
                  deckIds: [deck.id],
                  filterMode: 'red_yellow',
                })
              }
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 hover:bg-amber-100 font-medium text-xs transition"
            >
              Chưa thuộc ({st.red + st.yellow})
            </button>
          )}
          <button
            type="button"
            onClick={() => onStartStudy({ title: deck.name, deckIds: [deck.id], filterMode: 'all' })}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center gap-1"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Học ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
