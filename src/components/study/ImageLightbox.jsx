import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ImageLightbox({
  imageUrl,
  onClose,
}) {
  useEffect(() => {
    if (!imageUrl) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[92vh] flex flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-11 right-0 sm:-right-2 glass-pill bg-white/95 hover:bg-white text-slate-800 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-bold transition active:scale-95"
        >
          <X className="w-4 h-4" />
          <span>Đóng (Esc)</span>
        </button>
        <img
          src={imageUrl}
          alt="Minh họa chi tiết"
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl border border-white/20 object-contain select-none"
        />
      </div>
    </div>
  );
}
