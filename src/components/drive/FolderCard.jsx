import React from 'react';
import { MoreVertical, ChevronRight } from 'lucide-react';
import { computeStatsForCards } from '../../lib/spacedRepetition';

export default function FolderCard({
  folder,
  appData,
  progressMap,
  getFolderRecursiveDeckIds,
  getCardsByDeckIds,
  draggedItem,
  setDraggedItem,
  dragOverFolderId,
  setDragOverFolderId,
  handleDropOnFolder,
  setCurrentFolderId,
  openMenuFolderId,
  setOpenMenuFolderId,
}) {
  const deckIds = getFolderRecursiveDeckIds(folder.id);
  const cards = getCardsByDeckIds(deckIds);
  const st = computeStatsForCards(cards, progressMap);
  const subFolderCount = appData.folders.filter((sf) => sf.parentId === folder.id).length;
  const isFolderMenuOpen = openMenuFolderId === folder.id;

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData(
          'application/json',
          JSON.stringify({ type: 'folder', id: folder.id, name: folder.name })
        );
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
        dragOverFolderId === folder.id ? 'drag-over-active ring-2 ring-sky-500 bg-sky-50/90' : ''
      } ${isFolderMenuOpen ? 'relative z-40' : 'relative z-10'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-white/80 border border-slate-200/60 shadow-sm flex items-center justify-center text-xl shrink-0">
            {folder.icon || '📁'}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug break-words"
              title={folder.name}
            >
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
              setOpenMenuFolderId(folder.id);
            }}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95"
            title="Tùy chọn thư mục"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
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
}
