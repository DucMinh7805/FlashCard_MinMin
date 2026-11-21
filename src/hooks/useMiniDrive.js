import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_DECKS, DEFAULT_FOLDERS } from '../data/seedData';
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
} from '../lib/supabase';
import {
  STORAGE_KEY_CONTENT,
  STORAGE_KEY_PROGRESS,
  STORAGE_KEY_SESSION,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_ACTIVITY,
  getDeviceId,
  getActivityStorageKey,
  safeGet,
  safeSet,
  getAllDescendantFolderIds,
} from '../lib/storage';

export {
  STORAGE_KEY_CONTENT,
  STORAGE_KEY_PROGRESS,
  STORAGE_KEY_SESSION,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_ACTIVITY,
  getDeviceId,
  getActivityStorageKey,
  safeGet,
  safeSet,
  getAllDescendantFolderIds,
};

export function useMiniDrive({ showToast, hasActiveSession }) {
  const [appData, setAppData] = useState(() => {
    const saved = safeGet(STORAGE_KEY_CONTENT, null);
    const totalCards = (saved?.decks || []).reduce((sum, d) => sum + (d.cards?.length || 0), 0);
    if (!saved?.folders?.length || !saved?.decks?.length || totalCards === 0) {
      const initial = { folders: DEFAULT_FOLDERS, decks: DEFAULT_DECKS };
      safeSet(STORAGE_KEY_CONTENT, initial);
      return initial;
    }
    const normalized = normalizeCurriculumData(saved);
    safeSet(STORAGE_KEY_CONTENT, normalized);
    return normalized;
  });

  const [progressMap, setProgressMap] = useState(() => safeGet(STORAGE_KEY_PROGRESS, {}));
  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = safeGet(STORAGE_KEY_ACTIVITY, null);
    if (saved) return saved;
    const legacy = safeGet('minmin_flashcard_activity_v1', {});
    if (legacy && Object.keys(legacy).length > 0) {
      safeSet(STORAGE_KEY_ACTIVITY, legacy);
      return legacy;
    }
    return {};
  });
  const [settings, setSettings] = useState(() => {
    const saved = safeGet(STORAGE_KEY_SETTINGS, {});
    return {
      studentName: saved?.studentName || 'Học viên',
      ...saved,
      supabaseUrl: saved?.supabaseUrl || DEFAULT_SUPABASE_URL,
      supabaseKey: saved?.supabaseKey || DEFAULT_SUPABASE_KEY,
    };
  });

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  // Background Cloud Sync (Silent and non-destructive)
  const syncFromCloud = useCallback(
    async (isSilent = true) => {
      if (!settings.supabaseUrl || !settings.supabaseKey) return;
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setIsCloudSyncing(true);
      try {
        const rawCloud = await pullCloudData(settings.supabaseUrl, settings.supabaseKey);
        const cloudCards = (rawCloud?.decks || []).reduce((sum, d) => sum + (d.cards?.length || 0), 0);
        if (rawCloud && (rawCloud.folders?.length > 0 || rawCloud.decks?.length > 0)) {
          if (cloudCards === 0) {
            // Cloud has empty decks/cards - auto re-seed cloud with default curriculum
            const initial = { folders: DEFAULT_FOLDERS, decks: DEFAULT_DECKS };
            setAppData(initial);
            safeSet(STORAGE_KEY_CONTENT, initial);
            pushCloudData(settings.supabaseUrl, settings.supabaseKey, initial);
            for (const f of DEFAULT_FOLDERS) {
              atomicUpsertFolder(settings.supabaseUrl, settings.supabaseKey, f);
            }
            for (const d of DEFAULT_DECKS) {
              atomicUpsertDeckWithCards(settings.supabaseUrl, settings.supabaseKey, d, d.cards);
            }
          } else {
            const cloud = normalizeCurriculumData(rawCloud);
            setAppData(cloud);
            safeSet(STORAGE_KEY_CONTENT, cloud);
            if (!isSilent) showToast('⬇ Đã đồng bộ kho bài học mới nhất từ Cloud!');
          }
        }
      } catch {
        // Ignore background network issues
      } finally {
        isSyncingRef.current = false;
        setIsCloudSyncing(false);
      }
    },
    [settings.supabaseUrl, settings.supabaseKey, showToast]
  );

  // Auto-sync: on startup, when returning to tab, and periodic background poll
  useEffect(() => {
    syncFromCloud(true);
    const handleFocus = () => syncFromCloud(true);
    const handleVisibility = () => { if (!document.hidden) syncFromCloud(true); };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(() => { if (!hasActiveSession) syncFromCloud(true); }, 25000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [syncFromCloud, hasActiveSession]);

  // Folder & Deck Helpers
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

  // Atomic CRUD Handlers (Shared Mini Drive for ~10 users)
  const handleCreateFolder = ({ name, icon, parentId }) => {
    if (!name) return showToast('Vui lòng nhập tên thư mục!');
    const newFolder = {
      id: `fld_${Date.now()}`,
      name,
      icon: icon || '📁',
      author: settings.studentName || 'Thành viên',
      parentId: parentId ?? null,
    };
    const nextFolders = [...appData.folders, newFolder];
    const nextData = { ...appData, folders: nextFolders };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);
    atomicUpsertFolder(settings.supabaseUrl, settings.supabaseKey, newFolder);
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
    showToast(`Đã chuyển thư mục "${folder.name}"`);
  };

  const handleDeleteFolder = (folderId, currentFolderId, setCurrentFolderId) => {
    const descendantFolderIds = getAllDescendantFolderIds(folderId, appData.folders);
    const affectedDeckIds = appData.decks.filter((d) => descendantFolderIds.has(d.folderId)).map((d) => d.id);
    const affectedCardIds = new Set();
    for (const d of appData.decks) {
      if (descendantFolderIds.has(d.folderId)) {
        for (const c of d.cards) affectedCardIds.add(c.id);
      }
    }

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

  const handleConfirmImport = ({
    parsed,
    batchDecks,
    selectedFolderId,
    deckNameInput,
    deckNoteInput,
    currentFolderId,
    onComplete,
    author: authorInput,
  }) => {
    const targetFolderId = selectedFolderId !== undefined ? selectedFolderId : currentFolderId;
    const author = (authorInput && authorInput.trim()) || settings.studentName || 'Thành viên';
    const nowIso = new Date().toISOString();
    const dateTitle = new Date().toLocaleDateString('vi-VN');

    // Luồng Nạp hàng loạt (Batch Multi-File Import)
    if (Array.isArray(batchDecks) && batchDecks.length > 0) {
      const validDecks = batchDecks.filter((d) => d && d.isValid && Array.isArray(d.cards) && d.cards.length > 0);
      if (validDecks.length === 0) return showToast('Chưa có bài học hợp lệ nào để nạp!');

      const nextDecks = appData.decks.map((d) => ({ ...d, cards: d.cards.slice() }));
      let totalCardsCount = 0;
      let newDecksCount = 0;
      let mergedDecksCount = 0;
      const decksToUpsert = [];

      for (const item of validDecks) {
        const deckName = (item.deckName || '').trim() || `Bài học ${dateTitle}`;
        const note = (item.note || '').trim();

        const existing = nextDecks.find(
          (d) => (d.folderId || null) === targetFolderId && d.name.toLowerCase() === deckName.toLowerCase()
        );

        let targetDeck;
        if (existing) {
          for (const nc of item.cards) {
            const match = existing.cards.find((c) => c.front.trim().toLowerCase() === nc.front.trim().toLowerCase());
            if (match) {
              Object.assign(match, { back: nc.back, hint: nc.hint || match.hint, extra: nc.extra || match.extra, type: nc.type || match.type });
            } else {
              existing.cards.push(nc);
            }
          }
          if (note) existing.note = note;
          existing.author = author;
          existing.updatedAt = nowIso;
          targetDeck = existing;
          mergedDecksCount++;
        } else {
          targetDeck = {
            id: `deck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            folderId: targetFolderId,
            name: deckName,
            note,
            author,
            createdAt: nowIso,
            updatedAt: nowIso,
            cards: item.cards,
          };
          nextDecks.push(targetDeck);
          newDecksCount++;
        }

        totalCardsCount += item.cards.length;
        decksToUpsert.push(targetDeck);
      }

      const nextData = { folders: appData.folders, decks: nextDecks };
      setAppData(nextData);
      safeSet(STORAGE_KEY_CONTENT, nextData);

      for (const d of decksToUpsert) {
        atomicUpsertDeckWithCards(settings.supabaseUrl, settings.supabaseKey, d, d.cards);
      }

      const msgParts = [];
      if (newDecksCount > 0) msgParts.push(`tạo ${newDecksCount} bài mới`);
      if (mergedDecksCount > 0) msgParts.push(`gộp ${mergedDecksCount} bài trùng tên`);
      showToast(`Đã nạp thành công: ${msgParts.join(', ')} (${totalCardsCount} thẻ)!`);

      if (onComplete) onComplete(targetFolderId);
      return;
    }

    if (!parsed || parsed.cards.length === 0) return showToast('Chưa có thẻ hợp lệ để nạp!');

    const deckName = deckNameInput || `Bài học mới ${dateTitle}`;
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
        }
      }
      if (note) existing.note = note;
      existing.author = author;
      existing.updatedAt = nowIso;
      if (!existing.createdAt) existing.createdAt = nowIso;
      targetDeck = existing;
      showToast(`Đã gộp vào "${existing.name}": thêm ${added} thẻ, cập nhật ${updated} thẻ!`);
    } else {
      targetDeck = {
        id: `deck_${Date.now()}`,
        folderId: targetFolderId,
        name: deckName,
        note,
        author,
        createdAt: nowIso,
        updatedAt: nowIso,
        cards: parsed.cards,
      };
      nextDecks.push(targetDeck);
      showToast(`Đã tạo bộ thẻ "${deckName}" (${parsed.cards.length} thẻ)!`);
    }

    const nextData = { folders: appData.folders, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);

    atomicUpsertDeckWithCards(settings.supabaseUrl, settings.supabaseKey, targetDeck, targetDeck.cards);

    if (onComplete) onComplete(targetFolderId);
  };

  const handleEditDeck = ({ id, name, note }) => {
    const deck = appData.decks.find((d) => d.id === id);
    if (!deck) return;
    const updated = {
      ...deck,
      name: name || deck.name,
      note: note !== undefined ? note : deck.note,
      updatedAt: new Date().toISOString(),
    };
    const nextDecks = appData.decks.map((d) => (d.id === id ? updated : d));
    const nextData = { ...appData, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);
    atomicUpdateDeckMeta(settings.supabaseUrl, settings.supabaseKey, id, { name: updated.name, note: updated.note });
    showToast(`Đã cập nhật bài học "${updated.name}"`);
  };

  const handleMoveDeck = (deckId, newFolderId) => {
    const deck = appData.decks.find((d) => d.id === deckId);
    if (!deck) return;
    const updated = { ...deck, folderId: newFolderId || null, updatedAt: new Date().toISOString() };
    const nextDecks = appData.decks.map((d) => (d.id === deckId ? updated : d));
    const nextData = { ...appData, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);
    atomicUpdateDeckMeta(settings.supabaseUrl, settings.supabaseKey, deckId, { folderId: updated.folderId });
    showToast(`Đã chuyển bài "${deck.name}" sang thư mục mới`);
  };

  const handleDeleteDeck = (deckId) => {
    const deck = appData.decks.find((d) => d.id === deckId);
    const cardIds = (deck?.cards || []).map((c) => c.id);

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

  const handleSaveCard = (updatedCard) => {
    const nextDecks = appData.decks.map((d) => ({
      ...d,
      cards: d.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
    }));
    const nextData = { ...appData, decks: nextDecks };
    setAppData(nextData);
    safeSet(STORAGE_KEY_CONTENT, nextData);

    atomicUpdateCard(settings.supabaseUrl, settings.supabaseKey, updatedCard);
    showToast('Đã cập nhật nội dung thẻ!');
  };

  const updateSettings = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    safeSet(STORAGE_KEY_SETTINGS, next);
  };

  const resetProgress = () => {
    setProgressMap({});
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    showToast('Đã đặt lại toàn bộ tiến độ về Chưa học.');
  };

  const restoreSeedData = async () => {
    const initial = { folders: DEFAULT_FOLDERS, decks: DEFAULT_DECKS };
    setAppData(initial);
    safeSet(STORAGE_KEY_CONTENT, initial);
    showToast('Đang khôi phục 7 học phần & 46 thẻ mẫu lên Cloud...');
    try {
      for (const f of DEFAULT_FOLDERS) {
        await atomicUpsertFolder(settings.supabaseUrl, settings.supabaseKey, f);
      }
      for (const d of DEFAULT_DECKS) {
        await atomicUpsertDeckWithCards(settings.supabaseUrl, settings.supabaseKey, d, d.cards);
      }
      await pushCloudData(settings.supabaseUrl, settings.supabaseKey, initial);
      showToast('✅ Đã khôi phục thành công 7 học phần và 46 thẻ mẫu Y khoa!');
    } catch {
      showToast('Đã khôi phục trên máy, đang chờ kết nối lại Cloud.');
    }
  };

  return {
    appData,
    setAppData,
    progressMap,
    setProgressMap,
    activityLogs,
    setActivityLogs,
    deviceId: getDeviceId(),
    settings,
    setSettings,
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
  };
}
