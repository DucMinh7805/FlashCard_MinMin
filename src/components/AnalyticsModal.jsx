import React, { useEffect } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { computeStatsForCards, computeStudyStreak } from '../lib/spacedRepetition';

export default function AnalyticsModal({
  isOpen,
  onClose,
  appData,
  progressMap,
  activityLogs,
  getFolderRecursiveDeckIds,
  getCardsByDeckIds,
  onStartStudy,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { streak, todayCount } = computeStudyStreak(activityLogs);

  // Overall stats
  const allDecks = appData.decks || [];
  const allCards = allDecks.flatMap((d) => d.cards || []);
  const overallStats = computeStatsForCards(allCards, progressMap);
  const greenPct = overallStats.total ? Math.round((overallStats.green / overallStats.total) * 100) : 0;

  // 7-day activity bar data
  const last7Days = [];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('sv-SE');
    const count = activityLogs[key] || 0;
    last7Days.push({
      dateKey: key,
      label: i === 0 ? 'H.nay' : dayNames[d.getDay()],
      count,
    });
  }
  const maxActivity = Math.max(10, ...last7Days.map((d) => d.count));

  // Subject/Folder breakdown (root level folders + direct decks)
  const rootFolders = (appData.folders || []).filter((f) => !f.parentId);
  const folderAnalytics = rootFolders.map((folder) => {
    const deckIds = getFolderRecursiveDeckIds(folder.id);
    const cards = getCardsByDeckIds(deckIds);
    const stats = computeStatsForCards(cards, progressMap);
    const pct = stats.total ? Math.round((stats.green / stats.total) * 100) : 0;
    return {
      folder,
      deckIds,
      stats,
      pct,
    };
  });

  // Find lowest retention subject for smart recommendation
  const subjectsWithCards = folderAnalytics.filter((f) => f.stats.total > 0);
  subjectsWithCards.sort((a, b) => a.pct - b.pct);
  const weakestSubject = subjectsWithCards.length > 0 ? subjectsWithCards[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Thống kê & Phân tích Học tập</h3>
              <p className="text-xs text-slate-500">Tiến độ Spaced Repetition cá nhân & Biểu đồ ghi nhớ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="glass-card rounded-2xl p-3 flex flex-col justify-between border-amber-200/80 bg-amber-50/40">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Streak</span>
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{streak} ngày</p>
            <p className="text-[10px] text-amber-600/80 mt-0.5">Liên tục ôn tập</p>
          </div>

          <div className="glass-card rounded-2xl p-3 flex flex-col justify-between border-sky-200/80 bg-sky-50/40">
            <div className="flex items-center justify-between text-sky-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Hôm nay</span>
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-sky-700 mt-1">{todayCount} thẻ</p>
            <p className="text-[10px] text-sky-600/80 mt-0.5">Lượt thẻ đã lật</p>
          </div>

          <div className="glass-card rounded-2xl p-3 flex flex-col justify-between border-emerald-200/80 bg-emerald-50/40">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tỷ lệ nhớ</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{greenPct}%</p>
            <p className="text-[10px] text-emerald-600/80 mt-0.5">{overallStats.green} / {overallStats.total} thẻ</p>
          </div>

          <div className="glass-card rounded-2xl p-3 flex flex-col justify-between border-rose-200/80 bg-rose-50/40">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[11px] font-bold uppercase tracking-wider">Cần ôn</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-rose-700 mt-1">{overallStats.due} thẻ</p>
            <p className="text-[10px] text-rose-600/80 mt-0.5">Đến hạn Spaced Rep</p>
          </div>
        </div>

        {/* 7-day Activity Chart */}
        <div className="glass-card rounded-2xl p-3.5 space-y-2 border-slate-200/80">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Hoạt động 7 ngày gần nhất</span>
            </p>
            <span className="text-[11px] text-slate-500 font-medium">
              Tổng 7 ngày: {last7Days.reduce((acc, d) => acc + d.count, 0)} lượt
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1 px-2 border-b border-slate-100">
            {last7Days.map((d) => {
              const heightPct = Math.max(8, Math.round((d.count / maxActivity) * 100));
              const isToday = d.label === 'H.nay';
              return (
                <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </span>
                  <div className="w-full max-w-[32px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-full">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-sky-500 to-indigo-500'
                          : d.count > 0
                            ? 'bg-gradient-to-t from-sky-400/80 to-sky-300'
                            : 'bg-slate-200'
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'font-bold text-sky-700' : 'text-slate-500'}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Study Recommendation */}
        {weakestSubject && weakestSubject.pct < 100 && (
          <div className="glass-card rounded-2xl p-3.5 bg-gradient-to-r from-amber-50/80 via-white/80 to-sky-50/80 border-amber-200/80 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-amber-800 tracking-wider">Khuyến nghị ôn tập trọng tâm</p>
                <p className="text-xs text-slate-700 font-medium truncate">
                  Môn <strong>{weakestSubject.folder.name}</strong> mới đạt <strong>{weakestSubject.pct}%</strong> ghi nhớ ({weakestSubject.stats.red + weakestSubject.stats.yellow} thẻ chưa thuộc).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartStudy({
                  title: `Ôn trọng tâm: ${weakestSubject.folder.name}`,
                  deckIds: weakestSubject.deckIds,
                  filterMode: 'red_yellow',
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold text-xs shadow-sm transition active:scale-95 shrink-0 flex items-center gap-1"
            >
              <span>Ôn ngay</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Breakdown by Subjects/Folders */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            Tỷ lệ ghi nhớ theo Khoa / Môn học
          </p>

          <div className="space-y-2">
            {folderAnalytics.map(({ folder, deckIds, stats, pct }) => (
              <div key={folder.id} className="glass-card rounded-2xl p-3 space-y-2 border-slate-200/80">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{folder.icon || '📁'}</span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">{folder.name}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">({stats.total} thẻ)</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-emerald-700">{pct}% Đã nhớ</span>
                    {stats.total > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartStudy({
                            title: folder.name,
                            deckIds,
                            filterMode: 'all',
                          });
                        }}
                        className="glass-pill px-2 py-1 rounded-lg text-[11px] font-semibold text-sky-700 hover:bg-sky-50 flex items-center gap-0.5"
                      >
                        <span>Ôn</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden flex shadow-inner">
                  {stats.total > 0 && stats.red > 0 && (
                    <div
                      style={{ width: `${(stats.red / stats.total) * 100}%` }}
                      className="bg-rose-500 h-full shrink-0"
                      title={`Chưa nhớ: ${stats.red}`}
                    />
                  )}
                  {stats.total > 0 && stats.yellow > 0 && (
                    <div
                      style={{ width: `${(stats.yellow / stats.total) * 100}%` }}
                      className="bg-amber-400 h-full shrink-0"
                      title={`Tạm hiểu: ${stats.yellow}`}
                    />
                  )}
                  {stats.total > 0 && stats.green > 0 && (
                    <div
                      style={{ width: `${(stats.green / stats.total) * 100}%` }}
                      className="bg-emerald-500 h-full shrink-0"
                      title={`Đã thuộc: ${stats.green}`}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2.5">
                    <span className="text-rose-600 font-medium">● {stats.red} Chưa nhớ</span>
                    <span className="text-amber-600 font-medium">● {stats.yellow} Tạm hiểu</span>
                    <span className="text-emerald-600 font-medium">● {stats.green} Đã thuộc</span>
                  </div>
                  <span>Đến hạn: <strong className="text-slate-700">{stats.due} thẻ</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
