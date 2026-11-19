import React, { useEffect, useState } from 'react';
import {
  X,
  Cloud,
  Download,
  Upload,
  RotateCcw,
  Smartphone,
  Check,
  User,
  RefreshCw,
  FolderArchive,
  Database,
  FileSpreadsheet,
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onPullCloud,
  onExportBackup,
  onRestoreBackup,
  onExportUserProgress,
  onRestoreUserProgress,
  onResetProgress,
  onRestoreSeedData,
  showToast,
}) {
  const [studentName, setStudentName] = useState(settings.studentName || 'Học viên');
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseKey || '');
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setStudentName(settings.studentName || 'Học viên');
      setSupabaseUrl(settings.supabaseUrl || '');
      setSupabaseKey(settings.supabaseKey || '');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    const name = studentName.trim() || 'Thành viên';
    onUpdateSettings({ studentName: name });
    showToast(`Đã lưu tên thành viên: ${name}`);
  };

  const handleManualPull = async () => {
    setIsPulling(true);
    await onPullCloud();
    setIsPulling(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Cài đặt & Đồng bộ Mini Drive</h3>
            <p className="text-xs text-slate-500">Đồng bộ đám mây nhóm 10 người • Tiến độ học tập cá nhân</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Member Profile (Author Name) */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border border-slate-200/80">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">Tên thành viên hiển thị</h4>
          </div>
          <p className="text-[11px] text-slate-500">
            Tên này sẽ hiển thị dưới các bài học bạn nạp lên (ví dụ: <em>Đăng bởi {studentName || 'Minh'}</em>) để cả nhóm cùng biết.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Nhập tên của bạn (Ví dụ: Minh, Lan, BS. Huy...)"
              className="flex-1 glass-input rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800"
            />
            <button
              type="button"
              onClick={handleSaveProfile}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95 shrink-0"
            >
              Lưu tên
            </button>
          </div>
        </div>

        {/* 2. Cloud Sync Section */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">Đám mây Mini Drive (Supabase)</h4>
            </div>
            <button
              type="button"
              disabled={isPulling}
              onClick={handleManualPull}
              className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Đang tải...' : 'Làm mới từ Cloud'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Hệ thống tự động đồng bộ ngầm theo từng thao tác (Atomic CRUD) và tự cập nhật mỗi khi bạn mở hoặc quay lại tab web.
          </p>

          <div className="space-y-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Supabase URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Supabase Anon Key</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ supabaseUrl: supabaseUrl.trim(), supabaseKey: supabaseKey.trim() });
                showToast('Đã lưu cấu hình Supabase Cloud!');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
            >
              Lưu cấu hình Cloud
            </button>
          </div>
        </div>

        {/* 3. Personal Study Progress & Local Backup */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border border-slate-200/80">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">Tiến độ học cá nhân & Sao lưu</h4>
          </div>
          <p className="text-[11px] text-slate-500">
            Tiến độ (hộp nhớ Leitner, ngày đến hạn) được lưu riêng trên máy bạn. Bạn có thể xuất file để chuyển sang máy tính/điện thoại khác.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onExportUserProgress}
              className="glass-pill px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Xuất tiến độ học (.json)</span>
            </button>
            <label className="glass-pill px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nạp tiến độ học</span>
              <input type="file" accept=".json" onChange={onRestoreUserProgress} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onExportBackup}
              className="glass-pill px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <FolderArchive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sao lưu toàn bộ Drive (.json)</span>
            </button>
            <label className="glass-pill px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer text-center">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>Khôi phục Drive từ file</span>
              <input type="file" accept=".json" onChange={onRestoreBackup} className="hidden" />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
            <div>
              <span className="block text-xs font-bold text-slate-800">Khôi phục 46 thẻ mẫu Y khoa</span>
              <span className="text-[11px] text-slate-500">Nạp lại 7 học phần & 46 thẻ mẫu chuẩn lên máy và Cloud</span>
            </div>
            <button
              type="button"
              onClick={onRestoreSeedData}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
              <span>Khôi phục 46 thẻ mẫu</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Muốn học lại từ đầu toàn bộ các thẻ?</span>
            <button
              type="button"
              onClick={onResetProgress}
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
            >
              Đặt lại tiến độ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
