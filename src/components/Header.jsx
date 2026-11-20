import React from 'react';
import {
  TrendingUp,
  Search,
  Plus,
  Settings,
  BookPlus,
  FolderPlus,
  Sparkles,
  X,
  HardDrive,
} from 'lucide-react';

export default function Header({
  isOnline = true,
  isCloudSyncing,
  hasCloudConnection,
  onResetNavigation,
  onOpenAnalytics,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  plusMenuOpen,
  setPlusMenuOpen,
  onOpenImport,
  onOpenNewFolder,
  onOpenPrompt,
  onOpenSettings,
  onOpenBackupVault,
}) {
  return (
    <header className={`sticky top-0 px-3 sm:px-4 pt-2.5 pb-2 transition-all ${plusMenuOpen ? 'z-50' : 'z-30'}`}>
      <div className="max-w-5xl mx-auto glass-panel rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-sm">
        {/* Logo & App Title */}
        <button
          type="button"
          onClick={onResetNavigation}
          className="flex items-center gap-2 text-left"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            M
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-slate-800 text-sm sm:text-base">FlashCard MinMin</span>
            <span
              className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                !isOnline
                  ? 'bg-slate-400 ring-2 ring-slate-200'
                  : isCloudSyncing
                    ? 'bg-amber-400 animate-pulse'
                    : hasCloudConnection
                      ? 'bg-emerald-500 ring-2 ring-emerald-200'
                      : 'bg-slate-300'
              }`}
              title={
                !isOnline
                  ? 'Ngoại tuyến (Offline) - Vẫn học và lưu máy bình thường'
                  : isCloudSyncing
                    ? 'Đang đồng bộ Cloud...'
                    : 'Đám mây Mini Drive kết nối'
              }
            />
          </div>
        </button>

        {/* Right Actions: Clean, consistent Liquid Glass icons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="glass-pill w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
            title="Thống kê học tập"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            className={`glass-pill w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition ${
              showSearch || searchQuery ? 'bg-sky-100/90 text-sky-700 border-sky-300' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tìm kiếm"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* "+ Thêm" menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPlusMenuOpen((v) => !v)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs sm:text-sm flex items-center gap-1 shadow-sm transition active:scale-95"
              title="Thêm mới bài học / thư mục"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm</span>
            </button>

            {plusMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl p-1.5 z-50 shadow-2xl space-y-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setPlusMenuOpen(false);
                      onOpenImport();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                  >
                    <BookPlus className="w-4 h-4 text-sky-600" />
                    <span>Nạp bộ bài học mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlusMenuOpen(false);
                      onOpenNewFolder();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4 text-emerald-600" />
                    <span>Tạo thư mục mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlusMenuOpen(false);
                      onOpenPrompt();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Prompt tạo thẻ AI</span>
                  </button>
                  {onOpenBackupVault && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlusMenuOpen(false);
                        onOpenBackupVault();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                    >
                      <HardDrive className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span className="block font-bold">Kho dữ liệu & Link dự phòng</span>
                        <span className="text-[10px] text-slate-400 block">Google Drive, Sheets (Khóa mã)</span>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="glass-pill w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
            title="Cài đặt học tập"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Search Input */}
      {showSearch && (
        <div className="max-w-5xl mx-auto mt-2 animate-fadeIn">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo câu hỏi, đáp án, hoặc tên bài học..."
              className="w-full glass-input rounded-2xl pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-800 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
