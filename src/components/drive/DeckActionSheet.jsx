import React from 'react';
import { BookOpen, X, User, Calendar, Clock, FileText, Edit3, FolderInput, Share2, Trash2 } from 'lucide-react';

export default function DeckActionSheet({
  openMenuDeckId,
  setOpenMenuDeckId,
  appData,
  onViewNote,
  onEditDeck,
  onMoveDeck,
  onShareLink,
  setConfirmDelete,
}) {
  if (!openMenuDeckId) return null;
  const deck = appData.decks.find((d) => d.id === openMenuDeckId);
  if (!deck) return null;

  // Format creation & update timestamps
  let createdDateText = 'Không rõ';
  if (deck.createdAt) {
    createdDateText = deck.createdAt;
  } else {
    const match = deck.id?.match(/^deck_(\d{10,13})/);
    if (match) {
      const d = new Date(Number(match[1]));
      if (!isNaN(d.getTime())) {
        createdDateText = d.toLocaleDateString('vi-VN');
      }
    } else if (deck.updatedAt) {
      createdDateText = deck.updatedAt;
    }
  }
  const updatedDateText = deck.updatedAt || createdDateText;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setOpenMenuDeckId(null)}
      />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl z-10 border border-slate-100 space-y-2.5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tùy chọn bài học</p>
            <h4 className="text-sm sm:text-base font-bold text-slate-800 truncate flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="truncate">{deck.name}</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">{deck.cards?.length || 0} thẻ bài học</p>
          </div>
          <button
            type="button"
            onClick={() => setOpenMenuDeckId(null)}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Info Block: Người đăng, Ngày tải lên, Chỉnh sửa gần nhất */}
        <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Người tải lên / Đăng bài:</span>
            </span>
            <span className="font-semibold text-slate-800">{deck.author || 'Chưa đặt tên'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Thời gian tải lên:</span>
            </span>
            <span className="font-medium text-slate-700">{createdDateText}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Chỉnh sửa gần nhất:</span>
            </span>
            <span className="font-medium text-slate-700">{updatedDateText}</span>
          </div>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setOpenMenuDeckId(null);
              onViewNote(deck);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2.5 transition active:scale-98"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Ghi chú bài học (Note)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenMenuDeckId(null);
              onEditDeck(deck);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition active:scale-98"
          >
            <Edit3 className="w-4 h-4 text-sky-600" />
            <span>Đổi tên & sửa Note</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenMenuDeckId(null);
              onMoveDeck(deck);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition active:scale-98"
          >
            <FolderInput className="w-4 h-4 text-indigo-600" />
            <span>Di chuyển sang thư mục khác</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenMenuDeckId(null);
              onShareLink(`#deck=${deck.id}`, `Đã copy link chia sẻ bài "${deck.name}"`);
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
                setOpenMenuDeckId(null);
                setConfirmDelete({ type: 'deck', id: deck.id, name: deck.name });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-bold text-rose-600 bg-rose-50/80 hover:bg-rose-100 flex items-center gap-2.5 transition active:scale-98 border border-rose-200/60"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Xóa bài học này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
