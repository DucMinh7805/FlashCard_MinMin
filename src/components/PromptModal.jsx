import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Stethoscope,
  Dna,
  Globe2,
  ArrowRight,
  Upload,
  Plus,
  Pencil,
  Trash2,
  Save,
  RotateCcw,
  Download,
  FileText,
} from 'lucide-react';
import {
  STORAGE_KEY_PROMPTS,
  STORAGE_KEY_ACTIVE_PROMPT,
  safeGet,
  safeSet,
} from '../lib/storage';

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

const DEFAULT_PROMPTS = [
  {
    id: 'clinical',
    title: 'Lâm sàng',
    icon: 'stethoscope',
    isDefault: true,
    content: PROMPT_CLINICAL,
  },
  {
    id: 'basic',
    title: 'Cơ sở / Dược',
    icon: 'dna',
    isDefault: true,
    content: PROMPT_BASIC_SCIENCES,
  },
  {
    id: 'english',
    title: 'AV Chuyên ngành',
    icon: 'globe',
    isDefault: true,
    content: PROMPT_ENGLISH,
  },
];

const JSON_SCHEMA_SNIPPET = `
=== ĐỊNH DẠNG JSON NẠP WEB ===
Xuất DUY NHẤT 1 khối mã JSON hợp lệ (dùng dấu nháy kép "" chuẩn JSON, không viết lời dẫn ngoài khối mã):
{
  "deck": "Tên bài học ngắn gọn",
  "note": "Tóm tắt 3-5 ý chính (dùng \\n- để xuống dòng)",
  "cards": [
    {
      "type": "basic | cloze | case",
      "front": "Câu hỏi / tình huống / câu chứa {{c1::từ ẩn}}",
      "back": "Đáp án ngắn gọn, chính xác",
      "hint": "Gợi ý ngắn (để \"\" nếu không cần)",
      "extra": "Giải thích / cơ chế (để \"\" nếu không cần)",
      "image": ""
    }
  ]
}`;

function createPromptId() {
  return `prm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function loadInitialPrompts() {
  const saved = safeGet(STORAGE_KEY_PROMPTS, null);
  if (Array.isArray(saved) && saved.length > 0) {
    return saved.filter((p) => p && typeof p.id === 'string' && typeof p.content === 'string');
  }
  return DEFAULT_PROMPTS.map((p) => ({ ...p, updatedAt: Date.now() }));
}

function renderPromptIcon(iconName, isActive) {
  switch (iconName) {
    case 'stethoscope':
      return <Stethoscope className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-600' : 'text-sky-500/80'}`} />;
    case 'dna':
      return <Dna className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-indigo-500/80'}`} />;
    case 'globe':
      return <Globe2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-emerald-500/80'}`} />;
    default:
      return <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-600' : 'text-slate-500'}`} />;
  }
}

