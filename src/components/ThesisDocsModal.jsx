import React, { useEffect, useState } from 'react';
import {
  X,
  BookOpen,
  Brain,
  Sparkles,
  Server,
  Smartphone,
  Layers,
  ArrowRight,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function ThesisDocsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'tech'

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-white/90 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Tài liệu & Cơ chế Hệ thống</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wide">
                  Mini Drive
                </span>
              </div>
              <p className="text-xs text-slate-500">Hướng dẫn sử dụng & Kiến trúc đồng bộ học tập nhóm y khoa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'guide'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Hướng dẫn nhóm (3 bước)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'tech'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Cơ chế Spaced Repetition</span>
          </button>
        </div>

        {/* Tab 1: 3-step Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-3">
            <div className="glass-card rounded-2xl p-3 border-l-4 border-l-sky-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-800">Lấy Prompt AI tạo Flashcard</h4>
              </div>
              <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                Bấm nút <strong className="text-sky-700">+ Thêm → Prompt AI</strong>, sao chép prompt và dán kèm tài liệu bài giảng/slide vào ChatGPT hoặc Gemini. AI sẽ tự động xuất định dạng JSON kèm Ghi chú bài học.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-3 border-l-4 border-l-indigo-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-800">Nạp bài vào đúng Môn học</h4>
              </div>
              <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                Vào học phần cần nạp (Nội, Ngoại, Sản, Nhi...), bấm <strong className="text-indigo-700">Nạp bài</strong> và dán mã JSON. Bộ thẻ & Ghi chú sẽ nằm cố định tại môn đó, tự động đồng bộ ngay cho 10 thành viên khác cùng thấy.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-3 border-l-4 border-l-emerald-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="text-xs font-bold text-slate-800">Ôn tập Active Recall & Đánh giá</h4>
              </div>
              <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                Khi học, tự nhớ lại trước khi chạm lật thẻ. Đánh giá thành thật:
                <span className="block mt-1 text-[11px] text-slate-500">
                  🔴 <strong>Chưa nhớ</strong> (ôn lại sau 1 ngày) • 🟡 <strong>Tạm hiểu</strong> (ôn lại sau 2 ngày) • 🟢 <strong>Đã thuộc</strong> (tăng khoảng cách 4-21 ngày).
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Technology & Spaced Repetition */}
        {activeTab === 'tech' && (
          <div className="space-y-3">
            <div className="glass-card rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                <Brain className="w-4 h-4" />
                <span>Thuật toán Lặp lại Ngắt quãng (Leitner 5 Hộp)</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="font-bold text-rose-600">Hộp 0</div>
                  <div className="text-slate-500 mt-0.5">1 ngày</div>
                </div>
                <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="font-bold text-amber-700">Hộp 1</div>
                  <div className="text-slate-500 mt-0.5">2 ngày</div>
                </div>
                <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="font-bold text-emerald-700">Hộp 2</div>
                  <div className="text-slate-500 mt-0.5">4 ngày</div>
                </div>
                <div className="p-1.5 rounded-xl bg-teal-50 border border-teal-200">
                  <div className="font-bold text-teal-700">Hộp 3</div>
                  <div className="text-slate-500 mt-0.5">9 ngày</div>
                </div>
                <div className="p-1.5 rounded-xl bg-sky-50 border border-sky-200">
                  <div className="font-bold text-sky-700">Hộp 4</div>
                  <div className="text-slate-500 mt-0.5">21 ngày</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dựa trên đường cong quên lãng Ebbinghaus. Thẻ trả lời đúng được đẩy sang hộp tiếp theo với khoảng cách xa hơn; trả lời sai sẽ đưa về Hộp 0 để củng cố ngay.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="glass-card rounded-2xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700">
                  <Server className="w-3.5 h-3.5" />
                  <span>Mini Drive Nhóm (Atomic CRUD)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Đồng bộ độc lập từng thư mục, bài học và thẻ lên Supabase. Nhiều bạn đăng bài cùng lúc không bao giờ ghi đè mất dữ liệu của nhau.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Offline-First PWA</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Cache toàn bộ kho bài & Service Worker. Mất mạng hoặc vào phòng trực bệnh viện sóng yếu vẫn mở học mượt mà.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
