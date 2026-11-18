import React from 'react';
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

  return (
    <section className="space-y-4">
      {/* Breadcrumb & Drive Actions */}
      <div className="glass-panel rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center flex-wrap gap-1.5 text-sm">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={`px-2.5 py-1 rounded-lg transition ${
              currentFolderId === null ? 'bg-white/15 text-white font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            🏠 Kho môn học
          </button>
          {path.map((folder) => (
            <React.Fragment key={folder.id}>
              <span className="text-slate-500 text-xs">›</span>
              <button
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  folder.id === currentFolderId ? 'bg-white/15 text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
              >
                {folder.icon || '📁'} {folder.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onStartStudy({
                title: currentFolderObj ? `Thư mục: ${currentFolderObj.name}` : 'Toàn bộ Kho môn học',
                deckIds: scopeDeckIds,
                filterMode: 'all',
              })
            }
            className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-200 border-emerald-400/30 flex items-center gap-1.5"
          >
            <span>▶</span>
            <span>
              {currentFolderObj
                ? `Ôn cả thư mục "${currentFolderObj.name}" (${scopeStats.total} thẻ)`
                : `Ôn toàn bộ kho (${scopeStats.total} thẻ)`}
            </span>
          </button>
          <button
            type="button"
            onClick={onNewFolder}
            className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-white flex items-center gap-1.5"
          >
            <span>📁+</span>
            <span>Thư mục mới</span>
          </button>
          <button
            type="button"
            onClick={onNewDeck}
            className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-sky-200 flex items-center gap-1.5"
          >
            <span>🗂+</span>
            <span>Thêm bài học</span>
          </button>
          <button
            type="button"
            onClick={() => onShareLink(currentFolderId ? `#folder=${currentFolderId}` : '', 'Đã sao chép link chia sẻ thư mục hiện tại!')}
            className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5"
            title="Chia sẻ link thư mục hiện tại"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-2xl p-3.5">
          <p className="text-xs text-slate-300">Tổng số thẻ tại đây</p>
          <p className="text-2xl font-bold text-white mt-0.5">{scopeStats.total}</p>
        </div>
        <div className="glass-card rounded-2xl p-3.5">
          <p className="text-xs text-rose-300">Chưa nhớ / Cần ôn</p>
          <p className="text-2xl font-bold text-rose-300 mt-0.5">{scopeStats.red}</p>
        </div>
        <div className="glass-card rounded-2xl p-3.5">
          <p className="text-xs text-amber-300">Tạm hiểu</p>
          <p className="text-2xl font-bold text-amber-300 mt-0.5">{scopeStats.yellow}</p>
        </div>
        <div className="glass-card rounded-2xl p-3.5">
          <p className="text-xs text-emerald-300">Đã nhớ kỹ (Spaced)</p>
          <p className="text-2xl font-bold text-emerald-300 mt-0.5">{scopeStats.green}</p>
        </div>
      </div>

      {/* Global Search Results */}
      {q && (
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-sky-200">Kết quả tìm kiếm toàn cục</h2>
            <span className="text-xs text-slate-300">{searchResults.length} thẻ phù hợp</span>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Không tìm thấy thẻ nào khớp với "{searchQuery}".</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {searchResults.slice(0, 35).map((item) => (
                <div
                  key={`${item.deck.id}_${item.card.id}`}
                  onClick={() => onStartStudy({ title: item.deck.name, deckIds: [item.deck.id], filterMode: 'all' })}
                  className="glass-card rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div>
                    <p className="text-xs text-sky-300 font-medium">
                      {item.folderPathStr} › {item.deck.name}
                    </p>
                    <p className="text-sm text-white font-semibold mt-0.5">{item.card.front}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{item.card.back}</p>
                  </div>
                  <span className="glass-pill px-2.5 py-1 rounded-lg text-xs text-sky-200 shrink-0">Học bài này →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subfolders Grid */}
      {childFolders.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Thư mục môn / chuyên khoa</h2>
            <span className="text-xs text-slate-400">{childFolders.length} thư mục</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {childFolders.map((folder) => {
              const deckIds = getFolderRecursiveDeckIds(folder.id);
              const cards = getCardsByDeckIds(deckIds);
              const st = computeStatsForCards(cards, progressMap);
              const subFolderCount = appData.folders.filter((sf) => sf.parentId === folder.id).length;

              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="glass-card rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl glass-pill flex items-center justify-center text-2xl">
                        {folder.icon || '📁'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">{folder.name}</h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {subFolderCount} thư mục con • {deckIds.length} bài • {st.total} thẻ
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                        className="text-slate-400 hover:text-rose-300 text-xs px-1.5 py-0.5 rounded-lg"
                        title="Xóa thư mục"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden flex">
                      <div className="bg-rose-400 h-full" style={{ width: `${st.total ? (st.red / st.total) * 100 : 0}%` }} />
                      <div className="bg-amber-400 h-full" style={{ width: `${st.total ? (st.yellow / st.total) * 100 : 0}%` }} />
                      <div className="bg-emerald-400 h-full" style={{ width: `${st.total ? (st.green / st.total) * 100 : 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>
                        Đến hạn ôn: <strong className="text-sky-300">{st.due}</strong>
                      </span>
                      <span className="text-sky-200 font-medium">Mở thư mục →</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Decks Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Bộ thẻ bài học (Decks)</h2>
          <span className="text-xs text-slate-400">{childDecks.length} bộ thẻ</span>
        </div>
        {childDecks.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm text-slate-200 font-medium">Thư mục này chưa có bộ thẻ bài học trực tiếp nào.</p>
            <p className="text-xs text-slate-400">
              Bấm "＋ Thêm bài học" để nạp JSON/CSV vào đây hoặc mở các thư mục con ở trên.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {childDecks.map((deck) => {
              const st = computeStatsForCards(deck.cards, progressMap);
              return (
                <div key={deck.id} className="glass-card rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🗂</span>
                        <h3 className="font-semibold text-white text-sm sm:text-base">{deck.name}</h3>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {st.total} thẻ • <span className="text-rose-300">{st.red} Đỏ</span> •{' '}
                        <span className="text-amber-300">{st.yellow} Vàng</span> •{' '}
                        <span className="text-emerald-300">{st.green} Xanh</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onShareLink(`#deck=${deck.id}`, `Đã copy link chia sẻ bài "${deck.name}"`)}
                        className="glass-pill px-2 py-1 rounded-lg text-[11px] text-slate-200"
                        title="Copy link chia sẻ bài này"
                      >
                        🔗
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteDeck(deck.id)}
                          className="glass-pill px-2 py-1 rounded-lg text-[11px] text-rose-300"
                          title="Xóa bài này"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden flex">
                    <div className="bg-rose-400 h-full" style={{ width: `${st.total ? (st.red / st.total) * 100 : 0}%` }} />
                    <div className="bg-amber-400 h-full" style={{ width: `${st.total ? (st.yellow / st.total) * 100 : 0}%` }} />
                    <div className="bg-emerald-400 h-full" style={{ width: `${st.total ? (st.green / st.total) * 100 : 0}%` }} />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-sky-200">
                      Cần ôn hôm nay: <strong>{st.due} thẻ</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onStartStudy({
                            title: deck.name,
                            deckIds: [deck.id],
                            filterMode: st.red + st.yellow > 0 ? 'red_yellow' : 'all',
                          })
                        }
                        className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-amber-200"
                      >
                        Ôn thẻ Chưa thuộc ({st.red + st.yellow})
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartStudy({ title: deck.name, deckIds: [deck.id], filterMode: 'all' })}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition"
                      >
                        Học ngay
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
