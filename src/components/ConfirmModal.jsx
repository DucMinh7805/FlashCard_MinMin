import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận thao tác',
  message,
  confirmText = 'Xác nhận xóa',
  cancelText = 'Hủy',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-white/90">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-rose-100 text-rose-600 border border-rose-200'
                  : 'bg-sky-100 text-sky-600 border border-sky-200'
              }`}
            >
              {variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words whitespace-pre-line pl-1">
          {message}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="glass-pill px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition active:scale-95 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-sky-500 hover:bg-sky-400'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
