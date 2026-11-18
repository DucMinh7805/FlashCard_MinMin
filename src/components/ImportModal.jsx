import React, { useEffect, useState } from 'react';
import { parseImportInput } from '../lib/importParser';

export default function ImportModal({
  isOpen,
  onClose,
  folders,
  currentFolderId,
  getFolderPath,
  onConfirmImport,
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || '');
  const [deckName, setDeckName] = useState('');
  const [rawText, setRawText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(currentFolderId || '');
    }
  }, [isOpen, currentFolderId]);

  const handleClose = () => {
    setDeckName('');
    setRawText('');
    onClose();
  };

  if (!isOpen) return null;

  const parsed = parseImportInput(rawText);
  const clozeCount = parsed.cards.filter((c) => c.type === 'cloze').length;
  const caseCount = parsed.cards.filter((c) => c.type === 'case').length;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setRawText(content);
      const res = parseImportInput(content);
      if (res.deckName && !deckName.trim()) {
        setDeckName(res.deckName);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Nạp bộ thẻ mới / Cập nhật bài học</h3>
            <p className="text-xs text-slate-300">Tự động nhận diện JSON đa năng hoặc văn bản phân tách bằng dấu | (chống trùng lặp tiến độ cũ)</p>
          </div>
          <button type="button" onClick={handleClose} className="glass-pill w-8 h-8 rounded-xl text-slate-300 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Thư mục chứa bài học</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-sm"
            >
              <option value="">🏠 Thư mục gốc (Kho môn học)</option>
              {folders.map((f) => {
                const pathStr = getFolderPath(f.id).map((x) => x.name).join(' / ');
                return (
                  <option key={f.id} value={f.id}>
                    {f.icon || '📁'} {pathStr}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Tên bài học (Deck)</label>
            <input
              type="text"
              value={deckName || parsed.deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Ví dụ: Bài 1 - X-ray & CT"
              className="w-full glass-input rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs text-slate-300">Chọn file (.json, .csv, .txt) hoặc dán trực tiếp nội dung bên dưới:</label>
            <input
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleFileChange}
              className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-sky-500/20 file:text-sky-200 hover:file:bg-sky-500/30"
            />
          </div>
          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Dán JSON từ Prompt chuẩn hoặc nhập từng dòng theo cú pháp:&#10;Mặt trước | Mặt sau | Gợi ý (tùy chọn) | Giải thích thêm (tùy chọn)"
            className="w-full glass-input rounded-2xl p-3 text-xs sm:text-sm font-mono leading-relaxed"
          />
        </div>

        <div className="glass-card rounded-2xl p-3 text-xs text-slate-200">
          <p className="font-medium text-sky-200">
            {parsed.cards.length > 0
              ? `✓ Nhận diện hợp lệ ${parsed.cards.length} thẻ (${clozeCount} Cloze, ${caseCount} Case). Thẻ trùng Mặt trước sẽ giữ nguyên tiến độ cũ.`
              : 'Hãy dán nội dung hoặc chọn file để xem trước số thẻ...'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} className="glass-pill px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-300">
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmImport({
                parsed,
                selectedFolderId: selectedFolderId || null,
                deckNameInput: (deckName || parsed.deckName).trim(),
              });
              setRawText('');
              setDeckName('');
            }}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm"
          >
            Lưu & Nạp vào Thư mục
          </button>
        </div>
      </div>
    </div>
  );
}
