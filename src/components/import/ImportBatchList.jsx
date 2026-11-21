import React from 'react';
import { CheckCircle2, AlertTriangle, Trash2, ArrowLeft } from 'lucide-react';

export default function ImportBatchList({
  batchItems,
  validBatchDecks,
  totalBatchCards,
  totalBatchCloze,
  totalBatchCase,
  errorBatchCount,
  handleUpdateBatchDeckName,
  handleUpdateBatchNote,
  handleRemoveBatchItem,
  onResetToSingleMode,
  handleFilesChange,
}) {
  return (
    <div className="space-y-3">
      {/* Batch Summary Alert */}
      <div className="glass-card bg-sky-50/80 rounded-2xl p-3 border border-sky-200/80 space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-bold text-xs sm:text-sm text-sky-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Đã nhận diện: <strong>{validBatchDecks.length} bài học</strong> • {totalBatchCards} thẻ tổng cộng
            </span>
          </span>
          <span className="text-[11px] text-slate-500">
            ({totalBatchCloze} Điền chỗ trống{totalBatchCase > 0 ? `, ${totalBatchCase} Ca lâm sàng` : ''})
          </span>
        </div>
        {errorBatchCount > 0 && (
          <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Có {errorBatchCount} file bị lỗi cú pháp (được đánh dấu đỏ bên dưới).</span>
          </p>
        )}
      </div>

      {/* Recognized Decks Scrollable Cards List */}
      <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
        {batchItems.map((item, idx) => (
          <div
            key={item.id || idx}
            className={`rounded-2xl p-3 sm:p-3.5 border transition ${
              item.isValid
                ? 'bg-slate-50/80 border-slate-200/90 shadow-2xs'
                : 'bg-rose-50/90 border-rose-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200/60">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                  #{idx + 1}
                </span>
                {item.fileName && (
                  <span className="text-[11px] text-slate-500 font-mono truncate max-w-[220px] sm:max-w-xs">
                    {item.fileName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.isValid ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {item.cards.length} thẻ
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                    Lỗi file
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveBatchItem(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                  title="Bỏ qua file này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {item.isValid ? (
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                    Tên bài học:
                  </label>
                  <input
                    type="text"
                    value={item.deckName}
                    onChange={(e) => handleUpdateBatchDeckName(idx, e.target.value)}
                    placeholder="Tên bài học..."
                    className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                    Ghi chú bài học (Study Note):
                  </label>
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) => handleUpdateBatchNote(idx, e.target.value)}
                    placeholder="Tóm tắt trọng tâm bài học (tùy chọn)..."
                    className="w-full glass-input rounded-xl px-2.5 py-1 text-xs text-slate-700"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-rose-700 font-medium space-y-1">
                <p className="font-bold">Không thể nhận diện nội dung file:</p>
                <p className="font-mono text-[11px] bg-white/70 p-2 rounded-lg border border-rose-200">
                  {item.error}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Back to Single Input Mode Link */}
      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          onClick={onResetToSingleMode}
          className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại dán văn bản / chọn 1 file</span>
        </button>
        <label className="text-sky-600 hover:text-sky-700 font-medium cursor-pointer">
          <span>+ Thêm file khác</span>
          <input
            type="file"
            multiple
            accept=".json,.csv,.txt"
            onChange={handleFilesChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
