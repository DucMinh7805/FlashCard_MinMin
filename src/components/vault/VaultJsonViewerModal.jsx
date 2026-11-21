import React, { useState } from 'react';
import { FileCode, X, Search, Check, Copy } from 'lucide-react';

export default function VaultJsonViewerModal({
  viewingJson,
  onClose,
  showToast,
}) {
  const [jsonSearchQuery, setJsonSearchQuery] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);

  if (!viewingJson) return null;

  return (
    <div className="absolute inset-0 z-30 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode className="w-4 h-4 text-indigo-600 shrink-0" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {viewingJson.title}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Copy bar */}
        <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={jsonSearchQuery}
              onChange={(e) => setJsonSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trong JSON..."
              className="w-full glass-input rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(viewingJson.jsonText);
              setCopiedJson(true);
              if (showToast) showToast('Đã copy toàn bộ mã JSON vào bộ nhớ tạm!');
              setTimeout(() => setCopiedJson(false), 2000);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
              copiedJson ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 border'
            }`}
          >
            {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedJson ? 'Đã copy' : 'Copy JSON'}</span>
          </button>
        </div>

        {/* Code viewer */}
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] text-slate-100 bg-slate-900 whitespace-pre leading-relaxed select-text">
          {viewingJson.jsonText}
        </div>
      </div>
    </div>
  );
}
