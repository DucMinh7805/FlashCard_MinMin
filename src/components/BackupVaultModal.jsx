import React, { useEffect, useState, useMemo } from 'react';
import { X, Database, Lock } from 'lucide-react';
import {
  getSystemSnapshots,
  createSystemSnapshot,
  deleteSystemSnapshot,
  calculateStorageSizeKB,
} from '../lib/systemVault';
import {
  STORAGE_KEY_CONTENT,
  STORAGE_KEY_PROGRESS,
  safeSet,
} from '../hooks/useMiniDrive';
import { pushCloudData } from '../lib/supabase';
import VaultPasscodeGate from './vault/VaultPasscodeGate';
import VaultSnapshotList from './vault/VaultSnapshotList';
import VaultRawPasteModal from './vault/VaultRawPasteModal';
import VaultJsonViewerModal from './vault/VaultJsonViewerModal';
import VaultConfirmDialog from './vault/VaultConfirmDialog';

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
  onResetProgress,
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [authError, setAuthError] = useState('');

  // Snapshots list
  const [snapshots, setSnapshots] = useState([]);
  const [viewingJson, setViewingJson] = useState(null);

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

      const existing = getSystemSnapshots();
      if (existing.length === 0 && appData?.folders?.length > 0) {
        createSystemSnapshot(appData, progressMap, 'Khởi tạo hệ thống tự động');
        setSnapshots(getSystemSnapshots());
      } else {
        setSnapshots(existing);
      }
    }
  }, [isOpen, appData, progressMap]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (enteredPasscode.trim() === VAULT_PASSCODE) {
      setIsUnlocked(true);
      setAuthError('');
      setIsShaking(false);
      showToast('Đã mở khóa Kho dữ liệu Hệ thống!');
    } else {
      setIsShaking(true);
      setAuthError('Mật khẩu không chính xác! Vui lòng thử lại.');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleCreateNewSnapshot = () => {
    const snap = createSystemSnapshot(appData, progressMap, 'Sao lưu thủ công');
    if (snap) {
      setSnapshots(getSystemSnapshots());
      showToast('Đã chụp điểm sao lưu mới vào bộ nhớ máy!');
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
          createSystemSnapshot(targetAppData, parsed.progressMap || progressMap, 'Nạp từ mã JSON sửa lỗi');
          setSnapshots(getSystemSnapshots());
          setShowPasteBox(false);
          setPastedJson('');
          setConfirmDialog(null);
          showToast('Đã nạp đè và sửa lỗi dữ liệu thành công!');
        },
      });
    } catch {
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

        {/* 1. Màn hình khóa bảo mật */}
        {!isUnlocked ? (
          <VaultPasscodeGate
            enteredPasscode={enteredPasscode}
            setEnteredPasscode={setEnteredPasscode}
            showPasscode={showPasscode}
            setShowPasscode={setShowPasscode}
            isShaking={isShaking}
            authError={authError}
            setAuthError={setAuthError}
            onUnlock={handleUnlock}
          />
        ) : (
          /* 2. Màn hình nội dung kho dữ liệu */
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 animate-fadeIn">
            <VaultSnapshotList
              appData={appData}
              totalCards={totalCards}
              learnedCount={learnedCount}
              storageSizeKB={storageSizeKB}
              snapshots={snapshots}
              onCreateNewSnapshot={handleCreateNewSnapshot}
              onViewJson={setViewingJson}
              onRestoreSnapshot={handleRestoreSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              showToast={showToast}
            />

            <VaultRawPasteModal
              showPasteBox={showPasteBox}
              setShowPasteBox={setShowPasteBox}
              pastedJson={pastedJson}
              setPastedJson={setPastedJson}
              onApplyPastedJson={handleApplyPastedJson}
              onExportBackup={onExportBackup}
              onRestoreBackup={onRestoreBackup}
              onViewRawLiveJson={() =>
                setViewingJson({
                  title: 'Dữ liệu đang chạy hiện tại (Live System Data)',
                  jsonText: JSON.stringify({ appData, progressMap }, null, 2),
                })
              }
              onResetProgress={onResetProgress}
              setConfirmDialog={setConfirmDialog}
            />
          </div>
        )}

        {/* Popup xem & tìm kiếm mã Raw JSON */}
        <VaultJsonViewerModal
          viewingJson={viewingJson}
          onClose={() => setViewingJson(null)}
          showToast={showToast}
        />

        {/* Safety Confirmation Dialog */}
        <VaultConfirmDialog
          confirmDialog={confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      </div>
    </div>
  );
}
