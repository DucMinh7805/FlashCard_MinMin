import React, { useState } from 'react';
import { X, Copy, Check, Sparkles, Stethoscope, Dna, Globe2, ArrowRight } from 'lucide-react';

const PROMPT_CLINICAL = `Bạn là trợ lý soạn Flashcard Y khoa cho ứng dụng FlashCard MinMin.
Hãy làm việc theo đúng 2 BƯỚC dưới đây (tuyệt đối KHÔNG xuất JSON ở Bước 1):

=== KHUÔN LÂM SÀNG: NỘI, NGOẠI, SẢN, NHI ===
- Trọng tâm: Tiêu chuẩn chẩn đoán, thang điểm/phân độ, cận lâm sàng chìa khóa, chẩn đoán phân biệt, xử trí cấp cứu/phác đồ đầu tay, chống chỉ định và biến chứng.
- Ưu tiên loại thẻ:
  + Cloze ({{c1::...}}) cho tiêu chuẩn, mốc số, liều lượng, tam chứng/tứ chứng.
  + Case cho tình huống lâm sàng và hướng xử trí.
  + Basic cho định nghĩa, phân loại ngắn gọn.

=== NGUYÊN TẮC BẮT BUỘC ===
1. Chỉ dùng kiến thức có trong tài liệu đính kèm, tuyệt đối không tự bịa số liệu hay phác đồ bên ngoài.
2. Không ép số lượng thẻ cố định — tạo đủ số thẻ để phủ trọn các ý trọng tâm (1 thẻ = 1 ý kiểm tra duy nhất, không nhồi nhét).

=== BƯỚC 1 (LÀM NGAY BÂY GIỜ) ===
Đọc tài liệu đính kèm và trình bày ngắn gọn:
1. Danh sách các nhóm kiến thức & câu hỏi dự kiến sẽ tạo thẻ (gạch đầu dòng ngắn gọn để tôi duyệt).
2. Hỏi tôi: "Bạn muốn bỏ phần nào, đào sâu phần nào hay chốt xuất JSON ngay?"

=== BƯỚC 2 (CHỈ LÀM KHI TÔI BÁO "CHỐT" HOẶC YÊU CẦU XUẤT JSON) ===
Xuất DUY NHẤT 1 khối mã JSON hợp lệ (dùng dấu nháy kép "" chuẩn JSON, không viết lời dẫn ngoài khối mã):
{
  "deck": "Tên bài học lâm sàng ngắn gọn",
  "note": "Tóm tắt 3-5 gạch đầu dòng xương sống nhất của bài (dùng \\n- để xuống dòng)",
  "cards": [
    {
      "type": "basic | cloze | case",
      "front": "Câu hỏi / tình huống / câu chứa {{c1::từ ẩn}} nếu là cloze",
      "back": "Đáp án ngắn gọn, chính xác (dùng \\n- nếu nhiều ý)",
      "hint": "Gợi ý ngắn nếu cần (để \"\" nếu không cần)",
      "extra": "Cơ chế, lưu ý lâm sàng hoặc giải thích (để \"\" nếu không cần)",
      "image": ""
    }
  ]
}

=== TÀI LIỆU BÀI HỌC ===
[DÁN TÀI LIỆU HOẶC ĐÍNH KÈM FILE SLIDE/PDF VÀO ĐÂY]`;

