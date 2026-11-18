import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_DECKS, DEFAULT_FOLDERS } from './data/seedData';
import { calculateNextProgress, getCardProgress, isCardDue } from './lib/spacedRepetition';
import { DEFAULT_SUPABASE_KEY, DEFAULT_SUPABASE_URL, pullCloudData, pushCloudData } from './lib/supabase';
import DriveExplorer from './components/DriveExplorer';
import StudyView from './components/StudyView';
import ImportModal from './components/ImportModal';
import PromptModal from './components/PromptModal';
import EditorModal from './components/EditorModal';
import SettingsModal from './components/SettingsModal';

const STORAGE_KEY_CONTENT = 'minmin_flashcard_drive_v1';
const STORAGE_KEY_PROGRESS = 'minmin_flashcard_progress_v1';
const STORAGE_KEY_SESSION = 'minmin_flashcard_active_session_v1';
const STORAGE_KEY_SETTINGS = 'minmin_flashcard_settings_v1';

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

export default function App() {
  const [appData, setAppData] = useState(() => {
    const saved = safeGet(STORAGE_KEY_CONTENT, null);
    if (saved?.folders && saved?.decks) return saved;
    const initial = { folders: DEFAULT_FOLDERS, decks: DEFAULT_DECKS };
    safeSet(STORAGE_KEY_CONTENT, initial);
    return initial;
  });

  const [progressMap, setProgressMap] = useState(() => safeGet(STORAGE_KEY_PROGRESS, {}));
  const [settings, setSettings] = useState(() => {
    const saved = safeGet(STORAGE_KEY_SETTINGS, {});
    return {
      isAdmin: true,
      pin: '2309',
      ...saved,
      supabaseUrl: saved?.supabaseUrl || DEFAULT_SUPABASE_URL,
      supabaseKey: saved?.supabaseKey || DEFAULT_SUPABASE_KEY,
    };
  });

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [resumeCandidate, setResumeCandidate] = useState(() => {
    const saved = safeGet(STORAGE_KEY_SESSION, null);
    return saved?.queue && saved.currentIndex < saved.queue.length ? saved : null;
  });
  const [undoStack, setUndoStack] = useState([]);

  const [importOpen, setImportOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editorMode, setEditorMode] = useState(null);
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
      const cloud = await pullCloudData(settings.supabaseUrl, settings.supabaseKey);
      if (cloud) {
        setAppData(cloud);
        safeSet(STORAGE_KEY_CONTENT, cloud);
        // If not already in a session, resolve deep-link from fresh cloud data
        resolveHash(cloud);
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
      { cardId: card.id, prevProg, prevIndex: activeSession.currentIndex, queueLengthBefore: queue.length },
    ]);

    if (rating === 'red' && (!card.__repCount || card.__repCount < 2)) {
      const clone = { ...card, __repCount: (card.__repCount || 0) + 1 };
      queue.splice(Math.min(queue.length, activeSession.currentIndex + 4), 0, clone);
    } else if (rating === 'yellow' && !card.__repCount) {
      queue.push({ ...card, __repCount: 1 });
    }

    const nextProgressMap = { ...progressMap, [card.id]: calculateNextProgress(prevProg, rating) };
    setProgressMap(nextProgressMap);
    safeSet(STORAGE_KEY_PROGRESS, nextProgressMap);

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

    const trimmedQueue = activeSession.queue.slice(0, last.queueLengthBefore);
    const nextSession = {
      ...activeSession,
      queue: trimmedQueue,
      currentIndex: last.prevIndex,
      isFlipped: true,
      reviewedCount: Math.max(0, activeSession.reviewedCount - 1),
    };
    setActiveSession(nextSession);
    safeSet(STORAGE_KEY_SESSION, nextSession);
    showToast('Đã hoàn tác thẻ vừa chấm.');
  };

  const handleConfirmImport = ({ parsed, selectedFolderId, deckNameInput }) => {
    if (parsed.cards.length === 0) return showToast('Chưa có thẻ hợp lệ để nạp!');

    let nextFolders = appData.folders.slice();
    let targetFolderId = selectedFolderId;

    if (parsed.folderPath?.length > 0) {
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
        updatedAt: new Date().toISOString().slice(0, 10),
        cards: parsed.cards,
      });
      showToast(`Đã tạo bộ thẻ "${deckName}" (${parsed.cards.length} thẻ)!`);
    }

    setCurrentFolderId(targetFolderId);
    persistAndSyncContent({ folders: nextFolders, decks: nextDecks });
    setImportOpen(false);
  };

  return (
    <div>
      {/* Ambient Liquid Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-30 px-4 pt-3 pb-2">
        <div className="max-w-5xl mx-auto glass-panel rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveSession(null);
              setCurrentFolderId(null);
            }}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="w-9 h-9 rounded-xl glass-pill flex items-center justify-center text-sky-300 font-bold text-lg">M</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-sm sm:text-base">FlashCard MinMin</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                    settings.isAdmin
                      ? 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
                      : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                  }`}
                >
                  {settings.isAdmin ? 'Chủ sở hữu' : 'Khách (Chỉ học)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300/80">
                {settings.supabaseUrl ? 'Đã kết nối Cloud Supabase • Tiến độ lưu riêng từng máy' : 'Kho nội dung Local'}
              </p>
            </div>
          </button>

          <div className="flex-1 min-w-[200px] max-w-md relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm môn, bài học hoặc thuật ngữ..."
              className="w-full glass-input rounded-xl pl-9 pr-8 py-1.5 text-sm placeholder:text-slate-400"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPromptOpen(true)} className="glass-pill px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-sky-200 flex items-center gap-1.5">
              <span>📋</span>
              <span className="hidden sm:inline">Prompt tạo thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => (settings.isAdmin ? setImportOpen(true) : showToast('Cần quyền Chủ sở hữu để nạp thẻ mới.'))}
              className="glass-pill px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-white flex items-center gap-1.5"
            >
              <span>＋</span>
              <span>Nạp thẻ</span>
            </button>
            <button type="button" onClick={() => setSettingsOpen(true)} className="glass-pill p-2 rounded-xl text-slate-200 hover:text-white" title="Cài đặt">
              ⚙
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-3 space-y-4">
        {!activeSession && resumeCandidate && (
          <div className="glass-panel rounded-2xl p-3.5 border-l-4 border-l-sky-400 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-400/20 border border-sky-400/30 flex items-center justify-center text-sky-300">⏱</div>
              <div>
                <p className="text-xs uppercase tracking-wider text-sky-300 font-semibold">Phiên học đang dở</p>
                <p className="text-sm text-white font-medium">
                  {resumeCandidate.title} — Đang ở thẻ {resumeCandidate.currentIndex + 1} / {resumeCandidate.queue.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startStudySession({ resumeState: resumeCandidate })}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500/80 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition"
              >
                Học tiếp ngay
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY_SESSION);
                  setResumeCandidate(null);
                }}
                className="glass-pill px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white"
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
              persistAndSyncContent({
                folders: appData.folders.filter((f) => f.id !== fid && f.parentId !== fid),
                decks: appData.decks.filter((d) => d.folderId !== fid),
              });
              showToast('Đã xóa thư mục.');
            }}
            onDeleteDeck={(did) => {
              persistAndSyncContent({ ...appData, decks: appData.decks.filter((d) => d.id !== did) });
              showToast('Đã xóa bộ thẻ.');
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
            onEditCard={() => (settings.isAdmin ? setEditorMode('edit_card') : showToast('Cần mở khóa PIN để sửa thẻ.'))}
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
        mode={editorMode}
        card={activeSession ? activeSession.queue[activeSession.currentIndex] : null}
        onClose={() => setEditorMode(null)}
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
          const target = activeSession.queue[activeSession.currentIndex];
          const nextDecks = appData.decks.map((d) => ({
            ...d,
            cards: d.cards.map((c) => (c.id === target.id ? { ...c, ...updated } : c)),
          }));
          persistAndSyncContent({ ...appData, decks: nextDecks });
          const nextQueue = activeSession.queue.map((c, idx) => (idx === activeSession.currentIndex ? { ...c, ...updated } : c));
          setActiveSession({ ...activeSession, queue: nextQueue });
          setEditorMode(null);
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
          const cloud = await pullCloudData(settings.supabaseUrl, settings.supabaseKey);
          if (cloud) {
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
        onResetProgress={() => {
          setProgressMap({});
          localStorage.removeItem(STORAGE_KEY_PROGRESS);
          localStorage.removeItem(STORAGE_KEY_SESSION);
          setResumeCandidate(null);
          showToast('Đã đặt lại toàn bộ tiến độ về Chưa nhớ.');
        }}
      />

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 glass-panel rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-2xl border border-sky-400/30">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
