import { useState, useCallback, useEffect, useRef } from 'react';
import {
  STORAGE_KEY_SESSION,
  STORAGE_KEY_PROGRESS,
  STORAGE_KEY_ACTIVITY,
  safeGet,
  safeSet,
} from './useMiniDrive';
import {
  calculateNextProgress,
  getCardProgress,
  isCardDue,
} from '../lib/spacedRepetition';

export function useStudySession({
  appData,
  progressMap,
  setProgressMap,
  activityLogs,
  setActivityLogs,
  getCardsByDeckIds,
  showToast,
  currentFolderIdRef,
  setCurrentFolderId,
}) {
  const [activeSession, setActiveSession] = useState(null);
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  const [resumeCandidate, setResumeCandidate] = useState(() => {
    const saved = safeGet(STORAGE_KEY_SESSION, null);
    return saved?.queue && saved.currentIndex < saved.queue.length ? saved : null;
  });
  const [undoStack, setUndoStack] = useState([]);

  // Study Session Exit: updates UI state and URL hash without calling history.back()
  const handleExitStudy = useCallback(() => {
    setActiveSession(null);
    const folderId = currentFolderIdRef.current;
    const nextHash = folderId ? `#folder=${encodeURIComponent(folderId)}` : '';
    window.history.replaceState(null, '', window.location.pathname + nextHash);
  }, [currentFolderIdRef]);

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
    [setCurrentFolderId, showToast]
  );

  const startStudySession = useCallback(
    ({
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
        filtered = allCards
          .filter((c) => getCardProgress(progressMap, c.id).status !== 'green')
          .slice(0, 20);
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
    },
    [appData.decks, currentFolderIdRef, getCardsByDeckIds, progressMap, showToast]
  );

  const handleRate = useCallback(
    (rating) => {
      if (!activeSession || activeSession.currentIndex >= activeSession.queue.length) return;
      const queue = activeSession.queue.slice();
      const card = queue[activeSession.currentIndex];
      const prevProg = { ...getCardProgress(progressMap, card.id) };

      setUndoStack((prev) =>
        [
          ...prev,
          {
            cardId: card.id,
            prevProg,
            prevIndex: activeSession.currentIndex,
            prevQueue: activeSession.queue.slice(),
            prevReviewedCount: activeSession.reviewedCount,
          },
        ].slice(-15)
      );

      if (rating === 'red' && (!card.__repCount || card.__repCount < 2)) {
        const clone = { ...card, __repCount: (card.__repCount || 0) + 1 };
        queue.splice(Math.min(queue.length, activeSession.currentIndex + 4), 0, clone);
      } else if (rating === 'yellow' && !card.__repCount) {
        queue.push({ ...card, __repCount: 1 });
      }

      const nextProgressMap = {
        ...progressMap,
        [card.id]: calculateNextProgress(prevProg, rating),
      };
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
    },
    [activeSession, activityLogs, progressMap, setActivityLogs, setProgressMap]
  );

  const handleUndo = useCallback(() => {
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
  }, [activeSession, activityLogs, progressMap, setActivityLogs, setProgressMap, showToast, undoStack]);

  const handleShuffle = useCallback(() => {
    if (!activeSession) return;
    const rem = activeSession.queue.slice(activeSession.currentIndex);
    for (let i = rem.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rem[i], rem[j]] = [rem[j], rem[i]];
    }
    const q = [...activeSession.queue.slice(0, activeSession.currentIndex), ...rem];
    setActiveSession({ ...activeSession, queue: q, isFlipped: false });
    showToast('Đã trộn ngẫu nhiên các thẻ còn lại!');
  }, [activeSession, showToast]);

  const handleChangeFilter = useCallback(
    (filterMode) => {
      if (!activeSession) return;
      startStudySession({
        title: activeSession.title,
        deckIds: activeSession.deckIds,
        filterMode,
        direction: activeSession.direction,
      });
    },
    [activeSession, startStudySession]
  );

  const handleChangeDirection = useCallback(
    (direction) => {
      if (!activeSession) return;
      setActiveSession((prev) => ({ ...prev, direction, isFlipped: false }));
    },
    [activeSession]
  );

  const handleRestartSession = useCallback(
    (filterMode) => {
      if (!activeSession) return;
      startStudySession({
        title: activeSession.title,
        deckIds: activeSession.deckIds,
        filterMode,
        direction: activeSession.direction,
      });
    },
    [activeSession, startStudySession]
  );

  const handleToggleHint = useCallback(() => {
    if (!activeSession) return;
    setActiveSession((prev) => ({ ...prev, hintVisible: !prev.hintVisible }));
  }, [activeSession]);

  const handleFlip = useCallback(() => {
    if (!activeSession) return;
    setActiveSession((prev) => ({ ...prev, isFlipped: !prev.isFlipped }));
  }, [activeSession]);

  // Keyboard Shortcuts for Study Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeSessionRef.current) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const current = activeSessionRef.current;
      if (!current || current.currentIndex >= current.queue.length) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === '1') {
        e.preventDefault();
        handleRate('red');
      } else if (e.key === '2') {
        e.preventDefault();
        handleRate('yellow');
      } else if (e.key === '3') {
        e.preventDefault();
        handleRate('green');
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleToggleHint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleRate, handleUndo, handleToggleHint]);

  return {
    activeSession,
    setActiveSession,
    activeSessionRef,
    resumeCandidate,
    setResumeCandidate,
    undoStack,
    setUndoStack,
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
  };
}
