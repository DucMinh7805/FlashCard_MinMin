import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import ResumeBanner from './components/ResumeBanner';
import BottomDock from './components/BottomDock';
import DriveExplorer from './components/DriveExplorer';
import StudyView from './components/StudyView';
import AppModals from './components/AppModals';
import {
  useMiniDrive,
  STORAGE_KEY_SESSION,
  safeSet,
} from './hooks/useMiniDrive';
import { useStudySession } from './hooks/useStudySession';

export default function App() {
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2800);
  }, []);

  // Listen for storage quota warnings
  useEffect(() => {
    const handleQuotaErr = () => {
      showToast('Bộ nhớ trình duyệt (LocalStorage) đầy! Hãy vào Cài đặt để sao lưu.');
    };
    window.addEventListener('minmin_quota_error', handleQuotaErr);
    return () => window.removeEventListener('minmin_quota_error', handleQuotaErr);
  }, [showToast]);

  // Network online/offline status
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Đã kết nối lại mạng! Tự động đồng bộ Cloud.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Mất kết nối mạng! Bạn vẫn học và lưu tiến độ trên máy bình thường.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Navigation & Search
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);

  // Modals state
  const [importOpen, setImportOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [thesisDocsOpen, setThesisDocsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backupVaultOpen, setBackupVaultOpen] = useState(false);

  // Action / Editor state
  const [editorMode, setEditorMode] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedFolderForAction, setSelectedFolderForAction] = useState(null);
  const [selectedDeckForAction, setSelectedDeckForAction] = useState(null);

  // Refs for navigation & mobile back gesture
  const currentFolderIdRef = useRef(currentFolderId);
  currentFolderIdRef.current = currentFolderId;

  const isModalOpen = !!(
    importOpen ||
    promptOpen ||
    analyticsOpen ||
    thesisDocsOpen ||
    settingsOpen ||
    backupVaultOpen ||
    editorMode ||
    plusMenuOpen
  );
  const isModalOpenRef = useRef(isModalOpen);
  isModalOpenRef.current = isModalOpen;

  // Mini Drive Core Hook
  const miniDrive = useMiniDrive({
    showToast,
    hasActiveSession: false, // will update below
  });

  const {
    appData,
    setAppData,
    progressMap,
    setProgressMap,
    activityLogs,
    setActivityLogs,
    deviceId,
    settings,
    updateSettings,
    resetProgress,
    restoreSeedData,
    isCloudSyncing,
    syncFromCloud,
    getFolderPath,
    getFolderRecursiveDeckIds,
    getCardsByDeckIds,
    handleCreateFolder,
    handleEditFolder,
    handleMoveFolder,
    handleDeleteFolder,
    handleConfirmImport,
    handleEditDeck,
    handleMoveDeck,
    handleDeleteDeck,
    handleSaveCard,
  } = miniDrive;

  const appDataRef = useRef(appData);
  appDataRef.current = appData;

  // Study Session Custom Hook
  const {
    activeSession,
    setActiveSession,
    activeSessionRef,
    resumeCandidate,
    setResumeCandidate,
    undoStack,
    handleExitStudy,
    openDeckDirectly,
    startStudySession,
    handleRate,
    handleUndo,
    handleShuffle,
    handleChangeFilter,
    handleChangeDirection,
    handleRestartSession,
    handleToggleHint,
    handleFlip,
  } = useStudySession({
    appData,
    progressMap,
    setProgressMap,
    activityLogs,
    setActivityLogs,
    getCardsByDeckIds,
    showToast,
    currentFolderIdRef,
    setCurrentFolderId,
  });

  // Folder navigation with History PushState
  const handleSelectFolder = useCallback((folderId) => {
    if (folderId === currentFolderIdRef.current) return;
    const hash = folderId ? `#folder=${encodeURIComponent(folderId)}` : '';
    window.history.pushState(
      { minmin: 'folder', folderId },
      '',
      window.location.pathname + hash
    );
    setCurrentFolderId(folderId);
  }, []);

  // Baseline History State on initial mount
  useEffect(() => {
    if (!window.history.state || !window.history.state.minmin) {
      window.history.replaceState({ minmin: 'root', folderId: null }, '');
    }
  }, []);

  // Modal History Helpers: push state with explicit #modal hash for 100% mobile back compatibility
  const pushModalHistory = () => {
    window.history.pushState({ minmin: 'modal' }, '', '#modal');
  };

  const openImport = () => {
    pushModalHistory();
    setImportOpen(true);
  };
  const openPrompt = () => {
    pushModalHistory();
    setPromptOpen(true);
  };
  const openAnalytics = () => {
    pushModalHistory();
    setAnalyticsOpen(true);
  };
  const openThesisDocs = () => {
    pushModalHistory();
    setThesisDocsOpen(true);
  };
  const openSettings = () => {
    pushModalHistory();
    setSettingsOpen(true);
  };
  const openBackupVault = () => {
    pushModalHistory();
    setBackupVaultOpen(true);
  };
  const openEditor = (mode, folder = null, deck = null, card = null) => {
    pushModalHistory();
    setEditorMode(mode);
    setSelectedFolderForAction(folder);
    setSelectedDeckForAction(deck);
    setEditingCard(card);
  };

  const closeAllModals = useCallback(() => {
    setImportOpen(false);
    setPromptOpen(false);
    setAnalyticsOpen(false);
    setThesisDocsOpen(false);
    setSettingsOpen(false);
    setBackupVaultOpen(false);
    setPlusMenuOpen(false);
    setEditorMode(null);
    setSelectedFolderForAction(null);
    setSelectedDeckForAction(null);
    setEditingCard(null);

    if (window.location.hash === '#modal') {
      const folderId = currentFolderIdRef.current;
      const nextHash = folderId ? `#folder=${encodeURIComponent(folderId)}` : '';
      window.history.replaceState({ minmin: folderId ? 'folder' : 'root', folderId }, '', window.location.pathname + nextHash);
    }
  }, []);

  // Mobile Hardware Back / PopState listener
  useEffect(() => {
    const handlePopState = (e) => {
      if (isModalOpenRef.current) {
        closeAllModals();
        return;
      }

      if (activeSessionRef.current) {
        handleExitStudy();
        return;
      }

      if (currentFolderIdRef.current !== null) {
        const targetFolder =
          e.state && typeof e.state.folderId !== 'undefined'
            ? e.state.folderId
            : (appDataRef.current?.folders?.find((f) => f.id === currentFolderIdRef.current)?.parentId || null);

        setCurrentFolderId(targetFolder);
        const nextHash = targetFolder ? `#folder=${encodeURIComponent(targetFolder)}` : '';
        window.history.replaceState(null, '', window.location.pathname + nextHash);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeAllModals, handleExitStudy]);

  // URL Hash resolution on load
  const resolveHash = useCallback(
    (sourceData) => {
      const hash = window.location.hash || '';
      if (!hash || hash === '#modal') return false;
      const data = sourceData || appDataRef.current;
      if (!data) return false;

      if (hash.startsWith('#deck=')) {
        const did = decodeURIComponent(hash.slice('#deck='.length));
        const deck = data.decks?.find((d) => d.id === did);
        if (deck) {
          return openDeckDirectly(deck);
        }
      } else if (hash.startsWith('#folder=')) {
        const fid = decodeURIComponent(hash.slice('#folder='.length));
        if (data.folders?.some((f) => f.id === fid)) {
          setCurrentFolderId(fid);
          window.history.replaceState({ minmin: 'folder', folderId: fid }, '', window.location.hash);
          return true;
        }
      }
      return false;
    },
    [openDeckDirectly]
  );

  const hasResolvedInitialHashRef = useRef(false);
  useEffect(() => {
    if (!hasResolvedInitialHashRef.current && (appData.decks?.length > 0 || appData.folders?.length > 0)) {
      const resolved = resolveHash(appData);
      if (resolved) {
        hasResolvedInitialHashRef.current = true;
      }
    }
  }, [resolveHash, appData]);

  useEffect(() => {
    const handleHashChange = () => {
      if (isModalOpenRef.current && window.location.hash !== '#modal') {
        closeAllModals();
      }
      resolveHash(appDataRef.current);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [closeAllModals, resolveHash]);

  const handleShareLink = (hashFragment, successMessage) => {
    const url = `${window.location.origin}${window.location.pathname}${hashFragment}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast(successMessage || 'Đã sao chép liên kết chia sẻ!');
      }).catch(() => {
        showToast(`Link chia sẻ: ${url}`);
      });
    } else {
      showToast(`Link chia sẻ: ${url}`);
    }
  };

  return (
    <div className="min-h-screen text-slate-800">
      {/* Ambient Liquid Blobs - Light Version */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      {/* Top Navigation - Single Row Mini Drive Header (Hidden during active Study session) */}
      {!activeSession && (
        <Header
          isOnline={isOnline}
          isCloudSyncing={isCloudSyncing}
          hasCloudConnection={!!settings.supabaseUrl}
          onResetNavigation={() => {
            setActiveSession(null);
            handleSelectFolder(null);
          }}
          onOpenAnalytics={openAnalytics}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          plusMenuOpen={plusMenuOpen}
          setPlusMenuOpen={setPlusMenuOpen}
          onOpenImport={openImport}
          onOpenNewFolder={() => openEditor('new_folder')}
          onOpenPrompt={openPrompt}
          onOpenSettings={openSettings}
          onOpenBackupVault={openBackupVault}
        />
      )}

      {/* Main Container */}
      <main
        className={`max-w-5xl mx-auto px-3 sm:px-4 ${
          activeSession
            ? 'h-[100dvh] flex flex-col py-1.5 sm:py-2 overflow-hidden'
            : 'py-3 sm:py-4 space-y-4 pb-32 sm:pb-16'
        }`}
      >
        {/* Resume Banner */}
        {!activeSession && (
          <ResumeBanner
            resumeCandidate={resumeCandidate}
            onDismiss={() => {
              localStorage.removeItem(STORAGE_KEY_SESSION);
              setResumeCandidate(null);
            }}
            onResume={() => startStudySession({ resumeState: resumeCandidate })}
          />
        )}

        {/* View Mode: DriveExplorer vs StudyView */}
        {!activeSession ? (
          <DriveExplorer
            appData={appData}
            progressMap={progressMap}
            activityLogs={activityLogs}
            deviceId={deviceId}
            currentFolderId={currentFolderId}
            setCurrentFolderId={handleSelectFolder}
            getFolderPath={getFolderPath}
            getFolderRecursiveDeckIds={getFolderRecursiveDeckIds}
            getCardsByDeckIds={getCardsByDeckIds}
            onStartStudy={startStudySession}
            onNewFolder={() => openEditor('new_folder')}
            onNewDeck={openImport}
            onEditFolder={(folder) => openEditor('edit_folder', folder)}
            onMoveFolder={(folder) => openEditor('move_folder', folder)}
            onDeleteFolder={handleDeleteFolder}
            onEditDeck={(deck) => openEditor('edit_deck', null, deck)}
            onMoveDeck={(deck) => openEditor('move_deck', null, deck)}
            onDeleteDeck={handleDeleteDeck}
            onViewNote={(deck) => openEditor('view_note', null, deck)}
            onShareLink={handleShareLink}
            searchQuery={searchQuery}
            onQuickMoveDeck={handleMoveDeck}
            onQuickMoveFolder={handleMoveFolder}
          />
        ) : (
          <StudyView
            session={activeSession}
            progressMap={progressMap}
            undoCount={undoStack.length}
            getCardsByDeckIds={getCardsByDeckIds}
            onExit={handleExitStudy}
            onFlip={handleFlip}
            onToggleHint={handleToggleHint}
            onRate={handleRate}
            onUndo={handleUndo}
            onShuffle={handleShuffle}
            onChangeFilter={handleChangeFilter}
            onChangeDirection={handleChangeDirection}
            onEditCard={(targetCard) => {
              const cardToEdit = targetCard || (activeSession ? activeSession.queue[activeSession.currentIndex] : null);
              openEditor('edit_card', null, null, cardToEdit);
            }}
            onRestartSession={handleRestartSession}
            onViewDeckNote={() => {
              const deck = appData.decks.find((d) => activeSession.deckIds.includes(d.id));
              if (deck) {
                openEditor('view_note', null, deck);
              }
            }}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Dock for Mobile */}
      {!activeSession && (
        <BottomDock
          currentFolderId={currentFolderId}
          setCurrentFolderId={handleSelectFolder}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          analyticsOpen={analyticsOpen}
          setAnalyticsOpen={(open) => (open ? openAnalytics() : closeAllModals())}
          settingsOpen={settingsOpen}
          setSettingsOpen={(open) => (open ? openSettings() : closeAllModals())}
          appData={appData}
          progressMap={progressMap}
          onStartStudy={startStudySession}
          showToast={showToast}
        />
      )}

      {/* Modals & Dialogs Component */}
      <AppModals
        importOpen={importOpen}
        setImportOpen={(open) => (open ? openImport() : closeAllModals())}
        onConfirmImport={({ parsed, batchDecks, selectedFolderId, deckNameInput, deckNoteInput, author }) => {
          handleConfirmImport({
            parsed,
            batchDecks,
            selectedFolderId,
            deckNameInput,
            deckNoteInput,
            currentFolderId,
            author,
            onComplete: (tFid) => {
              closeAllModals();
              handleSelectFolder(tFid);
            },
          });
        }}
        promptOpen={promptOpen}
        setPromptOpen={(open) => (open ? openPrompt() : closeAllModals())}
        analyticsOpen={analyticsOpen}
        setAnalyticsOpen={(open) => (open ? openAnalytics() : closeAllModals())}
        thesisDocsOpen={thesisDocsOpen}
        setThesisDocsOpen={(open) => (open ? openThesisDocs() : closeAllModals())}
        settingsOpen={settingsOpen}
        setSettingsOpen={(open) => (open ? openSettings() : closeAllModals())}
        backupVaultOpen={backupVaultOpen}
        setBackupVaultOpen={(open) => (open ? openBackupVault() : closeAllModals())}
        settings={settings}
        onUpdateSettings={updateSettings}
        onPullCloud={() => syncFromCloud(false)}
        onResetProgress={resetProgress}
        onRestoreSeedData={restoreSeedData}
        editorMode={editorMode}
        setEditorMode={(mode) => (mode ? openEditor(mode) : closeAllModals())}
        editingCard={editingCard}
        setEditingCard={setEditingCard}
        selectedFolderForAction={selectedFolderForAction}
        setSelectedFolderForAction={setSelectedFolderForAction}
        selectedDeckForAction={selectedDeckForAction}
        setSelectedDeckForAction={setSelectedDeckForAction}
        onSaveFolder={({ name, icon }) => {
          handleCreateFolder({ name, icon, parentId: currentFolderId });
          closeAllModals();
        }}
        onEditFolder={(folderId, data) => {
          handleEditFolder(folderId, data);
          closeAllModals();
        }}
        onMoveFolder={(folderId, targetParentId) => {
          handleMoveFolder(folderId, targetParentId);
          closeAllModals();
        }}
        onEditDeck={({ id, name, note }, openEditMode) => {
          if (openEditMode) {
            const deck = appData.decks.find((d) => d.id === id);
            if (deck) {
              openEditor('edit_deck', null, deck);
            }
            return;
          }
          handleEditDeck({ id, name, note });
          closeAllModals();
        }}
        onMoveDeck={(deckId, newFolderId) => {
          handleMoveDeck(deckId, newFolderId);
          closeAllModals();
        }}
        onSaveCard={(updated) => {
          const target = editingCard || activeSession?.queue[activeSession.currentIndex];
          if (!target) return;
          const updatedCard = { ...target, ...updated };
          handleSaveCard(updatedCard);
          if (activeSession) {
            const nextQueue = activeSession.queue.map((c) => (c.id === target.id ? updatedCard : c));
            const nextSession = { ...activeSession, queue: nextQueue };
            setActiveSession(nextSession);
            safeSet(STORAGE_KEY_SESSION, nextSession);
          }
          closeAllModals();
        }}
        appData={appData}
        setAppData={setAppData}
        progressMap={progressMap}
        setProgressMap={setProgressMap}
        activityLogs={activityLogs}
        setActivityLogs={setActivityLogs}
        currentFolderId={currentFolderId}
        getFolderPath={getFolderPath}
        getFolderRecursiveDeckIds={getFolderRecursiveDeckIds}
        getCardsByDeckIds={getCardsByDeckIds}
        onStartStudy={startStudySession}
        showToast={showToast}
        activeSession={activeSession}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/90 text-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium shadow-2xl border border-white/20 backdrop-blur-md max-w-[90vw] sm:max-w-md line-clamp-2 break-words">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
