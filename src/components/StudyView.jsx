import React, { useEffect } from 'react';
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

  const pct = session.queue.length ? Math.round((Math.min(session.currentIndex, session.queue.length) / session.queue.length) * 100) : 0;

  let useReverse = session.direction === 'back_to_front';
  if (session.direction === 'mixed') useReverse = session.currentIndex % 2 === 1;
  if (card?.type === 'cloze') useReverse = false;

  const typeLabelMap = { basic: 'Hỏi - Đáp (Basic)', cloze: 'Điền khuyết (Cloze)', case: 'Tình huống (Case)' };
  const statusTextMap = {
    red: '🔴 Chưa nhớ / Cần ôn',
    yellow: '🟡 Tạm hiểu',
    green: `🟢 Đã nhớ (Hộp ${prog?.box || 1})`,
  };

  return (
    <section className="space-y-4">
      {/* Top Study Bar */}
      <div className="glass-panel rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExit}
            className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1"
          >
            <span>←</span>
            <span>Quay lại thư mục</span>
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">{session.title}</h2>
            <p className="text-xs text-slate-300">{card ? `Bộ: ${card.deckName || session.title}` : 'Hoàn thành phiên học'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={session.filterMode}
            onChange={(e) => onChangeFilter(e.target.value)}
            className="glass-input rounded-xl px-2.5 py-1.5 text-xs"
          >
            <option value="all">Tất cả thẻ</option>
            <option value="due">Đến hạn & Chưa nhớ (Spaced)</option>
            <option value="red_yellow">Chỉ thẻ Đỏ & Vàng</option>
            <option value="chunk20">Chia chặng 20 thẻ</option>
          </select>

          <select
            value={session.direction}
            onChange={(e) => onChangeDirection(e.target.value)}
            className="glass-input rounded-xl px-2.5 py-1.5 text-xs"
          >
            <option value="front_to_back">Thuận (Trước ➔ Sau)</option>
            <option value="back_to_front">Ngược (Sau ➔ Trước)</option>
            <option value="mixed">Trộn chiều ngẫu nhiên</option>
          </select>

          <button type="button" onClick={onShuffle} className="glass-pill px-2.5 py-1.5 rounded-xl text-xs text-sky-200">
            🔀 Trộn
          </button>

          <button
            type="button"
            disabled={undoCount === 0}
            onClick={onUndo}
            className="glass-pill px-2.5 py-1.5 rounded-xl text-xs text-amber-200 disabled:opacity-40"
          >
            ↩ Hoàn tác
          </button>

          {!isComplete && (
            <button type="button" onClick={onEditCard} className="glass-pill px-2.5 py-1.5 rounded-xl text-xs text-slate-200">
              ✎ Sửa thẻ
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-panel rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-200">
            {isComplete ? `Hoàn tất ${session.queue.length} / ${session.queue.length} lượt thẻ` : `Thẻ ${session.currentIndex + 1} / ${session.queue.length}`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-rose-300">Đỏ: {st.red}</span>
            <span className="text-amber-300">Vàng: {st.yellow}</span>
            <span className="text-emerald-300">Xanh: {st.green}</span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {!isComplete && card ? (
        <>
          <div
            onClick={onFlip}
            className="glass-panel rounded-3xl p-6 sm:p-8 min-h-[340px] flex flex-col justify-between cursor-pointer select-none"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full glass-pill text-sky-200 font-medium">
                  {typeLabelMap[card.type] || 'Basic'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full glass-pill text-slate-200">{card.deckName || session.title}</span>
              </div>
              <span className="text-[11px] text-slate-300">{statusTextMap[prog?.status] || 'Mới'}</span>
            </div>

            <div className="my-auto py-6 space-y-5 text-center">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-sky-300/90 font-semibold">
                  {card.type === 'cloze'
                    ? session.isFlipped
                      ? 'Mặt trước • Đã điền khuyết'
                      : 'Mặt trước • Điền vào chỗ trống [...]'
                    : useReverse
                      ? 'Chiều ngược • Đáp án ➔ Đoán thuật ngữ'
                      : 'Mặt trước • Thuật ngữ / Câu hỏi'}
                </p>
                <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-white leading-relaxed whitespace-pre-line">
                  {card.type === 'cloze'
                    ? formatClozeParts(card.front, session.isFlipped)
                    : useReverse
                      ? card.back
                      : card.front}
                </div>
              </div>

              {card.image && card.image.trim() && (
                <div className="max-w-md mx-auto">
                  <img src={card.image.trim()} alt="Card visual" className="max-h-52 mx-auto rounded-2xl border border-white/15 object-contain" />
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
                    className="glass-pill px-3 py-1 rounded-full text-xs text-amber-200"
                  >
                    💡 Xem gợi ý (Phím H)
                  </button>
                  {session.hintVisible && (
                    <p className="mt-2 text-sm text-amber-200/95 bg-amber-500/10 border border-amber-400/25 rounded-xl px-3.5 py-2 max-w-lg mx-auto">
                      Gợi ý: {card.hint}
                    </p>
                  )}
                </div>
              )}

              {session.isFlipped && (
                <div className="pt-5 border-t border-white/15 space-y-4 text-left max-w-2xl mx-auto">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-semibold mb-1">Đáp án / Mặt sau</p>
                    <div className="text-base sm:text-lg text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                      {useReverse ? card.front : card.back}
                    </div>
                  </div>
                  {card.extra && card.extra.trim() && (
                    <div className="glass-card rounded-2xl p-3.5 border-l-4 border-l-sky-400">
                      <p className="text-[11px] uppercase tracking-wider text-sky-300 font-semibold mb-1">Giải thích / Lâm sàng / Ghi chú</p>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">{card.extra}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
              <span>
                {session.isFlipped ? 'Chọn mức độ hiểu bên dưới (Phím 1, 2, 3)' : 'Chạm vào thẻ hoặc nhấn Phím Space để lật đáp án'}
              </span>
              <span className="hidden sm:inline">Phím tắt: Space (Lật) • 1 (Đỏ) • 2 (Vàng) • 3 (Xanh) • Z (Undo)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onRate('red')}
              className="glass-panel rounded-2xl p-3.5 text-center border-rose-400/35 hover:bg-rose-500/20 transition"
            >
              <div className="text-xs font-semibold text-rose-300">1 • Chưa nhớ</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Lặp lại sau 3 thẻ • Ôn ngày mai</div>
            </button>
            <button
              type="button"
              onClick={() => onRate('yellow')}
              className="glass-panel rounded-2xl p-3.5 text-center border-amber-400/35 hover:bg-amber-500/20 transition"
            >
              <div className="text-xs font-semibold text-amber-300">2 • Tạm hiểu</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Cuối phiên • Hẹn 2 ngày</div>
            </button>
            <button
              type="button"
              onClick={() => onRate('green')}
              className="glass-panel rounded-2xl p-3.5 text-center border-emerald-400/35 hover:bg-emerald-500/20 transition"
            >
              <div className="text-xs font-semibold text-emerald-300">3 • Đã nhớ kỹ</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Qua thẻ • Giãn lịch 4–14 ngày</div>
            </button>
          </div>
        </>
      ) : (
        <div className="glass-panel rounded-3xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-2xl mx-auto">🎉</div>
          <h3 className="text-xl font-bold text-white">Hoàn thành phiên ôn tập!</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Bạn đã duyệt qua {session.reviewedCount} lượt thẻ trong phiên này. Hiện còn {st.red} thẻ Chưa nhớ (Đỏ) và {st.yellow} thẻ Tạm hiểu (Vàng).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onRestartSession('red_yellow')}
              className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm"
            >
              Ôn lại ngay các thẻ Chưa nhớ & Tạm hiểu
            </button>
            <button
              type="button"
              onClick={() => onRestartSession('all')}
              className="glass-pill px-4 py-2 rounded-xl text-xs sm:text-sm text-sky-200"
            >
              Học lại toàn bộ bài này
            </button>
            <button type="button" onClick={onExit} className="glass-pill px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-200">
              Về cây thư mục
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
