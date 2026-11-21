import React from 'react';
import {
  Server,
  Camera,
  HardDrive,
  Database,
  RotateCcw,
  FileCode,
  Trash2,
  Download,
} from 'lucide-react';

export default function VaultSnapshotList({
  appData,
  totalCards,
  learnedCount,
  storageSizeKB,
  snapshots,
  onCreateNewSnapshot,
  onViewJson,
  onRestoreSnapshot,
  onDeleteSnapshot,
  showToast,
}) {
  return (
    <>
      {/* THẺ 1: DỮ LIỆU ĐANG LƯU Ở ĐÂU & TRẠNG THÁI HIỆN TẠI */}
      <div className="glass-card bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                Vị trí lưu trữ dữ liệu hệ thống
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Dữ liệu bài học được lưu tại 2 tầng bảo vệ:
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCreateNewSnapshot}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Chụp điểm lưu ngay</span>
          </button>
        </div>

        {/* Chi tiết 2 nơi lưu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 space-y-0.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-600" />
              1. Bộ nhớ máy (LocalStorage)
            </span>
            <p className="text-slate-500 leading-tight">
              Lưu tại khóa <code>minmin_flashcard_drive_v1</code>. Dù ngoại tuyến (offline) vẫn
              còn nguyên trên máy.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 space-y-0.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              2. Đám mây Supabase Cloud
            </span>
            <p className="text-slate-500 leading-tight">
              Tự động đồng bộ ngầm thời gian thực (Atomic CRUD) lên bảng cơ sở dữ liệu của
              nhóm 10 người.
            </p>
          </div>
        </div>

        {/* Thống kê số lượng hiện tại */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-3 text-slate-700 font-semibold">
            <span>{(appData?.folders || []).length} Thư mục</span>
            <span>•</span>
            <span>{(appData?.decks || []).length} Bài học</span>
            <span>•</span>
            <span>{totalCards} Thẻ</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">{learnedCount} Đã học</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
            Dung lượng: ~{storageSizeKB} KB
          </span>
        </div>
      </div>

      {/* THẺ 2: CÁC MỐC SAO LƯU HỆ THỐNG (RESTORE POINTS) */}
      <div className="glass-card bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-sky-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              Các mốc sao lưu hệ thống ({snapshots.length})
            </h4>
          </div>
          <span className="text-[10px] text-slate-400">
            Lưu trữ các điểm dữ liệu để khôi phục khi mất
          </span>
        </div>

        <div className="space-y-2">
          {snapshots.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Chưa có bản sao lưu nào. Hãy bấm "Chụp điểm lưu ngay" ở trên.
            </p>
          ) : (
            snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 transition space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">
                        {snap.timeFormatted}
                      </span>
                      {idx === 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                          Mới nhất
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{snap.reason}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {snap.stats.folderCount} thư mục • {snap.stats.deckCount} bài •{' '}
                      {snap.stats.cardCount} thẻ • {snap.stats.progressCount} tiến độ
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onViewJson({
                          title: `Bản sao lưu: ${snap.timeFormatted}`,
                          jsonText: JSON.stringify(snap.data, null, 2),
                        })
                      }
                      title="Xem & Kiểm tra mã JSON"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <FileCode className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSnapshot(snap.id)}
                      title="Xóa bản lưu này"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onRestoreSnapshot(snap)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs border border-sky-200 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục dữ liệu bản này</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(snap.data, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `MinMin_Snapshot_${snap.timeFormatted.replace(/[\/\s:]/g, '_')}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast('Đã tải file snapshot về máy!');
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                    title="Tải file snapshot về máy"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Tải file</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
