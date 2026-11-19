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
  STORAGE_KEY_PROGRESS,
  STORAGE_KEY_ACTIVITY,
  safeGet,
  safeSet,
} from './hooks/useMiniDrive';
import { calculateNextProgress, getCardProgress, isCardDue } from './lib/spacedRepetition';

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

  const [activeSession, setActiveSession] = useState(null);
  const [resumeCandidate, setResumeCandidate] = useState(() => {
    const saved = safeGet(STORAGE_KEY_SESSION, null);
    return saved?.queue && saved.currentIndex < saved.queue.length ? saved : null;
  });
  const [undoStack, setUndoStack] = useState([]);

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

  // Action / Editor state
  const [editorMode, setEditorMode] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedFolderForAction, setSelectedFolderForAction] = useState(null);
  const [selectedDeckForAction, setSelectedDeckForAction] = useState(null);

  // Refs for navigation & mobile back gesture
  const currentFolderIdRef = useRef(currentFolderId);
  currentFolderIdRef.current = currentFolderId;

  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  const isModalOpen = !!(
    importOpen ||
    promptOpen ||
    analyticsOpen ||
    thesisDocsOpen ||
    settingsOpen ||
    editorMode ||
    plusMenuOpen
  );
  const isModalOpenRef = useRef(isModalOpen);
  isModalOpenRef.current = isModalOpen;



  // Mini Drive Core Hook
  const miniDrive = useMiniDrive({
    showToast,
    hasActiveSession: !!activeSession,
  });

  const {
    appData,
    setAppData,
    progressMap,
    setProgressMap,
    activityLogs,
    setActivityLogs,
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
  const openEditor = (mode, folder = null, deck = null, card = null) => {
    pushModalHistory();
    setSelectedFolderForAction(folder);
    setSelectedDeckForAction(deck);
    setEditingCard(card);
    setEditorMode(mode);
  };

  const closeAllModals = useCallback(() => {
    setPlusMenuOpen(false);
    setImportOpen(false);
    setPromptOpen(false);
    setAnalyticsOpen(false);
    setThesisDocsOpen(false);
    setSettingsOpen(false);
    setEditorMode(null);
    setSelectedFolderForAction(null);
    setSelectedDeckForAction(null);
    setEditingCard(null);

    // If URL hash was set to #modal, restore clean folder/root hash without polluting history
    if (window.location.hash === '#modal') {
      const folderId = currentFolderIdRef.current;
      const nextHash = folderId ? `#folder=${encodeURIComponent(folderId)}` : '';
      window.history.replaceState({ minmin: folderId ? 'folder' : 'root', folderId }, '', window.location.pathname + nextHash);
    }
  }, []);

  // Study Session Exit: updates UI state and URL hash without calling history.back()
  const handleExitStudy = useCallback(() => {
    setActiveSession(null);
    const folderId = currentFolderIdRef.current;
    const nextHash = folderId ? `#folder=${encodeURIComponent(folderId)}` : '';
    window.history.replaceState(null, '', window.location.pathname + nextHash);
  }, []);

  // Mobile Hardware Back / PopState listener: only updates state to close modal or navigate up
  useEffect(() => {
    const handlePopState = (e) => {
      // 1. If any modal is open -> close modal without exiting web
      if (isModalOpenRef.current) {
        closeAllModals();
        return;
      }

      // 2. If study session is active -> exit study view back to folder
      if (activeSessionRef.current) {
        setActiveSession(null);
        const folderId = currentFolderIdRef.current;
        const nextHash = folderId ? `#folder=${encodeURIComponent(folderId)}` : '';
        window.history.replaceState(null, '', window.location.pathname + nextHash);
        return;
      }

      // 3. If in a subfolder -> go back to parent folder
      if (currentFolderIdRef.current !== null) {
        const targetFolder =
          e.state && typeof e.state.folderId !== 'undefined'
            ? e.state.folderId
            : (appDataRef.current?.folders?.find((f) => f.id === currentFolderIdRef.current)?.parentId || null);

        setCurrentFolderId(targetFolder);
        const nextHash = targetFolder ? `#folder=${encodeURIComponent(targetFolder)}` : '';
        window.history.replaceState(null, '', window.location.pathname + nextHash);
        return;
      }

      // 4. At root with no modal/study -> let browser perform default back/exit
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeAllModals]);

  // Study Session Handlers
  const openDeckDirectly = useCallback(
    (deck) => {
      if (!deck) return false;
      setCurrentFolderId(deck.folderId || null);
      const cards = (deck.cards || []).map((c) => ({
        ...c,
        deckId: deck.id,
        deckName: deck.name,
      }));
      if (cards.length === 0) {
        showToast(`Bài "${deck.name}" chưa có thẻ nào để học!`);
        return true;
      }
      const nextSession = {
        title: deck.name,
        deckIds: [deck.id],
        deckNote: deck.note || '',
        filterMode: 'all',
        direction: 'front_to_back',
        queue: cards,
        currentIndex: 0,
        isFlipped: false,
        hintVisible: false,
        reviewedCount: 0,
      };
      setActiveSession(nextSession);
      setUndoStack([]);
      safeSet(STORAGE_KEY_SESSION, nextSession);
      setResumeCandidate(nextSession);
      window.history.pushState(
        { minmin: 'study', folderId: deck.folderId || null },
        '',
        `#deck=${encodeURIComponent(deck.id)}`
      );
      return true;
    },
    [showToast]
  );

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

  // Run hash resolution only ONCE on initial load, do not spam/reset study on 25s cloud sync
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

  const startStudySession = ({
    title,
    deckIds,
    filterMode = 'all',
    direction = 'front_to_back',
    resumeState = null,
  }) => {
    if (resumeState) {
      window.history.pushState(
        { minmin: 'study', folderId: currentFolderIdRef.current },
        '',
        resumeState.deckIds?.[0] ? `#deck=${encodeURIComponent(resumeState.deckIds[0])}` : '#study'
      );
      setActiveSession(resumeState);
      setUndoStack([]);
      return;
    }
    const allCards = getCardsByDeckIds(deckIds);
    if (allCards.length === 0) return showToast('Chưa có thẻ nào trong mục này để học!');

    let filtered = allCards.slice();
    if (filterMode === 'due' || filterMode === 'due_only') {
      filtered = allCards.filter((c) => isCardDue(progressMap, c.id));
    } else if (filterMode === 'red_yellow') {
      filtered = allCards.filter((c) => getCardProgress(progressMap, c.id).status !== 'green');
    } else if (filterMode === 'chunk20') {
      filtered = allCards.filter((c) => getCardProgress(progressMap, c.id).status !== 'green').slice(0, 20);
    }

    if (filtered.length === 0) {
      filtered = allCards.slice();
      showToast('Tất cả thẻ đều đã thuộc! Chuyển sang ôn toàn bộ thẻ.');
    }

    const firstDeck = appData.decks.find((d) => deckIds.includes(d.id));
    window.history.pushState(
      { minmin: 'study', folderId: currentFolderIdRef.current },
      '',
      firstDeck ? `#deck=${encodeURIComponent(firstDeck.id)}` : '#study'
    );

    const nextSession = {
      title,
      deckIds,
      deckNote: firstDeck?.note || '',
      filterMode,
      direction,
      queue: filtered,
      currentIndex: 0,
      isFlipped: false,
      hintVisible: false,
      reviewedCount: 0,
    };
    setActiveSession(nextSession);
    setUndoStack([]);
    safeSet(STORAGE_KEY_SESSION, nextSession);
    setResumeCandidate(nextSession);
  };

  const handleRate = (rating) => {
    if (!activeSession || activeSession.currentIndex >= activeSession.queue.length) return;
    const queue = activeSession.queue.slice();
    const card = queue[activeSession.currentIndex];
    const prevProg = { ...getCardProgress(progressMap, card.id) };

    setUndoStack((prev) => [
      ...prev,
      {
        cardId: card.id,
        prevProg,
        prevIndex: activeSession.currentIndex,
        prevQueue: activeSession.queue.slice(),
        prevReviewedCount: activeSession.reviewedCount,
      },
    ].slice(-15));

    if (rating === 'red' && (!card.__repCount || card.__repCount < 2)) {
      const clone = { ...card, __repCount: (card.__repCount || 0) + 1 };
      queue.splice(Math.min(queue.length, activeSession.currentIndex + 4), 0, clone);
    } else if (rating === 'yellow' && !card.__repCount) {
      queue.push({ ...card, __repCount: 1 });
    }

    const nextProgressMap = { ...progressMap, [card.id]: calculateNextProgress(prevProg, rating) };
    setProgressMap(nextProgressMap);
    safeSet(STORAGE_KEY_PROGRESS, nextProgressMap);

    const todayKey = new Date().toLocaleDateString('sv-SE');
    const nextActivity = { ...activityLogs, [todayKey]: (activityLogs[todayKey] || 0) + 1 };
    setActivityLogs(nextActivity);
    safeSet(STORAGE_KEY_ACTIVITY, nextActivity);

    const nextIndex = activeSession.currentIndex + 1;
    const nextSession = {
      ...activeSession,
      queue,
      currentIndex: nextIndex,
      isFlipped: false,
      hintVisible: false,
      reviewedCount: activeSession.reviewedCount + 1,
    };
    setActiveSession(nextSession);

    if (nextIndex >= queue.length) {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      setResumeCandidate(null);
    } else {
      safeSet(STORAGE_KEY_SESSION, nextSession);
      setResumeCandidate(nextSession);
    }
  };

  const handleUndo = () => {
    if (!activeSession || undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    const nextProgressMap = { ...progressMap, [last.cardId]: last.prevProg };
    setProgressMap(nextProgressMap);
    safeSet(STORAGE_KEY_PROGRESS, nextProgressMap);

    const todayKey = new Date().toLocaleDateString('sv-SE');
    if (activityLogs[todayKey] && activityLogs[todayKey] > 0) {
      const nextActivity = { ...activityLogs, [todayKey]: Math.max(0, activityLogs[todayKey] - 1) };
      setActivityLogs(nextActivity);
      safeSet(STORAGE_KEY_ACTIVITY, nextActivity);
    }

    const nextSession = {
      ...activeSession,
      queue: last.prevQueue || activeSession.queue.slice(0, last.queueLengthBefore),
      currentIndex: last.prevIndex,
      isFlipped: true,
      hintVisible: false,
      reviewedCount: Math.max(0, last.prevReviewedCount ?? (activeSession.reviewedCount - 1)),
    };
    setActiveSession(nextSession);
    safeSet(STORAGE_KEY_SESSION, nextSession);
    setResumeCandidate(nextSession);
    showToast('Đã hoàn tác thẻ vừa chấm.');
  };

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
            currentFolderId={currentFolderId}
            setCurrentFolderId={handleSelectFolder}
            searchQuery={searchQuery}
            onStartStudy={startStudySession}
            onNewFolder={() => openEditor('new_folder')}
            onNewDeck={openImport}
            onEditFolder={(f) => openEditor('edit_folder', f)}
            onMoveFolder={(f) => openEditor('move_folder', f)}
            onEditDeck={(d) => openEditor('edit_deck', null, d)}
            onMoveDeck={(d) => openEditor('move_deck', null, d)}
            onQuickMoveFolder={handleMoveFolder}
            onQuickMoveDeck={handleMoveDeck}
            onViewNote={(d) => openEditor('view_note', null, d)}
            onDeleteFolder={(fId) => handleDeleteFolder(fId, currentFolderId, handleSelectFolder)}
            onDeleteDeck={handleDeleteDeck}
            onShareLink={handleShareLink}
            getFolderPath={getFolderPath}
            getFolderRecursiveDeckIds={getFolderRecursiveDeckIds}
            getCardsByDeckIds={getCardsByDeckIds}
          />
        ) : (
          <StudyView
            session={activeSession}
            progressMap={progressMap}
            undoCount={undoStack.length}
            getCardsByDeckIds={getCardsByDeckIds}
            onExit={handleExitStudy}
            onFlip={() => setActiveSession((s) => (s ? { ...s, isFlipped: !s.isFlipped } : s))}
            onToggleHint={() => setActiveSession((s) => (s ? { ...s, hintVisible: !s.hintVisible } : s))}
            onRate={handleRate}
            onUndo={handleUndo}
            onShuffle={() => {
              const rem = activeSession.queue.slice(activeSession.currentIndex);
              for (let i = rem.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rem[i], rem[j]] = [rem[j], rem[i]];
              }
              const q = [...activeSession.queue.slice(0, activeSession.currentIndex), ...rem];
              setActiveSession({ ...activeSession, queue: q, isFlipped: false });
              showToast('Đã trộn ngẫu nhiên các thẻ còn lại!');
            }}
            onChangeFilter={(filterMode) =>
              startStudySession({
                title: activeSession.title,
                deckIds: activeSession.deckIds,
                filterMode,
                direction: activeSession.direction,
              })
            }
            onChangeDirection={(direction) =>
              setActiveSession({ ...activeSession, direction, isFlipped: false })
            }
            onEditCard={(targetCard) => {
              const cardToEdit = targetCard || (activeSession ? activeSession.queue[activeSession.currentIndex] : null);
              openEditor('edit_card', null, null, cardToEdit);
            }}
            onRestartSession={(filterMode) =>
              startStudySession({
                title: activeSession.title,
                deckIds: activeSession.deckIds,
                filterMode,
                direction: activeSession.direction,
              })
            }
            onViewDeckNote={() => {
              const deck = appData.decks.find((d) => activeSession.deckIds.includes(d.id));
              if (deck) {
                openEditor('view_note', null, deck);
              }
            }}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Dock for Mobile (Option 1 Soft Floating Capsule) */}
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
        onConfirmImport={({ parsed, selectedFolderId, deckNameInput, deckNoteInput }) => {
          handleConfirmImport({
            parsed,
            selectedFolderId,
            deckNameInput,
            deckNoteInput,
            currentFolderId,
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
