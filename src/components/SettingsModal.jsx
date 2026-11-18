import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Cloud,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Check,
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onPushCloud,
  onPullCloud,
  onExportBackup,
  onRestoreBackup,
  onResetProgress,
  showToast,
}) {
  const [pinInput, setPinInput] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseKey || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Cấu hình Cloud & Quyền Chủ sở hữu</h3>
            <p className="text-xs text-slate-500">Đồng bộ Cloud đa thiết bị + bảo vệ quyền sửa bài + sao lưu tiến độ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Admin PIN */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Chế độ Chủ sở hữu (Admin PIN)</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Người mở link chia sẻ chỉ có thể học thẻ, cần mã PIN để tạo/sửa/xóa bài
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (settings.isAdmin) {
                  onUpdateSettings({ isAdmin: false });
                  showToast('Đã chuyển sang chế độ Khách (chỉ học).');
                } else if (pinInput.trim() === settings.pin) {
                  onUpdateSettings({ isAdmin: true });
                  showToast('Đã mở khóa quyền Chủ sở hữu!');
                } else {
                  showToast('Nhập đúng mã PIN vào ô bên dưới để mở khóa (mặc định: 2309).');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                settings.isAdmin
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {settings.isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{settings.isAdmin ? 'Chủ sở hữu' : 'Chế độ Khách'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Đặt hoặc nhập mã PIN (mặc định: 2309)"
              className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs text-slate-800"
            />
            <button
              type="button"
              onClick={() => {
                if (!pinInput.trim()) return showToast('Vui lòng nhập mã PIN muốn lưu.');
                onUpdateSettings({ pin: pinInput.trim(), isAdmin: true });
                showToast('Đã cập nhật mã PIN Chủ sở hữu!');
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition"
            >
              Lưu PIN
            </button>
          </div>
        </div>

        {/* Supabase Cloud */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border-slate-200/80">
          <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-sky-600" />
            <span>Kết nối Cloud Database (Supabase)</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Tự động đồng bộ cây thư mục và bộ thẻ giữa PC, iPhone và Android qua Supabase.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="Supabase Project URL"
              className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-slate-800"
            />
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="Supabase Publishable / Anon Key"
              className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-slate-800"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ supabaseUrl: supabaseUrl.trim(), supabaseKey: supabaseKey.trim() });
                showToast('Đã lưu cấu hình Supabase Cloud!');
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition"
            >
              Lưu Cloud
            </button>
            <button
              type="button"
              onClick={onPushCloud}
              className="glass-pill px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Đẩy lên Cloud</span>
            </button>
            <button
              type="button"
              onClick={onPullCloud}
              className="glass-pill px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-700 hover:bg-sky-50 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải từ Cloud</span>
            </button>
          </div>
        </div>

        {/* PWA / iOS Tip & Backup */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border-slate-200/80">
          <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Cài đặt PWA & Sao lưu dự phòng</span>
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Trên iPhone / Safari: Bấm biểu tượng <strong>Chia sẻ (Share)</strong> rồi chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong> để chạy toàn màn hình không có thanh địa chỉ và chống bị iOS dọn cache.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onExportBackup}
              className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-800 hover:bg-emerald-50 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất file Backup (.json)</span>
            </button>
            <label className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-sky-800 hover:bg-sky-50 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Khôi phục Backup</span>
              <input type="file" accept=".json" onChange={onRestoreBackup} className="hidden" />
            </label>
            <button
              type="button"
              onClick={onResetProgress}
              className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại tiến độ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
