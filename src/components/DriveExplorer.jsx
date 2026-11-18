import React, { useEffect, useState } from 'react';
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
  Edit3,
  FolderInput,
  FileText,
  User,
  Flame,
  GripVertical,
} from 'lucide-react';
import { computeStatsForCards, computeStudyStreak } from '../lib/spacedRepetition';
import ConfirmModal from './ConfirmModal';

function stripCloze(text) {
  return (text || '').replace(/\{\{c\d+::(.*?)\}\}/g, '$1');
}

function getDescendantFolderIds(rootId, allFolders) {
  const set = new Set([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of allFolders) {
      if (f.parentId && set.has(f.parentId) && !set.has(f.id)) {
        set.add(f.id);
        added = true;
      }
    }
  }
  return set;
}

export default function DriveExplorer({
  appData,
  progressMap,
  activityLogs = {},
  currentFolderId,
  setCurrentFolderId,
  searchQuery,
  onStartStudy,
  onNewFolder,
  onNewDeck,
  onEditFolder,
  onMoveFolder,
  onEditDeck,
  onMoveDeck,
  onQuickMoveFolder,
  onQuickMoveDeck,
  onViewNote,
  onDeleteFolder,
  onDeleteDeck,
  onShareLink,
  getFolderPath,
  getFolderRecursiveDeckIds,
  getCardsByDeckIds,
}) {
  const [openMenuFolderId, setOpenMenuFolderId] = useState(null);
  const [openMenuDeckId, setOpenMenuDeckId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'folder' | 'deck', id: string, name: string }
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuFolderId(null);
      setOpenMenuDeckId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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
      const folderPathStr = getFolderPath(deck.folderId).map((f) => f.name).join(' / ') || 'Trang chủ';
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
  const { streak } = computeStudyStreak(activityLogs);

  const handleDropOnFolder = (targetFolderId) => {
    if (!draggedItem) return;
    if (draggedItem.type === 'deck') {
      if (onQuickMoveDeck) {
        onQuickMoveDeck(draggedItem.id, targetFolderId);
      }
    } else if (draggedItem.type === 'folder') {
      if (draggedItem.id === targetFolderId) return;
      const descendantIds = getDescendantFolderIds(draggedItem.id, appData.folders);
      if (descendantIds.has(targetFolderId)) return;
      if (onQuickMoveFolder) {
        onQuickMoveFolder(draggedItem.id, targetFolderId);
      }
    }
    setDraggedItem(null);
    setDragOverFolderId(null);
  };

  return (
    <section className="space-y-4">
      {/* Breadcrumbs Navigation Bar with Drop-to-Move Target */}
      <div className="glass-panel rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-sm">
        <nav className="flex items-center gap-1 text-xs sm:text-sm overflow-x-auto max-w-full py-0.5">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedItem) setDragOverFolderId('root');
            }}
            onDragLeave={() => {
              if (dragOverFolderId === 'root') setDragOverFolderId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverFolderId(null);
              if (!draggedItem) return;
              if (draggedItem.type === 'deck') onQuickMoveDeck?.(draggedItem.id, null);
              if (draggedItem.type === 'folder') onQuickMoveFolder?.(draggedItem.id, null);
              setDraggedItem(null);
            }}
            className={`px-2 py-1 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
              dragOverFolderId === 'root'
                ? 'bg-sky-200 text-sky-900 font-bold ring-2 ring-sky-500 scale-105'
                : currentFolderId === null
                  ? 'bg-sky-100 text-sky-800 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            title="Kéo môn học hoặc bài vào đây để chuyển ra thư mục gốc"
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
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedItem && draggedItem.id !== folder.id) setDragOverFolderId(folder.id);
                }}
                onDragLeave={() => {
                  if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverFolderId(null);
                  handleDropOnFolder(folder.id);
                }}
                className={`px-2 py-1 rounded-lg transition whitespace-nowrap ${
                  dragOverFolderId === folder.id
                    ? 'bg-sky-200 text-sky-900 font-bold ring-2 ring-sky-500 scale-105'
                    : folder.id === currentFolderId
                      ? 'bg-sky-100 text-sky-800 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                title={`Kéo thả vào để chuyển sang thư mục "${folder.name}"`}
              >
                <span>{folder.icon || '📁'}</span>
                <span className="ml-1">{folder.name}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
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

          <button
            type="button"
            onClick={onNewDeck}
            className="glass-pill p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
            title="Nạp bài học mới"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Nạp bài</span>
          </button>
          <button
            type="button"
            onClick={onNewFolder}
            className="glass-pill p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
            title="Tạo thư mục con"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Thư mục</span>
          </button>
        </div>
      </div>

      {/* Hero Stats Card: Rõ ràng, trực quan, tối ưu cho cả Mobile & Desktop */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5 border border-white/90">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-inner">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-sm sm:text-base">Chuỗi học tập</span>
              <span className="ml-1.5 text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                {streak ? `${streak} ngày liên tục` : 'Bắt đầu ngay'}
              </span>
            </div>
          </div>

          {scopeStats.due > 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 shadow-2xs">
              ⚡ {scopeStats.due} thẻ cần ôn hôm nay
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 shadow-2xs">
              ✨ Đã hoàn thành các thẻ hôm nay!
            </span>
          )}
        </div>

        {/* 3 Metrics Badges */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="bg-white/80 p-2.5 rounded-2xl border border-slate-200/70 shadow-2xs">
            <p className="text-[11px] text-slate-500 font-medium">Tổng số thẻ</p>
            <p className="text-base sm:text-xl font-extrabold text-slate-800 mt-0.5">{scopeStats.total}</p>
            <p className="text-[10px] text-slate-400">thẻ toàn mục</p>
          </div>

          <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-100 shadow-2xs">
            <p className="text-[11px] text-rose-600 font-semibold">Chưa nhớ</p>
            <p className="text-base sm:text-xl font-extrabold text-rose-700 mt-0.5">{scopeStats.red}</p>
            <p className="text-[10px] text-rose-500 font-medium">{scopeStats.due} cần ôn gấp</p>
          </div>

          <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
            <p className="text-[11px] text-emerald-700 font-semibold">Đã thuộc</p>
            <p className="text-base sm:text-xl font-extrabold text-emerald-700 mt-0.5">{greenPct}%</p>
            <p className="text-[10px] text-emerald-600 font-medium">{scopeStats.green}/{scopeStats.total} thẻ</p>
          </div>
        </div>

        {/* Retention Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {scopeStats.green} Thuộc</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {scopeStats.yellow} Tạm hiểu</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {scopeStats.red} Chưa nhớ</span>
              {(scopeStats.newCount || 0) > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> {scopeStats.newCount} Mới</span>}
            </span>
            <span className="text-emerald-700 font-bold text-xs">{greenPct}% Ghi nhớ</span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden flex shadow-inner">
            {scopeStats.total > 0 && scopeStats.green > 0 && (
              <div style={{ width: `${(scopeStats.green / scopeStats.total) * 100}%` }} className="bg-emerald-500 h-full shrink-0" />
            )}
            {scopeStats.total > 0 && scopeStats.yellow > 0 && (
              <div style={{ width: `${(scopeStats.yellow / scopeStats.total) * 100}%` }} className="bg-amber-400 h-full shrink-0" />
            )}
            {scopeStats.total > 0 && scopeStats.red > 0 && (
              <div style={{ width: `${(scopeStats.red / scopeStats.total) * 100}%` }} className="bg-rose-500 h-full shrink-0" />
            )}
            {scopeStats.total > 0 && (scopeStats.newCount || 0) > 0 && (
              <div style={{ width: `${((scopeStats.newCount || 0) / scopeStats.total) * 100}%` }} className="bg-slate-300 h-full shrink-0" />
            )}
          </div>
        </div>

        {/* Quick Review Button */}
        {scopeStats.total > 0 && (
          <button
            type="button"
            onClick={() =>
              onStartStudy({
                title: currentFolderObj ? `Thư mục: ${currentFolderObj.name}` : 'Toàn bộ Kho môn học',
                deckIds: scopeDeckIds,
                filterMode: scopeStats.due > 0 ? 'due_only' : 'all',
              })
            }
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {scopeStats.due > 0
                ? `ÔN TẬP NGAY (${scopeStats.due} THẺ CẦN ÔN HÔM NAY)`
                : `ÔN TẬP TOÀN BỘ (${scopeStats.total} THẺ)`}
            </span>
          </button>
        )}
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
                    <p className="text-sm text-slate-900 font-semibold mt-0.5 truncate">{stripCloze(item.card.front)}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{stripCloze(item.card.back)}</p>
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
              Học phần / Môn học
            </h2>
            <span className="text-xs text-slate-400 font-medium">{childFolders.length} thư mục</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {childFolders.map((folder) => {
              const deckIds = getFolderRecursiveDeckIds(folder.id);
              const cards = getCardsByDeckIds(deckIds);
              const st = computeStatsForCards(cards, progressMap);
              const subFolderCount = appData.folders.filter((sf) => sf.parentId === folder.id).length;
              const isFolderMenuOpen = openMenuFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id, name: folder.name }));
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedItem({ type: 'folder', id: folder.id, name: folder.name });
                  }}
                  onDragEnd={() => {
                    setDraggedItem(null);
                    setDragOverFolderId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedItem && draggedItem.id !== folder.id) {
                      setDragOverFolderId(folder.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverFolderId(null);
                    handleDropOnFolder(folder.id);
                  }}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={`glass-card rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 cursor-pointer shadow-sm hover:border-sky-300 transition ${
                    dragOverFolderId === folder.id
                      ? 'drag-over-active ring-2 ring-sky-500 bg-sky-50/90'
                      : ''
                  } ${
                    isFolderMenuOpen ? 'relative z-40' : 'relative z-10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-white/80 border border-slate-200/60 shadow-sm flex items-center justify-center text-xl shrink-0">
                        {folder.icon || '📁'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug break-words" title={folder.name}>
                          {folder.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {subFolderCount > 0 ? `${subFolderCount} mục con • ` : ''}
                          {deckIds.length} bài • {st.total} thẻ
                        </p>
                      </div>
                    </div>

                    {/* Folder 3-dot Action Menu */}
                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuFolderId(isFolderMenuOpen ? null : folder.id);
                        }}
                        className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
                        title="Tùy chọn thư mục"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isFolderMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuFolderId(null);
                            }}
                          />
                          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl p-1.5 z-50 shadow-2xl border border-slate-200 space-y-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuFolderId(null);
                                onEditFolder(folder);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                              <span>Đổi tên & biểu tượng</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuFolderId(null);
                                onMoveFolder(folder);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                            >
                              <FolderInput className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Di chuyển thư mục</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuFolderId(null);
                                onShareLink(`#folder=${folder.id}`, `Đã copy link chia sẻ môn "${folder.name}"`);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5 text-sky-600" />
                              <span>Sao chép link chia sẻ</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuFolderId(null);
                                setConfirmDelete({ type: 'folder', id: folder.id, name: folder.name });
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Xóa thư mục này</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 4-Color Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden flex shadow-inner">
                      {st.total > 0 && st.green > 0 && (
                        <div
                          className="bg-emerald-500 h-full shrink-0"
                          style={{ width: `${(st.green / st.total) * 100}%` }}
                          title={`Đã thuộc: ${st.green}`}
                        />
                      )}
                      {st.total > 0 && st.yellow > 0 && (
                        <div
                          className="bg-amber-400 h-full shrink-0"
                          style={{ width: `${(st.yellow / st.total) * 100}%` }}
                          title={`Tạm hiểu: ${st.yellow}`}
                        />
                      )}
                      {st.total > 0 && st.red > 0 && (
                        <div
                          className="bg-rose-500 h-full shrink-0"
                          style={{ width: `${(st.red / st.total) * 100}%` }}
                          title={`Chưa nhớ: ${st.red}`}
                        />
                      )}
                      {st.total > 0 && (st.newCount || 0) > 0 && (
                        <div
                          className="bg-slate-300 h-full shrink-0"
                          style={{ width: `${((st.newCount || 0) / st.total) * 100}%` }}
                          title={`Chưa học: ${st.newCount || 0}`}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Hôm nay: <strong className="text-amber-700 font-bold">{st.due} cần ôn</strong>
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
      {(childDecks.length > 0 || childFolders.length === 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bộ thẻ bài học (Decks)
            </h2>
            <span className="text-xs text-slate-400 font-medium">{childDecks.length} bài học</span>
          </div>
          {childDecks.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center space-y-2.5">
              <p className="text-sm text-slate-700 font-medium">Thư mục này chưa có bài học nào.</p>
              <p className="text-xs text-slate-500">
                Bấm nút bên dưới để nạp bài học mới và chia sẻ cho cả nhóm.
              </p>
              <button
                type="button"
                onClick={onNewDeck}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nạp bài học vào đây</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {childDecks.map((deck) => {
                const st = computeStatsForCards(deck.cards, progressMap);
                const isMenuOpen = openMenuDeckId === deck.id;

                return (
                  <div
                    key={deck.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'deck', id: deck.id, name: deck.name }));
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedItem({ type: 'deck', id: deck.id, name: deck.name });
                    }}
                    onDragEnd={() => {
                      setDraggedItem(null);
                      setDragOverFolderId(null);
                    }}
                    className={`glass-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-sky-300 transition cursor-grab active:cursor-grabbing ${
                      isMenuOpen ? 'relative z-40' : 'relative z-10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab hover:text-sky-600 transition" title="Kéo bài học này thả vào thư mục khác" />
                          <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                          <h3 className="font-bold text-slate-800 text-sm sm:text-base line-clamp-2 leading-snug break-words">
                            {deck.name}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">
                            {st.total} thẻ • {st.due > 0 ? (
                              <span className="text-amber-700 font-semibold">{st.due} cần ôn</span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">Đã xong hôm nay</span>
                            )}
                            {(st.newCount || 0) > 0 && (
                              <span className="text-slate-400"> • {st.newCount} mới</span>
                            )}
                          </span>

                          {deck.note?.trim() && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewNote(deck);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200/80 transition"
                              title="Bấm để xem ghi chú bài học"
                            >
                              <FileText className="w-3 h-3 text-amber-600" />
                              <span>Xem Note</span>
                            </button>
                          )}
                        </div>

                        {deck.author && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Đăng bởi <strong className="text-slate-600 font-medium">{deck.author}</strong></span>
                            {deck.updatedAt && <span>• {deck.updatedAt}</span>}
                          </p>
                        )}
                      </div>

                      {/* Single 3-dot Action Menu button */}
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuDeckId(isMenuOpen ? null : deck.id);
                          }}
                          className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
                          title="Tùy chọn bài học"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuDeckId(null);
                              }}
                            />
                            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl p-1.5 z-50 shadow-2xl border border-slate-200 space-y-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuDeckId(null);
                                  onViewNote(deck);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                <span>Ghi chú bài học (Note)</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuDeckId(null);
                                  onEditDeck(deck);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                                <span>Đổi tên & sửa Note</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuDeckId(null);
                                  onMoveDeck(deck);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                              >
                                <FolderInput className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Di chuyển sang thư mục khác</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuDeckId(null);
                                  onShareLink(`#deck=${deck.id}`, `Đã copy link chia sẻ bài "${deck.name}"`);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                              >
                                <Share2 className="w-3.5 h-3.5 text-sky-600" />
                                <span>Sao chép link chia sẻ</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuDeckId(null);
                                  setConfirmDelete({ type: 'deck', id: deck.id, name: deck.name });
                                }}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Xóa bài học này</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 4-Color Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden flex shadow-inner">
                      {st.total > 0 && st.green > 0 && (
                        <div
                          className="bg-emerald-500 h-full shrink-0"
                          style={{ width: `${(st.green / st.total) * 100}%` }}
                          title={`Đã thuộc: ${st.green}`}
                        />
                      )}
                      {st.total > 0 && st.yellow > 0 && (
                        <div
                          className="bg-amber-400 h-full shrink-0"
                          style={{ width: `${(st.yellow / st.total) * 100}%` }}
                          title={`Tạm hiểu: ${st.yellow}`}
                        />
                      )}
                      {st.total > 0 && st.red > 0 && (
                        <div
                          className="bg-rose-500 h-full shrink-0"
                          style={{ width: `${(st.red / st.total) * 100}%` }}
                          title={`Chưa nhớ: ${st.red}`}
                        />
                      )}
                      {st.total > 0 && (st.newCount || 0) > 0 && (
                        <div
                          className="bg-slate-300 h-full shrink-0"
                          style={{ width: `${((st.newCount || 0) / st.total) * 100}%` }}
                          title={`Chưa học: ${st.newCount || 0}`}
                        />
                      )}
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span className="text-[11px] text-slate-500">
                        {st.due > 0 ? (
                          <>Hôm nay cần ôn: <strong className="text-amber-700 font-bold">{st.due} thẻ</strong></>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Tất cả đều thuộc</span>
                        )}
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
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title={confirmDelete?.type === 'folder' ? 'Xác nhận xóa thư mục' : 'Xác nhận xóa bộ thẻ bài học'}
        message={
          confirmDelete?.type === 'folder'
            ? `Bạn có chắc chắn muốn xóa thư mục "${confirmDelete?.name}" cùng toàn bộ bài học bên trong không?\n\nThao tác này sẽ xóa đồng bộ trên đám mây của cả nhóm.`
            : `Bạn có chắc chắn muốn xóa bộ bài học "${confirmDelete?.name}" không?\n\nThao tác này sẽ xóa toàn bộ thẻ bài học trên đám mây của cả nhóm.`
        }
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete?.type === 'folder') {
            onDeleteFolder(confirmDelete.id);
          } else if (confirmDelete?.type === 'deck') {
            onDeleteDeck(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </section>
  );
}
