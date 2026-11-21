import React, { useEffect, useState } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Trash2,
  ArrowLeft,
  Layers,
  Folder,
  User,
} from 'lucide-react';
import {
  parseImportInput,
  parseFileOrTextToDecks,
  cleanFileNameToTitle,
} from '../lib/importParser';
import { isDefaultOrEmptyName } from '../lib/nameValidator';
import ImportBatchList from './import/ImportBatchList';

export default function ImportModal({
  isOpen,
  onClose,
  folders,
  currentFolderId,
  getFolderPath,
  onConfirmImport,
  settings,
  onUpdateSettings,
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || '');
  const [deckName, setDeckName] = useState('');
  const [deckNote, setDeckNote] = useState('');
  const [rawText, setRawText] = useState('');
  const [batchItems, setBatchItems] = useState([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [uploaderName, setUploaderName] = useState(() => {
    const sName = settings?.studentName || '';
    return isDefaultOrEmptyName(sName) ? '' : sName;
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(currentFolderId || '');
      const sName = settings?.studentName || '';
      if (!isDefaultOrEmptyName(sName)) {
        setUploaderName(sName);
      }
    }
  }, [isOpen, currentFolderId, settings?.studentName]);

  const handleClose = () => {
    setDeckName('');
    setDeckNote('');
    setRawText('');
    setBatchItems([]);
    setIsBatchMode(false);
    setIsEditingName(false);
    setSelectedFolderId(currentFolderId || '');
    onClose();
  };

  const parsed = parseImportInput(rawText);
  const clozeCount = parsed.cards.filter((c) => c.type === 'cloze').length;
  const caseCount = parsed.cards.filter((c) => c.type === 'case').length;

  // Auto-sync parsed note if user hasn't typed their own note
  useEffect(() => {
    if (isOpen && !isBatchMode && parsed.note && !deckNote.trim()) {
      setDeckNote(parsed.note);
    }
  }, [isOpen, isBatchMode, parsed.note, deckNote]);

  if (!isOpen) return null;

  // Xử lý nạp 1 hoặc NHIỀU file (.json, .csv, .txt) cùng lúc
  const handleFilesChange = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;
    setIsReadingFiles(true);

    try {
      const results = await Promise.all(
        fileList.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const content = String(reader.result || '');
              const parsedList = parseFileOrTextToDecks(content, file.name);
              resolve(parsedList);
            };
            reader.onerror = () => {
              resolve([
                {
                  id: `err_${Date.now()}_${Math.random()}`,
                  fileName: file.name,
                  deckName: cleanFileNameToTitle(file.name),
                  note: '',
                  cards: [],
                  isValid: false,
                  error: 'Không đọc được file (Lỗi I/O hệ thống)',
                  clozeCount: 0,
                  caseCount: 0,
                  basicCount: 0,
                },
              ]);
            };
            reader.readAsText(file, 'utf-8');
          });
        })
      );

      const allRecognized = results.flat();

      // Nếu chỉ có đúng 1 bài học từ 1 file đơn: Giữ giao diện nhập đơn quen thuộc
      if (allRecognized.length === 1 && allRecognized[0].isValid && fileList.length === 1) {
        const item = allRecognized[0];
        setBatchItems([]);
        setIsBatchMode(false);
        setDeckName(item.deckName);
        setDeckNote(item.note);
        setRawText(
          JSON.stringify(
            {
              deck: item.deckName,
              note: item.note,
              cards: item.cards,
            },
            null,
            2
          )
        );
      } else if (allRecognized.length > 0) {
        // Nhiều bài học hoặc nhiều file: Bật giao diện nhận diện hàng loạt
        setBatchItems(allRecognized);
        setIsBatchMode(true);
      }
    } finally {
      setIsReadingFiles(false);
      e.target.value = '';
    }
  };

  const handleUpdateBatchDeckName = (index, value) => {
    setBatchItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], deckName: value };
      return next;
    });
  };

  const handleUpdateBatchNote = (index, value) => {
    setBatchItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], note: value };
      return next;
    });
  };

  const handleRemoveBatchItem = (index) => {
    setBatchItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setIsBatchMode(false);
      }
      return next;
    });
  };

  const validBatchDecks = batchItems.filter((d) => d.isValid && d.cards.length > 0);
  const totalBatchCards = validBatchDecks.reduce((sum, d) => sum + d.cards.length, 0);
  const totalBatchCloze = validBatchDecks.reduce((sum, d) => sum + (d.clozeCount || 0), 0);
  const totalBatchCase = validBatchDecks.reduce((sum, d) => sum + (d.caseCount || 0), 0);
  const errorBatchCount = batchItems.filter((d) => !d.isValid).length;

  const hasSavedCustomName = !isDefaultOrEmptyName(settings?.studentName);
  const isNameInvalid = !hasSavedCustomName && isDefaultOrEmptyName(uploaderName);

  const currentFolderObj = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>Nạp bộ bài học mới</span>
                {isBatchMode && (
                  <span className="text-xs bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full">
                    Hàng loạt ({validBatchDecks.length} bài)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Tự động đồng bộ lên Mini Drive để cả nhóm cùng học ngay lập tức
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Folder Selector (Chung cho cả 2 chế độ) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Thư mục nạp vào (Mặc định vị trí bạn đang đứng)
          </label>
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="w-full glass-input rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800"
          >
            <option value="">📁 Trang chủ (Thư mục gốc)</option>
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

        {/* Uploader Name - Nếu đã đổi tên trước đó thì lần sau KHÔNG bắt xác thực nữa */}
        {hasSavedCustomName ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Người đăng bài:</span>
              <strong className="text-slate-800 font-bold">{uploaderName || settings?.studentName}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsEditingName(!isEditingName)}
              className="text-[11px] text-sky-600 hover:text-sky-700 font-medium underline"
            >
              {isEditingName ? 'Đóng' : 'Đổi tên'}
            </button>
          </div>
        ) : (
          /* Chỉ hiện bắt buộc khi chưa từng đổi tên lần nào */
          <div className="p-3 rounded-2xl border bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span>Tên người đăng bài:</span>
                <span className="text-rose-500 font-bold">* (Bắt buộc lần đầu)</span>
              </label>
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-100/90 px-2 py-0.5 rounded-full border border-rose-300">
                Chưa đổi tên
              </span>
            </div>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="Nhập tên bạn (Ví dụ: BS Minh, Thu Hà K46, Hoàng Nam...)"
              className="w-full glass-input rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold border-rose-400 bg-white text-slate-900 focus:ring-rose-400"
            />
            <p className="text-[11px] text-rose-700 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Chỉ cần đổi tên một lần duy nhất, các lần sau hệ thống sẽ tự động ghi nhớ tên của bạn.</span>
            </p>
          </div>
        )}

        {hasSavedCustomName && isEditingName && (
          <div className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 animate-fadeIn space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Đổi tên người đăng bài:</label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="Nhập tên mới..."
              className="w-full glass-input rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
            />
          </div>
        )}

        {/* -------------------- CHẾ ĐỘ 1: NHẬN DIỆN NHIỀU FILE (BATCH MODE) -------------------- */}
        {isBatchMode ? (
          <ImportBatchList
            batchItems={batchItems}
            validBatchDecks={validBatchDecks}
            totalBatchCards={totalBatchCards}
            totalBatchCloze={totalBatchCloze}
            totalBatchCase={totalBatchCase}
            errorBatchCount={errorBatchCount}
            handleUpdateBatchDeckName={handleUpdateBatchDeckName}
            handleUpdateBatchNote={handleUpdateBatchNote}
            handleRemoveBatchItem={handleRemoveBatchItem}
            onResetToSingleMode={() => {
              setBatchItems([]);
              setIsBatchMode(false);
            }}
            handleFilesChange={handleFilesChange}
          />
        ) : (
          /* -------------------- CHẾ ĐỘ 2: ĐƠN BÀI HỌC (SINGLE MODE / PASTED TEXT) -------------------- */
          <div className="space-y-3">
            {/* Deck Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên bài học</label>
              <input
                type="text"
                value={deckName || parsed.deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Ví dụ: Bài 1 - X-ray & CT lồng ngực"
                className="w-full glass-input rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 font-medium"
              />
            </div>

            {/* Study Note (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ghi chú bài học / Tóm tắt trọng tâm ôn thi (Study Note)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Tùy chọn - Cả nhóm sẽ thấy</span>
              </label>
              <textarea
                rows={2}
                value={deckNote || parsed.note || ''}
                onChange={(e) => setDeckNote(e.target.value)}
                placeholder="Ví dụ: Lưu ý tam chứng Beck, phác đồ điều trị bước 1, liều thuốc thường gặp..."
                className="w-full glass-input rounded-xl p-2.5 text-xs text-slate-800 leading-relaxed font-sans"
              />
            </div>

            {/* File & Text Input Area */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-600">
                  Chọn 1 hoặc NHIỀU file (.json, .csv, .txt) hoặc dán mã JSON:
                </label>
                <input
                  type="file"
                  multiple
                  accept=".json,.csv,.txt"
                  onChange={handleFilesChange}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                />
              </div>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Dán JSON từ Prompt AI (Gemini / ChatGPT) hoặc nhập từng dòng theo cú pháp:&#10;Mặt trước | Mặt sau | Gợi ý (tùy chọn) | Giải thích thêm (tùy chọn)"
                className="w-full glass-input rounded-2xl p-3 text-xs sm:text-sm font-mono leading-relaxed text-slate-800"
              />
            </div>

            {/* JSON Parser Status */}
            {parsed.isJsonError ? (
              <div className="glass-card bg-rose-50/90 rounded-2xl p-3 text-xs text-rose-800 border border-rose-300 shadow-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-700">Lỗi cú pháp JSON phát hiện:</p>
                  <p className="font-mono text-[11px] text-rose-800 bg-white/70 px-2 py-1 rounded-lg border border-rose-200 break-all">
                    {parsed.error}
                  </p>
                  <p className="text-[11px] text-rose-600">
                    Hệ thống đã chặn nạp tự động để tránh cắt sai dữ liệu thành các thẻ hỏng.
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-card bg-slate-50/80 rounded-2xl p-3 text-xs text-slate-700 border-slate-200/80">
                <div className="font-medium flex items-center gap-1.5 text-sky-800">
                  {parsed.cards.length > 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Nhận diện hợp lệ <strong>{parsed.cards.length} thẻ</strong> ({clozeCount} Điền chỗ trống, {caseCount} Ca lâm sàng). Thẻ trùng câu hỏi sẽ giữ nguyên tiến độ cũ.
                      </span>
                    </>
                  ) : (
                    <span>Hãy chọn 1 hoặc nhiều file, hoặc dán nội dung để xem trước số thẻ...</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="glass-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Hủy
          </button>

          {isBatchMode ? (
            <button
              type="button"
              disabled={validBatchDecks.length === 0 || isReadingFiles || isNameInvalid}
              onClick={() => {
                if (validBatchDecks.length === 0 || isNameInvalid) return;
                const cleanAuthor = (uploaderName && uploaderName.trim()) || settings?.studentName || '';
                if (onUpdateSettings && cleanAuthor && (!hasSavedCustomName || cleanAuthor !== settings?.studentName)) {
                  onUpdateSettings({ studentName: cleanAuthor });
                }
                onConfirmImport({
                  batchDecks: validBatchDecks,
                  selectedFolderId: selectedFolderId || null,
                  author: cleanAuthor,
                });
                handleClose();
              }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 ${
                validBatchDecks.length === 0 || isReadingFiles || isNameInvalid
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-sky-500 hover:bg-sky-400 text-white'
              }`}
            >
              {isReadingFiles
                ? 'Đang đọc file...'
                : isNameInvalid
                ? 'Nhập tên bạn để nạp bài'
                : `Lưu & Nạp ${validBatchDecks.length} bài học (${totalBatchCards} thẻ) vào ${
                    currentFolderObj?.name ? `"${currentFolderObj.name}"` : 'Thư mục'
                  }`}
            </button>
          ) : (
            <button
              type="button"
              disabled={parsed.cards.length === 0 || parsed.isJsonError || isReadingFiles || isNameInvalid}
              onClick={() => {
                if (parsed.cards.length === 0 || parsed.isJsonError || isNameInvalid) return;
                const cleanAuthor = (uploaderName && uploaderName.trim()) || settings?.studentName || '';
                if (onUpdateSettings && cleanAuthor && (!hasSavedCustomName || cleanAuthor !== settings?.studentName)) {
                  onUpdateSettings({ studentName: cleanAuthor });
                }
                onConfirmImport({
                  parsed,
                  selectedFolderId: selectedFolderId || null,
                  deckNameInput: (deckName || parsed.deckName).trim(),
                  deckNoteInput: (deckNote || parsed.note || '').trim(),
                  author: cleanAuthor,
                });
                handleClose();
              }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 ${
                parsed.cards.length === 0 || parsed.isJsonError || isReadingFiles || isNameInvalid
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-sky-500 hover:bg-sky-400 text-white'
              }`}
            >
              {isNameInvalid
                ? 'Nhập tên bạn để nạp bài'
                : `Lưu & Nạp vào ${currentFolderObj?.name ? `"${currentFolderObj.name}"` : 'Thư mục'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
