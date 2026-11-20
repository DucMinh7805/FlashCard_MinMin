/**
 * System Data Vault - Quản lý các bản sao lưu cục bộ (Local Snapshots)
 * Giúp người dùng kiểm tra dữ liệu, xem JSON và khôi phục kịp thời khi có lỗi.
 */

export const STORAGE_KEY_SNAPSHOTS = 'minmin_system_vault_snapshots_v1';
const MAX_SNAPSHOTS = 10;

export function getSystemSnapshots() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading snapshots:', err);
    return [];
  }
}

export function saveSystemSnapshots(snapshots) {
  try {
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(snapshots));
  } catch (err) {
    console.error('Error saving snapshots:', err);
  }
}

export function createSystemSnapshot(appData, progressMap, reason = 'Sao lưu thủ công') {
  if (!appData) return null;

  const allDecks = appData.decks || [];
  const cardCount = allDecks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
  const folderCount = (appData.folders || []).length;
  const deckCount = allDecks.length;
  const progressCount = Object.keys(progressMap || {}).length;

  const now = new Date();
  const timeFormatted = now.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const newSnapshot = {
    id: `snap_${Date.now()}`,
    timestamp: Date.now(),
    timeFormatted,
    reason,
    stats: {
      folderCount,
      deckCount,
      cardCount,
      progressCount,
    },
    data: {
      appData,
      progressMap: progressMap || {},
    },
  };

  const existing = getSystemSnapshots();
  // Giữ tối đa MAX_SNAPSHOTS bản lưu gần nhất (FIFO)
  const updated = [newSnapshot, ...existing.filter((s) => s.id !== newSnapshot.id)].slice(
    0,
    MAX_SNAPSHOTS
  );

  saveSystemSnapshots(updated);
  return newSnapshot;
}

export function deleteSystemSnapshot(snapshotId) {
  const existing = getSystemSnapshots();
  const updated = existing.filter((s) => s.id !== snapshotId);
  saveSystemSnapshots(updated);
  return updated;
}

export function calculateStorageSizeKB() {
  try {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('minmin_')) {
        const val = localStorage.getItem(key) || '';
        totalBytes += (key.length + val.length) * 2; // UTF-16 approximate
      }
    }
    return Math.max(1, Math.round(totalBytes / 1024));
  } catch {
    return 10;
  }
}
