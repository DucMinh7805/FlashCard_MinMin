import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Undo2,
  MoreHorizontal,
  Shuffle,
  Edit3,
  Lightbulb,
  CheckCircle,
  X,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ImageOff,
  ZoomIn,
  FileText,
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
  onViewDeckNote,
}) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Swipe & Tap Gestures State
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(null); // 'left' | 'right' | 'up' | 'down' | null
  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const dragCurrentRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const lastFlipTimeRef = useRef(0);
  const wasSwipeRef = useRef(false);
  const cardScrollRef = useRef(null);
  const rafRef = useRef(null);

  const isContentScrollable = () => {
    if (!cardScrollRef.current) return false;
    return cardScrollRef.current.scrollHeight > cardScrollRef.current.clientHeight + 8;
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const triggerFlip = () => {
    const now = Date.now();
    if (now - lastFlipTimeRef.current < 250) return; // Chống double-tap / ghost click
    lastFlipTimeRef.current = now;
    onFlip();
  };

  const allSessionCards = getCardsByDeckIds(session.deckIds);
  const st = computeStatsForCards(allSessionCards, progressMap);
  const isComplete = session.currentIndex >= session.queue.length;
  const card = !isComplete ? session.queue[session.currentIndex] : null;
  const prog = card ? getCardProgress(progressMap, card.id) : null;

  useEffect(() => {
    setImgError(false);
    setDragOffset({ x: 0, y: 0 });
    setExitDirection(null);
    setIsDragging(false);
    isPointerDownRef.current = false;
    hasMovedRef.current = false;
  }, [card?.id]);

  const triggerSwipe = (dir, rateColor) => {
    if (exitDirection) return;
    wasSwipeRef.current = true;
    setExitDirection(dir);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(18);
      } catch (_) {}
    }
    const targetX =
      dir === 'right' ? window.innerWidth * 1.2 : dir === 'left' ? -window.innerWidth * 1.2 : 0;
    const targetY =
      dir === 'up' ? -window.innerHeight * 1.2 : dir === 'down' ? window.innerHeight * 1.2 : 0;
    setDragOffset({ x: targetX, y: targetY });

    setTimeout(() => {
      onRate(rateColor);
      setDragOffset({ x: 0, y: 0 });
      setExitDirection(null);
      setIsDragging(false);
      isPointerDownRef.current = false;
      hasMovedRef.current = false;
      setTimeout(() => {
        wasSwipeRef.current = false;
      }, 250);
    }, 180);
  };

  const handlePointerDown = (e) => {
    if (exitDirection) return;

    // 1. Tránh xung đột mép trái iOS Safari / PWA Back gesture (< 28px hoặc > width - 20px)
    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    if (clientX < 28 || (typeof window !== 'undefined' && clientX > window.innerWidth - 20)) {
      return;
    }

    // 2. Bỏ qua nếu người dùng ấn vào các nút con (Button xem Gợi ý, Phóng to ảnh...)
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.no-drag')) {
      return;
    }

    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    dragCurrentRef.current = { x: e.clientX, y: e.clientY };
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current || exitDirection) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragCurrentRef.current = { x: e.clientX, y: e.clientY };

    const scrollable = isContentScrollable();

    // 3. Xung đột thẻ Y khoa dài:
    // Nếu thẻ có nội dung dài (bị tràn chiều cao) và cử chỉ ngón tay thiên về cuộn dọc:
    // Nhường 100% cho việc cuộn đọc văn bản mượt mà, không drag thẻ!
    if (scrollable && Math.abs(dy) > Math.abs(dx)) {
      if (isDragging) {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
      }
      return;
    }

    if (!hasMovedRef.current && (Math.abs(dx) > 6 || (!scrollable && Math.abs(dy) > 6))) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      // 90fps / 120fps hardware sync qua requestAnimationFrame
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragOffset({ x: dx, y: scrollable ? 0 : dy });
      });
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const dx = dragCurrentRef.current.x - dragStartRef.current.x;
    const dy = dragCurrentRef.current.y - dragStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    const wasDragging = hasMovedRef.current;
    const scrollable = isContentScrollable();

    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    hasMovedRef.current = false;

    // Chạm (Tap nhẹ): không kéo hoặc khoảng cách dịch chuyển nhỏ (< 30px) -> Lật thẻ ngay!
    if (!wasDragging || dist < 30) {
      triggerFlip();
      return;
    }

    // Vuốt thẻ (Swipe): khoảng cách vuốt rõ ràng (>= 50px)
    const SWIPE_THRESHOLD = 50;

    // Vuốt ngang (Ưu tiên số 1): Trái = Chưa nhớ, Phải = Đã thuộc
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx > SWIPE_THRESHOLD) {
        triggerSwipe('right', 'green'); // Vuốt phải -> Đã thuộc
        return;
      }
      if (dx < -SWIPE_THRESHOLD) {
        triggerSwipe('left', 'red'); // Vuốt trái -> Chưa nhớ
        return;
      }
    } else if (!scrollable) {
      // Chỉ cho phép vuốt dọc chấm Tạm hiểu khi thẻ NGẮN (không có thanh cuộn)
      if (dy < -SWIPE_THRESHOLD) {
        triggerSwipe('up', 'yellow'); // Vuốt lên -> Tạm hiểu
        return;
      }
      if (dy > SWIPE_THRESHOLD) {
        triggerSwipe('down', 'yellow'); // Vuốt xuống -> Tạm hiểu
        return;
      }
    }
  };

  const handlePointerCancel = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    hasMovedRef.current = false;
  };

  useEffect(() => {
    if (!lightboxImg) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setLightboxImg(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightboxImg]);

  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Space') {
        e.preventDefault();
        triggerFlip();
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
    basic: 'Hỏi - Đáp thường',
    cloze: 'Điền vào chỗ trống',
    case: 'Ca lâm sàng',
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

  const isCaseOrLong = card?.type === 'case' || (card?.front && card.front.length > 80);

  return (
    <section className="fixed inset-0 z-50 flex flex-col justify-between p-2.5 sm:p-4 bg-gradient-to-br from-slate-100/95 via-sky-50/50 to-indigo-50/50 backdrop-blur-2xl overflow-hidden overscroll-none touch-none select-none h-[100dvh] w-screen">
      {/* Top Study Bar: 1 unified bar with counter, title, actions, and integrated 3px progress line */}
      <div className="relative glass-panel rounded-2xl px-3 sm:px-4 py-2 shadow-sm border border-white/90 overflow-hidden shrink-0">
        <div className="flex items-center justify-between gap-2">
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
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[140px] sm:max-w-xs text-center">
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

      {/* Swipe Gesture & Tap Hint bar */}
      {!isComplete && card && (
        <div className="flex items-center justify-between px-2 text-[10px] sm:text-[11px] text-slate-500 font-medium select-none shrink-0 min-h-[20px]">
          {session.isFlipped ? (
            <div className="w-full flex items-center justify-between text-[11px] font-semibold select-none">
              <span className="flex items-center gap-1 text-rose-600">
                <span>←</span> Vuốt trái: Chưa nhớ
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span>↕</span> Lên/Xuống: Tạm hiểu
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                Vuốt phải: Đã thuộc <span>→</span>
              </span>
            </div>
          ) : (
            <div className="w-full text-center text-slate-500 font-medium flex items-center justify-center gap-1.5 text-xs animate-pulse">
              <span>👆</span>
              <span>Chạm thẻ để xem đáp án • Phím Cách (Space)</span>
            </div>
          )}
        </div>
      )}

      {/* Main Flashcard Card: Tràn đầy khoảng trống, căn giữa nội dung, chạm để lật và hỗ trợ vuốt Swipe 4 hướng */}
      {!isComplete && card ? (
        <div
          onClick={(e) => {
            if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.no-drag')) return;
            if (wasSwipeRef.current) return;
            triggerFlip();
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.065}deg)`,
            transition: isDragging
              ? 'none'
              : 'transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.18s ease',
            opacity: exitDirection ? 0.2 : 1,
            willChange: 'transform, opacity',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
          className="glass-panel rounded-3xl p-4 sm:p-7 flex-1 min-h-0 flex flex-col justify-between select-none shadow-lg relative overflow-hidden cursor-pointer border border-white/90 active:scale-[0.995] transition-transform"
        >
          {/* Stamps phản hồi thị giác khi vuốt */}
          {((dragOffset.x > 25 && !exitDirection) || exitDirection === 'right') && (
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

          {((dragOffset.x < -25 && !exitDirection) || exitDirection === 'left') && (
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

          {(((Math.abs(dragOffset.y) > 25 && Math.abs(dragOffset.y) > Math.abs(dragOffset.x)) && !exitDirection) ||
            exitDirection === 'up' ||
            exitDirection === 'down') && (
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

          {/* Card Top: Type badge & Status badge (NO redundant lesson name) */}
          <div className="flex items-center justify-between gap-2 text-xs shrink-0">
            <span className="px-2.5 py-0.5 rounded-full glass-pill text-sky-800 font-bold border-sky-200">
              {typeLabelMap[card.type] || 'Hỏi - Đáp thường'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentBadge.bg}`}>
              {currentBadge.label}
            </span>
          </div>

          {/* Card Scrollable Content Area: touch-pan-y giữ nguyên cuộn dọc 100% khi thẻ Y khoa dài */}
          <div
            ref={cardScrollRef}
            className="my-auto py-2 space-y-3 max-h-full overflow-y-auto px-1 pr-1.5 flex flex-col justify-center touch-pan-y overscroll-contain select-text"
          >
            <div className={`space-y-2 ${isCaseOrLong ? 'text-left' : 'text-center'}`}>
              <p className="text-[11px] uppercase tracking-widest text-sky-600 font-bold">
                {card.type === 'cloze'
                  ? session.isFlipped
                    ? 'Mặt trước • Đã điền vào chỗ trống'
                    : 'Mặt trước • Điền vào chỗ trống [...]'
                  : card.type === 'case'
                    ? 'Mặt trước • Ca lâm sàng'
                    : useReverse
                      ? 'Chiều ngược • Đáp án → Đoán thuật ngữ'
                      : 'Mặt trước • Câu hỏi'}
              </p>
              <div
                className={`${
                  isCaseOrLong
                    ? 'text-left text-base sm:text-lg md:text-xl font-semibold text-slate-900 leading-relaxed bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/70 shadow-sm'
                    : 'text-center text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-relaxed'
                } whitespace-pre-line`}
              >
                {card.type === 'cloze'
                  ? formatClozeParts(card.front, session.isFlipped)
                  : useReverse
                    ? card.back
                    : card.front}
              </div>
            </div>

            {card.image && card.image.trim() && (
              <div className="max-w-md mx-auto pt-2 text-center">
                {imgError ? (
                  <div className="glass-card rounded-2xl p-3 bg-slate-50 text-xs text-slate-500 border border-slate-200 flex items-center justify-center gap-2">
                    <ImageOff className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Không tải được ảnh minh họa</span>
                  </div>
                ) : (
                  <div
                    className="relative inline-block group cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImg(card.image.trim());
                    }}
                    title="Bấm để phóng to ảnh xem chi tiết"
                  >
                    <img
                      src={card.image.trim()}
                      alt="Minh họa bài học"
                      onError={() => setImgError(true)}
                      className="max-h-56 mx-auto rounded-2xl border border-slate-200/80 shadow-md object-contain hover:brightness-95 transition"
                    />
                    <div className="absolute bottom-2 right-2 glass-pill bg-white/90 px-2 py-0.5 rounded-lg text-[10px] text-slate-700 font-semibold shadow flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <ZoomIn className="w-3 h-3 text-sky-600" />
                      <span>Phóng to</span>
                    </div>
                  </div>
                )}
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
                  <span>{session.hintVisible ? 'Ẩn gợi ý' : 'Gợi ý nhỏ (Phím H)'}</span>
                </button>
                {session.hintVisible && (
                  <p className="mt-2 text-xs sm:text-sm text-amber-800 bg-amber-50/90 border border-amber-300/80 rounded-xl px-3.5 py-2 max-w-lg mx-auto shadow-sm">
                    Gợi ý nhỏ: {card.hint}
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
                      Giải thích thêm / Ghi chú
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
            {st.red + st.yellow === 0 ? '🏆' : '🎉'}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
            {st.red + st.yellow === 0 ? 'Tuyệt vời! Đã thuộc 100% bài học!' : 'Hoàn thành phiên ôn tập!'}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {st.red + st.yellow === 0 ? (
              <span>
                Toàn bộ <strong>{allSessionCards.length} thẻ</strong> đều đã được ghi nhớ vững vàng trong phiên này. Hãy nghỉ ngơi hoặc ôn các bài khác nhé!
              </span>
            ) : (
              <span>
                Bạn đã duyệt qua {session.reviewedCount} lượt thẻ trong phiên này. Hiện còn{' '}
                <strong className="text-rose-600 font-bold">{st.red} thẻ Chưa nhớ</strong> và{' '}
                <strong className="text-amber-600 font-bold">{st.yellow} thẻ Tạm hiểu</strong>.
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {st.red + st.yellow > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => onRestartSession('red_yellow')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95"
                >
                  Ôn lại thẻ Chưa nhớ & Tạm hiểu ({st.red + st.yellow})
                </button>
                <button
                  type="button"
                  onClick={() => onRestartSession('all')}
                  className="glass-pill px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  Học lại toàn bộ bài
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onRestartSession('all')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95"
              >
                Học lại toàn bộ bài
              </button>
            )}
            <button
              type="button"
              onClick={onExit}
              className="glass-pill px-4 py-2.5 rounded-xl text-xs sm:text-sm text-slate-600 hover:text-slate-800 transition"
            >
              Về danh sách bài học
            </button>
          </div>
        </div>
      )}





      {/* iOS-STYLE ACTION SHEET (Mounted at root z-50 to completely prevent Stacking Context traps) */}
      {optionsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          {/* Backdrop click to dismiss */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setOptionsOpen(false)}
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
                onClick={() => setOptionsOpen(false)}
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
                  setOptionsOpen(false);
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
                  setOptionsOpen(false);
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
                    setOptionsOpen(false);
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
                    setOptionsOpen(false);
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
                      setOptionsOpen(false);
                      onEditCard(card);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sửa thẻ này</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOptionsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm mt-1 active:scale-95 transition"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Overlay for Medical & Anatomical Images */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[92vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute -top-11 right-0 sm:-right-2 glass-pill bg-white/95 hover:bg-white text-slate-800 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-bold transition active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Đóng (Esc)</span>
            </button>
            <img
              src={lightboxImg}
              alt="Minh họa chi tiết"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl border border-white/20 object-contain select-none"
            />
          </div>
        </div>
      )}
    </section>
  );
}
