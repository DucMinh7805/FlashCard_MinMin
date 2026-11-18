import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Cpu,
  ShieldCheck,
  Brain,
  Layers,
  Sparkles,
  Server,
  Smartphone,
  Database,
  Lock,
  GitBranch,
} from 'lucide-react';

export default function ThesisDocsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('algorithm'); // 'algorithm' | 'architecture' | 'ai_data'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Tài liệu Kiến trúc & Thuật toán</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wide">
                  Đồ án
                </span>
              </div>
              <p className="text-xs text-slate-500">Mô hình Spaced Repetition, Offline-First PWA & Phân quyền bảo mật</p>
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
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('algorithm')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'algorithm'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Thuật toán Lặp lại</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Kiến trúc & Bảo mật</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai_data')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ai_data'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chuẩn Dữ liệu & AI</span>
          </button>
        </div>

        {/* Tab 1: Spaced Repetition Algorithm */}
        {activeTab === 'algorithm' && (
          <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed animate-fadeIn">
            <div className="glass-card rounded-2xl p-3.5 bg-indigo-50/50 border-indigo-200/80 space-y-1.5">
              <p className="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>1. Cơ sở Lý thuyết: Đường cong Quên lãng Ebbinghaus (1885)</span>
              </p>
              <p>
                Bộ não con người quên tới <strong>70% kiến thức mới sau 24 giờ</strong> nếu không được củng cố. Thuật toán
                Spaced Repetition (Lặp lại ngắt quãng) tính toán thời điểm sắp quên để yêu cầu chủ động nhớ lại (Active Recall),
                biến trí nhớ ngắn hạn thành trí nhớ dài hạn vĩnh viễn với số lần ôn tập tối thiểu.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-3.5 space-y-2 border-slate-200/80">
              <p className="font-bold text-slate-800 text-sm">2. Mô hình Hộp Leitner Thích ứng (Adaptive Leitner System)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-1.5 pr-2">Nút Chấm</th>
                      <th className="py-1.5 px-2">Hành vi trong phiên</th>
                      <th className="py-1.5 px-2">Trạng thái Hộp</th>
                      <th className="py-1.5 pl-2">Chu kỳ đến hạn (Interval)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 pr-2 font-bold text-rose-600">🔴 Chưa nhớ (1)</td>
                      <td className="py-2 px-2">Lặp lại sau 3 thẻ ngay trong phiên</td>
                      <td className="py-2 px-2">Reset về Hộp 0</td>
                      <td className="py-2 pl-2">1 ngày sau (Hôm sau ôn lại)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-2 font-bold text-amber-600">🟡 Tạm hiểu (2)</td>
                      <td className="py-2 px-2">Đưa xuống cuối hàng đợi phiên học</td>
                      <td className="py-2 px-2">Chuyển sang Hộp 1</td>
                      <td className="py-2 pl-2">2 ngày sau</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-2 font-bold text-emerald-600">🟢 Đã thuộc (3)</td>
                      <td className="py-2 px-2">Vượt qua phiên hiện tại</td>
                      <td className="py-2 px-2">Tăng +1 Hộp (tối đa Hộp 4)</td>
                      <td className="py-2 pl-2">Giãn cách: 3d → 5d → 9d → 14d → 21d</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3.5 space-y-1.5 border-slate-200/80">
              <p className="font-bold text-slate-800 text-sm">3. Công thức Toán học Tính Thời gian Đến hạn (Due Date)</p>
              <div className="p-2.5 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] space-y-1">
                <p>DueDate = Timestamp_Now + (IntervalDays[Box] * 24 * 60 * 60 * 1000)</p>
                <p className="text-slate-400">// Trong đó: IntervalDays = [3, 5, 9, 14, 21], Box = clamp(0, Box + 1, 4)</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Khi người dùng chọn chế độ <em>"Đến hạn & Chưa nhớ"</em>, hệ thống chỉ lọc những thẻ có{' '}
                <code>Date.now() &gt;= card.dueDate</code> hoặc trạng thái chưa thuộc, giúp tiết kiệm 80% thời gian so với ôn tập truyền thống.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: System Architecture & Security */}
        {activeTab === 'architecture' && (
          <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed animate-fadeIn">
            <div className="glass-card rounded-2xl p-3.5 bg-sky-50/50 border-sky-200/80 space-y-1.5">
              <p className="font-bold text-sky-900 text-sm flex items-center gap-1.5">
                <Server className="w-4 h-4 text-sky-600" />
                <span>1. Kiến trúc Offline-First PWA (Progressive Web App)</span>
              </p>
              <p>
                Ứng dụng vận hành theo nguyên lý <strong>Offline-First</strong>: toàn bộ tài nguyên tĩnh và cơ sở dữ liệu thẻ
                được cache an toàn trên trình duyệt qua <strong>Service Worker</strong> và <strong>LocalStorage Cache</strong>.
                Người học có thể mở thẻ ôn tập ngay trong thang máy, bệnh viện không có sóng mạng; tốc độ tải trang gần như tức thì (&lt; 0.5s).
              </p>
            </div>

            <div className="glass-card rounded-2xl p-3.5 space-y-2 border-slate-200/80">
              <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Mô hình Phân quyền: Chủ sở hữu (Admin) vs. 10 Học viên</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Chủ sở hữu (Tác giả đồ án)</span>
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                    <li>Nhập mã PIN bảo mật để mở khóa.</li>
                    <li>Tạo/xóa/sửa cấu trúc thư mục & bài học.</li>
                    <li>Sửa trực tiếp nội dung từng thẻ.</li>
                    <li>Quyền ghi đè Master Content lên Cloud Supabase.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Học viên (10 người dùng chung)</span>
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                    <li>Mặc định mở web là Chế độ Khách (Guest).</li>
                    <li>Ẩn toàn bộ nút Xóa, Sửa và cấu hình Cloud Key.</li>
                    <li>Tải Master Decks từ Cloud để học.</li>
                    <li>Lưu tiến độ Spaced Repetition cá nhân độc lập.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3.5 space-y-1.5 border-slate-200/80">
              <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Database className="w-4 h-4 text-sky-600" />
                <span>3. Cơ chế Chống Xung đột Dữ liệu (Conflict-Free Sync)</span>
              </p>
              <p>
                Dữ liệu ứng dụng được phân tách rạch ròi thành 2 miền:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-800 space-y-1">
                <p>1. <strong>Master Content</strong> (Folders + Decks + Cards) ➔ Quản lý tập trung bởi Admin.</p>
                <p>2. <strong>User Progress</strong> (Card Progress Map + Activity Logs) ➔ Quản lý phân tán độc lập trên máy từng học viên.</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Nhờ phân tách này, 10 bạn trong nhóm học tập dù ôn tập đồng thời cũng không bao giờ làm xáo trộn kho thẻ master hoặc ghi đè kết quả của nhau.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Data Standard & AI Prompt */}
        {activeTab === 'ai_data' && (
          <div className="space-y-3.5 text-xs text-slate-700 leading-relaxed animate-fadeIn">
            <div className="glass-card rounded-2xl p-3.5 bg-amber-50/50 border-amber-200/80 space-y-1.5">
              <p className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>1. Chuẩn hóa 3 Định dạng Thẻ Đa môn</span>
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/60">
                  <span className="font-bold text-sky-800 text-xs">① Hỏi - Đáp (Basic):</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Phù hợp từ vựng chuyên ngành AVCN, khái niệm y khoa cơ bản. Mặt trước là thuật ngữ / câu hỏi, mặt sau là nghĩa tiếng Việt hoặc giải thích ngắn gọn.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/60">
                  <span className="font-bold text-emerald-800 text-xs">② Điền khuyết (Cloze Deletion):</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Dùng regex <code>\{`{\\{c1::từ khóa\\}\\}`}</code> để ẩn từ khóa quan trọng trong câu dài (mốc liều lượng, tam chứng, giải phẫu). Khi chưa lật hiện <code>[ ... ]</code>, khi lật sẽ highlight từ khóa.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/60">
                  <span className="font-bold text-indigo-800 text-xs">③ Tình huống Lâm sàng (Case Study):</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Mô tả ca bệnh thực tế ở mặt trước, chẩn đoán/hướng xử trí ở mặt sau, kèm phần <strong>Giải thích lâm sàng (Extra)</strong> phân tích cơ chế bệnh sinh chi tiết.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3.5 space-y-1.5 border-slate-200/80">
              <p className="font-bold text-slate-800 text-sm">2. Khả năng Tích hợp AI (Gemini / ChatGPT)</p>
              <p>
                Hệ thống cung cấp khung Prompt chuẩn (One-shot Prompt Engineering) có cấu trúc ràng buộc cao (Strict Schema JSON Output),
                giúp sinh viên biến một bài giảng Word/PDF 20 trang thành bộ thẻ chuẩn trong vòng chưa đầy 10 giây.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
