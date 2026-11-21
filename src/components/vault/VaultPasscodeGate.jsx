import React from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';

export default function VaultPasscodeGate({
  enteredPasscode,
  setEnteredPasscode,
  showPasscode,
  setShowPasscode,
  isShaking,
  authError,
  setAuthError,
  onUnlock,
}) {
  return (
    <div className="p-5 sm:p-6 space-y-4 animate-fadeIn">
      <div
        className={`glass-card bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 text-center space-y-3.5 shadow-sm ${
          isShaking ? 'shake-animation border-rose-300 bg-rose-50/40' : ''
        }`}
      >
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h4 className="text-sm sm:text-base font-bold text-slate-800">
            Kho dữ liệu hệ thống được khóa mã
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
            Đây là kho lưu trữ dữ liệu gốc, các bản sao lưu cục bộ và công cụ sửa lỗi JSON của
            hệ thống. Vui lòng nhập mật khẩu quản trị để tiếp tục.
          </p>
        </div>

        <form onSubmit={onUnlock} className="space-y-3 max-w-xs mx-auto pt-1">
          <div className="relative">
            <input
              type={showPasscode ? 'text' : 'password'}
              value={enteredPasscode}
              onChange={(e) => {
                setEnteredPasscode(e.target.value);
                if (authError) setAuthError('');
              }}
              autoFocus
              placeholder="Nhập mật khẩu (9 số)"
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-slate-800 border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {authError && (
            <p className="text-xs font-bold text-rose-600 animate-fadeIn">{authError}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Mở khóa Kho dữ liệu</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-200/60">
          <p className="text-[11px] text-slate-400">
            Mật khẩu mặc định: <span className="font-mono font-bold text-slate-600">123456789</span>
          </p>
        </div>
      </div>
    </div>
  );
}
