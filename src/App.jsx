import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import ResumeBanner from './components/ResumeBanner';
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
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(window.__minminToast);
    window.__minminToast = setTimeout(() => setToastMsg(''), 2800);
  }, []);

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
      return true;
    },
    [showToast]
  );

  // URL Hash resolution
  const appDataRef = useRef(appData);
  appDataRef.current = appData;

  const resolveHash = useCallback(
    (sourceData) => {
      const hash = window.location.hash || '';
      if (!hash) return false;
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
          return true;
        }
      }
      return false;
    },
    [openDeckDirectly]
  );

  useEffect(() => {
    resolveHash(appData);
  }, [resolveHash, appData]);

  useEffect(() => {
    const handleHashChange = () => resolveHash(appDataRef.current);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [resolveHash]);

  const startStudySession = ({
    title,
    deckIds,
    filterMode = 'all',
    direction = 'front_to_back',
    resumeState = null,
  }) => {
    if (resumeState) {
      setActiveSession(resumeState);
      setUndoStack([]);
      return;
    }
    const allCards = getCardsByDeckIds(deckIds);
    if (allCards.length === 0) return showToast('Chưa có thẻ nào trong mục này để học!');

    let filtered = allCards.slice();
    if (filterMode === 'due') {
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
          isCloudSyncing={isCloudSyncing}
          hasCloudConnection={!!settings.supabaseUrl}
          onResetNavigation={() => {
            setActiveSession(null);
            setCurrentFolderId(null);
          }}
          onOpenAnalytics={() => setAnalyticsOpen(true)}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          plusMenuOpen={plusMenuOpen}
          setPlusMenuOpen={setPlusMenuOpen}
          onOpenImport={() => setImportOpen(true)}
          onOpenNewFolder={() => {
            setSelectedFolderForAction(null);
            setEditorMode('new_folder');
          }}
          onOpenPrompt={() => setPromptOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4 pb-6 sm:pb-8">
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
            setCurrentFolderId={setCurrentFolderId}
            searchQuery={searchQuery}
            onStartStudy={startStudySession}
            onNewFolder={() => {
              setSelectedFolderForAction(null);
              setEditorMode('new_folder');
            }}
            onNewDeck={() => setImportOpen(true)}
            onEditFolder={(f) => {
              setSelectedFolderForAction(f);
              setEditorMode('edit_folder');
            }}
            onMoveFolder={(f) => {
              setSelectedFolderForAction(f);
              setEditorMode('move_folder');
            }}
            onEditDeck={(d) => {
              setSelectedDeckForAction(d);
              setEditorMode('edit_deck');
            }}
            onMoveDeck={(d) => {
              setSelectedDeckForAction(d);
              setEditorMode('move_deck');
            }}
            onQuickMoveFolder={handleMoveFolder}
            onQuickMoveDeck={handleMoveDeck}
            onViewNote={(d) => {
              setSelectedDeckForAction(d);
              setEditorMode('view_note');
            }}
            onDeleteFolder={(fId) => handleDeleteFolder(fId, currentFolderId, setCurrentFolderId)}
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
            onExit={() => {
              setActiveSession(null);
              if (window.location.hash.startsWith('#deck=')) {
                const nextHash = currentFolderId ? `#folder=${currentFolderId}` : '';
                window.history.replaceState(null, '', window.location.pathname + nextHash);
              }
            }}
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
              setEditingCard(cardToEdit);
              setEditorMode('edit_card');
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
                setSelectedDeckForAction(deck);
                setEditorMode('view_note');
              }
            }}
          />
        )}
      </main>

      {/* Modals & Dialogs Component */}
      <AppModals
        importOpen={importOpen}
        setImportOpen={setImportOpen}
        onConfirmImport={({ parsed, selectedFolderId, deckNameInput, deckNoteInput }) => {
          handleConfirmImport({
            parsed,
            selectedFolderId,
            deckNameInput,
            deckNoteInput,
            currentFolderId,
            onComplete: (tFid) => {
              setCurrentFolderId(tFid);
              setImportOpen(false);
            },
          });
        }}
        promptOpen={promptOpen}
        setPromptOpen={setPromptOpen}
        analyticsOpen={analyticsOpen}
        setAnalyticsOpen={setAnalyticsOpen}
        thesisDocsOpen={thesisDocsOpen}
        setThesisDocsOpen={setThesisDocsOpen}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        settings={settings}
        onUpdateSettings={updateSettings}
        onPullCloud={() => syncFromCloud(false)}
        onResetProgress={resetProgress}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        editingCard={editingCard}
        setEditingCard={setEditingCard}
        selectedFolderForAction={selectedFolderForAction}
        setSelectedFolderForAction={setSelectedFolderForAction}
        selectedDeckForAction={selectedDeckForAction}
        setSelectedDeckForAction={setSelectedDeckForAction}
        onSaveFolder={({ name, icon }) => {
          handleCreateFolder({ name, icon, parentId: currentFolderId });
          setEditorMode(null);
        }}
        onEditFolder={(folderId, data) => {
          handleEditFolder(folderId, data);
          setEditorMode(null);
          setSelectedFolderForAction(null);
        }}
        onMoveFolder={(folderId, targetParentId) => {
          handleMoveFolder(folderId, targetParentId);
          setEditorMode(null);
          setSelectedFolderForAction(null);
        }}
        onEditDeck={({ id, name, note }, openEditMode) => {
          if (openEditMode) {
            const deck = appData.decks.find((d) => d.id === id);
            if (deck) {
              setSelectedDeckForAction(deck);
              setEditorMode('edit_deck');
            }
            return;
          }
          handleEditDeck({ id, name, note });
          setEditorMode(null);
          setSelectedDeckForAction(null);
        }}
        onMoveDeck={(deckId, newFolderId) => {
          handleMoveDeck(deckId, newFolderId);
          setEditorMode(null);
          setSelectedDeckForAction(null);
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
          setEditorMode(null);
          setEditingCard(null);
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
