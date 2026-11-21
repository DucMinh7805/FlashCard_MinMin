import React, { useEffect, useRef, useState } from 'react';
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
import SwipeStamps from './study/SwipeStamps';
import CardAnswerArea from './study/CardAnswerArea';
import { useStudyKeyboardShortcuts } from '../hooks/useStudyKeyboardShortcuts';

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
  const exitDirectionRef = useRef(null);
  exitDirectionRef.current = exitDirection;

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
    if (now - lastFlipTimeRef.current < 250) return; // Chống double-tap
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
    exitDirectionRef.current = null;
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
    exitDirectionRef.current = dir;
    setIsDragging(false);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(18);
      } catch (_) {}
    }

    const flyX = typeof window !== 'undefined' ? window.innerWidth * 1.25 : 600;
    const flyY = typeof window !== 'undefined' ? window.innerHeight * 1.25 : 800;
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
      exitDirectionRef.current = null;
      setIsDragging(false);
      isPointerDownRef.current = false;
      hasMovedRef.current = false;
      setTimeout(() => {
        wasSwipeRef.current = false;
      }, 200);
    }, 190);
  };

  const handlePointerDown = (e) => {
    if (exitDirection) return;

    // Tránh mép vuốt thoát trang iOS / Android
    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    if (clientX < 20 || (typeof window !== 'undefined' && clientX > window.innerWidth - 20)) {
      return;
    }

    // Bỏ qua nếu bấm vào nút con
    if (e.target.closest('button') || e.target.closest('a')) {
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

    // Thẻ Y khoa dài: nhường cuộn dọc cho văn bản nếu kéo dọc nhiều hơn ngang
    if (scrollable && Math.abs(dy) > Math.abs(dx)) {
      if (isDragging) {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
      }
      return;
    }

    if (!hasMovedRef.current && (Math.abs(dx) > 8 || (!scrollable && Math.abs(dy) > 8))) {
      hasMovedRef.current = true;
      setIsDragging(true);
      if (typeof window !== 'undefined' && window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }

    if (hasMovedRef.current) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragOffset({ x: dx, y: scrollable ? 0 : dy });
        rafRef.current = null;
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
    const dist = Math.hypot(dx, dy);
    const wasDragging = hasMovedRef.current;
    const scrollable = isContentScrollable();

    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    hasMovedRef.current = false;

    // Không lật nếu người dùng đang bôi đen chọn chữ
    const hasSelection =
      typeof window !== 'undefined' &&
      window.getSelection &&
      window.getSelection().toString().trim().length > 0;
    if (hasSelection) {
      return;
    }

    // Chạm (Tap nhẹ): không kéo hoặc khoảng cách < 25px -> Lật thẻ ngay!
    if (!wasDragging || dist < 25) {
      triggerFlip();
      return;
    }

    // Vuốt thẻ (Swipe): khoảng cách vuốt >= 50px
    const SWIPE_THRESHOLD = 50;

    // Vuốt ngang: Trái = Chưa nhớ, Phải = Đã thuộc
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
      // Vuốt dọc: Lên / Xuống = Tạm hiểu (khi thẻ ngắn không cuộn)
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
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    hasMovedRef.current = false;
  };

  // Global window listeners: chống kẹt thẻ khi chuột ra khỏi vùng thẻ
  useEffect(() => {
    const onWindowMove = (e) => {
      if (!isPointerDownRef.current || exitDirectionRef.current) return;
      handlePointerMove(e);
    };
    const onWindowUp = () => {
      if (!isPointerDownRef.current) return;
      endDrag();
    };
    const onWindowCancel = () => {
      if (!isPointerDownRef.current) return;
      handlePointerCancel();
    };

    window.addEventListener('pointermove', onWindowMove, { passive: true });
    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowCancel);
    window.addEventListener('blur', onWindowCancel);

    return () => {
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowCancel);
      window.removeEventListener('blur', onWindowCancel);
    };
  }, []);

  // Keyboard shortcuts
  useStudyKeyboardShortcuts({
    triggerFlip,
    onRate,
    onUndo,
    onToggleHint,
    onEditCard,
  });

  const pct =
    session.queue.length > 0
      ? Math.min(100, Math.round(((session.currentIndex + 1) / session.queue.length) * 100))
      : 0;

  const useReverse =
    session.direction === 'back_to_front' ||
    (session.direction === 'mixed' && card && (card.sortOrder || 0) % 2 === 1);

  const typeLabelMap = {
    basic: 'Hỏi - Đáp thường',
    cloze: 'Điền vào chỗ trống',
    case: 'Ca lâm sàng',
  };

  const isCaseOrLong = card?.type === 'case' || (card?.front && card.front.length > 80);

  return (
    <section className="fixed inset-0 z-50 flex flex-col justify-between p-2.5 sm:p-4 bg-gradient-to-br from-slate-100/95 via-sky-50/50 to-indigo-50/50 backdrop-blur-2xl overflow-hidden overscroll-none touch-none select-none h-[100dvh] w-screen">
      {/* Top Study Bar */}
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
              <span>
                Chạm thẻ để xem đáp án
                <span className="hidden sm:inline"> • Phím Cách (Space)</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Flashcard Card: Tràn đầy khoảng trống, căn giữa nội dung, chạm để lật và hỗ trợ vuốt Swipe 4 hướng */}
      {!isComplete && card ? (
        <div
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onClick={(e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            if (wasSwipeRef.current) return;
            triggerFlip();
          }}
          onPointerDown={handlePointerDown}
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
          <SwipeStamps dragOffset={dragOffset} exitDirection={exitDirection} />

          {/* Card Top: Type badge & Status badge */}
          <div className="flex items-center justify-between gap-2 text-xs shrink-0">
            <span className="px-2.5 py-0.5 rounded-full glass-pill text-sky-800 font-bold border-sky-200">
              {typeLabelMap[card.type] || 'Hỏi - Đáp thường'}
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
                {repCount > 0 ? `Ôn ${repCount} lần` : 'Mới'}
              </span>
            </div>
          </div>

          {/* Card Scrollable Content Area: giữ nguyên cuộn dọc khi thẻ Y khoa dài */}
          <div
            ref={cardScrollRef}
            className={`my-auto py-2 space-y-3 max-h-full overflow-y-auto px-1 pr-1.5 flex flex-col justify-center touch-pan-y overscroll-contain ${
              isDragging ? 'select-none pointer-events-none' : 'select-text'
            }`}
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
            <CardAnswerArea session={session} card={card} useReverse={useReverse} />
          </div>

          {/* Desktop Keyboard Hints Footer (Hidden on Mobile) */}
          <div className="hidden md:flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>
              {session.isFlipped
                ? 'Vuốt thẻ hoặc phím (1: Chưa nhớ, 2: Tạm hiểu, 3: Đã thuộc)'
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
