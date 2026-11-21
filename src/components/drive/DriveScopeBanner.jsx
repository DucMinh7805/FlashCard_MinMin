import React from 'react';
import { Play } from 'lucide-react';
import TikTokFlame from '../TikTokFlame';

export default function DriveScopeBanner({
  streak,
  deviceId,
  greenPct,
  scopeStats,
  currentFolderObj,
  scopeDeckIds,
  onStartStudy,
}) {
  return (
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-white/90 space-y-2.5">
      <div className="flex items-center justify-between gap-2.5">
        {/* Cột trái: Streak ngọn lửa & % Đã thuộc */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 flex items-center justify-center">
            <TikTokFlame streak={streak} size="md" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`font-black text-xs sm:text-sm ${
                  streak
                    ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent'
                    : 'text-slate-700'
                }`}
              >
                {streak ? `${streak} ngày liên tục` : 'Bắt đầu học'}
              </span>
              {deviceId && (
                <span
                  className="text-[10px] text-slate-500 font-bold bg-slate-100/90 px-1.5 py-0.5 rounded-md border border-slate-200/80 shrink-0"
                  title={`Chuỗi học tập tính riêng cho máy này (ID: ${deviceId})`}
                >
                  Máy #{deviceId.replace('dev_', '').slice(0, 4).toUpperCase()}
                </span>
              )}
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                {greenPct}% đã thuộc
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
              {scopeStats.green}/{scopeStats.total} thẻ thuộc •{' '}
              {scopeStats.due > 0 ? (
                <strong className="text-rose-600">{scopeStats.due} cần ôn hôm nay</strong>
              ) : (
                <span className="text-emerald-600 font-medium">Hết thẻ cần ôn</span>
              )}
            </p>
          </div>
        </div>

        {/* Cột phải: CTA Button Ôn tập ngay */}
        {scopeStats.total > 0 && (
          <button
            type="button"
            onClick={() =>
              onStartStudy({
                title: currentFolderObj ? `Thư mục: ${currentFolderObj.name}` : 'Toàn bộ Kho môn học',
                deckIds: scopeDeckIds,
                filterMode: scopeStats.due > 0 ? 'due' : 'all',
              })
            }
            className={`py-2 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 ${
              scopeStats.due > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {scopeStats.due > 0 ? `ÔN NGAY (${scopeStats.due})` : `Ôn tất cả (${scopeStats.total})`}
            </span>
          </button>
        )}
      </div>

      {/* Thanh Retention Progress Bar siêu mỏng 3px */}
      <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden flex shadow-inner">
        {scopeStats.total > 0 && scopeStats.green > 0 && (
          <div
            style={{ width: `${(scopeStats.green / scopeStats.total) * 100}%` }}
            className="bg-emerald-500 h-full shrink-0"
            title={`Đã thuộc: ${scopeStats.green}`}
          />
        )}
        {scopeStats.total > 0 && scopeStats.yellow > 0 && (
          <div
            style={{ width: `${(scopeStats.yellow / scopeStats.total) * 100}%` }}
            className="bg-amber-400 h-full shrink-0"
            title={`Tạm hiểu: ${scopeStats.yellow}`}
          />
        )}
        {scopeStats.total > 0 && scopeStats.red > 0 && (
          <div
            style={{ width: `${(scopeStats.red / scopeStats.total) * 100}%` }}
            className="bg-rose-500 h-full shrink-0"
            title={`Chưa nhớ: ${scopeStats.red}`}
          />
        )}
        {scopeStats.total > 0 && (scopeStats.newCount || 0) > 0 && (
          <div
            style={{ width: `${((scopeStats.newCount || 0) / scopeStats.total) * 100}%` }}
            className="bg-slate-300 h-full shrink-0"
            title={`Chưa học: ${scopeStats.newCount || 0}`}
          />
        )}
      </div>
    </div>
  );
}
