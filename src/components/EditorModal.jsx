import React, { useEffect, useState } from 'react';
import {
  X,
  FolderPlus,
  Edit3,
  FolderInput,
  FileText,
  BookOpen,
  Check,
  ArrowRight,
} from 'lucide-react';

export default function EditorModal({
  mode,
  card,
  folder,
  deck,
  folders = [],
  onClose,
  onSaveFolder,
  onEditFolder,
  onMoveFolder,
  onEditDeck,
  onMoveDeck,
  onSaveCard,
}) {
  // Folder state
  const [folderName, setFolderName] = useState('');
  const [folderIcon, setFolderIcon] = useState('📁');
  const [targetParentId, setTargetParentId] = useState('');

  // Deck state
  const [deckName, setDeckName] = useState('');
  const [deckNote, setDeckNote] = useState('');
  const [targetDeckFolderId, setTargetDeckFolderId] = useState('');

  // Card state
  const [type, setType] = useState('basic');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [image, setImage] = useState('');
  const [extra, setExtra] = useState('');

  useEffect(() => {
    if (!mode) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onClose]);

  useEffect(() => {
    if (mode === 'new_folder') {
      setFolderName('');
      setFolderIcon('📁');
    } else if (mode === 'edit_folder' && folder) {
      setFolderName(folder.name || '');
      setFolderIcon(folder.icon || '📁');
    } else if (mode === 'move_folder' && folder) {
      setTargetParentId(folder.parentId || '');
    } else if ((mode === 'edit_deck' || mode === 'view_note') && deck) {
      setDeckName(deck.name || '');
      setDeckNote(deck.note || '');
    } else if (mode === 'move_deck' && deck) {
      setTargetDeckFolderId(deck.folderId || '');
    } else if (mode === 'edit_card' && card) {
      setType(card.type || 'basic');
      setFront(card.front || '');
      setBack(card.back || '');
      setHint(card.hint || '');
      setImage(card.image || '');
      setExtra(card.extra || '');
    }
  }, [mode, folder, deck, card]);

  if (!mode) return null;

  // Filter out the folder itself and its descendants when moving a folder
  const getExcludedFolderIds = (rootId) => {
    const set = new Set([rootId]);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parentId && set.has(f.parentId) && !set.has(f.id)) {
          set.add(f.id);
          added = true;
        }
      }
    }
    return set;
  };
  const excludedIds = folder ? getExcludedFolderIds(folder.id) : new Set();
  const validParentFolders = folders.filter((f) => !excludedIds.has(f.id));

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-white/90 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {mode === 'new_folder' && <FolderPlus className="w-5 h-5 text-emerald-600" />}
            {mode === 'edit_folder' && <Edit3 className="w-5 h-5 text-sky-600" />}
            {mode === 'move_folder' && <FolderInput className="w-5 h-5 text-indigo-600" />}
            {mode === 'edit_deck' && <Edit3 className="w-5 h-5 text-sky-600" />}
            {mode === 'move_deck' && <FolderInput className="w-5 h-5 text-indigo-600" />}
            {mode === 'view_note' && <FileText className="w-5 h-5 text-amber-600" />}
            {mode === 'edit_card' && <Edit3 className="w-5 h-5 text-sky-600" />}

            <h3 className="text-base font-bold text-slate-800">
              {mode === 'new_folder' && 'Tạo thư mục mới'}
              {mode === 'edit_folder' && `Đổi tên thư mục: ${folder?.name}`}
              {mode === 'move_folder' && `Di chuyển thư mục: ${folder?.name}`}
              {mode === 'edit_deck' && `Sửa bài học & Ghi chú: ${deck?.name}`}
              {mode === 'move_deck' && `Di chuyển bài học: ${deck?.name}`}
              {mode === 'view_note' && `Ghi chú bài học: ${deck?.name}`}
              {mode === 'edit_card' && 'Sửa nhanh thẻ đang học'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content by Mode */}
        {mode === 'new_folder' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên thư mục</label>
              <input
                type="text"
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Ví dụ: Nội khoa, Ngoại khoa, AVCN..."
                className="w-full glass-input rounded-xl px-3 py-2 text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Biểu tượng (Emoji)</label>
              <input
                type="text"
                value={folderIcon}
                onChange={(e) => setFolderIcon(e.target.value)}
                className="w-24 glass-input rounded-xl px-3 py-2 text-sm text-center text-slate-800"
              />
            </div>
          </div>
        )}

        {mode === 'edit_folder' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên thư mục</label>
              <input
                type="text"
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Biểu tượng (Emoji)</label>
              <input
                type="text"
                value={folderIcon}
                onChange={(e) => setFolderIcon(e.target.value)}
                className="w-24 glass-input rounded-xl px-3 py-2 text-sm text-center text-slate-800"
              />
            </div>
          </div>
        )}

        {mode === 'move_folder' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Chọn thư mục đích bạn muốn chuyển <strong className="text-slate-700">{folder?.name}</strong> vào:
            </p>
            <select
              value={targetParentId}
              onChange={(e) => setTargetParentId(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm text-slate-800"
            >
              <option value="">📁 Trang chủ (Thư mục gốc)</option>
              {validParentFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.icon || '📁'} {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'edit_deck' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên bộ bài học</label>
              <input
                type="text"
                autoFocus
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ghi chú bài học / Tóm tắt trọng tâm (Study Note)
              </label>
              <textarea
                rows={5}
                value={deckNote}
                onChange={(e) => setDeckNote(e.target.value)}
                placeholder="Nhập tóm tắt bài học, phác đồ, công thức hoặc lưu ý ôn thi chung cho nhóm..."
                className="w-full glass-input rounded-xl p-2.5 text-xs text-slate-800 leading-relaxed font-sans"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Mọi thành viên trong nhóm đều có thể đọc ghi chú này trước khi học thẻ.
              </p>
            </div>
          </div>
        )}

        {mode === 'move_deck' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Chọn thư mục đích để di chuyển bài học <strong className="text-slate-700">{deck?.name}</strong>:
            </p>
            <select
              value={targetDeckFolderId}
              onChange={(e) => setTargetDeckFolderId(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm text-slate-800"
            >
              <option value="">📁 Trang chủ (Không thuộc thư mục nào)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.icon || '📁'} {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'view_note' && (
          <div className="space-y-3">
            {deck?.author && (
              <p className="text-[11px] text-slate-500">
                Đóng góp bởi: <strong className="text-sky-700">{deck.author}</strong> • {deck.updatedAt || 'Hôm nay'}
              </p>
            )}
            <div className="glass-card bg-amber-50/50 rounded-2xl p-3.5 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border border-amber-200/60 font-sans">
              {deck?.note?.trim() ? (
                deck.note
              ) : (
                <p className="text-slate-400 italic text-center py-4">Bài học này chưa có ghi chú tóm tắt.</p>
              )}
            </div>
          </div>
        )}

        {mode === 'edit_card' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Loại thẻ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
              >
                <option value="basic">Hỏi - Đáp thường</option>
                <option value="cloze">Điền vào chỗ trống (bọc từ cần ẩn bằng &#123;&#123;c1::từ ẩn&#125;&#125;)</option>
                <option value="case">Ca lâm sàng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mặt trước (Câu hỏi / Thuật ngữ)</label>
              <textarea
                rows={2}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                className="w-full glass-input rounded-xl p-2.5 text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mặt sau (Đáp án)</label>
              <textarea
                rows={3}
                value={back}
                onChange={(e) => setBack(e.target.value)}
                className="w-full glass-input rounded-xl p-2.5 text-sm text-slate-800"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gợi ý nhỏ (xem trước khi lật)</label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Gợi ý ngắn giúp nhớ lại..."
                  className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Link ảnh minh họa (tùy chọn)</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Giải thích thêm / Ghi chú (hiện dưới đáp án)</label>
              <textarea
                rows={2}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Giải thích thêm hoặc câu ví dụ (hiện dưới đáp án)..."
                className="w-full glass-input rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="glass-pill px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            {mode === 'view_note' ? 'Đóng' : 'Hủy'}
          </button>
          {mode === 'view_note' ? (
            <button
              type="button"
              onClick={() => onEditDeck({ id: deck.id, name: deck.name, note: deck.note || '' }, true)}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa ghi chú</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (mode === 'new_folder') {
                  onSaveFolder({ name: folderName.trim(), icon: folderIcon.trim() || '📁' });
                } else if (mode === 'edit_folder') {
                  onEditFolder(folder.id, { name: folderName.trim(), icon: folderIcon.trim() || '📁' });
                } else if (mode === 'move_folder') {
                  onMoveFolder(folder.id, targetParentId || null);
                } else if (mode === 'edit_deck') {
                  onEditDeck({ id: deck.id, name: deckName.trim(), note: deckNote.trim() });
                } else if (mode === 'move_deck') {
                  onMoveDeck(deck.id, targetDeckFolderId || null);
                } else if (mode === 'edit_card') {
                  onSaveCard({
                    type,
                    front: front.trim(),
                    back: back.trim(),
                    hint: hint.trim(),
                    image: image.trim(),
                    extra: extra.trim(),
                  });
                }
              }}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95"
            >
              Lưu thay đổi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
