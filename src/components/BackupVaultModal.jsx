import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  Database,
  Lock,
  Unlock,
  RotateCcw,
  Download,
  Upload,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Server,
  Layers,
  FileCode,
  HardDrive,
  Camera,
  Trash2,
  Search,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  getSystemSnapshots,
  createSystemSnapshot,
  deleteSystemSnapshot,
  calculateStorageSizeKB,
  STORAGE_KEY_SNAPSHOTS,
} from '../lib/systemVault';
import {
  STORAGE_KEY_CONTENT,
  STORAGE_KEY_PROGRESS,
  safeSet,
} from '../hooks/useMiniDrive';
import { pushCloudData } from '../lib/supabase';

const VAULT_PASSCODE = '123456789';

export default function BackupVaultModal({
  isOpen,
  onClose,
  appData,
  setAppData,
  progressMap,
  setProgressMap,
  settings,
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

  // Snapshots list
  const [snapshots, setSnapshots] = useState([]);
  const [viewingJson, setViewingJson] = useState(null); // null | { title, jsonText }
  const [jsonSearchQuery, setJsonSearchQuery] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);

  // Emergency Paste JSON Box
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedJson, setPastedJson] = useState('');

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmDialog) setConfirmDialog(null);
        else if (viewingJson) setViewingJson(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, confirmDialog, viewingJson]);

  useEffect(() => {
    if (isOpen) {
      setEnteredPasscode('');
      setAuthError('');
      setIsShaking(false);
      setIsUnlocked(false);
      setViewingJson(null);
      setShowPasteBox(false);
      setPastedJson('');
      setConfirmDialog(null);

      // Load existing snapshots or create initial if empty
      const existing = getSystemSnapshots();
      if (existing.length === 0 && appData) {
        const initSnap = createSystemSnapshot(appData, progressMap, 'Bản sao lưu hệ thống tự động');
        setSnapshots(initSnap ? [initSnap] : []);
      } else {
        setSnapshots(existing);
      }
    }
  }, [isOpen, appData, progressMap]);

  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    if (enteredPasscode.trim() === VAULT_PASSCODE) {
      setIsUnlocked(true);
      setAuthError('');
      showToast('Đã mở khóa Kho dữ liệu Hệ thống!');
    } else {
      setAuthError('Mật khẩu không chính xác! Vui lòng thử lại.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleCreateNewSnapshot = () => {
    const snap = createSystemSnapshot(appData, progressMap, 'Sao lưu thủ công tại chỗ');
    if (snap) {
      setSnapshots(getSystemSnapshots());
      showToast('Đã tạo điểm sao lưu hệ thống mới thành công!');
    }
  };

  const handleRestoreSnapshot = (snap) => {
    setConfirmDialog({
      title: `Khôi phục dữ liệu về bản "${snap.timeFormatted}"?`,
      message: `Hệ thống sẽ nạp lại toàn bộ ${snap.stats.folderCount} thư mục, ${snap.stats.deckCount} bài học và ${snap.stats.cardCount} thẻ từ mốc này.\n\nDữ liệu hiện tại sẽ được thay thế bằng bản sao lưu này. Tiếp tục?`,
      confirmText: 'Khôi phục bản này',
      action: () => {
        if (snap.data?.appData) {
          setAppData(snap.data.appData);
          safeSet(STORAGE_KEY_CONTENT, snap.data.appData);
          if (settings?.supabaseUrl && settings?.supabaseKey) {
            pushCloudData(settings.supabaseUrl, settings.supabaseKey, snap.data.appData);
          }
        }
        if (snap.data?.progressMap) {
          setProgressMap(snap.data.progressMap);
          safeSet(STORAGE_KEY_PROGRESS, snap.data.progressMap);
        }
        setConfirmDialog(null);
        showToast(`Đã khôi phục thành công về mốc ${snap.timeFormatted}!`);
      },
    });
  };

  const handleDeleteSnapshot = (id) => {
    const updated = deleteSystemSnapshot(id);
    setSnapshots(updated);
    showToast('Đã xóa bản sao lưu này.');
  };

  const handleApplyPastedJson = () => {
    if (!pastedJson.trim()) {
      showToast('Vui lòng dán nội dung mã JSON vào ô!');
      return;
    }
    try {
      const parsed = JSON.parse(pastedJson);
      const targetAppData = parsed.appData || (parsed.folders && parsed.decks ? parsed : null);
      if (!targetAppData || !Array.isArray(targetAppData.folders)) {
        showToast('Mã JSON không đúng cấu trúc (thiếu danh sách folders / decks).');
        return;
      }

      setConfirmDialog({
        title: 'Xác nhận nạp đè dữ liệu sửa lỗi?',
        message: `Đã đọc thành công ${targetAppData.folders.length} thư mục và ${(targetAppData.decks || []).length} bài học từ mã JSON.\n\nBạn có muốn nạp đè ngay vào hệ thống để sửa lỗi không?`,
        confirmText: 'Nạp đè dữ liệu',
        action: () => {
          setAppData(targetAppData);
          safeSet(STORAGE_KEY_CONTENT, targetAppData);
          if (settings?.supabaseUrl && settings?.supabaseKey) {
            pushCloudData(settings.supabaseUrl, settings.supabaseKey, targetAppData);
          }
          if (parsed.progressMap) {
            setProgressMap(parsed.progressMap);
            safeSet(STORAGE_KEY_PROGRESS, parsed.progressMap);
          }
          // Lưu lại điểm snapshot cứu hộ
          createSystemSnapshot(targetAppData, parsed.progressMap || progressMap, 'Nạp từ mã JSON sửa lỗi');
          setSnapshots(getSystemSnapshots());
          setShowPasteBox(false);
          setPastedJson('');
          setConfirmDialog(null);
          showToast('Đã nạp đè và sửa lỗi dữ liệu thành công!');
        },
      });
    } catch (err) {
      showToast('Lỗi cú pháp: Chuỗi dán vào không phải là JSON hợp lệ!');
    }
  };

  const totalCards = useMemo(() => {
    return (appData?.decks || []).reduce((sum, d) => sum + (d.cards?.length || 0), 0);
  }, [appData]);

  const learnedCount = useMemo(() => {
    return Object.keys(progressMap || {}).length;
  }, [progressMap]);

  const storageSizeKB = useMemo(() => {
    return calculateStorageSizeKB();
  }, [appData, progressMap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="glass-panel bg-white/95 rounded-t-[28px] sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-white/90 overflow-hidden relative">
        {/* Mobile pull indicator */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-1 shrink-0" />

        {/* Sticky Header */}
        <div className="px-4 sm:px-6 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              {isUnlocked ? <Database className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-tight truncate">
                  Kho dữ liệu Hệ thống
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
                Kiểm tra dữ liệu • Bản sao lưu cục bộ • Khôi phục & Sửa lỗi
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
                  Kho dữ liệu hệ thống được khóa mã
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Đây là kho lưu trữ dữ liệu gốc, các bản sao lưu cục bộ và công cụ sửa lỗi JSON của
                  hệ thống. Vui lòng nhập mật khẩu quản trị để tiếp tục.
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
                  <span>Mở khóa Kho dữ liệu</span>
                </button>
              </form>

              <div className="pt-2 border-t border-slate-200/60">
                <p className="text-[11px] text-slate-400">
                  Mật khẩu mặc định: <span className="font-mono font-bold text-slate-600">123456789</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* 2. MÀN HÌNH NỘI DUNG KHO DỮ LIỆU HỆ THỐNG */
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 animate-fadeIn">
            {/* THẺ 1: DỮ LIỆU ĐANG LƯU Ở ĐÂU & TRẠNG THÁI HIỆN TẠI */}
            <div className="glass-card bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Vị trí lưu trữ dữ liệu hệ thống
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      Dữ liệu bài học được lưu tại 2 tầng bảo vệ:
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewSnapshot}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chụp điểm lưu ngay</span>
                </button>
              </div>

              {/* Chi tiết 2 nơi lưu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 space-y-0.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                    1. Bộ nhớ máy (LocalStorage)
                  </span>
                  <p className="text-slate-500 leading-tight">
                    Lưu tại khóa <code>minmin_flashcard_drive_v1</code>. Dù ngoại tuyến (offline) vẫn
                    còn nguyên trên máy.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 space-y-0.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    2. Đám mây Supabase Cloud
                  </span>
                  <p className="text-slate-500 leading-tight">
                    Tự động đồng bộ ngầm thời gian thực (Atomic CRUD) lên bảng cơ sở dữ liệu của
                    nhóm 10 người.
                  </p>
                </div>
              </div>

              {/* Thống kê số lượng hiện tại */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex items-center gap-3 text-slate-700 font-semibold">
                  <span>{(appData?.folders || []).length} Thư mục</span>
                  <span>•</span>
                  <span>{(appData?.decks || []).length} Bài học</span>
                  <span>•</span>
                  <span>{totalCards} Thẻ</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-bold">{learnedCount} Đã học</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  Dung lượng: ~{storageSizeKB} KB
                </span>
              </div>
            </div>

            {/* THẺ 2: CÁC MỐC SAO LƯU HỆ THỐNG (RESTORE POINTS) */}
            <div className="glass-card bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Các mốc sao lưu hệ thống ({snapshots.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">
                  Lưu trữ các điểm dữ liệu để khôi phục khi mất
                </span>
              </div>

              <div className="space-y-2">
                {snapshots.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Chưa có bản sao lưu nào. Hãy bấm "Chụp điểm lưu ngay" ở trên.
                  </p>
                ) : (
                  snapshots.map((snap, idx) => (
                    <div
                      key={snap.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">
                              {snap.timeFormatted}
                            </span>
                            {idx === 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                                Mới nhất
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{snap.reason}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {snap.stats.folderCount} thư mục • {snap.stats.deckCount} bài •{' '}
                            {snap.stats.cardCount} thẻ • {snap.stats.progressCount} tiến độ
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setViewingJson({
                                title: `Bản sao lưu: ${snap.timeFormatted}`,
                                jsonText: JSON.stringify(snap.data, null, 2),
                              })
                            }
                            title="Xem & Kiểm tra mã JSON"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            <FileCode className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSnapshot(snap.id)}
                            title="Xóa bản lưu này"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(snap)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs border border-sky-200 transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục dữ liệu bản này</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(snap.data, null, 2)], {
                              type: 'application/json',
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `MinMin_Snapshot_${snap.timeFormatted.replace(/[\/\s:]/g, '_')}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            showToast('Đã tải file snapshot về máy!');
                          }}
                          className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                          title="Tải file snapshot về máy"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tải file</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* THẺ 3: XUẤT / NẠP FILE & DÁN MÃ JSON SỬA LỖI KHẨN CẤP */}
            <div className="glass-card bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Cứu hộ & Sửa lỗi khẩn cấp (Emergency Fix)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dùng khi bị mất bài hoặc cần nạp đè file/mã JSON cứu hộ từ máy khác:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasteBox(!showPasteBox)}
                  className="text-xs font-bold text-indigo-600 hover:underline shrink-0"
                >
                  {showPasteBox ? 'Đóng ô dán' : 'Dán mã JSON'}
                </button>
              </div>

              {/* Ô dán JSON trực tiếp để fix */}
              {showPasteBox && (
                <div className="space-y-2 p-3 bg-white rounded-xl border-2 border-indigo-300 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Dán trực tiếp chuỗi JSON dữ liệu vào đây:
                    </span>
                    <button
                      type="button"
                      onClick={() => setPastedJson('')}
                      className="text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      Xóa trắng
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    placeholder='{"appData": {"folders": [...], "decks": [...]}}'
                    className="w-full glass-input rounded-xl p-2.5 text-xs font-mono text-slate-800"
                  />
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleApplyPastedJson}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Kiểm tra & Nạp đè dữ liệu sửa lỗi</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2 nút tải file và nạp file từ máy */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="py-2.5 px-3 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Tải file toàn bộ (.json)</span>
                </button>

                <label className="py-2.5 px-3 rounded-xl border border-teal-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer text-center">
                  <Upload className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">Nạp file cứu hộ (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={onRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Nút xem trực tiếp raw JSON hiện tại */}
              <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Muốn xem toàn bộ chuỗi JSON đang chạy trên máy?
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setViewingJson({
                      title: 'Dữ liệu đang chạy hiện tại (Live System Data)',
                      jsonText: JSON.stringify({ appData, progressMap }, null, 2),
                    })
                  }
                  className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem Raw JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POPUP XEM & TÌM KIẾM MÃ RAW JSON */}
        {viewingJson && (
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
                  onClick={() => setViewingJson(null)}
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
                    placeholder="Tìm tên thẻ, bài học trong JSON..."
                    className="w-full glass-input rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingJson.jsonText);
                    setCopiedJson(true);
                    showToast('Đã copy toàn bộ mã JSON vào bộ nhớ tạm!');
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
              <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] text-slate-800 bg-slate-900 text-slate-100 whitespace-pre leading-relaxed select-text">
                {viewingJson.jsonText}
              </div>
            </div>
          </div>
        )}

        {/* Safety Confirmation Dialog */}
        {confirmDialog && (
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
                  onClick={() => setConfirmDialog(null)}
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
        )}
      </div>
    </div>
  );
}
