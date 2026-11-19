import React from 'react';
import ImportModal from './ImportModal';
import PromptModal from './PromptModal';
import EditorModal from './EditorModal';
import SettingsModal from './SettingsModal';
import AnalyticsModal from './AnalyticsModal';
import ThesisDocsModal from './ThesisDocsModal';
import { pushCloudData } from '../lib/supabase';
import {
  STORAGE_KEY_CONTENT,
  STORAGE_KEY_PROGRESS,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_ACTIVITY,
  safeSet,
} from '../hooks/useMiniDrive';

export default function AppModals({
  // Import
  importOpen,
  setImportOpen,
  onConfirmImport,
  // Prompt
  promptOpen,
  setPromptOpen,
  // Analytics
  analyticsOpen,
  setAnalyticsOpen,
  // Thesis / Docs
  thesisDocsOpen,
  setThesisDocsOpen,
  // Settings
  settingsOpen,
  setSettingsOpen,
  settings,
  onUpdateSettings,
  onPullCloud,
  onResetProgress,
  onRestoreSeedData,
  // Editor
  editorMode,
  setEditorMode,
  editingCard,
  setEditingCard,
  selectedFolderForAction,
  setSelectedFolderForAction,
  selectedDeckForAction,
  setSelectedDeckForAction,
  onSaveFolder,
  onEditFolder,
  onMoveFolder,
  onEditDeck,
  onMoveDeck,
  onSaveCard,
  // Data props
  appData,
  setAppData,
  progressMap,
  setProgressMap,
  activityLogs,
  setActivityLogs,
  currentFolderId,
  getFolderPath,
  getFolderRecursiveDeckIds,
  getCardsByDeckIds,
  onStartStudy,
  showToast,
  activeSession,
}) {
  return (
    <>
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        folders={appData.folders}
        currentFolderId={currentFolderId}
        getFolderPath={getFolderPath}
        onConfirmImport={onConfirmImport}
      />

      <PromptModal
        isOpen={promptOpen}
        onClose={() => setPromptOpen(false)}
        onCopySuccess={() => showToast('Đã sao chép Prompt chuẩn!')}
      />

      <EditorModal
        key={editorMode || 'closed'}
        mode={editorMode}
        card={editingCard || (activeSession ? activeSession.queue[activeSession.currentIndex] : null)}
        folder={selectedFolderForAction}
        deck={selectedDeckForAction}
        folders={appData.folders}
        onClose={() => {
          setEditorMode(null);
          setEditingCard(null);
          setSelectedFolderForAction(null);
          setSelectedDeckForAction(null);
        }}
        onSaveFolder={onSaveFolder}
        onEditFolder={onEditFolder}
        onMoveFolder={onMoveFolder}
        onEditDeck={onEditDeck}
        onMoveDeck={onMoveDeck}
        onSaveCard={onSaveCard}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        showToast={showToast}
        onUpdateSettings={onUpdateSettings}
        onPullCloud={onPullCloud}
        onExportBackup={() => {
          const blob = new Blob(
            [JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), appData, progressMap }, null, 2)],
            { type: 'application/json' }
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `FlashCard_MinMin_Backup_${new Date().toLocaleDateString('sv-SE')}.json`;
          a.click();
          URL.revokeObjectURL(url);
          showToast('Đã tải xuống file sao lưu toàn bộ!');
        }}
        onRestoreBackup={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(String(reader.result || '{}'));
              if (parsed.appData?.folders) {
                setAppData(parsed.appData);
                safeSet(STORAGE_KEY_CONTENT, parsed.appData);
                pushCloudData(settings.supabaseUrl, settings.supabaseKey, parsed.appData);
              }
              if (parsed.progressMap) {
                setProgressMap(parsed.progressMap);
                safeSet(STORAGE_KEY_PROGRESS, parsed.progressMap);
              }
              showToast('Đã khôi phục toàn bộ thư mục và tiến độ học!');
            } catch {
              showToast('File Backup không đúng định dạng JSON.');
            }
          };
          reader.readAsText(file, 'utf-8');
        }}
        onExportUserProgress={() => {
          const blob = new Blob(
            [
              JSON.stringify(
                {
                  type: 'minmin_user_progress',
                  studentName: settings.studentName || 'Học viên',
                  exportedAt: new Date().toISOString(),
                  progressMap,
                  activityLogs,
                },
                null,
                2
              ),
            ],
            { type: 'application/json' }
          );
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `MinMin_TienDoHoc_${(settings.studentName || 'HocVien').replace(/\s+/g, '_')}_${new Date().toLocaleDateString('sv-SE')}.json`;
          a.click();
          URL.revokeObjectURL(url);
          showToast('Đã tải xuống file tiến độ học tập cá nhân!');
        }}
        onRestoreUserProgress={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const parsed = JSON.parse(String(reader.result || '{}'));
              if (parsed.progressMap) {
                const merged = { ...progressMap, ...parsed.progressMap };
                setProgressMap(merged);
                safeSet(STORAGE_KEY_PROGRESS, merged);
              }
              if (parsed.activityLogs) {
                const mergedLogs = { ...activityLogs, ...parsed.activityLogs };
                setActivityLogs(mergedLogs);
                safeSet(STORAGE_KEY_ACTIVITY, mergedLogs);
              }
              if (parsed.studentName) {
                const next = { ...settings, studentName: parsed.studentName };
                onUpdateSettings(next);
                safeSet(STORAGE_KEY_SETTINGS, next);
              }
              showToast(`Đã đồng bộ tiến độ học của "${parsed.studentName || 'Học viên'}"!`);
            } catch {
              showToast('File tiến độ không đúng định dạng JSON.');
            }
          };
          reader.readAsText(file, 'utf-8');
        }}
        onResetProgress={onResetProgress}
        onRestoreSeedData={onRestoreSeedData}
      />

      <AnalyticsModal
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        appData={appData}
        progressMap={progressMap}
        activityLogs={activityLogs}
        getFolderRecursiveDeckIds={getFolderRecursiveDeckIds}
        getCardsByDeckIds={getCardsByDeckIds}
        onStartStudy={onStartStudy}
      />

      <ThesisDocsModal isOpen={thesisDocsOpen} onClose={() => setThesisDocsOpen(false)} />
    </>
  );
}
