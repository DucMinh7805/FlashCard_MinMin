import React from 'react';
import { isCardDue } from '../lib/spacedRepetition';

export default function BottomDock({
  currentFolderId,
  setCurrentFolderId,
  showSearch,
  setShowSearch,
  analyticsOpen,
  setAnalyticsOpen,
  settingsOpen,
  setSettingsOpen,
  appData,
  progressMap,
  onStartStudy,
  showToast,
}) {
  const allCards = appData.decks.flatMap((d) => d.cards || []);
  const dueCards = allCards.filter((c) => isCardDue(progressMap, c.id));
  const dueCount = dueCards.length;

  const isHomeActive = currentFolderId === null && !showSearch && !analyticsOpen && !settingsOpen;

  return (
    <nav
      aria-label="Thanh điều hướng nhanh"
      style={{ bottom: 'max(env(safe-area-inset-bottom, 0px), 0.875rem)' }}
      className="fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.75rem)] max-w-sm glass-dock rounded-3xl p-1.5 sm:hidden flex items-center justify-between"
    >
      {/* Tab 1: Kho bài */}
      <button
        type="button"
        onClick={() => {
          setCurrentFolderId(null);
          setShowSearch(false);
          setAnalyticsOpen(false);
          setSettingsOpen(false);
        }}
        className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 active:scale-95 ${
          isHomeActive
            ? 'bg-sky-500/10 text-sky-600 font-bold shadow-xs'
            : 'text-slate-400 hover:text-slate-600 font-medium'
        }`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="6" width="13" height="15" rx="3.5" />
          <path d="M7 3h9a3.5 3.5 0 0 1 3.5 3.5V17" opacity="0.65" />
          <circle cx="9.5" cy="13.5" r="1.5" fill="currentColor" opacity="0.4" />
        </svg>
        <span className="text-[10px] tracking-tight">Kho bài</span>
      </button>

      {/* Tab 2: Ôn nhanh */}
      <button
        type="button"
        onClick={() => {
          if (allCards.length === 0) {
            showToast('Chưa có thẻ nào trong kho để ôn!');
            return;
          }
          onStartStudy({
            title: dueCount > 0 ? `Ôn nhanh (${dueCount} thẻ đến hạn)` : 'Ôn toàn bộ bài học',
            deckIds: appData.decks.map((d) => d.id),
            filterMode: dueCount > 0 ? 'due' : 'all',
          });
        }}
        className="flex-1 py-1.5 flex flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 hover:text-slate-700 font-medium transition-all duration-200 active:scale-95 relative"
      >
        <div className="relative">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2.5L4.5 13.5h7l-1 8 8.5-11h-7l1-8z" />
          </svg>
          {dueCount > 0 && (
            <span
              className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"
              title={`${dueCount} thẻ đến hạn`}
            />
          )}
        </div>
        <span className="text-[10px] tracking-tight">Ôn nhanh</span>
      </button>

      {/* Tab 3: Thống kê */}
      <button
        type="button"
        onClick={() => setAnalyticsOpen(true)}
        className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 active:scale-95 ${
          analyticsOpen
            ? 'bg-sky-500/10 text-sky-600 font-bold shadow-xs'
            : 'text-slate-400 hover:text-slate-600 font-medium'
        }`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="13" width="3.5" height="7.5" rx="1.75" />
          <rect x="10.25" y="4.5" width="3.5" height="16" rx="1.75" />
          <rect x="16.5" y="9" width="3.5" height="11.5" rx="1.75" />
        </svg>
        <span className="text-[10px] tracking-tight">Thống kê</span>
      </button>

      {/* Tab 4: Cài đặt */}
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 active:scale-95 ${
          settingsOpen
            ? 'bg-sky-500/10 text-sky-600 font-bold shadow-xs'
            : 'text-slate-400 hover:text-slate-600 font-medium'
        }`}
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="8" x2="20" y2="8" />
          <circle cx="9" cy="8" r="2.5" fill="currentColor" fillOpacity="0.15" />
          <line x1="4" y1="16" x2="20" y2="16" />
          <circle cx="15" cy="16" r="2.5" fill="currentColor" fillOpacity="0.15" />
        </svg>
        <span className="text-[10px] tracking-tight">Cài đặt</span>
      </button>
    </nav>
  );
}
