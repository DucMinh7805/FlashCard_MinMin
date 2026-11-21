import React from 'react';
import { Lightbulb, ImageOff, ZoomIn } from 'lucide-react';
import { formatClozeParts } from '../../lib/clozeUtils';

export default function CardQuestionArea({
  card,
  session,
  useReverse,
  isCaseOrLong,
  imgError,
  setImgError,
  setLightboxImg,
  onToggleHint,
}) {
  return (
    <>
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
        <div className="max-w-md mx-auto pt-2 text-center pointer-events-auto">
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
        <div className="pt-1 pointer-events-auto">
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
    </>
  );
}
