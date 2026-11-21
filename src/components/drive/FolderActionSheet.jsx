import React from 'react';
import { Folder, X, Edit3, FolderInput, Share2, Trash2 } from 'lucide-react';

export default function FolderActionSheet({
  openMenuFolderId,
  setOpenMenuFolderId,
  appData,
  onEditFolder,
  onMoveFolder,
  onShareLink,
  setConfirmDelete,
}) {
  if (!openMenuFolderId) return null;
  const folder = appData.folders.find((f) => f.id === openMenuFolderId);
  if (!folder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setOpenMenuFolderId(null)}
      />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl z-10 border border-slate-100 space-y-2.5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tùy chọn thư mục</p>
            <h4 className="text-sm sm:text-base font-bold text-slate-800 truncate flex items-center gap-1.5">
              <span className="text-base">{folder.icon || '📁'}</span>
              <span className="truncate">{folder.name}</span>
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setOpenMenuFolderId(null)}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setOpenMenuFolderId(null);
              onEditFolder(folder);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition active:scale-98"
          >
            <Edit3 className="w-4 h-4 text-sky-600" />
            <span>Đổi tên & biểu tượng</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenMenuFolderId(null);
              onMoveFolder(folder);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition active:scale-98"
          >
            <FolderInput className="w-4 h-4 text-indigo-600" />
            <span>Di chuyển thư mục</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenMenuFolderId(null);
              onShareLink(`#folder=${folder.id}`, `Đã copy link chia sẻ môn "${folder.name}"`);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition active:scale-98"
          >
            <Share2 className="w-4 h-4 text-sky-600" />
            <span>Sao chép link chia sẻ</span>
          </button>

          <div className="pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setOpenMenuFolderId(null);
                setConfirmDelete({ type: 'folder', id: folder.id, name: folder.name });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-bold text-rose-600 bg-rose-50/80 hover:bg-rose-100 flex items-center gap-2.5 transition active:scale-98 border border-rose-200/60"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Xóa thư mục này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
