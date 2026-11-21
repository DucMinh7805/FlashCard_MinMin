import React, { useEffect, useRef, useState } from 'react';
import { computeStatsForCards, getCardProgress } from '../lib/spacedRepetition';
import StudyHeader from './study/StudyHeader';
import StudyOptionsSheet from './study/StudyOptionsSheet';
import StudyCompletionCard from './study/StudyCompletionCard';
import ImageLightbox from './study/ImageLightbox';
import SwipeStamps from './study/SwipeStamps';
import CardAnswerArea from './study/CardAnswerArea';
import CardQuestionArea from './study/CardQuestionArea';
import CardStatusBadge from './study/CardStatusBadge';
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
  const [exitDirection, setExitDirection] = useState(null);
  const exitDirectionRef = useRef(null);
  exitDirectionRef.current = exitDirection;

  const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
  const dragCurrentRef = useRef({ x: 0, y: 0 });
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const wasSwipeRef = useRef(false);
  const activePointerIdRef = useRef(null);
  const cardElementRef = useRef(null);
  const lastFlipTimeRef = useRef(0);
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
    if (now - lastFlipTimeRef.current < 220) return;
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
      exitDirectionRef.current = null;
      setIsDragging(false);
      isPointerDownRef.current = false;
      hasMovedRef.current = false;
      setTimeout(() => {
        wasSwipeRef.current = false;
      }, 250);
    }, 190);
  };

  const handlePointerDown = (e) => {
    if (exitDirection) return;
    if (e.target.closest('button') || e.target.closest('a')) return;

    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    if (clientX < 15 || (typeof window !== 'undefined' && clientX > window.innerWidth - 15)) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      activePointerIdRef.current = e.pointerId;
      cardElementRef.current = e.currentTarget;
    } catch (_) {}

    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    dragCurrentRef.current = { x: e.clientX, y: e.clientY };
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    wasSwipeRef.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current || exitDirection) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragCurrentRef.current = { x: e.clientX, y: e.clientY };

    const scrollable = isContentScrollable();
    if (scrollable && Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > 12) {
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
        setDragOffset({ x: dx, y: scrollable ? 0 : dy });
        rafRef.current = null;
      });
    }
  };

  const endDrag = () => {
    if (!isPointerDownRef.current || exitDirection) return;
    isPointerDownRef.current = false;

    if (cardElementRef.current && activePointerIdRef.current != null) {
      try {
        cardElementRef.current.releasePointerCapture(activePointerIdRef.current);
      } catch (_) {}
      activePointerIdRef.current = null;
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const dx = dragCurrentRef.current.x - dragStartRef.current.x;
    const dy = dragCurrentRef.current.y - dragStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    const wasDragging = hasMovedRef.current;
    const dt = Math.max(1, Date.now() - dragStartRef.current.time);
    const velocityX = Math.abs(dx) / dt;
    const velocityY = Math.abs(dy) / dt;
    const scrollable = isContentScrollable();

    // Chạm (Tap nhẹ): không kéo hoặc khoảng cách < 15px -> Lật thẻ ngay!
    if (!wasDragging || dist < 15) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 300);
      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
      hasMovedRef.current = false;
      triggerFlip();
      return;
    }

    // Nếu đã kéo (dist >= 15), chặn click sau đó
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 350);

    // Vuốt ngang: Vuốt trái = Chưa nhớ, Vuốt phải = Đã thuộc (cả mặt trước & sau)
    const isHorizontal = Math.abs(dx) >= Math.abs(dy);
    const passedHorizThreshold = Math.abs(dx) >= 42 || (Math.abs(dx) >= 24 && velocityX > 0.35);

    if (isHorizontal && passedHorizThreshold) {
      hasMovedRef.current = false;
      if (dx > 0) {
        triggerSwipe('right', 'green');
      } else {
        triggerSwipe('left', 'red');
      }
      return;
    }

    // Vuốt dọc: Lên / Xuống = Tạm hiểu (khi thẻ không cuộn dài)
    const passedVertThreshold = Math.abs(dy) >= 42 || (Math.abs(dy) >= 24 && velocityY > 0.35);
    if (!isHorizontal && !scrollable && passedVertThreshold) {
      hasMovedRef.current = false;
      if (dy < 0) {
        triggerSwipe('up', 'yellow');
      } else {
        triggerSwipe('down', 'yellow');
      }
      return;
    }

    // Kéo chưa tới ngưỡng -> Bật lò xo về vị trí cũ (Snap back)
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    hasMovedRef.current = false;
  };

  const handlePointerCancel = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    if (cardElementRef.current && activePointerIdRef.current != null) {
      try {
        cardElementRef.current.releasePointerCapture(activePointerIdRef.current);
      } catch (_) {}
      activePointerIdRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    hasMovedRef.current = false;
  };

  // Global window listeners dự phòng
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
    <section className="fixed inset-0 z-50 flex flex-col items-center justify-between p-2 sm:p-4 md:py-6 bg-gradient-to-br from-slate-100/95 via-sky-50/50 to-indigo-50/50 backdrop-blur-2xl overflow-hidden overscroll-none touch-none select-none h-[100dvh] w-screen">
      <div className="w-full max-w-2xl lg:max-w-3xl flex flex-col justify-between flex-1 min-h-0 h-full mx-auto">
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

        {/* Main Flashcard Card: Tràn đầy khoảng trống, chạm để lật và vuốt Swipe 4 hướng */}
        {!isComplete && card ? (
          <div
            ref={cardElementRef}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onClick={(e) => {
              if (e.target.closest('button') || e.target.closest('a')) return;
              if (suppressClickRef.current || wasSwipeRef.current || hasMovedRef.current) return;
              triggerFlip();
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={handlePointerCancel}
            style={{
              transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.065}deg)`,
              transition: isDragging
                ? 'none'
                : 'transform 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.18s ease',
              opacity: exitDirection ? 0.15 : 1,
              willChange: 'transform, opacity',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
            className="glass-panel rounded-3xl p-4 sm:p-7 md:p-8 flex-1 min-h-0 md:max-h-[660px] md:my-auto flex flex-col justify-between select-none shadow-xl relative overflow-hidden cursor-pointer border border-white/90 active:scale-[0.995] transition-transform touch-none"
          >
            {/* Stamps phản hồi thị giác khi vuốt */}
            <SwipeStamps dragOffset={dragOffset} exitDirection={exitDirection} />

            {/* Card Top: Type badge & Metallic Status badge */}
            <div className="flex items-center justify-between gap-2 text-xs shrink-0 pointer-events-none mb-2">
              <span className="px-2.5 py-0.5 rounded-full glass-pill text-sky-800 font-bold border-sky-200">
                {typeLabelMap[card.type] || 'Hỏi - Đáp thường'}
              </span>
              <CardStatusBadge prog={prog} repCount={repCount} />
            </div>

            {/* Card Content Area */}
            <div
              ref={cardScrollRef}
              className="my-auto py-2 space-y-3 max-h-full overflow-y-auto px-1 pr-1.5 flex flex-col justify-center select-none pointer-events-none"
            >
              <CardQuestionArea
                card={card}
                session={session}
                useReverse={useReverse}
                isCaseOrLong={isCaseOrLong}
                imgError={imgError}
                setImgError={setImgError}
                setLightboxImg={setLightboxImg}
                onToggleHint={onToggleHint}
              />

              {/* Flipped Answer Area */}
              <CardAnswerArea session={session} card={card} useReverse={useReverse} />
            </div>

            {/* Desktop Keyboard Hints Footer (Ẩn trên điện thoại) */}
            <div className="hidden md:flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 pointer-events-none">
              <span>
                {session.isFlipped
                  ? 'Vuốt thẻ hoặc phím (1: Chưa nhớ, 2: Tạm hiểu, 3: Đã thuộc)'
                  : 'Chạm thẻ hoặc phím Space để lật đáp án'}
              </span>
              <span>Phím tắt: Space (Lật) • 1 (Đỏ) • 2 (Vàng) • 3 (Xanh) • Z (Undo)</span>
            </div>
          </div>
        ) : (
          <div className="my-auto">
            <StudyCompletionCard
              st={st}
              allSessionCards={allSessionCards}
              session={session}
              onRestartSession={onRestartSession}
              onExit={onExit}
            />
          </div>
        )}
      </div>

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
        onRestartSession={onRestartSession}
      />

      {/* Lightbox Zoom Overlay */}
      <ImageLightbox
        imageUrl={lightboxImg}
        onClose={() => setLightboxImg(null)}
      />
    </section>
  );
}
