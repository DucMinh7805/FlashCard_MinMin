import React, { useEffect, useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
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
    setSelectedFolderId(currentFolderId || '');
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Nạp bộ thẻ mới / Cập nhật bài học</h3>
            <p className="text-xs text-slate-500">Tự động nhận diện JSON đa năng hoặc văn bản phân tách bằng dấu | (chống trùng lặp tiến độ)</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Thư mục chứa bài học</label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800"
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tên bài học (Deck)</label>
            <input
              type="text"
              value={deckName || parsed.deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Ví dụ: Bài 1 - X-ray & CT"
              className="w-full glass-input rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-600">Chọn file (.json, .csv, .txt) hoặc dán trực tiếp nội dung:</label>
            <input
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleFileChange}
              className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
            />
          </div>
          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Dán JSON từ Prompt chuẩn hoặc nhập từng dòng theo cú pháp:&#10;Mặt trước | Mặt sau | Gợi ý (tùy chọn) | Giải thích thêm (tùy chọn)"
            className="w-full glass-input rounded-2xl p-3 text-xs sm:text-sm font-mono leading-relaxed text-slate-800"
          />
        </div>

        {parsed.isJsonError ? (
          <div className="glass-card bg-rose-50/90 rounded-2xl p-3 text-xs text-rose-800 border border-rose-300 shadow-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-700">Lỗi cú pháp JSON phát hiện:</p>
              <p className="font-mono text-[11px] text-rose-800 bg-white/70 px-2 py-1 rounded-lg border border-rose-200 break-all">
                {parsed.error}
              </p>
              <p className="text-[11px] text-rose-600">
                Hệ thống đã chặn nạp tự động để tránh cắt sai dữ liệu thành các thẻ hỏng. Vui lòng kiểm tra lại cấu trúc JSON hoặc dấu phẩy thừa.
              </p>
            </div>
          </div>
        ) : (
          <div className="glass-card bg-slate-50/80 rounded-2xl p-3 text-xs text-slate-700 border-slate-200/80">
            <p className="font-medium flex items-center gap-1.5 text-sky-800">
              {parsed.cards.length > 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Nhận diện hợp lệ <strong>{parsed.cards.length} thẻ</strong> ({clozeCount} Cloze, {caseCount} Case). Thẻ trùng câu hỏi sẽ giữ nguyên tiến độ cũ.
                  </span>
                </>
              ) : (
                <span>Hãy dán nội dung hoặc chọn file để xem trước số thẻ...</span>
              )}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="glass-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={parsed.cards.length === 0 || parsed.isJsonError}
            onClick={() => {
              if (parsed.cards.length === 0 || parsed.isJsonError) return;
              onConfirmImport({
                parsed,
                selectedFolderId: selectedFolderId || null,
                deckNameInput: (deckName || parsed.deckName).trim(),
              });
              setRawText('');
              setDeckName('');
            }}
            className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 ${
              parsed.cards.length === 0 || parsed.isJsonError
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-sky-500 hover:bg-sky-400 text-white'
            }`}
          >
            Lưu & Nạp vào Thư mục
          </button>
        </div>
      </div>
    </div>
  );
}
