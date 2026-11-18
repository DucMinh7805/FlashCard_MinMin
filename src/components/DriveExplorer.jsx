import React, { useState } from 'react';
import {
  Home,
  ChevronRight,
  Play,
  FolderPlus,
  Plus,
  Share2,
  Trash2,
  MoreVertical,
  Layers,
  BookOpen,
  ArrowRight,
  Folder,
} from 'lucide-react';
import { computeStatsForCards } from '../lib/spacedRepetition';

export default function DriveExplorer({
  appData,
  progressMap,
  currentFolderId,
  setCurrentFolderId,
  isAdmin,
  searchQuery,
  onStartStudy,
  onNewFolder,
  onNewDeck,
  onDeleteFolder,
  onDeleteDeck,
  onShareLink,
  getFolderPath,
  getFolderRecursiveDeckIds,
  getCardsByDeckIds,
}) {
  const [openMenuDeckId, setOpenMenuDeckId] = useState(null);

  const scopeDeckIds = getFolderRecursiveDeckIds(currentFolderId);
  const scopeCards = getCardsByDeckIds(scopeDeckIds);
  const scopeStats = computeStatsForCards(scopeCards, progressMap);

  const currentFolderObj = appData.folders.find((f) => f.id === currentFolderId);
  const path = getFolderPath(currentFolderId);
  const childFolders = appData.folders.filter((f) => (f.parentId || null) === currentFolderId);
  const childDecks = appData.decks.filter((d) => (d.folderId || null) === currentFolderId);

  // Global Search
  const q = searchQuery.trim().toLowerCase();
  const searchResults = [];
  if (q) {
    for (const deck of appData.decks) {
      const folderPathStr = getFolderPath(deck.folderId).map((f) => f.name).join(' / ') || 'Thư mục gốc';
      for (const card of deck.cards) {
        if (
          card.front.toLowerCase().includes(q) ||
          card.back.toLowerCase().includes(q) ||
          (card.extra && card.extra.toLowerCase().includes(q)) ||
          deck.name.toLowerCase().includes(q)
        ) {
          searchResults.push({ deck, card, folderPathStr });
        }
      }
    }
  }

  const greenPct = scopeStats.total ? Math.round((scopeStats.green / scopeStats.total) * 100) : 0;
  const redPct = scopeStats.total ? (scopeStats.red / scopeStats.total) * 100 : 0;
  const yellowPct = scopeStats.total ? (scopeStats.yellow / scopeStats.total) * 100 : 0;
  const greenBarPct = scopeStats.total ? (scopeStats.green / scopeStats.total) * 100 : 0;

  return (
    <section className="space-y-3.5">
      {/* Streamlined Breadcrumb & Primary Actions */}
      <div className="glass-panel rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <nav className="flex items-center gap-1 text-xs sm:text-sm overflow-x-auto max-w-full py-0.5">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={`px-2 py-1 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
              currentFolderId === null
                ? 'bg-sky-100 text-sky-800 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-sky-600" />
            <span>Kho môn học</span>
          </button>
          {path.map((folder) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className={`px-2 py-1 rounded-lg transition whitespace-nowrap ${
                  folder.id === currentFolderId
                    ? 'bg-sky-100 text-sky-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{folder.icon || '📁'}</span>
                <span className="ml-1">{folder.name}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {scopeStats.total > 0 && (
            <button
              type="button"
              onClick={() =>
                onStartStudy({
                  title: currentFolderObj ? `Thư mục: ${currentFolderObj.name}` : 'Toàn bộ Kho môn học',
                  deckIds: scopeDeckIds,
                  filterMode: 'all',
                })
              }
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
              title="Ôn tập toàn bộ thẻ trong mục này"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Ôn mục này ({scopeStats.total})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onShareLink(
                currentFolderId ? `#folder=${currentFolderId}` : '',
                'Đã sao chép link chia sẻ thư mục hiện tại!'
              )
            }
            className="glass-pill p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
            title="Chia sẻ liên kết thư mục này"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onNewFolder}
              className="glass-pill p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
              title="Tạo thư mục con"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Thư mục</span>
            </button>
          )}
        </div>
      </div>

      {/* Sleek Progress Strip (Replaces the 4 huge cards) */}
      <div className="glass-card rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>{scopeStats.total} thẻ</span>
          </div>
          {scopeStats.due > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[11px]">
              {scopeStats.due} cần ôn hôm nay
            </span>
          )}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 border-l border-slate-200 pl-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {scopeStats.red} Đỏ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {scopeStats.yellow} Vàng
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {scopeStats.green} Xanh
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:max-w-xs min-w-[130px]">
          <div className="flex-1 h-2 rounded-full bg-slate-200/80 overflow-hidden flex shadow-inner">
            <div style={{ width: `${redPct}%` }} className="bg-rose-500 h-full transition-all" title={`Chưa nhớ: ${scopeStats.red}`} />
            <div style={{ width: `${yellowPct}%` }} className="bg-amber-400 h-full transition-all" title={`Tạm hiểu: ${scopeStats.yellow}`} />
            <div style={{ width: `${greenBarPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Đã thuộc: ${scopeStats.green}`} />
          </div>
          <span className="text-[11px] font-bold text-emerald-700 whitespace-nowrap">
            {greenPct}% Đã nhớ
          </span>
        </div>
      </div>

      {/* Global Search Results */}
      {q && (
        <div className="glass-panel rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-sky-800">Kết quả tìm kiếm toàn cục</h2>
            <span className="text-xs text-slate-500 font-medium">{searchResults.length} thẻ phù hợp</span>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">Không tìm thấy thẻ nào khớp với "{searchQuery}".</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {searchResults.slice(0, 35).map((item) => (
                <div
                  key={`${item.deck.id}_${item.card.id}`}
                  onClick={() => onStartStudy({ title: item.deck.name, deckIds: [item.deck.id], filterMode: 'all' })}
                  className="glass-card rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer hover:border-sky-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-sky-700 font-medium truncate">
                      {item.folderPathStr} › {item.deck.name}
                    </p>
                    <p className="text-sm text-slate-900 font-semibold mt-0.5 truncate">{item.card.front}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{item.card.back}</p>
                  </div>
                  <span className="glass-pill px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-700 shrink-0 flex items-center gap-1">
                    <span>Học bài này</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subfolders Grid */}
      {childFolders.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thư mục môn / chuyên khoa
            </h2>
            <span className="text-xs text-slate-400 font-medium">{childFolders.length} thư mục</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {childFolders.map((folder) => {
              const deckIds = getFolderRecursiveDeckIds(folder.id);
              const cards = getCardsByDeckIds(deckIds);
              const st = computeStatsForCards(cards, progressMap);
              const subFolderCount = appData.folders.filter((sf) => sf.parentId === folder.id).length;

              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="glass-card rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 cursor-pointer shadow-sm hover:border-sky-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white/80 border border-slate-200/60 shadow-sm flex items-center justify-center text-xl shrink-0">
                        {folder.icon || '📁'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{folder.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {subFolderCount > 0 ? `${subFolderCount} mục con • ` : ''}
                          {deckIds.length} bài • {st.total} thẻ
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Xác nhận xóa thư mục "${folder.name}"?`)) {
                            onDeleteFolder(folder.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition"
                        title="Xóa thư mục"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden flex">
                      <div className="bg-rose-500 h-full" style={{ width: `${st.total ? (st.red / st.total) * 100 : 0}%` }} />
                      <div className="bg-amber-400 h-full" style={{ width: `${st.total ? (st.yellow / st.total) * 100 : 0}%` }} />
                      <div className="bg-emerald-500 h-full" style={{ width: `${st.total ? (st.green / st.total) * 100 : 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Hôm nay: <strong className="text-rose-600 font-bold">{st.due}</strong>
                      </span>
                      <span className="text-sky-700 font-semibold flex items-center gap-0.5">
                        <span>Mở mục</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decks Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Bộ thẻ bài học (Decks)
          </h2>
          <span className="text-xs text-slate-400 font-medium">{childDecks.length} bài học</span>
        </div>
        {childDecks.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm text-slate-700 font-medium">Thư mục này chưa có bộ thẻ bài học trực tiếp nào.</p>
            <p className="text-xs text-slate-500">
              Bấm nút "＋ Thêm" ở thanh trên cùng để nạp bài học mới hoặc mở các thư mục con ở trên.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {childDecks.map((deck) => {
              const st = computeStatsForCards(deck.cards, progressMap);
              const isMenuOpen = openMenuDeckId === deck.id;

              return (
                <div key={deck.id} className="glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-sky-300 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">{deck.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {st.total} thẻ • <span className="text-rose-600 font-medium">{st.red} Đỏ</span> •{' '}
                        <span className="text-amber-600 font-medium">{st.yellow} Vàng</span> •{' '}
                        <span className="text-emerald-600 font-medium">{st.green} Xanh</span>
                      </p>
                    </div>

                    {/* Single 3-dot Action Menu button to prevent misclicks */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenMenuDeckId(isMenuOpen ? null : deck.id)}
                        className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
                        title="Tùy chọn bài học"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuDeckId(null)} />
                          <div className="absolute right-0 top-full mt-1.5 w-48 glass-panel bg-white/95 rounded-2xl p-1.5 z-50 shadow-xl border border-white/90 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuDeckId(null);
                                onShareLink(`#deck=${deck.id}`, `Đã copy link chia sẻ bài "${deck.name}"`);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5 text-sky-600" />
                              <span>Sao chép link chia sẻ</span>
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuDeckId(null);
                                  if (window.confirm(`Xác nhận xóa bộ thẻ bài học "${deck.name}"?`)) {
                                    onDeleteDeck(deck.id);
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Xóa bài học này</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden flex shadow-inner">
                    <div className="bg-rose-500 h-full" style={{ width: `${st.total ? (st.red / st.total) * 100 : 0}%` }} />
                    <div className="bg-amber-400 h-full" style={{ width: `${st.total ? (st.yellow / st.total) * 100 : 0}%` }} />
                    <div className="bg-emerald-500 h-full" style={{ width: `${st.total ? (st.green / st.total) * 100 : 0}%` }} />
                  </div>

                  {/* Bottom Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <span className="text-[11px] text-slate-500">
                      Cần ôn: <strong className="text-slate-800 font-bold">{st.due} thẻ</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {st.red + st.yellow > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onStartStudy({
                              title: deck.name,
                              deckIds: [deck.id],
                              filterMode: 'red_yellow',
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 hover:bg-amber-100 font-medium text-xs transition"
                        >
                          Chưa thuộc ({st.red + st.yellow})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onStartStudy({ title: deck.name, deckIds: [deck.id], filterMode: 'all' })}
                        className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Học ngay</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