export default function PromptModal({ isOpen, onClose, onCopySuccess, showToast }) {
  const [prompts, setPrompts] = useState(loadInitialPrompts);
  const [activeId, setActiveId] = useState(() => {
    const initial = loadInitialPrompts();
    const savedId = safeGet(STORAGE_KEY_ACTIVE_PROMPT, null);
    if (savedId && initial.some((p) => p.id === savedId)) return savedId;
    return initial[0]?.id || 'clinical';
  });

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setIsCreating(false);
      setConfirmDeleteId(null);
      setStatusMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activePrompt = prompts.find((p) => p.id === activeId) || prompts[0];
  const defaultTemplate = activePrompt
    ? DEFAULT_PROMPTS.find((d) => d.id === activePrompt.id)
    : null;
  const isModifiedDefault =
    Boolean(defaultTemplate) &&
    activePrompt &&
    (activePrompt.content !== defaultTemplate.content || activePrompt.title !== defaultTemplate.title);

  const notify = (msg) => {
    setStatusMessage(msg);
    if (showToast) showToast(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? '' : prev));
    }, 3000);
  };

  const persistPrompts = (nextPrompts, nextActiveId = activeId) => {
    setPrompts(nextPrompts);
    safeSet(STORAGE_KEY_PROMPTS, nextPrompts);
    if (nextActiveId) {
      setActiveId(nextActiveId);
      safeSet(STORAGE_KEY_ACTIVE_PROMPT, nextActiveId);
    }
  };

  const handleSelectPrompt = (id) => {
    setActiveId(id);
    safeSet(STORAGE_KEY_ACTIVE_PROMPT, id);
    setIsEditing(false);
    setIsCreating(false);
    setConfirmDeleteId(null);
  };

  const handleCopy = () => {
    if (!activePrompt) return;
    navigator.clipboard?.writeText(activePrompt.content).catch(() => {});
    setCopied(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setConfirmDeleteId(null);
    setDraftTitle('');
    setDraftContent('');
  };

  const handleStartEdit = () => {
    if (!activePrompt) return;
    setIsCreating(false);
    setIsEditing(true);
    setConfirmDeleteId(null);
    setDraftTitle(activePrompt.title);
    setDraftContent(activePrompt.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleSaveEdit = () => {
    const cleanTitle = draftTitle.trim() || 'Prompt tùy chỉnh';
    const cleanContent = draftContent.trim();
    if (!cleanContent) {
      notify('Nội dung prompt không được để trống.');
      return;
    }

    if (isCreating) {
      const newPrompt = {
        id: createPromptId(),
        title: cleanTitle,
        icon: 'file',
        isDefault: false,
        content: cleanContent,
        updatedAt: Date.now(),
      };
      const next = [...prompts, newPrompt];
      persistPrompts(next, newPrompt.id);
      setIsEditing(false);
      setIsCreating(false);
      notify(`Đã lưu prompt "${cleanTitle}" vào kho lâu dài!`);
      return;
    }

    const next = prompts.map((p) =>
      p.id === activePrompt.id
        ? { ...p, title: cleanTitle, content: cleanContent, updatedAt: Date.now() }
        : p
    );
    persistPrompts(next, activePrompt.id);
    setIsEditing(false);
    notify(`Đã cập nhật prompt "${cleanTitle}"!`);
  };

  const handleDuplicate = () => {
    if (!activePrompt) return;
    const copyPrompt = {
      id: createPromptId(),
      title: `${activePrompt.title} (Bản sao)`,
      icon: 'file',
      isDefault: false,
      content: activePrompt.content,
      updatedAt: Date.now(),
    };
    const next = [...prompts, copyPrompt];
    persistPrompts(next, copyPrompt.id);
    notify(`Đã nhân bản thành "${copyPrompt.title}"`);
  };

  const handleRestoreDefault = () => {
    if (!defaultTemplate) return;
    const next = prompts.map((p) =>
      p.id === defaultTemplate.id
        ? { ...defaultTemplate, updatedAt: Date.now() }
        : p
    );
    persistPrompts(next, defaultTemplate.id);
    setIsEditing(false);
    notify(`Đã khôi phục prompt gốc "${defaultTemplate.title}"`);
  };

  const handleDeletePrompt = (id) => {
    if (prompts.length <= 1) {
      notify('Cần giữ lại ít nhất 1 prompt trong danh sách.');
      return;
    }
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    const deleted = prompts.find((p) => p.id === id);
    const next = prompts.filter((p) => p.id !== id);
    const nextActiveId = activeId === id ? next[0]?.id : activeId;
    persistPrompts(next, nextActiveId);
    setConfirmDeleteId(null);
    setIsEditing(false);
    notify(`Đã xóa prompt "${deleted?.title || ''}"`);
  };

  const handleUploadFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const addedPrompts = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const trimmed = text.trim();
        if (!trimmed) continue;

        if (file.name.toLowerCase().endsWith('.json')) {
          try {
            const parsed = JSON.parse(trimmed);
            // Case 1: Backup bundle { type: 'minmin_prompts_backup', prompts: [...] } or array of prompts
            const list = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed?.prompts)
                ? parsed.prompts
                : null;
            if (list) {
              list.forEach((item, idx) => {
                if (item && typeof item.content === 'string' && item.content.trim()) {
                  addedPrompts.push({
                    id: createPromptId(),
                    title: (item.title || `Prompt nhập ${idx + 1}`).trim(),
                    icon: item.icon || 'file',
                    isDefault: false,
                    content: item.content.trim(),
                    updatedAt: Date.now(),
                  });
                }
              });
              continue;
            }
            // Case 2: Single prompt JSON object { title, content }
            if (parsed && typeof parsed.content === 'string' && parsed.content.trim()) {
              addedPrompts.push({
                id: createPromptId(),
                title: (parsed.title || file.name.replace(/\.json$/i, '')).trim(),
                icon: 'file',
                isDefault: false,
                content: parsed.content.trim(),
                updatedAt: Date.now(),
              });
              continue;
            }
          } catch {
            // Fall through and treat as plain text prompt
          }
        }

        const baseName = file.name.replace(/\.(txt|md|json)$/i, '').trim() || 'Prompt tải lên';
        addedPrompts.push({
          id: createPromptId(),
          title: baseName,
          icon: 'file',
          isDefault: false,
          content: trimmed,
          updatedAt: Date.now(),
        });
      } catch {
        // Ignore unreadable file
      }
    }

    if (addedPrompts.length === 0) {
      notify('Không đọc được nội dung prompt từ file đã chọn.');
      return;
    }

    const next = [...prompts, ...addedPrompts];
    const lastAdded = addedPrompts[addedPrompts.length - 1];
    persistPrompts(next, lastAdded.id);
    setIsEditing(false);
    setIsCreating(false);
    notify(
      addedPrompts.length === 1
        ? `Đã tải lên & lưu prompt "${lastAdded.title}"!`
        : `Đã tải lên & lưu ${addedPrompts.length} prompt mới!`
    );
  };

  const handleExportPrompts = () => {
    const payload = {
      type: 'minmin_prompts_backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      prompts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MinMin_Prompts_Backup_${new Date().toLocaleDateString('sv-SE')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Đã xuất ${prompts.length} prompt ra file sao lưu!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-3.5 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/90">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Kho Prompt AI</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase tracking-wide">
                  Lưu lâu dài • {prompts.length} mẫu
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tải lên file (.txt, .md, .json), tự soạn hoặc chỉnh sửa & dùng lại mọi lúc
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

        {/* Prompt Management Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json,text/plain,text/markdown,application/json"
              multiple
              onChange={handleUploadFiles}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/70 text-xs font-bold transition flex items-center gap-1.5"
              title="Tải lên 1 hoặc nhiều file .txt, .md, .json"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải lên Prompt</span>
            </button>
            <button
              type="button"
              onClick={handleStartCreate}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Soạn mới</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPrompts}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-semibold transition flex items-center gap-1.5"
            title="Tải xuống toàn bộ kho prompt để sao lưu hoặc chuyển máy"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sao lưu kho</span>
          </button>
        </div>

        {/* Prompt Tabs (Scrollable / Wrapping) */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl max-h-28 overflow-y-auto">
          {prompts.map((item) => {
            const isActive = item.id === activePrompt?.id && !isCreating;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPrompt(item.id)}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 max-w-[190px] ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {renderPromptIcon(item.icon, isActive)}
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Workflow Guide Pills */}
        {!isEditing && (
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
        )}

        {/* Editor or Viewer */}
        {isEditing ? (
          <div className="space-y-2.5 bg-slate-50/90 p-3 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700">
                {isCreating ? 'Tạo Prompt mới' : 'Chỉnh sửa Prompt'}
              </label>
              <button
                type="button"
                onClick={() =>
                  setDraftContent((prev) =>
                    prev.trim() ? `${prev.trimEnd()}\n${JSON_SCHEMA_SNIPPET}` : JSON_SCHEMA_SNIPPET.trim()
                  )
                }
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 underline"
              >
                + Chèn khung JSON chuẩn MinMin
              </button>
            </div>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Tên prompt (VD: Nội khoa - Tim mạch, Ôn thi trắc nghiệm...)"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={10}
              placeholder="Dán hoặc nhập nội dung prompt của bạn tại đây..."
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-400 resize-y min-h-[180px] max-h-[38vh]"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isCreating ? 'Lưu Prompt mới' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active Prompt Action Bar */}
            {activePrompt && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-slate-700 truncate">
                    {activePrompt.title}
                  </span>
                  {activePrompt.isDefault ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold shrink-0">
                      Mẫu sẵn
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[10px] font-semibold shrink-0">
                      Đã lưu
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Nhân bản</span>
                  </button>
                  {isModifiedDefault && (
                    <button
                      type="button"
                      onClick={handleRestoreDefault}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-700 hover:bg-amber-50 transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Khôi phục gốc</span>
                    </button>
                  )}
                  {prompts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeletePrompt(activePrompt.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                        confirmDeleteId === activePrompt.id
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : 'text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{confirmDeleteId === activePrompt.id ? 'Bấm lần nữa để xóa' : 'Xóa'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Code Frame */}
            <pre className="glass-input bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed select-all border border-slate-200/80 font-mono max-h-[38vh]">
              {activePrompt?.content || ''}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-emerald-700 font-medium truncate">
            {copied
              ? '✓ Đã sao chép! Dán prompt này vào Gemini/ChatGPT kèm tài liệu.'
              : statusMessage}
          </span>
          {!isEditing && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép Prompt này'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
