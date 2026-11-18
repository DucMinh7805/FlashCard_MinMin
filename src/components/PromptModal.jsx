import React, { useState } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';

const STANDARD_PROMPT = `Hãy chuyển đổi tài liệu bài học dưới đây thành bộ Flashcard chuẩn JSON để nạp vào ứng dụng FlashCard MinMin.

Yêu cầu cấu trúc JSON chính xác:
{
  "folderPath": ["Y khoa lâm sàng", "Nội khoa"],
  "deck": "Tên bài học (Ví dụ: Bài 1 - X-ray & CT)",
  "cards": [
    {
      "type": "basic | cloze | case",
      "front": "Câu hỏi, thuật ngữ, hoặc câu có chứa {{c1::từ khóa ẩn}} nếu là kiểu cloze",
      "back": "Đáp án ngắn gọn, chính xác (dùng \\n- nếu có nhiều ý)",
      "hint": "Gợi ý ngắn giúp nhớ lại (để \"\" nếu không cần)",
      "extra": "Giải thích cơ chế, lưu ý lâm sàng hoặc mở rộng (để \"\" nếu không cần)",
      "image": ""
    }
  ]
}

Quy tắc chọn loại thẻ (type) thông minh theo từng môn:
1. "basic": Dùng cho từ vựng chuyên ngành (AVCN), định nghĩa, phân loại, hỏi - đáp trực tiếp.
2. "cloze": Dùng cho tiêu chuẩn chẩn đoán, tam chứng/tứ chứng, công thức, mốc liều lượng (ẩn từ khóa quan trọng bằng cú pháp {{c1::từ cần điền}} ngay trong trường front).
3. "case": Dùng cho tình huống lâm sàng (Nội, Ngoại, Sản, Nhi) hoặc câu hỏi vận dụng cần giải thích sâu ở trường "extra".
4. Chỉ trả về duy nhất khối mã JSON hợp lệ, không viết thêm lời dẫn.

Nội dung tài liệu cần chuyển đổi:
[DÁN NỘI DUNG BÀI HỌC CỦA BẠN VÀO ĐÂY]`;

export default function PromptModal({ isOpen, onClose, onCopySuccess }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(STANDARD_PROMPT).catch(() => {});
    setCopied(true);
    onCopySuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Prompt AI tạo Flashcard Đa Môn</h3>
              <p className="text-xs text-slate-500">
                Tự động chọn loại thẻ: Định nghĩa (Basic), Điền khuyết (Cloze) và Ca lâm sàng (Case)
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

        <pre className="glass-input bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all border border-slate-200/80 font-mono">
          {STANDARD_PROMPT}
        </pre>

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-emerald-700 font-medium">
            {copied ? '✓ Đã sao chép! Dán prompt này vào Gemini/ChatGPT kèm tài liệu.' : ''}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép Prompt này'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
