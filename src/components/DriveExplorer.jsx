import React, { useState } from 'react';
import {
  Home,
  ChevronRight,
  FolderPlus,
  Plus,
  Share2,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';
import { computeStatsForCards, computeStudyStreak } from '../lib/spacedRepetition';
import ConfirmModal from './ConfirmModal';
import DriveScopeBanner from './drive/DriveScopeBanner';
import SearchResultsView from './drive/SearchResultsView';
import FolderCard from './drive/FolderCard';
import DeckCard from './drive/DeckCard';
import FolderActionSheet from './drive/FolderActionSheet';
import DeckActionSheet from './drive/DeckActionSheet';

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
  activityLogs,
  currentFolderId,
  setCurrentFolderId,
  getFolderPath,
  getFolderRecursiveDeckIds,
  getCardsByDeckIds,
  onStartStudy,
  onNewFolder,
  onNewDeck,
  onEditFolder,
  onMoveFolder,
  onDeleteFolder,
  onEditDeck,
  onMoveDeck,
  onDeleteDeck,
  onViewNote,
  onShareLink,
  searchQuery,
  deviceId,
  onQuickMoveDeck,
  onQuickMoveFolder,
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const [openMenuFolderId, setOpenMenuFolderId] = useState(null);
  const [openMenuDeckId, setOpenMenuDeckId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const scopeDeckIds = getFolderRecursiveDeckIds(currentFolderId);
  const scopeCards = getCardsByDeckIds(scopeDeckIds);
  const scopeStats = computeStatsForCards(scopeCards, progressMap);

  const currentFolderObj = appData.folders.find((f) => f.id === currentFolderId);
  const path = getFolderPath(currentFolderId);
  const childFolders = appData.folders.filter((f) => (f.parentId || null) === currentFolderId);
  const childDecks = appData.decks.filter((d) => (d.folderId || null) === currentFolderId);

  // Sắp xếp danh sách bài học & thư mục (Natural Alphanumeric Sort)
  const [sortMode, setSortMode] = useState(() => {
    try {
      return localStorage.getItem('minmin_deck_sort') || 'name_asc';
    } catch (_) {
      return 'name_asc';
    }
  });

  const handleSortChange = (newMode) => {
    setSortMode(newMode);
    try {
      localStorage.setItem('minmin_deck_sort', newMode);
    } catch (_) {}
  };

  const sortedFolders = [...childFolders].sort((a, b) => {
    const nameA = (a.name || '').trim();
    const nameB = (b.name || '').trim();
    return nameA.localeCompare(nameB, 'vi', { numeric: true, sensitivity: 'base' });
  });

  const sortedDecks = [...childDecks].sort((a, b) => {
    const nameA = (a.name || '').trim();
    const nameB = (b.name || '').trim();

    if (sortMode === 'name_asc') {
      return nameA.localeCompare(nameB, 'vi', { numeric: true, sensitivity: 'base' });
    }
    if (sortMode === 'name_desc') {
      return nameB.localeCompare(nameA, 'vi', { numeric: true, sensitivity: 'base' });
    }
    if (sortMode === 'newest') {
      const timeA = a.updatedAt || a.id || '';
      const timeB = b.updatedAt || b.id || '';
      return timeB.localeCompare(timeA);
    }
    if (sortMode === 'oldest') {
      const timeA = a.updatedAt || a.id || '';
      const timeB = b.updatedAt || b.id || '';
      return timeA.localeCompare(timeB);
    }
    if (sortMode === 'due_desc') {
      const dueA = computeStatsForCards(a.cards, progressMap).due;
      const dueB = computeStatsForCards(b.cards, progressMap).due;
      return dueB - dueA;
    }
    if (sortMode === 'cards_desc') {
      return (b.cards?.length || 0) - (a.cards?.length || 0);
    }
    return 0;
  });

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
                className={`px-2 py-1 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap max-w-[140px] sm:max-w-xs truncate ${
                  currentFolderId === folder.id
                    ? 'bg-sky-100 text-sky-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{folder.icon || '📁'}</span>
                <span className="truncate">{folder.name}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              const hash = currentFolderId ? `#folder=${currentFolderId}` : '';
              const url = `${window.location.origin}${window.location.pathname}${hash}`;
              navigator.clipboard?.writeText(url);
              onShareLink(hash, 'Đã sao chép link chia sẻ thư mục này!');
            }}
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

      {/* Focus Study Scope Banner */}
      <DriveScopeBanner
        streak={streak}
        deviceId={deviceId}
        greenPct={greenPct}
        scopeStats={scopeStats}
        currentFolderObj={currentFolderObj}
        scopeDeckIds={scopeDeckIds}
        onStartStudy={onStartStudy}
      />

      {/* Global Search Results */}
      <SearchResultsView
        searchQuery={searchQuery}
        searchResults={searchResults}
        onStartStudy={onStartStudy}
      />

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
            {sortedFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                appData={appData}
                progressMap={progressMap}
                getFolderRecursiveDeckIds={getFolderRecursiveDeckIds}
                getCardsByDeckIds={getCardsByDeckIds}
                draggedItem={draggedItem}
                setDraggedItem={setDraggedItem}
                dragOverFolderId={dragOverFolderId}
                setDragOverFolderId={setDragOverFolderId}
                handleDropOnFolder={handleDropOnFolder}
                setCurrentFolderId={setCurrentFolderId}
                openMenuFolderId={openMenuFolderId}
                setOpenMenuFolderId={setOpenMenuFolderId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Decks Grid */}
      {(childDecks.length > 0 || childFolders.length === 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bộ bài học
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative inline-flex items-center">
                <ArrowUpDown className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
                <select
                  value={sortMode}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="pl-6 pr-6 py-1 bg-white/80 hover:bg-white text-[11px] font-semibold text-slate-700 rounded-xl border border-slate-200/80 shadow-2xs appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-400"
                  title="Sắp xếp danh sách bài học"
                >
                  <option value="name_asc">Tên A → Z (Tự nhiên 1→9)</option>
                  <option value="name_desc">Tên Z → A</option>
                  <option value="newest">Mới cập nhật nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="due_desc">Cần ôn nhiều nhất</option>
                  <option value="cards_desc">Nhiều thẻ nhất</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
              </div>
              <span className="text-xs text-slate-400 font-medium">{childDecks.length} bài học</span>
            </div>
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
              {sortedDecks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  progressMap={progressMap}
                  openMenuDeckId={openMenuDeckId}
                  setOpenMenuDeckId={setOpenMenuDeckId}
                  setDraggedItem={setDraggedItem}
                  setDragOverFolderId={setDragOverFolderId}
                  onViewNote={onViewNote}
                  onStartStudy={onStartStudy}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Folder Action Sheet */}
      <FolderActionSheet
        openMenuFolderId={openMenuFolderId}
        setOpenMenuFolderId={setOpenMenuFolderId}
        appData={appData}
        onEditFolder={onEditFolder}
        onMoveFolder={onMoveFolder}
        onShareLink={onShareLink}
        setConfirmDelete={setConfirmDelete}
      />

      {/* Deck Action Sheet with Metadata Info */}
      <DeckActionSheet
        openMenuDeckId={openMenuDeckId}
        setOpenMenuDeckId={setOpenMenuDeckId}
        appData={appData}
        onViewNote={onViewNote}
        onEditDeck={onEditDeck}
        onMoveDeck={onMoveDeck}
        onShareLink={onShareLink}
        setConfirmDelete={setConfirmDelete}
      />

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