const PROMPT_BASIC_SCIENCES = `Bạn là trợ lý soạn Flashcard Y khoa cho ứng dụng FlashCard MinMin.
Hãy làm việc theo đúng 2 BƯỚC dưới đây (tuyệt đối KHÔNG xuất JSON ở Bước 1):

=== KHUÔN Y HỌC CƠ SỞ: GIẢI PHẪU, SINH LÝ, HÓA SINH, DƯỢC LÝ ===
- Trọng tâm:
  + Giải phẫu: Mối liên quan cấu trúc, thần kinh chi phối, mạch máu cấp máu.
  + Sinh lý / Hóa sinh: Chu trình, cơ chế tác động, điều hòa ngược (feedback), mốc trị số sinh lý.
  + Dược lý: Nhóm thuốc - cơ chế tác dụng - chỉ định chính - chống chỉ định - tác dụng phụ đặc trưng.
- Ưu tiên loại thẻ:
  + Basic cho thuật ngữ, định nghĩa, phân loại, cơ chế.
  + Cloze ({{c1::...}}) cho mốc số, công thức, liên quan giải phẫu. Không cần tạo thẻ Case nếu tài liệu không có ca bệnh.

=== NGUYÊN TẮC BẮT BUỘC ===
1. Chỉ dùng kiến thức có trong tài liệu đính kèm, tuyệt đối không tự bịa kiến thức ngoài tài liệu.
2. Không ép số lượng thẻ cố định — tạo đủ số thẻ để phủ trọn các ý trọng tâm (1 thẻ = 1 ý kiểm tra duy nhất, không nhồi nhét).

=== BƯỚC 1 (LÀM NGAY BÂY GIỜ) ===
Đọc tài liệu đính kèm và trình bày ngắn gọn:
1. Danh sách các nhóm kiến thức & câu hỏi dự kiến sẽ tạo thẻ (gạch đầu dòng ngắn gọn để tôi duyệt).
2. Hỏi tôi: "Bạn muốn bỏ phần nào, đào sâu phần nào hay chốt xuất JSON ngay?"

=== BƯỚC 2 (CHỈ LÀM KHI TÔI BÁO "CHỐT" HOẶC YÊU CẦU XUẤT JSON) ===
Xuất DUY NHẤT 1 khối mã JSON hợp lệ (dùng dấu nháy kép "" chuẩn JSON, không viết lời dẫn ngoài khối mã):
{
  "deck": "Tên bài học y học cơ sở ngắn gọn",
  "note": "Tóm tắt 3-5 gạch đầu dòng xương sống nhất của bài (dùng \\n- để xuống dòng)",
  "cards": [
    {
      "type": "basic | cloze",
      "front": "Câu hỏi cấu trúc / cơ chế / câu chứa {{c1::từ ẩn}} nếu là cloze",
      "back": "Đáp án ngắn gọn, chính xác (dùng \\n- nếu nhiều ý)",
      "hint": "Gợi ý ngắn nếu cần (để \"\" nếu không cần)",
      "extra": "Giải thích chi tiết, liên hệ lâm sàng (để \"\" nếu không cần)",
      "image": ""
    }
  ]
}

=== TÀI LIỆU BÀI HỌC ===
[DÁN TÀI LIỆU HOẶC ĐÍNH KÈM FILE SLIDE/PDF VÀO ĐÂY]`;

