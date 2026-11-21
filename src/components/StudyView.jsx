import React, { useEffect, useState, useRef } from 'react';
import {
  Lightbulb,
  ImageOff,
  ZoomIn,
} from 'lucide-react';
import { computeStatsForCards, getCardProgress } from '../lib/spacedRepetition';
import { formatClozeParts } from '../lib/clozeUtils';
import StudyHeader from './study/StudyHeader';
import StudyOptionsSheet from './study/StudyOptionsSheet';
import StudyCompletionCard from './study/StudyCompletionCard';
import ImageLightbox from './study/ImageLightbox';

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
  const repCount = prog?.reps ?? (prog?.lastReviewed ? Math.max(1, (prog.box || 0) + 1) : 0);

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setImgError(false);
    setDragOffset({ x: 0, y: 0 });
    setExitDirection(null);
    setIsDragging(false);
    isPointerDownRef.current = false;
    hasMovedRef.current = false;
  }, [card?.id]);

  const triggerSwipe = (dir, rateColor) => {
    if (exitDirection) return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    wasSwipeRef.current = true;
    setExitDirection(dir);
    setIsDragging(false); // Cho phép CSS transition kích hoạt animation mượt mà

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch (_) {}
    }

    const flyX = typeof window !== 'undefined' ? window.innerWidth * 1.3 : 600;
    const flyY = typeof window !== 'undefined' ? window.innerHeight * 1.3 : 800;
    const targetX = dir === 'right' ? flyX : dir === 'left' ? -flyX : 0;
    const targetY = dir === 'up' ? -flyY : dir === 'down' ? flyY : 0;
    setDragOffset({ x: targetX, y: targetY });

    setTimeout(() => {
      onRate(rateColor);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setDragOffset({ x: 0, y: 0 });
      setExitDirection(null);
      setIsDragging(false);
      isPointerDownRef.current = false;
      hasMovedRef.current = false;
      setTimeout(() => {
        wasSwipeRef.current = false;
      }, 150);
    }, 220);
  };

  const handlePointerDown = (e) => {
    if (exitDirection) return;

    // 1. Tránh xung đột mép vuốt thoát trang của iOS/Android
    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    if (clientX < 16 || (typeof window !== 'undefined' && clientX > window.innerWidth - 16)) {
      return;
    }

    // 2. Bỏ qua nếu người dùng bấm trúng các nút bấm con bên trong
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }

    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch (_) {}

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

    // Nếu nội dung thẻ dài cần cuộn và người dùng vuốt dọc nhiều, ưu tiên cuộn nội dung chữ
    if (scrollable && Math.abs(dy) > Math.abs(dx) * 1.6 && Math.abs(dy) > 12) {
      if (isDragging) {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
      }
      return;
    }

    if (!hasMovedRef.current && (Math.abs(dx) > 6 || (!scrollable && Math.abs(dy) > 6))) {
      hasMovedRef.current = true;
      setIsDragging(true);
      if (typeof window !== 'undefined' && window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }

    if (hasMovedRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragOffset({ x: dx, y: scrollable ? dy * 0.35 : dy * 0.85 });
      });
    }
  };

  const endDrag = () => {
    if (!isPointerDownRef.current || exitDirection) return;
    isPointerDownRef.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const dx = dragCurrentRef.current.x - dragStartRef.current.x;
    const dy = dragCurrentRef.current.y - dragStartRef.current.y;
    const duration = Date.now() - dragStartRef.current.time;
    const dist = Math.hypot(dx, dy);

    // Chạm/Tap: Di chuyển < 18px và thời gian < 450ms -> lật mặt thẻ ngay lập tức
    const isTap = dist < 18 && duration < 450;

    if (isTap) {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      hasMovedRef.current = false;
      triggerFlip();
      return;
    }

    // Nếu thẻ chưa lật, mọi vuốt ngang dọc đều mượt mà hồi về vị trí cũ
    if (!session.isFlipped) {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      hasMovedRef.current = false;
      return;
    }

    // Khi đã lật: Vuốt 4 hướng để chấm điểm
    const THRESHOLD = 60;
    const scrollable = isContentScrollable();

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > THRESHOLD) {
        triggerSwipe('right', 'green');
        return;
      } else if (dx < -THRESHOLD) {
        triggerSwipe('left', 'red');
        return;
      }
    } else {
      if (!scrollable || Math.abs(dy) > 80) {
        if (dy < -THRESHOLD) {
          triggerSwipe('up', 'yellow');
          return;
        } else if (dy > THRESHOLD) {
          triggerSwipe('down', 'yellow');
          return;
        }
      }
    }

    // Nếu chưa đủ ngưỡng, hồi về vị trí ban đầu với animation mượt
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    hasMovedRef.current = false;
  };

  const handlePointerUp = () => endDrag();
  const handlePointerCancel = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    isPointerDownRef.current = false;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    hasMovedRef.current = false;
  };

  const useReverse =
    session.direction === 'back_to_front' ||
    (session.direction === 'mixed' && card && (card.sortOrder || 0) % 2 === 1);

  const pct =
    session.queue.length > 0
      ? Math.min(100, Math.round(((session.currentIndex + 1) / session.queue.length) * 100))
      : 0;

  const cardRotate = (dragOffset.x / 18).toFixed(2);
  const swipeIndicator =
    dragOffset.x > 40 ? 'green' : dragOffset.x < -40 ? 'red' : Math.abs(dragOffset.y) > 40 ? 'yellow' : null;

  return (
    <section className="w-full max-w-3xl mx-auto h-full flex-1 flex flex-col justify-between overflow-hidden select-none pb-0.5 sm:pb-2">
      {/* Pinned Top Bar with integrated progress rim (Never scrolls off screen) */}
      <StudyHeader
        session={session}
        isComplete={isComplete}
        pct={pct}
        st={st}
        undoCount={undoCount}
        onExit={onExit}
        onUndo={onUndo}
        setOptionsOpen={setOptionsOpen}
      />

      {/* Swipe Gesture & Tap Hint bar */}
      {!isComplete && card && (
        <div className="shrink-0 flex items-center justify-between px-2 text-[10px] sm:text-[11px] text-slate-500 font-medium select-none mb-1 sm:mb-2 min-h-[22px]">
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
              <span>
                Chạm thẻ để xem đáp án
                <span className="hidden sm:inline"> • Phím Cách (Space)</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Flashcard Card - Flex-1 stretches to fit mobile screen without blank gap */}
      {!isComplete && card ? (
        <div
          onClick={(e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            if (wasSwipeRef.current) return;
            triggerFlip();
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${cardRotate}deg)`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease-out',
            opacity: exitDirection ? 0 : 1,
            touchAction: isContentScrollable() ? 'pan-y' : 'none',
          }}
          className={`glass-card rounded-3xl p-4 sm:p-7 shadow-lg border border-white/95 flex-1 min-h-0 flex flex-col justify-between text-center cursor-pointer select-none relative overflow-hidden active:shadow-md transition-shadow ${
            swipeIndicator === 'green'
              ? 'ring-4 ring-emerald-400/80 bg-emerald-50/40'
              : swipeIndicator === 'red'
              ? 'ring-4 ring-rose-400/80 bg-rose-50/40'
              : swipeIndicator === 'yellow'
              ? 'ring-4 ring-amber-400/80 bg-amber-50/40'
              : ''
          }`}
        >
          {/* Top meta tags */}
          <div className="shrink-0 flex items-center justify-between gap-2 text-xs mb-2">
            <span className="glass-pill px-3 py-1 rounded-full text-slate-600 font-semibold text-[11px] border border-slate-200/80">
              {card.type === 'cloze'
                ? 'Điền vào chỗ trống'
                : card.type === 'case'
                ? 'Ca lâm sàng'
                : 'Hỏi - Đáp thường'}
            </span>
            <div className="flex items-center gap-1.5">
              {prog?.status === 'red' && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" title="Chưa nhớ" />
              )}
              {prog?.status === 'yellow' && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" title="Tạm hiểu" />
              )}
              {prog?.status === 'green' && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" title="Đã thuộc" />
              )}
              <span className="text-[11px] text-slate-500 font-medium">
                {repCount > 0 ? `Ôn ${repCount} lần` : 'Thẻ mới'}
              </span>
            </div>
          </div>

          {/* Middle Body */}
          <div ref={cardScrollRef} className="my-auto py-2 sm:py-4 space-y-3 sm:space-y-4 max-h-full overflow-y-auto">
            <p className="text-xs uppercase tracking-widest text-sky-800 font-bold">
              {useReverse ? 'Mặt sau • Câu hỏi ngược' : 'Mặt trước • Câu hỏi'}
            </p>

            <div className="text-lg sm:text-2xl font-bold text-slate-900 leading-relaxed max-w-2xl mx-auto whitespace-pre-line break-words">
              {card.type === 'cloze' && !useReverse
                ? formatClozeParts(card.front, session.isFlipped)
                : useReverse
                ? card.back
                : card.front}
            </div>

            {/* Illustration image */}
            {card.image && card.image.trim() && (
              <div className="pt-2">
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
                  <span>
                    {session.hintVisible ? (
                      'Ẩn gợi ý'
                    ) : (
                      <span>
                        Gợi ý nhỏ<span className="hidden sm:inline"> (Phím H)</span>
                      </span>
                    )}
                  </span>
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
        <StudyCompletionCard
          st={st}
          allSessionCards={allSessionCards}
          session={session}
          onRestartSession={onRestartSession}
          onExit={onExit}
        />
      )}

      {/* iOS-Style Options & Filters Action Sheet */}
      <StudyOptionsSheet
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        session={session}
        allSessionCards={allSessionCards}
        isComplete={isComplete}
        card={card}
        onChangeFilter={onChangeFilter}
        onChangeDirection={onChangeDirection}
        onViewDeckNote={onViewDeckNote}
        onShuffle={onShuffle}
        onEditCard={onEditCard}
      />

      {/* Lightbox Zoom Overlay for Medical & Anatomical Images */}
      <ImageLightbox
        imageUrl={lightboxImg}
        onClose={() => setLightboxImg(null)}
      />
    </section>
  );
}
