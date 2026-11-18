import React, { useEffect, useState } from 'react';
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
  User,
  KeyRound,
  FileSpreadsheet,
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
  onExportUserProgress,
  onRestoreUserProgress,
  onResetProgress,
  showToast,
}) {
  const [pinInput, setPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [studentName, setStudentName] = useState(settings.studentName || 'Học viên');
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseKey || '');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === String(settings.pin).trim()) {
      onUpdateSettings({ isAdmin: true });
      setPinInput('');
      showToast('Đã mở khóa quyền Chủ sở hữu!');
    } else {
      showToast('Mã PIN không đúng. Vui lòng kiểm tra lại.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Cài đặt & Phân quyền</h3>
            <p className="text-xs text-slate-500">Bảo mật quyền sửa bài + Đồng bộ Cloud + Tiến độ cá nhân</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role & PIN Section */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Quyền truy cập: {settings.isAdmin ? 'Chủ sở hữu (Tác giả)' : 'Học viên (Khách)'}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {settings.isAdmin
                  ? 'Đã mở khóa toàn quyền: Tạo thư mục, nạp bài AI, xóa/sửa thẻ và đẩy lên Cloud'
                  : 'Chế độ an toàn: Chỉ học bài & lưu tiến độ cá nhân. Nhập PIN để mở quyền Chủ sở hữu'}
              </p>
            </div>
            {settings.isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ isAdmin: false });
                  showToast('Đã khóa lại về Chế độ Học viên.');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition flex items-center gap-1 shrink-0"
                title="Khóa về chế độ Học viên"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa quyền</span>
              </button>
            )}
          </div>

          {!settings.isAdmin ? (
            <form onSubmit={handleUnlock} className="flex items-center gap-2 pt-1">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock(e);
                }}
                placeholder="Nhập mã PIN Chủ sở hữu để mở khóa"
                className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở khóa</span>
              </button>
            </form>
          ) : (
            <div className="pt-1 border-t border-slate-200/60 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Đổi mã PIN Chủ sở hữu:</span>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Nhập mã PIN mới muốn đổi"
                  className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newPinInput.trim()) return showToast('Vui lòng nhập mã PIN mới.');
                    onUpdateSettings({ pin: newPinInput.trim() });
                    setNewPinInput('');
                    showToast('Đã đổi mã PIN Chủ sở hữu thành công!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs shadow-sm transition shrink-0"
                >
                  Lưu PIN mới
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic pt-0.5">
                Mã PIN mới được lưu trên trình duyệt máy này. (Xem mục 🧠 Kiến trúc đồ án để tham khảo lộ trình nâng cấp Supabase Auth & RLS).
              </p>
            </div>
          )}
        </div>

        {/* Student Profile & Personal Progress Sync (Available to EVERYONE) */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border-slate-200/80">
          <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-600" />
            <span>Hồ sơ Học viên & Tiến độ Cá nhân</span>
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Tiến độ Spaced Repetition (thẻ Đỏ/Vàng/Xanh và Streak) lưu độc lập trên máy của bạn, không ảnh hưởng đến các bạn khác trong nhóm.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Tên học viên (Ví dụ: Minh Châu)"
              className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs text-slate-800"
            />
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ studentName: studentName.trim() || 'Học viên' });
                showToast(`Đã lưu tên hồ sơ "${studentName.trim() || 'Học viên'}"!`);
              }}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition shrink-0"
            >
              Lưu tên
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onExportUserProgress}
              className="glass-pill px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
              title="Xuất riêng tiến độ học cá nhân để chuyển máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất tiến độ học của bạn</span>
            </button>
            <label className="glass-pill px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              <span>Nhập tiến độ cá nhân</span>
              <input type="file" accept=".json" onChange={onRestoreUserProgress} className="hidden" />
            </label>
            <button
              type="button"
              onClick={onResetProgress}
              className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 flex items-center gap-1 ml-auto"
              title="Đặt lại tiến độ thẻ về Chưa nhớ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại tiến độ</span>
            </button>
          </div>
        </div>

        {/* Supabase Cloud (Restricted to Owner for Push/Credentials, Pull is open) */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2.5 border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-sky-600" />
              <span>Đồng bộ Kho thẻ Cloud (Supabase)</span>
            </p>
            {settings.supabaseUrl && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Đã kết nối
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {settings.isAdmin
              ? 'Tự động đồng bộ cây thư mục và bộ thẻ giữa PC, iPhone và Android qua Supabase PostgreSQL.'
              : 'Tải bộ bài học mới nhất được cập nhật bởi Chủ sở hữu.'}
          </p>

          {/* Cloud credentials ONLY visible if Admin */}
          {settings.isAdmin && (
            <div className="space-y-2 pt-0.5">
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
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {settings.isAdmin && (
              <>
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
                  <span>Đẩy lên Cloud (Ghi đè Master)</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onPullCloud}
              className="glass-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold text-sky-700 hover:bg-sky-50 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải bài học mới từ Cloud</span>
            </button>
          </div>
        </div>

        {/* Full Backup for Owner */}
        {settings.isAdmin && (
          <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 space-y-2 border-slate-200/80">
            <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Sao lưu toàn bộ Kho thẻ (Dành cho Chủ sở hữu)</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Xuất hoặc nhập file JSON chứa toàn bộ cây thư mục, các bộ bài học và toàn bộ thẻ.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={onExportBackup}
                className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-800 hover:bg-emerald-50 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất file Backup toàn bộ (.json)</span>
              </button>
              <label className="glass-pill px-3 py-1.5 rounded-xl text-xs font-medium text-sky-800 hover:bg-sky-50 cursor-pointer flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Khôi phục Backup toàn bộ</span>
                <input type="file" accept=".json" onChange={onRestoreBackup} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* PWA / iOS Tip */}
        <div className="glass-card bg-slate-50/70 rounded-2xl p-3 space-y-1.5 border-slate-200/80">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Mẹo cài App PWA không có thanh địa chỉ</span>
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Trên <strong>iPhone / Safari</strong>: Bấm nút <strong>Chia sẻ (Share)</strong> ➔ chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
            Trên <strong>Android / Chrome</strong>: Bấm menu ⋮ ➔ chọn <strong>Cài đặt ứng dụng</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
