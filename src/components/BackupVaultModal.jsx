import React, { useEffect, useState } from 'react';
import {
  X,
  HardDrive,
  Download,
  Upload,
  FolderArchive,
  Database,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  Plus,
  Trash2,
  Edit3,
  Check,
  FileSpreadsheet,
  Globe,
  Info,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';

const VAULT_PASSCODE = '123456789';
const STORAGE_KEY_VAULT_LINKS = 'minmin_backup_vault_links_v1';

const DEFAULT_VAULT_LINKS = [
  {
    id: 'link_gdrive',
    title: 'Thư mục Google Drive Nhóm',
    url: 'https://drive.google.com/drive/folders/1_Sample_Flashcard_Drive_Ykhoa',
    type: 'drive',
    note: 'Nơi lưu trữ file bài học, slide bài giảng & dữ liệu flashcard của nhóm',
  },
  {
    id: 'link_gsheet',
    title: 'Google Sheets - Ngân hàng câu hỏi',
    url: 'https://docs.google.com/spreadsheets/d/1_Sample_Flashcard_Questions_Ykhoa/edit',
    type: 'sheet',
    note: 'Bảng tính chứa danh sách câu hỏi trắc nghiệm, case lâm sàng và điền từ',
  },
];

export default function BackupVaultModal({
  isOpen,
  onClose,
  showToast,
  onExportBackup,
  onRestoreBackup,
  onExportUserProgress,
  onRestoreUserProgress,
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [authError, setAuthError] = useState('');

  // Links state
  const [links, setLinks] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_VAULT_LINKS);
      return raw ? JSON.parse(raw) : DEFAULT_VAULT_LINKS;
    } catch {
      return DEFAULT_VAULT_LINKS;
    }
  });

  // Edit / Add modal inline state
  const [editingLink, setEditingLink] = useState(null); // null | { id, title, url, type, note }
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setEnteredPasscode('');
      setAuthError('');
      setIsShaking(false);
      setIsUnlocked(false);
      setEditingLink(null);
      setIsAddingNew(false);
    }
  }, [isOpen]);

  const saveLinksToStorage = (updated) => {
    setLinks(updated);
    try {
      localStorage.setItem(STORAGE_KEY_VAULT_LINKS, JSON.stringify(updated));
    } catch (_) {}
  };

  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    if (enteredPasscode.trim() === VAULT_PASSCODE) {
      setIsUnlocked(true);
      setAuthError('');
      showToast('Đã mở khóa Kho dữ liệu dự phòng thành công!');
    } else {
      setAuthError('Mật khẩu không chính xác! Vui lòng thử lại.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleCopyLink = (url, title) => {
    try {
      navigator.clipboard.writeText(url);
      showToast(`Đã copy link: ${title}`);
    } catch {
      showToast('Không thể tự động copy link, vui lòng copy thủ công.');
    }
  };

  const handleSaveEditLink = (linkData) => {
    if (!linkData.title.trim() || !linkData.url.trim()) {
      showToast('Vui lòng nhập tên và đường dẫn URL!');
      return;
    }
    if (isAddingNew) {
      const newLink = {
        ...linkData,
        id: `link_${Date.now()}`,
      };
      const next = [...links, newLink];
      saveLinksToStorage(next);
      showToast('Đã thêm liên kết dự phòng mới!');
    } else {
      const next = links.map((l) => (l.id === linkData.id ? linkData : l));
      saveLinksToStorage(next);
      showToast('Đã cập nhật liên kết dự phòng!');
    }
    setEditingLink(null);
    setIsAddingNew(false);
  };

  const handleDeleteLink = (id, title) => {
    const next = links.filter((l) => l.id !== id);
    saveLinksToStorage(next);
    showToast(`Đã xóa liên kết: ${title}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-t-[28px] sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-white/90 overflow-hidden relative">
        {/* Mobile pull indicator */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-1 shrink-0" />

        {/* Sticky Header */}
        <div className="px-4 sm:px-6 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">
                  Kho dữ liệu & Link dự phòng
                </h3>
                {isUnlocked ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
                    Đã mở khóa
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold shrink-0">
                    Bảo mật
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Google Drive • Google Sheets • Dữ liệu dự phòng nhóm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="glass-pill w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 transition shrink-0 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. MÀN HÌNH KHÓA BẢO MẬT (Passcode Gate) */}
        {!isUnlocked ? (
          <div className="p-5 sm:p-6 space-y-4 animate-fadeIn">
            <div
              className={`glass-card bg-slate-50/80 rounded-2xl p-5 border border-slate-200/90 text-center space-y-3.5 shadow-sm ${
                isShaking ? 'shake-animation border-rose-300 bg-rose-50/40' : ''
              }`}
            >
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-800">
                  Kho dữ liệu dự phòng được khóa mã
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Kho này chứa các liên kết thư mục Google Drive, Google Sheets tài liệu và file dự
                  phòng của nhóm. Vui lòng nhập mật khẩu để mở khóa.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3 max-w-xs mx-auto pt-1">
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={enteredPasscode}
                    onChange={(e) => {
                      setEnteredPasscode(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    autoFocus
                    placeholder="Nhập mật khẩu (9 số)"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-slate-800 border-slate-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {authError && (
                  <p className="text-xs font-bold text-rose-600 animate-fadeIn">{authError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Mở khóa Kho dự phòng</span>
                </button>
              </form>

              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-[11px] text-slate-400">
                  Mật khẩu hệ thống: <span className="font-mono font-bold text-slate-600">123456789</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* 2. MÀN HÌNH NỘI DUNG KHO DỰ PHÒNG */
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 animate-fadeIn">
            {/* Thanh giới thiệu & Hướng dẫn */}
            <div className="glass-card bg-indigo-50/70 rounded-2xl p-3.5 border border-indigo-200/80 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-indigo-950 leading-relaxed">
                <p className="font-bold">Nơi lưu trữ các nguồn dữ liệu dự phòng của nhóm:</p>
                <p className="text-indigo-800/90 mt-0.5">
                  Bấm <strong>Mở link</strong> để truy cập trực tiếp thư mục Google Drive hoặc bảng tính Google Sheets của nhóm. Bạn cũng có thể bấm <strong>Sửa</strong> để thay đổi link theo kho tài liệu thật của nhóm bạn.
                </p>
              </div>
            </div>

            {/* DANH SÁCH LIÊN KẾT KHO DỰ PHÒNG */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Liên kết thư mục & Bảng tính dự phòng ({links.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(true);
                    setEditingLink({
                      id: '',
                      title: '',
                      url: '',
                      type: 'drive',
                      note: '',
                    });
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm link</span>
                </button>
              </div>

              {/* Form Thêm mới / Sửa Link */}
              {editingLink && (
                <div className="glass-card bg-white rounded-2xl p-3.5 border-2 border-indigo-400 space-y-2.5 shadow-md animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">
                      {isAddingNew ? 'Thêm liên kết dự phòng mới' : 'Chỉnh sửa liên kết'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLink(null);
                        setIsAddingNew(false);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Tên kho / Tài liệu
                      </label>
                      <input
                        type="text"
                        value={editingLink.title}
                        onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                        placeholder="VD: Google Drive Bài giảng, Google Sheets Câu hỏi..."
                        className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Đường dẫn URL
                      </label>
                      <input
                        type="text"
                        value={editingLink.url}
                        onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                        placeholder="https://drive.google.com/drive/folders/... hoặc docs.google.com/spreadsheets/..."
                        className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Loại liên kết
                        </label>
                        <select
                          value={editingLink.type}
                          onChange={(e) => setEditingLink({ ...editingLink, type: e.target.value })}
                          className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800 bg-white"
                        >
                          <option value="drive">📁 Google Drive</option>
                          <option value="sheet">📊 Google Sheets</option>
                          <option value="other">🌐 Link khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Ghi chú ngắn
                        </label>
                        <input
                          type="text"
                          value={editingLink.note || ''}
                          onChange={(e) => setEditingLink({ ...editingLink, note: e.target.value })}
                          placeholder="Mô tả nội dung kho này..."
                          className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLink(null);
                          setIsAddingNew(false);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditLink(editingLink)}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Lưu liên kết</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Danh sách các link đã lưu */}
              {links.map((item) => (
                <div
                  key={item.id}
                  className="glass-card bg-slate-50/70 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-2 hover:border-indigo-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          item.type === 'drive'
                            ? 'bg-sky-100 text-sky-700'
                            : item.type === 'sheet'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {item.type === 'drive' ? (
                          <FolderArchive className="w-4 h-4" />
                        ) : item.type === 'sheet' ? (
                          <FileSpreadsheet className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {item.title}
                          </h5>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              item.type === 'drive'
                                ? 'bg-sky-100 text-sky-800'
                                : item.type === 'sheet'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {item.type === 'drive'
                              ? 'Google Drive'
                              : item.type === 'sheet'
                                ? 'Google Sheets'
                                : 'Kho ngoài'}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-1 mt-0.5">
                            {item.note}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs mt-0.5">
                          {item.url}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons on card header */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNew(false);
                          setEditingLink(item);
                        }}
                        title="Sửa link"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(item.id, item.title)}
                        title="Xóa link"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Button bar: Mở link & Copy link */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở link</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.url, item.title)}
                      className="py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* SAO LƯU & TẢI TỆP DỮ LIỆU ĐỂ UP LÊN DRIVE */}
            <div className="glass-card bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Xuất & Nạp file dữ liệu (.json) lên Drive
                </h4>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                  Tải file sao lưu về máy để upload vào thư mục Google Drive của nhóm, hoặc khôi phục từ file tải về:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="py-2.5 px-2.5 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Xuất file Drive (.json)</span>
                </button>

                <label className="py-2.5 px-2.5 rounded-xl border border-teal-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer text-center">
                  <Upload className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">Nạp Drive từ file</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={onRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={onExportUserProgress}
                  className="py-2 px-2.5 rounded-xl border border-sky-200 hover:border-sky-300 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">Xuất tiến độ học</span>
                </button>

                <label className="py-2 px-2.5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer text-center">
                  <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">Nạp tiến độ học</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={onRestoreUserProgress}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
