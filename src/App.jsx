import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Settings,
  Sparkles,
  FolderPlus,
  BookPlus,
  Play,
  X,
  TrendingUp,
  Brain,
  User,
  RotateCw,
  RefreshCw,
} from 'lucide-react';
import { DEFAULT_DECKS, DEFAULT_FOLDERS } from './data/seedData';
import { calculateNextProgress, getCardProgress, isCardDue } from './lib/spacedRepetition';
import {
  DEFAULT_SUPABASE_KEY,
  DEFAULT_SUPABASE_URL,
  normalizeCurriculumData,
  pullCloudData,
  pushCloudData,
  atomicUpsertFolder,
  atomicDeleteFolder,
  atomicUpsertDeckWithCards,
  atomicUpdateDeckMeta,
  atomicDeleteDeck,
  atomicUpdateCard,
} from './lib/supabase';
import DriveExplorer from './components/DriveExplorer';
import StudyView from './components/StudyView';
import ImportModal from './components/ImportModal';
import PromptModal from './components/PromptModal';
import EditorModal from './components/EditorModal';
import SettingsModal from './components/SettingsModal';
import AnalyticsModal from './components/AnalyticsModal';
import ThesisDocsModal from './components/ThesisDocsModal';

const STORAGE_KEY_CONTENT = 'minmin_flashcard_drive_v1';
const STORAGE_KEY_PROGRESS = 'minmin_flashcard_progress_v1';
const STORAGE_KEY_SESSION = 'minmin_flashcard_active_session_v1';
const STORAGE_KEY_SETTINGS = 'minmin_flashcard_settings_v1';
const STORAGE_KEY_ACTIVITY = 'minmin_flashcard_activity_v1';

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore quota errors
  }
}

function getAllDescendantFolderIds(rootFolderId, allFolders) {
  const ids = new Set([rootFolderId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of allFolders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        added = true;
      }
    }
  }
  return ids;
}

