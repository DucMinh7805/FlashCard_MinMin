import React, { useEffect, useState } from 'react';
import { X, FolderPlus, Edit3 } from 'lucide-react';

export default function EditorModal({ mode, card, onClose, onSaveFolder, onSaveCard }) {
  const [folderName, setFolderName] = useState('');
  const [folderIcon, setFolderIcon] = useState('📁');

  const [type, setType] = useState('basic');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [image, setImage] = useState('');
  const [extra, setExtra] = useState('');

  useEffect(() => {
    if (mode === 'new_folder') {
      setFolderName('');
      setFolderIcon('📁');
    } else if (mode === 'edit_card' && card) {
      setType(card.type || 'basic');
      setFront(card.front || '');
      setBack(card.back || '');
      setHint(card.hint || '');
      setImage(card.image || '');
      setExtra(card.extra || '');
    }
  }, [mode, card]);

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-white/90 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {mode === 'new_folder' ? (
              <FolderPlus className="w-5 h-5 text-emerald-600" />
            ) : (
              <Edit3 className="w-5 h-5 text-sky-600" />
            )}
            <h3 className="text-base font-bold text-slate-800">
              {mode === 'new_folder' ? 'Tạo thư mục môn học / chuyên khoa' : 'Sửa nhanh thẻ đang học'}
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

        {mode === 'new_folder' ? (
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
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Loại thẻ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
              >
                <option value="basic">Basic (Hỏi - Đáp / Thuật ngữ)</option>
                <option value="cloze">Cloze (Điền khuyết &#123;&#123;c1::...&#125;&#125;)</option>
                <option value="case">Case (Tình huống lâm sàng)</option>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gợi ý (Hint)</label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Giải thích chi tiết / Ghi chú lâm sàng</label>
              <textarea
                rows={2}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                className="w-full glass-input rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="glass-pill px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              if (mode === 'new_folder') {
                onSaveFolder({ name: folderName.trim(), icon: folderIcon.trim() || '📁' });
              } else {
                onSaveCard({ type, front: front.trim(), back: back.trim(), hint: hint.trim(), image: image.trim(), extra: extra.trim() });
              }
            }}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
