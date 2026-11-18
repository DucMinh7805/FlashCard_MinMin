import React, { useState } from 'react';

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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Cấu hình Cloud, Quyền Chủ Sở Hữu & Sao lưu</h3>
            <p className="text-xs text-slate-300">Thiết lập kho dùng chung online + bảo vệ quyền sửa xóa + sao lưu chống mất dữ liệu iOS</p>
          </div>
          <button type="button" onClick={onClose} className="glass-pill w-8 h-8 rounded-xl text-slate-300 hover:text-white">
            ✕
          </button>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Chế độ Chủ sở hữu (Admin PIN)</p>
              <p className="text-xs text-slate-300">Khách mở link chia sẻ chỉ được học, cần mã PIN mới được tạo/sửa/xóa</p>
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
              className="glass-pill px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-200"
            >
              {settings.isAdmin ? 'Đang mở khóa (Chủ sở hữu)' : 'Đang khóa (Chế độ Khách)'}
            </button>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Đặt hoặc nhập mã PIN (mặc định: 2309)"
              className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!pinInput.trim()) return showToast('Vui lòng nhập mã PIN muốn lưu.');
                onUpdateSettings({ pin: pinInput.trim(), isAdmin: true });
                showToast('Đã cập nhật mã PIN Chủ sở hữu!');
              }}
              className="glass-pill px-3 py-1.5 rounded-xl text-xs text-sky-200"
            >
              Lưu mã PIN
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-2.5">
          <p className="text-sm font-semibold text-white">Kết nối Cloud Database (Supabase)</p>
          <p className="text-xs text-slate-300">Đã cấu hình sẵn project Supabase của bạn. Tự động đồng bộ kho thẻ giữa PC và iPhone.</p>
          <div className="space-y-2">
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="Supabase Project URL"
              className="w-full glass-input rounded-xl px-3 py-1.5 text-xs"
            />
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="Supabase Publishable / Anon Key"
              className="w-full glass-input rounded-xl px-3 py-1.5 text-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ supabaseUrl: supabaseUrl.trim(), supabaseKey: supabaseKey.trim() });
                showToast('Đã lưu cấu hình Supabase Cloud!');
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-semibold text-xs"
            >
              Lưu kết nối Cloud
            </button>
            <button type="button" onClick={onPushCloud} className="glass-pill px-3 py-1.5 rounded-xl text-xs text-emerald-200">
              ☁ Đẩy dữ liệu lên Cloud
            </button>
            <button type="button" onClick={onPullCloud} className="glass-pill px-3 py-1.5 rounded-xl text-xs text-sky-200">
              ⬇ Tải từ Cloud về máy
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-2.5">
          <p className="text-sm font-semibold text-white">Sao lưu & Khôi phục toàn bộ (JSON + Tiến độ học)</p>
          <p className="text-xs text-slate-300">
            Mẹo trên iPhone/iOS: Chọn <strong className="text-white">Chia sẻ ➔ Thêm vào MH chính</strong> để iOS không tự xóa bộ nhớ sau 7 ngày.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="button" onClick={onExportBackup} className="glass-pill px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-200">
              ⬇ Xuất file Backup (.json)
            </button>
            <label className="glass-pill px-3.5 py-2 rounded-xl text-xs font-medium text-sky-200 cursor-pointer">
              ⬆ Khôi phục từ file Backup
              <input type="file" accept=".json" onChange={onRestoreBackup} className="hidden" />
            </label>
            <button type="button" onClick={onResetProgress} className="glass-pill px-3.5 py-2 rounded-xl text-xs font-medium text-rose-300">
              Đặt lại tiến độ học
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