export default function App() {
  const [appData, setAppData] = useState(() => {
    const saved = safeGet(STORAGE_KEY_CONTENT, null);
    if (saved?.folders && saved?.decks) {
      const normalized = normalizeCurriculumData(saved);
      safeSet(STORAGE_KEY_CONTENT, normalized);
      return normalized;
    }
    const initial = { folders: DEFAULT_FOLDERS, decks: DEFAULT_DECKS };
    safeSet(STORAGE_KEY_CONTENT, initial);
    return initial;
  });

  const [progressMap, setProgressMap] = useState(() => safeGet(STORAGE_KEY_PROGRESS, {}));
  const [activityLogs, setActivityLogs] = useState(() => safeGet(STORAGE_KEY_ACTIVITY, {}));
  const [settings, setSettings] = useState(() => {
    const saved = safeGet(STORAGE_KEY_SETTINGS, {});
    return {
      studentName: saved?.studentName || 'Học viên',
      ...saved,
      supabaseUrl: saved?.supabaseUrl || DEFAULT_SUPABASE_URL,
      supabaseKey: saved?.supabaseKey || DEFAULT_SUPABASE_KEY,
    };
  });

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [resumeCandidate, setResumeCandidate] = useState(() => {
    const saved = safeGet(STORAGE_KEY_SESSION, null);
    return saved?.queue && saved.currentIndex < saved.queue.length ? saved : null;
  });
  const [undoStack, setUndoStack] = useState([]);

  // Modals
  const [importOpen, setImportOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [thesisDocsOpen, setThesisDocsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Dynamic Action Modals
  const [editorMode, setEditorMode] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [selectedFolderForAction, setSelectedFolderForAction] = useState(null);
  const [selectedDeckForAction, setSelectedDeckForAction] = useState(null);

  // Cloud Sync state
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(window.__minminToast);
    window.__minminToast = setTimeout(() => setToastMsg(''), 2800);
  }, []);

  const appDataRef = useRef(appData);
  appDataRef.current = appData;

  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;

  // Background Cloud Sync (Silent and non-destructive)
  const syncFromCloud = useCallback(
    async (isSilent = true) => {
      if (!settings.supabaseUrl || !settings.supabaseKey) return;
      if (isCloudSyncing) return;
      setIsCloudSyncing(true);
      try {
        const rawCloud = await pullCloudData(settings.supabaseUrl, settings.supabaseKey);
        if (rawCloud) {
          const cloud = normalizeCurriculumData(rawCloud);
          // Do not replace queue while user is actively learning
          setAppData(cloud);
          safeSet(STORAGE_KEY_CONTENT, cloud);
          if (!isSilent) showToast('⬇ Đã đồng bộ kho bài học mới nhất từ Cloud!');
        }
      } catch {
        // Ignore background network issues
      } finally {
        setIsCloudSyncing(false);
      }
    },
    [settings.supabaseUrl, settings.supabaseKey, isCloudSyncing, showToast]
  );

  // Auto-sync: on startup, when returning to tab, and periodic background poll
  useEffect(() => {
    syncFromCloud(true);

    const handleFocus = () => syncFromCloud(true);
    const handleVisibility = () => {
      if (!document.hidden) syncFromCloud(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      if (!activeSessionRef.current) {
        syncFromCloud(true);
      }
    }, 25000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [syncFromCloud]);

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
    const handleHashChange = () => {
      resolveHash(appDataRef.current);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [resolveHash]);

  const getFolderPath = useCallback(
    (folderId) => {
      const path = [];
      const visited = new Set();
      let curr = appData.folders.find((f) => f.id === folderId);
      while (curr && !visited.has(curr.id)) {
        visited.add(curr.id);
        path.unshift(curr);
        curr = appData.folders.find((f) => f.id === curr.parentId);
      }
      return path;
    },
    [appData.folders]
  );

  const getFolderRecursiveDeckIds = useCallback(
    (folderId) => {
      const folderIds = new Set([folderId]);
      let added = true;
      while (added) {
        added = false;
        for (const f of appData.folders) {
          if (f.parentId && folderIds.has(f.parentId) && !folderIds.has(f.id)) {
            folderIds.add(f.id);
            added = true;
          }
        }
      }
      return appData.decks.filter((d) => (folderId === null ? true : folderIds.has(d.folderId))).map((d) => d.id);
    },
    [appData]
  );

  const getCardsByDeckIds = useCallback(
    (deckIds) => {
      const set = new Set(deckIds);
      const list = [];
      for (const d of appData.decks) {
        if (set.has(d.id)) {
          for (const c of d.cards) {
            list.push({ ...c, deckId: d.id, deckName: d.name });
          }
        }
      }
      return list;
    },
    [appData.decks]
  );

  const startStudySession = ({ title, deckIds, filterMode = 'all', direction = 'front_to_back', resumeState = null }) => {
    if (resumeState) {
      setActiveSession(resumeState);
      setUndoStack([]);
      return;
    }
    const allCards = getCardsByDeckIds(deckIds);
    if (allCards.length === 0) return showToast('Chưa có thẻ nào trong mục này để học!');

    let filtered = allCards.slice();
    if (filterMode === 'due') filtered = allCards.filter((c) => isCardDue(progressMap, c.id));
    else if (filterMode === 'red_yellow') filtered = allCards.filter((c) => getCardProgress(progressMap, c.id).status !== 'green');
    else if (filterMode === 'chunk20') filtered = allCards.filter((c) => getCardProgress(progressMap, c.id).status !== 'green').slice(0, 20);

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

    // Track daily review count for Streak & Analytics (Local Timezone YYYY-MM-DD)
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

    // 1. Revert card progress in progressMap
    const nextProgressMap = { ...progressMap, [last.cardId]: last.prevProg };
    setProgressMap(nextProgressMap);
    safeSet(STORAGE_KEY_PROGRESS, nextProgressMap);

    // 2. Decrement today's activity review count (Local Timezone YYYY-MM-DD)
    const todayKey = new Date().toLocaleDateString('sv-SE');
    if (activityLogs[todayKey] && activityLogs[todayKey] > 0) {
      const nextActivity = { ...activityLogs, [todayKey]: Math.max(0, activityLogs[todayKey] - 1) };
      setActivityLogs(nextActivity);
      safeSet(STORAGE_KEY_ACTIVITY, nextActivity);
    }

    // 3. Restore exact queue snapshot before rating
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

  // ============================================================================
  // ATOMIC CRUD HANDLERS (Shared Mini Drive for 10 users)
  // ============================================================================

  const handleCreateFolder = ({ name, icon }) => {
    if (!name) return showToast('Vui lòng nhập tên thư mục!');
    const newFolder = {
      id: `fld_${Date.now()}`,
      name,
      icon: icon || '📁',
      author: settings.studentName || 'Thành viên',
      parentId: currentFolderId,
    };
    const nextFolders = [...appData.folders, newFolder];
    const nextData = { ...appData, folders: nextFolders };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);
    atomicUpsertFolder(settings.supabaseUrl, settings.supabaseKey, newFolder);
    setEditorMode(null);
    showToast(`Đã tạo thư mục "${name}"`);
  };

  const handleEditFolder = (folderId, { name, icon }) => {
    if (!name) return showToast('Vui lòng nhập tên thư mục!');
    const folder = appData.folders.find((f) => f.id === folderId);
    if (!folder) return;
    const updated = { ...folder, name, icon: icon || '📁' };
    const nextFolders = appData.folders.map((f) => (f.id === folderId ? updated : f));
    const nextData = { ...appData, folders: nextFolders };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);
    atomicUpsertFolder(settings.supabaseUrl, settings.supabaseKey, updated);
    setEditorMode(null);
    setSelectedFolderForAction(null);
    showToast(`Đã cập nhật thư mục "${name}"`);
  };

  const handleMoveFolder = (folderId, targetParentId) => {
    const folder = appData.folders.find((f) => f.id === folderId);
    if (!folder) return;
    const updated = { ...folder, parentId: targetParentId || null };
    const nextFolders = appData.folders.map((f) => (f.id === folderId ? updated : f));
    const nextData = { ...appData, folders: nextFolders };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);
    atomicUpsertFolder(settings.supabaseUrl, settings.supabaseKey, updated);
    setEditorMode(null);
    setSelectedFolderForAction(null);
    showToast(`Đã chuyển thư mục "${folder.name}"`);
  };

  const handleDeleteFolder = (folderId) => {
    const descendantFolderIds = getAllDescendantFolderIds(folderId, appData.folders);
    const affectedDeckIds = appData.decks.filter((d) => descendantFolderIds.has(d.folderId)).map((d) => d.id);
    const affectedCardIds = new Set();
    for (const d of appData.decks) {
      if (descendantFolderIds.has(d.folderId)) {
        for (const c of d.cards) affectedCardIds.add(c.id);
      }
    }

    // Atomic DELETE from Cloud
    for (const fid of descendantFolderIds) {
      atomicDeleteFolder(settings.supabaseUrl, settings.supabaseKey, fid);
    }
    for (const did of affectedDeckIds) {
      atomicDeleteDeck(settings.supabaseUrl, settings.supabaseKey, did);
    }

    const nextFolders = appData.folders.filter((f) => !descendantFolderIds.has(f.id));
    const nextDecks = appData.decks.filter((d) => !descendantFolderIds.has(d.folderId));
    const nextData = { folders: nextFolders, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);

    if (affectedCardIds.size > 0) {
      const nextProgressMap = { ...progressMap };
      let changed = false;
      for (const cid of affectedCardIds) {
        if (nextProgressMap[cid]) {
          delete nextProgressMap[cid];
          changed = true;
        }
      }
      if (changed) {
        setProgressMap(nextProgressMap);
        safeSet(STORAGE_KEY_PROGRESS, nextProgressMap);
      }
    }

    if (currentFolderId && descendantFolderIds.has(currentFolderId)) {
      const parent = appData.folders.find((f) => f.id === folderId)?.parentId || null;
      setCurrentFolderId(parent);
    }
    showToast('Đã xóa thư mục và dữ liệu liên quan.');
  };

  const handleConfirmImport = ({ parsed, selectedFolderId, deckNameInput, deckNoteInput }) => {
    if (parsed.cards.length === 0) return showToast('Chưa có thẻ hợp lệ để nạp!');

    const targetFolderId = selectedFolderId !== undefined ? selectedFolderId : currentFolderId;
    const deckName = deckNameInput || `Bài học mới ${new Date().toLocaleDateString('vi-VN')}`;
    const author = settings.studentName || 'Thành viên';
    const note = deckNoteInput !== undefined ? deckNoteInput : (parsed.note || '');

    const nextDecks = appData.decks.map((d) => ({ ...d, cards: d.cards.slice() }));
    const existing = nextDecks.find(
      (d) => (d.folderId || null) === targetFolderId && d.name.toLowerCase() === deckName.toLowerCase()
    );

    let targetDeck;
    if (existing) {
      let added = 0;
      let updated = 0;
      for (const nc of parsed.cards) {
        const match = existing.cards.find((c) => c.front.trim().toLowerCase() === nc.front.trim().toLowerCase());
        if (match) {
          Object.assign(match, { back: nc.back, hint: nc.hint || match.hint, extra: nc.extra || match.extra, type: nc.type || match.type });
          updated++;
        } else {
          existing.cards.push(nc);
          added++;
        }
      }
      if (note) existing.note = note;
      existing.author = author;
      existing.updatedAt = new Date().toLocaleDateString('sv-SE');
      targetDeck = existing;
      showToast(`Đã gộp vào "${existing.name}": thêm ${added} thẻ, cập nhật ${updated} thẻ!`);
    } else {
      targetDeck = {
        id: `deck_${Date.now()}`,
        folderId: targetFolderId,
        name: deckName,
        note,
        author,
        updatedAt: new Date().toLocaleDateString('sv-SE'),
        cards: parsed.cards,
      };
      nextDecks.push(targetDeck);
      showToast(`Đã tạo bộ thẻ "${deckName}" (${parsed.cards.length} thẻ)!`);
    }

    const nextData = { folders: appData.folders, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);

    // Atomic Cloud Sync
    atomicUpsertDeckWithCards(settings.supabaseUrl, settings.supabaseKey, targetDeck, targetDeck.cards);

    setCurrentFolderId(targetFolderId);
    setImportOpen(false);
  };

  const handleEditDeck = ({ id, name, note }, openEditMode = false) => {
    if (openEditMode) {
      const deck = appData.decks.find((d) => d.id === id);
      if (deck) {
        setSelectedDeckForAction(deck);
        setEditorMode('edit_deck');
      }
      return;
    }
    const deck = appData.decks.find((d) => d.id === id);
    if (!deck) return;
    const updated = {
      ...deck,
      name: name || deck.name,
      note: note !== undefined ? note : deck.note,
      updatedAt: new Date().toLocaleDateString('sv-SE'),
    };
    const nextDecks = appData.decks.map((d) => (d.id === id ? updated : d));
    const nextData = { ...appData, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);
    atomicUpdateDeckMeta(settings.supabaseUrl, settings.supabaseKey, id, { name: updated.name, note: updated.note });
    setEditorMode(null);
    setSelectedDeckForAction(null);
    showToast(`Đã cập nhật bài học "${updated.name}"`);
  };

  const handleMoveDeck = (deckId, newFolderId) => {
    const deck = appData.decks.find((d) => d.id === deckId);
    if (!deck) return;
    const updated = { ...deck, folderId: newFolderId || null, updatedAt: new Date().toLocaleDateString('sv-SE') };
    const nextDecks = appData.decks.map((d) => (d.id === deckId ? updated : d));
    const nextData = { ...appData, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);
    atomicUpdateDeckMeta(settings.supabaseUrl, settings.supabaseKey, deckId, { folderId: updated.folderId });
    setEditorMode(null);
    setSelectedDeckForAction(null);
    showToast(`Đã chuyển bài "${deck.name}" sang thư mục mới`);
  };

  const handleDeleteDeck = (deckId) => {
    const deck = appData.decks.find((d) => d.id === deckId);
    const cardIds = (deck?.cards || []).map((c) => c.id);

    // Atomic Cloud Delete
    atomicDeleteDeck(settings.supabaseUrl, settings.supabaseKey, deckId);

    const nextDecks = appData.decks.filter((d) => d.id !== deckId);
    const nextData = { ...appData, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);

    if (cardIds.length > 0) {
      const nextProgressMap = { ...progressMap };
      let changed = false;
      for (const cid of cardIds) {
        if (nextProgressMap[cid]) {
          delete nextProgressMap[cid];
          changed = true;
        }
      }
      if (changed) {
        setProgressMap(nextProgressMap);
        safeSet(STORAGE_KEY_PROGRESS, nextProgressMap);
      }
    }
    showToast('Đã xóa bộ bài học.');
  };

  const handleSaveCard = (updated) => {
    const target = editingCard || activeSession?.queue[activeSession.currentIndex];
    if (!target) return;
    const updatedCard = { ...target, ...updated };

    const nextDecks = appData.decks.map((d) => ({
      ...d,
      cards: d.cards.map((c) => (c.id === target.id ? updatedCard : c)),
    }));
    const nextData = { ...appData, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);

    // Atomic Card Update
    atomicUpdateCard(settings.supabaseUrl, settings.supabaseKey, updatedCard);

    if (activeSession) {
      const nextQueue = activeSession.queue.map((c) => (c.id === target.id ? updatedCard : c));
      const nextSession = { ...activeSession, queue: nextQueue };
      setActiveSession(nextSession);
      safeSet(STORAGE_KEY_SESSION, nextSession);
    }

    setEditorMode(null);
    setEditingCard(null);
    showToast('Đã cập nhật nội dung thẻ!');
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
        <header className={`sticky top-0 px-3 sm:px-4 pt-2.5 pb-2 transition-all ${plusMenuOpen ? 'z-50' : 'z-30'}`}>
          <div className="max-w-5xl mx-auto glass-panel rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-sm">
            {/* Logo & App Title */}
            <button
              type="button"
              onClick={() => {
                setActiveSession(null);
                setCurrentFolderId(null);
              }}
              className="flex items-center gap-2 text-left"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                M
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-800 text-sm sm:text-base">FlashCard MinMin</span>
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    isCloudSyncing
                      ? 'bg-amber-400 animate-pulse'
                      : settings.supabaseUrl
                        ? 'bg-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-slate-300'
                  }`}
                  title={isCloudSyncing ? 'Đang đồng bộ Cloud...' : 'Đám mây Mini Drive kết nối'}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen(true);
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-semibold border border-sky-200/80 transition"
                  title="Bấm để đổi tên thành viên"
                >
                  <User className="w-3 h-3 text-sky-600" />
                  <span className="truncate max-w-[85px]">{settings.studentName || 'Học viên'}</span>
                </button>
              </div>
            </button>

            {/* Right Actions: Analytics + Docs + Search + Plus/Prompt AI + Settings */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setAnalyticsOpen(true)}
                className="glass-pill w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
                title="Thống kê học tập & Streak"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => setThesisDocsOpen(true)}
                className="glass-pill w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
                title="Hướng dẫn sử dụng & Cơ chế Spaced Repetition"
              >
                <Brain className="w-4 h-4 text-indigo-600" />
              </button>

              <button
                type="button"
                onClick={() => setShowSearch((v) => !v)}
                className={`glass-pill w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition ${
                  showSearch || searchQuery ? 'bg-sky-100/90 text-sky-700 border-sky-300' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tìm kiếm"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Full "+ Thêm" menu available to ALL 10 members */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPlusMenuOpen((v) => !v)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs sm:text-sm flex items-center gap-1 shadow-sm transition active:scale-95"
                  title="Thêm mới bài học / thư mục"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Thêm</span>
                </button>

                {plusMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setPlusMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl p-1.5 z-50 shadow-2xl space-y-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setPlusMenuOpen(false);
                          setImportOpen(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                      >
                        <BookPlus className="w-4 h-4 text-sky-600" />
                        <span>Nạp bộ bài học mới</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPlusMenuOpen(false);
                          setEditorMode('new_folder');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                      >
                        <FolderPlus className="w-4 h-4 text-emerald-600" />
                        <span>Tạo thư mục mới</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPlusMenuOpen(false);
                          setPromptOpen(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Prompt tạo thẻ AI</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="glass-pill w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
                title="Cài đặt & Đồng bộ Cloud"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Search Input */}
          {showSearch && (
            <div className="max-w-5xl mx-auto mt-2 animate-fadeIn">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo câu hỏi, đáp án, hoặc tên bài học..."
                  className="w-full glass-input rounded-2xl pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-800 shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4">
        {/* Resume Banner */}
        {!activeSession && resumeCandidate && (
          <div className="glass-panel rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-sm border-l-4 border-l-sky-500">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                Đang học dở: {resumeCandidate.title}
              </p>
              <p className="text-[11px] text-slate-500">
                Đã học {resumeCandidate.currentIndex} / {resumeCandidate.queue.length} thẻ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY_SESSION);
                  setResumeCandidate(null);
                }}
                className="glass-pill px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800"
              >
                Bỏ qua
              </button>
              <button
                type="button"
                onClick={() => startStudySession({ resumeState: resumeCandidate })}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tiếp tục học</span>
              </button>
            </div>
          </div>
        )}

        {/* View Mode: DriveExplorer vs StudyView */}
        {!activeSession ? (
          <DriveExplorer
            appData={appData}
            progressMap={progressMap}
            currentFolderId={currentFolderId}
            setCurrentFolderId={setCurrentFolderId}
            searchQuery={searchQuery}
            onStartStudy={startStudySession}
            onNewFolder={() => setEditorMode('new_folder')}
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
            onViewNote={(d) => {
              setSelectedDeckForAction(d);
              setEditorMode('view_note');
            }}
            onDeleteFolder={handleDeleteFolder}
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
            onChangeDirection={(direction) => setActiveSession({ ...activeSession, direction, isFlipped: false })}
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

      {/* Modals */}
      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        folders={appData.folders}
        currentFolderId={currentFolderId}
        getFolderPath={getFolderPath}
        onConfirmImport={handleConfirmImport}
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
        onSaveFolder={handleCreateFolder}
        onEditFolder={handleEditFolder}
        onMoveFolder={handleMoveFolder}
        onEditDeck={handleEditDeck}
        onMoveDeck={handleMoveDeck}
        onSaveCard={handleSaveCard}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        showToast={showToast}
        onUpdateSettings={(patch) => {
          const next = { ...settings, ...patch };
          setSettings(next);
          safeSet(STORAGE_KEY_SETTINGS, next);
        }}
        onPullCloud={() => syncFromCloud(false)}
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
                setSettings(next);
                safeSet(STORAGE_KEY_SETTINGS, next);
              }
              showToast(`Đã đồng bộ tiến độ học của "${parsed.studentName || 'Học viên'}"!`);
            } catch {
              showToast('File tiến độ không đúng định dạng JSON.');
            }
          };
          reader.readAsText(file, 'utf-8');
        }}
        onResetProgress={() => {
          setProgressMap({});
          localStorage.removeItem(STORAGE_KEY_PROGRESS);
          localStorage.removeItem(STORAGE_KEY_SESSION);
          setResumeCandidate(null);
          showToast('Đã đặt lại toàn bộ tiến độ về Chưa học.');
        }}
      />

      <AnalyticsModal
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        appData={appData}
        progressMap={progressMap}
        activityLogs={activityLogs}
        getFolderRecursiveDeckIds={getFolderRecursiveDeckIds}
        getCardsByDeckIds={getCardsByDeckIds}
        onStartStudy={startStudySession}
      />

      <ThesisDocsModal isOpen={thesisDocsOpen} onClose={() => setThesisDocsOpen(false)} />

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/90 text-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium shadow-2xl border border-white/20 backdrop-blur-md max-w-[90vw] sm:max-w-md line-clamp-2 break-words">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
