import React from 'react';

export default function StudyCompletionCard({
  st,
  allSessionCards,
  session,
  onRestartSession,
  onExit,
}) {
  const isAllMastered = st.red + st.yellow === 0;

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-lg">
      <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 text-2xl mx-auto shadow-sm">
        {isAllMastered ? '🏆' : '🎉'}
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
        {isAllMastered ? 'Tuyệt vời! Đã thuộc 100% bài học!' : 'Hoàn thành phiên ôn tập!'}
      </h3>
      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        {isAllMastered ? (
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
        {!isAllMastered ? (
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
  );
}
