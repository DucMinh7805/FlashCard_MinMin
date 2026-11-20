import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Cloud,
  RefreshCw,
  Check,
  Settings,
  Database,
} from 'lucide-react';
import TikTokFlame from './TikTokFlame';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onPullCloud,
  onOpenBackupVault,
  showToast,
}) {
  const [studentName, setStudentName] = useState(settings?.studentName || 'Học viên');
  const [dailyGoal, setDailyGoal] = useState(settings?.dailyGoal || 30);
  const [isPulling, setIsPulling] = useState(false);
  const [justSavedName, setJustSavedName] = useState(false);

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
      setStudentName(settings?.studentName || 'Học viên');
      setDailyGoal(settings?.dailyGoal || 30);
      setJustSavedName(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    const name = studentName.trim() || 'Học viên';
    onUpdateSettings({ studentName: name });
    setJustSavedName(true);
    showToast(`Đã lưu tên thành viên: ${name}`);
    setTimeout(() => setJustSavedName(false), 2000);
  };

  const handleSelectGoal = (goal) => {
    setDailyGoal(goal);
    onUpdateSettings({ dailyGoal: goal });
    showToast(`Mục tiêu hàng ngày: ${goal} thẻ/ngày`);
  };

  const handleManualPull = async () => {
    setIsPulling(true);
    try {
      await onPullCloud();
    } finally {
      setIsPulling(false);
    }
  };

  const userInitial = (studentName.trim() || 'H').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-t-[28px] sm:rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/90 overflow-hidden relative">
        {/* Mobile pull indicator */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-1 shrink-0" />

        {/* Sticky Header */}
        <div className="px-4 sm:px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">
                Cài đặt & Cá nhân
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                Đồng bộ nhóm 10 người • Mục tiêu học tập
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cài đặt"
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 transition shrink-0 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content (Cực kỳ gọn nhẹ, 100% tích cực, không nút nguy hiểm) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {/* 1. Tên thành viên */}
          <div className="glass-card bg-slate-50/70 rounded-2xl p-3 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">Tên thành viên hiển thị</span>
              </div>
              <span className="text-[10px] text-slate-400">Hiển thị khi tạo bài</span>
            </div>

            <form onSubmit={handleSaveProfile} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {userInitial}
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nhập tên của bạn (VD: Minh, BS. Huy...)"
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-sky-400 focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 shrink-0 flex items-center gap-1 shadow-sm ${
                  justSavedName
                    ? 'bg-emerald-500 text-white'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                }`}
              >
                {justSavedName ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Đã lưu</span>
                  </>
                ) : (
                  <span>Lưu</span>
                )}
              </button>
            </form>
          </div>

          {/* 2. Đám mây Mini Drive */}
          <div className="glass-card bg-slate-50/70 rounded-2xl p-3 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">
                  Đám mây Mini Drive
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang đồng bộ
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Nhóm 10 người</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Dữ liệu tự động đồng bộ theo từng thao tác. Bấm nút dưới nếu muốn tải ngay bài mới do bạn bè vừa thêm:
            </p>

            <button
              type="button"
              disabled={isPulling}
              onClick={handleManualPull}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-70"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
              <span>{isPulling ? 'Đang đồng bộ...' : 'Đồng bộ & Làm mới từ Cloud'}</span>
            </button>
          </div>

          {/* 3. Mục tiêu ôn tập hàng ngày */}
          <div className="glass-card bg-slate-50/70 rounded-2xl p-3 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TikTokFlame streak={1} size="sm" />
                <span className="text-xs font-bold text-slate-800">
                  Mục tiêu ôn tập mỗi ngày
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Duy trì Streak</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[20, 30, 50].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleSelectGoal(goal)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                    dailyGoal === goal
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                      : 'bg-white hover:bg-amber-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {goal} thẻ/ngày
                </button>
              ))}
            </div>
          </div>

          {/* 4. Chân modal: Liên kết ra ngoài lề (Kho dữ liệu hệ thống) */}
          {onOpenBackupVault && (
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={onOpenBackupVault}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-sky-700 transition"
              >
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>Xem bản sao lưu & Dữ liệu hệ thống?</span>
                <span className="text-sky-600 underline underline-offset-2">Mở Kho dữ liệu ↗</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
