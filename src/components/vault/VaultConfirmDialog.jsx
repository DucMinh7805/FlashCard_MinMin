import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function VaultConfirmDialog({
  confirmDialog,
  onCancel,
}) {
  if (!confirmDialog) return null;

  return (
    <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl border border-slate-100 animate-scaleUp">
        <div className="flex items-center gap-2.5 text-slate-800">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold">{confirmDialog.title}</h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pl-1">
          {confirmDialog.message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={confirmDialog.action}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition active:scale-95"
          >
            {confirmDialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