const PROMPT_ENGLISH = `Bạn là trợ lý soạn Flashcard Y khoa cho ứng dụng FlashCard MinMin.
Hãy làm việc theo đúng 2 BƯỚC dưới đây (tuyệt đối KHÔNG xuất JSON ở Bước 1):

=== KHUÔN TIẾNG ANH CHUYÊN NGÀNH Y KHOA (AVCN) ===
- Trọng tâm: Thuật ngữ y khoa gốc Hy Lạp/La Tinh (tiền tố - gốc từ - hậu tố), họ từ (noun/verb/adj), cụm từ giao tiếp với bệnh nhân, cấu trúc câu trong bệnh án tiếng Anh.
- Ưu tiên loại thẻ:
  + Basic: Mặt trước là Thuật ngữ tiếng Anh + Từ loại; Mặt sau là Nghĩa tiếng Việt chuẩn + Phiên âm IPA; Extra là Câu ví dụ trong ngữ cảnh bài học.
  + Cloze ({{c1::...}}): Điền từ vựng còn thiếu vào câu ngữ cảnh lâm sàng.

=== NGUYÊN TẮC BẮT BUỘC ===
1. Chỉ dùng từ vựng và câu ngữ cảnh có trong bài học đính kèm.
2. Không chế ca lâm sàng phức tạp nếu bài học chỉ thuần từ vựng.
3. Không ép số lượng thẻ cố định — bao phủ trọn vẹn các thuật ngữ trọng tâm trong bài.

=== BƯỚC 1 (LÀM NGAY BÂY GIỜ) ===
Đọc tài liệu đính kèm và trình bày ngắn gọn:
1. Danh sách các thuật ngữ và mẫu câu dự kiến sẽ tạo thẻ (gạch đầu dòng ngắn gọn để tôi duyệt).
2. Hỏi tôi: "Bạn muốn bổ sung từ nào, bỏ từ nào hay chốt xuất JSON ngay?"

=== BƯỚC 2 (CHỈ LÀM KHI TÔI BÁO "CHỐT" HOẶC YÊU CẦU XUẤT JSON) ===
Xuất DUY NHẤT 1 khối mã JSON hợp lệ (dùng dấu nháy kép "" chuẩn JSON, không viết lời dẫn ngoài khối mã):
{
  "deck": "Tên bài học AVCN ngắn gọn",
  "note": "Tóm tắt 3-5 cấu trúc câu hoặc tiền tố/hậu tố quan trọng nhất của bài (dùng \\n- để xuống dòng)",
  "cards": [
    {
      "type": "basic | cloze",
      "front": "Thuật ngữ tiếng Anh (kèm từ loại: n/v/adj) hoặc câu điền từ {{c1::từ ẩn}}",
      "back": "Nghĩa tiếng Việt chuẩn (kèm phiên âm IPA nếu có)",
      "hint": "Gợi ý gốc từ / tiền tố / từ đồng nghĩa (để \"\" nếu không cần)",
      "extra": "Câu ví dụ trong ngữ cảnh bài đọc tiếng Anh (để \"\" nếu không cần)",
      "image": ""
    }
  ]
}

=== TÀI LIỆU BÀI HỌC ===
[DÁN BÀI ĐỌC HOẶC DANH SÁCH TỪ VỰNG TIẾNG ANH VÀO ĐÂY]`;

export default function PromptModal({ isOpen, onClose, onCopySuccess }) {
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'basic' | 'english'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getActivePrompt = () => {
    switch (activeTab) {
      case 'clinical':
        return PROMPT_CLINICAL;
      case 'basic':
        return PROMPT_BASIC_SCIENCES;
      case 'english':
        return PROMPT_ENGLISH;
      default:
        return PROMPT_CLINICAL;
    }
  };

  const currentPrompt = getActivePrompt();

  const handleCopy = () => {
    navigator.clipboard?.writeText(currentPrompt).catch(() => {});
    setCopied(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Prompt AI Soạn Thẻ Y Khoa</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase tracking-wide">
                  Quy trình 2 bước
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Duyệt trước khung câu hỏi trong 10 giây ➔ Gõ "Chốt" để xuất JSON chuẩn 100%
              </p>
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

        {/* 3 Domain Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'clinical'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate">Lâm sàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'basic'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dna className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Cơ sở / Dược</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('english')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'english'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">AV Chuyên ngành</span>
          </button>
        </div>

        {/* Workflow Guide Pills */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 leading-snug">
          <div className="font-bold shrink-0 text-amber-700">Cách dùng:</div>
          <div className="flex-1 flex flex-wrap items-center gap-1">
            <span>Dán prompt + tài liệu vào Gemini/ChatGPT</span>
            <ArrowRight className="w-3 h-3 text-amber-600 inline shrink-0" />
            <span>AI tóm tắt câu hỏi để bạn duyệt</span>
            <ArrowRight className="w-3 h-3 text-amber-600 inline shrink-0" />
            <span className="font-bold underline text-amber-950">Gõ "Chốt"</span>
            <span>để lấy JSON nạp web</span>
          </div>
        </div>

        {/* Code Frame */}
        <pre className="glass-input bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all border border-slate-200/80 font-mono max-h-[42vh]">
          {currentPrompt}
        </pre>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-emerald-700 font-medium truncate">
            {copied ? '✓ Đã sao chép! Dán prompt này vào Gemini/ChatGPT kèm tài liệu.' : ''}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép Prompt này'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
