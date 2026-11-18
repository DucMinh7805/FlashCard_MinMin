import React, { useState } from 'react';

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
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Prompt chuẩn tạo Flashcard Đa Môn Học</h3>
            <p className="text-xs text-slate-300">
              Hỗ trợ tự động chọn loại thẻ: Định nghĩa (Basic), Điền khuyết &#123;&#123;c1::...&#125;&#125; (Cloze), và Ca lâm sàng (Case)
            </p>
          </div>
          <button type="button" onClick={onClose} className="glass-pill w-8 h-8 rounded-xl text-slate-300 hover:text-white">
            ✕
          </button>
        </div>

        <pre className="glass-input rounded-2xl p-4 text-xs text-slate-100 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
          {STANDARD_PROMPT}
        </pre>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-emerald-300">
            {copied ? '✓ Đã sao chép! Hãy dán vào AI kèm nội dung bài học của bạn.' : ''}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm"
          >
            📋 Sao chép Prompt này
          </button>
        </div>
      </div>
    </div>
  );
}
