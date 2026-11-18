import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Undo2,
  MoreHorizontal,
  Shuffle,
  Edit3,
  RotateCw,
  Lightbulb,
  CheckCircle,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { computeStatsForCards, getCardProgress } from '../lib/spacedRepetition';

function formatClozeParts(rawText, revealed) {
  const parts = [];
  const regex = /\{\{c\d+::(.*?)\}\}/g;
  let lastIndex = 0;
  let match;
  let idx = 0;
  while ((match = regex.exec(rawText || '')) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t_${idx++}`}>{rawText.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <span key={`c_${idx++}`} className={revealed ? 'cloze-revealed' : 'cloze-blank'}>
        {revealed ? match[1] : '[ ... ]'}
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < (rawText || '').length) {
    parts.push(<span key={`t_${idx++}`}>{rawText.slice(lastIndex)}</span>);
  }
  return parts;
}

export default function StudyView({
  session,
  progressMap,
  undoCount,
  getCardsByDeckIds,
  onExit,
  onFlip,
  onToggleHint,
  onRate,
  onUndo,
  onShuffle,
  onChangeFilter,
  onChangeDirection,
  onEditCard,
  onRestartSession,
}) {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const allSessionCards = getCardsByDeckIds(session.deckIds);
  const st = computeStatsForCards(allSessionCards, progressMap);
  const isComplete = session.currentIndex >= session.queue.length;
  const card = !isComplete ? session.queue[session.currentIndex] : null;
  const prog = card ? getCardProgress(progressMap, card.id) : null;

  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Space') {
        e.preventDefault();
        onFlip();
      } else if (e.key === '1') {
        onRate('red');
      } else if (e.key === '2') {
        onRate('yellow');
      } else if (e.key === '3') {
        onRate('green');
      } else if (e.key.toLowerCase() === 'z') {
        onUndo();
      } else if (e.key.toLowerCase() === 'h') {
        onToggleHint();
      } else if (e.key.toLowerCase() === 'e') {
        onEditCard();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onFlip, onRate, onUndo, onToggleHint, onEditCard]);

  const pct = session.queue.length
    ? Math.round((Math.min(session.currentIndex, session.queue.length) / session.queue.length) * 100)
    : 0;

  let useReverse = session.direction === 'back_to_front';
  if (session.direction === 'mixed') useReverse = session.currentIndex % 2 === 1;
  if (card?.type === 'cloze') useReverse = false;

  const typeLabelMap = {
    basic: 'Hỏi - Đáp (Basic)',
    cloze: 'Điền khuyết (Cloze)',
    case: 'Tình huống lâm sàng (Case)',
  };

  const statusBadgeMap = {
    red: { label: 'Chưa nhớ', bg: 'bg-rose-100 text-rose-700 border-rose-200' },
    yellow: { label: 'Tạm hiểu', bg: 'bg-amber-100 text-amber-700 border-amber-200' },
    green: { label: `Đã thuộc (Hộp ${prog?.box || 1})`, bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  };

  const currentBadge = (prog && statusBadgeMap[prog.status]) || {
    label: 'Mới',
    bg: 'bg-sky-100 text-sky-700 border-sky-200',
  };

  return (
    <section className="space-y-3 pb-28">
      {/* Top Study Bar: 1 line, only lesson title, options menu */}
      <div className="glass-panel rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 shadow-sm">
        <button
          type="button"
          onClick={onExit}
          className="glass-pill px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quay lại</span>
        </button>

        <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md text-center">
          {session.title}
        </h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={undoCount === 0}
            onClick={onUndo}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 transition"
            title="Hoàn tác thẻ vừa chấm (Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOptionsOpen((v) => !v)}
              className={`glass-pill w-8 h-8 rounded-xl flex items-center justify-center transition ${
                optionsOpen ? 'bg-sky-100 text-sky-700 border-sky-300' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tùy chọn học & Lọc thẻ"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {optionsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOptionsOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 glass-panel bg-white/95 rounded-2xl p-3 z-50 shadow-2xl border border-white/90 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Bộ lọc thẻ ôn tập
                    </label>
                    <select
                      value={session.filterMode}
                      onChange={(e) => {
                        onChangeFilter(e.target.value);
                        setOptionsOpen(false);
                      }}
                      className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800"
                    >
                      <option value="all">Tất cả thẻ bài học</option>
                      <option value="due">Đến hạn & Chưa nhớ (Spaced)</option>
                      <option value="red_yellow">Chỉ thẻ Đỏ & Vàng</option>
                      <option value="chunk20">Chia chặng 20 thẻ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Chiều lật thẻ
                    </label>
                    <select
                      value={session.direction}
                      onChange={(e) => {
                        onChangeDirection(e.target.value);
                        setOptionsOpen(false);
                      }}
                      className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800"
                    >
                      <option value="front_to_back">Thuận (Trước → Sau)</option>
                      <option value="back_to_front">Ngược (Sau → Trước)</option>
                      <option value="mixed">Trộn chiều ngẫu nhiên</option>
                    </select>
                  </div>

                  <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onShuffle();
                        setOptionsOpen(false);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-sky-600" />
                      <span>Trộn ngẫu nhiên</span>
                    </button>
                    {!isComplete && (
                      <button
                        type="button"
                        onClick={() => {
                          onEditCard();
                          setOptionsOpen(false);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1"
                        title="Sửa thẻ hiện tại"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Sửa</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="glass-panel rounded-2xl px-3.5 py-2 space-y-1.5 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            {isComplete
              ? `Hoàn tất ${session.queue.length} / ${session.queue.length} thẻ`
              : `Thẻ ${session.currentIndex + 1} / ${session.queue.length}`}
          </span>
          <div className="flex items-center gap-2.5 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {st.red}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {st.yellow}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {st.green}
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Main Flashcard Card */}
      {!isComplete && card ? (
        <div
          onClick={onFlip}
          className="glass-panel rounded-3xl p-5 sm:p-7 min-h-[360px] flex flex-col justify-between cursor-pointer select-none shadow-md hover:border-sky-300 transition"
        >
          {/* Card Top: Type badge & Status badge (NO redundant lesson name) */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full glass-pill text-sky-800 font-bold border-sky-200">
              {typeLabelMap[card.type] || 'Basic'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentBadge.bg}`}>
              {currentBadge.label}
            </span>
          </div>

          {/* Card Scrollable Content Area */}
          <div className="my-auto py-5 space-y-4 text-center max-h-[calc(100vh-270px)] overflow-y-auto px-1 pr-1.5">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-sky-600 font-bold">
                {card.type === 'cloze'
                  ? session.isFlipped
                    ? 'Mặt trước • Đã điền khuyết'
                    : 'Mặt trước • Điền vào chỗ trống [...]'
                  : useReverse
                    ? 'Chiều ngược • Đáp án → Đoán thuật ngữ'
                    : 'Mặt trước • Thuật ngữ / Câu hỏi'}
              </p>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                {card.type === 'cloze'
                  ? formatClozeParts(card.front, session.isFlipped)
                  : useReverse
                    ? card.back
                    : card.front}
              </div>
            </div>

            {card.image && card.image.trim() && (
              <div className="max-w-md mx-auto pt-2">
                <img
                  src={card.image.trim()}
                  alt="Card illustration"
                  className="max-h-52 mx-auto rounded-2xl border border-slate-200/80 shadow-md object-contain"
                />
              </div>
            )}

            {card.hint && card.hint.trim() && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHint();
                  }}
                  className="glass-pill px-3 py-1 rounded-full text-xs font-semibold text-amber-700 border-amber-200/80 inline-flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>{session.hintVisible ? 'Ẩn gợi ý' : 'Xem gợi ý (Phím H)'}</span>
                </button>
                {session.hintVisible && (
                  <p className="mt-2 text-xs sm:text-sm text-amber-800 bg-amber-50/90 border border-amber-300/80 rounded-xl px-3.5 py-2 max-w-lg mx-auto shadow-sm">
                    Gợi ý: {card.hint}
                  </p>
                )}
              </div>
            )}

            {/* Flipped Answer Area */}
            {session.isFlipped && (
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
                      Giải thích lâm sàng / Ghi chú
                    </p>
                    <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {card.extra}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Keyboard Hints Footer (Hidden on Mobile) */}
          <div className="hidden md:flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>
              {session.isFlipped
                ? 'Chọn mức độ hiểu bên dưới (Phím 1, 2, 3)'
                : 'Chạm vào thẻ hoặc nhấn Phím Space để lật đáp án'}
            </span>
            <span>Phím tắt: Space (Lật) • 1 (Đỏ) • 2 (Vàng) • 3 (Xanh) • Z (Undo)</span>
          </div>
        </div>
      ) : (
        /* Completion Screen */
        <div className="glass-panel rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 text-2xl mx-auto shadow-sm">
            🎉
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">Hoàn thành phiên ôn tập!</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Bạn đã duyệt qua {session.reviewedCount} lượt thẻ trong phiên này. Hiện còn {st.red} thẻ Chưa nhớ (Đỏ) và{' '}
            {st.yellow} thẻ Tạm hiểu (Vàng).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onRestartSession('red_yellow')}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95"
            >
              Ôn lại thẻ Chưa nhớ & Tạm hiểu
            </button>
            <button
              type="button"
              onClick={() => onRestartSession('all')}
              className="glass-pill px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              Học lại toàn bộ bài
            </button>
            <button
              type="button"
              onClick={onExit}
              className="glass-pill px-4 py-2.5 rounded-xl text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition"
            >
              Về danh sách bài học
            </button>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM ACTION BAR: Sticky/Fixed at bottom for effortless one-handed thumb tap without scrolling */}
      {!isComplete && card && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-200/90 px-3 sm:px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <div className="max-w-2xl mx-auto">
            {session.isFlipped ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onRate('red')}
                  className="rounded-2xl p-2.5 sm:p-3 text-center bg-rose-50/90 border border-rose-200/90 text-rose-700 hover:bg-rose-100 active:scale-95 transition shadow-sm flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Chưa nhớ
                  </span>
                  <span className="text-[10px] text-rose-500 hidden sm:inline">Lặp lại sau 3 thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRate('yellow')}
                  className="rounded-2xl p-2.5 sm:p-3 text-center bg-amber-50/90 border border-amber-200/90 text-amber-800 hover:bg-amber-100 active:scale-95 transition shadow-sm flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Tạm hiểu
                  </span>
                  <span className="text-[10px] text-amber-600 hidden sm:inline">Ôn cuối phiên</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRate('green')}
                  className="rounded-2xl p-2.5 sm:p-3 text-center bg-emerald-50/90 border border-emerald-200/90 text-emerald-800 hover:bg-emerald-100 active:scale-95 transition shadow-sm flex flex-col items-center justify-center gap-0.5"
                >
                  <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Đã thuộc
                  </span>
                  <span className="text-[10px] text-emerald-600 hidden sm:inline">Giãn cách ôn</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onFlip}
                className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Chạm thẻ hoặc bấm vào đây để lật đáp án</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
