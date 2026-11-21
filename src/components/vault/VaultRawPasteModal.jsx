import React from 'react';
import { Check, Download, Upload, Eye } from 'lucide-react';

export default function VaultRawPasteModal({
  showPasteBox,
  setShowPasteBox,
  pastedJson,
  setPastedJson,
  onApplyPastedJson,
  onExportBackup,
  onRestoreBackup,
  onViewRawLiveJson,
  onResetProgress,
  setConfirmDialog,
}) {
  return (
    <div className="glass-card bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
            Cứu hộ & Sửa lỗi khẩn cấp (Emergency Fix)
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Dùng khi bị mất bài hoặc cần nạp đè file/mã JSON cứu hộ từ máy khác:
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPasteBox(!showPasteBox)}
          className="text-xs font-bold text-indigo-600 hover:underline shrink-0"
        >
          {showPasteBox ? 'Đóng ô dán' : 'Dán mã JSON'}
        </button>
      </div>

      {/* Ô dán JSON trực tiếp để fix */}
      {showPasteBox && (
        <div className="space-y-2 p-3 bg-white rounded-xl border-2 border-indigo-300 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Dán trực tiếp chuỗi JSON dữ liệu vào đây:
            </span>
            <button
              type="button"
              onClick={() => setPastedJson('')}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Xóa trắng
            </button>
          </div>
          <textarea
            rows={4}
            value={pastedJson}
            onChange={(e) => setPastedJson(e.target.value)}
            placeholder='{"appData": {"folders": [...], "decks": [...]}}'
            className="w-full glass-input rounded-xl p-2.5 text-xs font-mono text-slate-800"
          />
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onApplyPastedJson}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Kiểm tra & Nạp đè dữ liệu sửa lỗi</span>
            </button>
          </div>
        </div>
      )}

      {/* 2 nút tải file và nạp file từ máy */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onExportBackup}
          className="py-2.5 px-3 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">Tải file toàn bộ (.json)</span>
        </button>

        <label className="py-2.5 px-3 rounded-xl border border-teal-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer text-center">
          <Upload className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="truncate">Nạp file cứu hộ (.json)</span>
          <input
            type="file"
            accept=".json"
            onChange={onRestoreBackup}
            className="hidden"
          />
        </label>
      </div>

      {/* Nút xem trực tiếp raw JSON hiện tại */}
      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">
          Muốn xem toàn bộ chuỗi JSON đang chạy trên máy?
        </span>
        <button
          type="button"
          onClick={onViewRawLiveJson}
          className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Xem Raw JSON</span>
        </button>
      </div>

      {/* Tùy chọn Quản trị: Đặt lại toàn bộ tiến độ học (Duy nhất 1 chỗ này, sạch sẽ và chuẩn xác) */}
      {onResetProgress && (
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-rose-800">Đặt lại toàn bộ tiến độ học</span>
            <span className="text-[10px] text-slate-500">Chuyển tất cả thẻ về trạng thái Chưa học (Hộp 1)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmDialog({
                title: 'Đặt lại toàn bộ tiến độ học?',
                message:
                  'Tất cả thẻ sẽ được chuyển về Hộp 1 (Chưa học). Danh sách bài học và thẻ vẫn giữ nguyên.\n\nBạn có chắc chắn muốn thực hiện?',
                confirmText: 'Xác nhận đặt lại',
                action: () => {
                  onResetProgress();
                  setConfirmDialog(null);
                },
              });
            }}
            className="px-2.5 py-1 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition active:scale-95 shrink-0"
          >
            Đặt lại tiến độ
          </button>
        </div>
      )}
    </div>
  );
}
