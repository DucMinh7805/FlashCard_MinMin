import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Plus, Settings, Sparkles, FolderPlus, BookPlus, Play, X, TrendingUp, Brain } from 'lucide-react';
import { DEFAULT_DECKS, DEFAULT_FOLDERS } from './data/seedData';
import { calculateNextProgress, getCardProgress, isCardDue } from './lib/spacedRepetition';
import { DEFAULT_SUPABASE_KEY, DEFAULT_SUPABASE_URL, normalizeCurriculumData, pullCloudData, pushCloudData } from './lib/supabase';
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
      isAdmin: false, // Default to Guest/Student mode for safety on public & shared devices
      pin: '2309',
      studentName: 'Học viên',
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

  const [importOpen, setImportOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [thesisDocsOpen, setThesisDocsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(window.__minminToast);
    window.__minminToast = setTimeout(() => setToastMsg(''), 2800);
  }, []);

  const persistAndSyncContent = useCallback(
    (nextData) => {
      setAppData(nextData);
      safeSet(STORAGE_KEY_CONTENT, nextData);
      if (settings.isAdmin && settings.supabaseUrl && settings.supabaseKey) {
        pushCloudData(settings.supabaseUrl, settings.supabaseKey, nextData);
      }
    },
    [settings]
  );

  const appDataRef = useRef(appData);
  appDataRef.current = appData;

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

  // Auto-sync on mount & handle deep-link hash
  useEffect(() => {
    // 1. Resolve deep-link immediately with local cached data
    resolveHash(appData);

    // 2. Fetch latest data from Cloud and re-check deep link
    (async () => {
      if (!settings.supabaseUrl || !settings.supabaseKey) return;
      const rawCloud = await pullCloudData(settings.supabaseUrl, settings.supabaseKey);
      if (rawCloud) {
        const cloud = normalizeCurriculumData(rawCloud);
        setAppData(cloud);
        safeSet(STORAGE_KEY_CONTENT, cloud);
        // If not already in a session, resolve deep-link from fresh cloud data
        resolveHash(cloud);
        // If Cloud still had the old hierarchy, auto-push the normalized version to Cloud immediately
        if (settings.isAdmin && rawCloud.folders?.some((f) => f.id === 'fld_ykhoa')) {
          pushCloudData(settings.supabaseUrl, settings.supabaseKey, cloud);
        }
      } else if (settings.isAdmin) {
        await pushCloudData(settings.supabaseUrl, settings.supabaseKey, appData);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to hash changes while running
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

    const nextSession = {
      title,
      deckIds,
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

    // 3. Restore exact queue snapshot before rating (removes any spliced clones of Red/Yellow cards)
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

  const handleConfirmImport = ({ parsed, selectedFolderId, deckNameInput }) => {
    if (parsed.cards.length === 0) return showToast('Chưa có thẻ hợp lệ để nạp!');

    let nextFolders = appData.folders.slice();
    let targetFolderId = selectedFolderId;

    // Only auto-resolve folderPath from JSON if user hasn't explicitly selected a specific folder
    if (!selectedFolderId && parsed.folderPath?.length > 0) {
      let parentId = null;
      for (const rawName of parsed.folderPath) {
        const name = String(rawName || '').trim();
        if (!name) continue;
        let found = nextFolders.find((f) => (f.parentId || null) === parentId && f.name.toLowerCase() === name.toLowerCase());
        if (!found) {
          found = { id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name, icon: '📁', parentId };
          nextFolders.push(found);
        }
        parentId = found.id;
      }
      targetFolderId = parentId;
    }

    const deckName = deckNameInput || `Bài học mới ${new Date().toLocaleDateString('vi-VN')}`;
    const nextDecks = appData.decks.map((d) => ({ ...d, cards: d.cards.slice() }));
    const existing = nextDecks.find((d) => (d.folderId || null) === targetFolderId && d.name.toLowerCase() === deckName.toLowerCase());

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
      showToast(`Đã gộp vào "${existing.name}": thêm ${added} thẻ mới, cập nhật ${updated} thẻ!`);
    } else {
      nextDecks.push({
        id: `deck_${Date.now()}`,
        folderId: targetFolderId,
        name: deckName,
        updatedAt: new Date().toLocaleDateString('sv-SE'),
        cards: parsed.cards,
      });
      showToast(`Đã tạo bộ thẻ "${deckName}" (${parsed.cards.length} thẻ)!`);
    }

    setCurrentFolderId(targetFolderId);
    persistAndSyncContent({ folders: nextFolders, decks: nextDecks });
    setImportOpen(false);
  };

  return (
    <div className="min-h-screen text-slate-800">
      {/* Ambient Liquid Blobs - Light Version */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      {/* Top Navigation - Streamlined 1-row header, hidden during Study Session */}
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
                    settings.supabaseUrl ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'
                  }`}
                  title={settings.supabaseUrl ? 'Cloud Supabase đã kết nối' : 'Kho dữ liệu Local'}
                />
                {settings.isAdmin ? (
                  <span className="hidden sm:inline px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Admin
                  </span>
                ) : (
                  <span className="hidden sm:inline px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium truncate max-w-[80px]">
                    {settings.studentName || 'Học viên'}
                  </span>
                )}
              </div>
            </button>

            {/* Right Actions: Analytics + Thesis Docs + Search + Plus/Prompt AI + Settings */}
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
                title="Kiến trúc Đồ án & Thuật toán Spaced Repetition"
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

              {/* If Admin: show full "+ Thêm" menu. If Student: hide + Thêm, show direct Prompt AI */}
              {settings.isAdmin ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPlusMenuOpen((v) => !v)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs sm:text-sm flex items-center gap-1 shadow-sm transition active:scale-95"
                    title="Thêm mới"
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
              ) : (
                <button
                  type="button"
                  onClick={() => setPromptOpen(true)}
                  className="glass-pill px-2.5 py-1.5 rounded-xl text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 flex items-center gap-1 transition"
                  title="Prompt tạo thẻ AI chuẩn"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Prompt AI</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="glass-pill w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center transition"
                title="Cài đặt"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expandable Search Input */}
          {(showSearch || searchQuery) && (
            <div className="max-w-5xl mx-auto mt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm môn, bài học hoặc nội dung thẻ..."
                  className="w-full glass-input rounded-xl pl-9 pr-8 py-2 text-sm placeholder:text-slate-400 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearch(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </header>
      )}

      <main className="max-w-5xl mx-auto px-3 sm:px-4 pt-2 pb-6 space-y-4">
        {!activeSession && resumeCandidate && (
          <div className="glass-panel rounded-2xl p-3 border-l-4 border-l-sky-500 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-sky-600 font-semibold">Phiên học đang dở</p>
                <p className="text-sm text-slate-800 font-medium">
                  {resumeCandidate.title} — Còn {Math.max(1, resumeCandidate.queue.length - resumeCandidate.currentIndex)} lượt thẻ trong phiên (Đã học {resumeCandidate.reviewedCount || resumeCandidate.currentIndex} lượt)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startStudySession({ resumeState: resumeCandidate })}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition shadow-sm"
              >
                Học tiếp ngay
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY_SESSION);
                  setResumeCandidate(null);
                }}
                className="glass-pill px-2.5 py-1.5 rounded-xl text-xs text-slate-600 hover:text-slate-900"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        )}

        {!activeSession ? (
          <DriveExplorer
            appData={appData}
            progressMap={progressMap}
            currentFolderId={currentFolderId}
            setCurrentFolderId={setCurrentFolderId}
            isAdmin={settings.isAdmin}
            searchQuery={searchQuery}
            onStartStudy={startStudySession}
            onNewFolder={() => (settings.isAdmin ? setEditorMode('new_folder') : showToast('Cần mở khóa PIN Chủ sở hữu.'))}
            onNewDeck={() => (settings.isAdmin ? setImportOpen(true) : showToast('Cần mở khóa PIN Chủ sở hữu.'))}
            onDeleteFolder={(fid) => {
              const descendantIds = getAllDescendantFolderIds(fid, appData.folders);
              const decksToDelete = appData.decks.filter((d) => descendantIds.has(d.folderId));
              const cardIdsToDelete = new Set(decksToDelete.flatMap((d) => (d.cards || []).map((c) => c.id)));

              // Clean orphaned progress in progressMap
              let nextProgressMap = { ...progressMap };
              let cleanedAny = false;
              for (const cid of cardIdsToDelete) {
                if (nextProgressMap[cid]) {
                  delete nextProgressMap[cid];
                  cleanedAny = true;
                }
              }
              if (cleanedAny) {
                setProgressMap(nextProgressMap);
                safeSet(STORAGE_KEY_PROGRESS, nextProgressMap);
              }

              // Reset current folder if inside deleted tree
              if (descendantIds.has(currentFolderId)) {
                setCurrentFolderId(null);
              }

              // Clear active session / resume candidate if affected
              const deletedDeckIds = new Set(decksToDelete.map((d) => d.id));
              if (resumeCandidate?.deckIds?.some((id) => deletedDeckIds.has(id))) {
                localStorage.removeItem(STORAGE_KEY_SESSION);
                setResumeCandidate(null);
              }

              const nextFolders = appData.folders.filter((f) => !descendantIds.has(f.id));
              const nextDecks = appData.decks.filter((d) => !descendantIds.has(d.folderId));
              persistAndSyncContent({ folders: nextFolders, decks: nextDecks });
              showToast(`Đã xóa thư mục cùng ${decksToDelete.length} bài học liên quan.`);
            }}
            onDeleteDeck={(did) => {
              const targetDeck = appData.decks.find((d) => d.id === did);
              const cardIdsToDelete = new Set((targetDeck?.cards || []).map((c) => c.id));

              // Clean orphaned progress in progressMap
              let nextProgressMap = { ...progressMap };
              let cleanedAny = false;
              for (const cid of cardIdsToDelete) {
                if (nextProgressMap[cid]) {
                  delete nextProgressMap[cid];
                  cleanedAny = true;
                }
              }
              if (cleanedAny) {
                setProgressMap(nextProgressMap);
                safeSet(STORAGE_KEY_PROGRESS, nextProgressMap);
              }

              if (resumeCandidate?.deckIds?.includes(did)) {
                localStorage.removeItem(STORAGE_KEY_SESSION);
                setResumeCandidate(null);
              }

              const nextDecks = appData.decks.filter((d) => d.id !== did);
              persistAndSyncContent({ ...appData, decks: nextDecks });
              showToast(`Đã xóa bộ thẻ "${targetDeck?.name || ''}".`);
            }}
            onShareLink={(hash, msg) => {
              navigator.clipboard?.writeText(window.location.origin + window.location.pathname + hash).catch(() => {});
              showToast(msg);
            }}
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
                const nextHash = currentFolderId ? `#folder=${encodeURIComponent(currentFolderId)}` : '';
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
              startStudySession({ title: activeSession.title, deckIds: activeSession.deckIds, filterMode, direction: activeSession.direction })
            }
            onChangeDirection={(direction) => setActiveSession({ ...activeSession, direction, isFlipped: false })}
            onEditCard={(targetCard) => {
              if (settings.isAdmin) {
                const cardToEdit = targetCard || (activeSession ? activeSession.queue[activeSession.currentIndex] : null);
                setEditingCard(cardToEdit);
                setEditorMode('edit_card');
              } else {
                showToast('Cần mở khóa PIN để sửa thẻ.');
              }
            }}
            onRestartSession={(filterMode) =>
              startStudySession({ title: activeSession.title, deckIds: activeSession.deckIds, filterMode, direction: activeSession.direction })
            }
          />
        )}
      </main>

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        folders={appData.folders}
        currentFolderId={currentFolderId}
        getFolderPath={getFolderPath}
        onConfirmImport={handleConfirmImport}
      />

      <PromptModal isOpen={promptOpen} onClose={() => setPromptOpen(false)} onCopySuccess={() => showToast('Đã sao chép Prompt chuẩn!')} />

      <EditorModal
        key={editorMode ? `${editorMode}_${editingCard?.id || (activeSession ? activeSession.queue[activeSession.currentIndex]?.id : 'none')}` : 'closed'}
        mode={editorMode}
        card={editingCard || (activeSession ? activeSession.queue[activeSession.currentIndex] : null)}
        onClose={() => {
          setEditorMode(null);
          setEditingCard(null);
        }}
        onSaveFolder={({ name, icon }) => {
          if (!name) return showToast('Vui lòng nhập tên thư mục!');
          persistAndSyncContent({
            ...appData,
            folders: [...appData.folders, { id: `fld_${Date.now()}`, name, icon, parentId: currentFolderId }],
          });
          setEditorMode(null);
          showToast(`Đã tạo thư mục "${name}"`);
        }}
        onSaveCard={(updated) => {
          const target = editingCard || activeSession.queue[activeSession.currentIndex];
          const nextDecks = appData.decks.map((d) => ({
            ...d,
            cards: d.cards.map((c) => (c.id === target.id ? { ...c, ...updated } : c)),
          }));
          persistAndSyncContent({ ...appData, decks: nextDecks });
          // Update ALL instances of this card in queue (including any repetition clones)
          const nextQueue = activeSession.queue.map((c) =>
            c.id === target.id ? { ...c, ...updated } : c
          );
          const nextSession = { ...activeSession, queue: nextQueue };
          setActiveSession(nextSession);
          safeSet(STORAGE_KEY_SESSION, nextSession);
          setEditorMode(null);
          setEditingCard(null);
          showToast('Đã cập nhật nội dung thẻ!');
        }}
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
        onPushCloud={async () => {
          const res = await pushCloudData(settings.supabaseUrl, settings.supabaseKey, appData);
          showToast(res.ok ? '☁ Đã đẩy toàn bộ cây thư mục & thẻ lên Cloud!' : 'Lỗi đồng bộ lên Supabase.');
        }}
        onPullCloud={async () => {
          const rawCloud = await pullCloudData(settings.supabaseUrl, settings.supabaseKey);
          if (rawCloud) {
            const cloud = normalizeCurriculumData(rawCloud);
            setAppData(cloud);
            safeSet(STORAGE_KEY_CONTENT, cloud);
            showToast('⬇ Đã đồng bộ kho thẻ mới nhất từ Cloud!');
          } else {
            showToast('Chưa có dữ liệu trên Cloud.');
          }
        }}
        onExportBackup={() => {
          const blob = new Blob([JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), appData, progressMap }, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `FlashCard_MinMin_Backup_${new Date().toISOString().slice(0, 10)}.json`;
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
              if (parsed.appData?.folders) persistAndSyncContent(parsed.appData);
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
          a.download = `MinMin_TienDoHoc_${(settings.studentName || 'HocVien').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
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
          showToast('Đã đặt lại toàn bộ tiến độ về Chưa nhớ.');
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

      <ThesisDocsModal
        isOpen={thesisDocsOpen}
        onClose={() => setThesisDocsOpen(false)}
      />

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/90 text-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium shadow-2xl border border-white/20 backdrop-blur-md max-w-[90vw] sm:max-w-md line-clamp-2 break-words">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
