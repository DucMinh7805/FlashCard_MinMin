export const STORAGE_KEY_CONTENT = 'minmin_flashcard_drive_v1';
export const STORAGE_KEY_PROGRESS = 'minmin_flashcard_progress_v1';
export const STORAGE_KEY_SESSION = 'minmin_flashcard_active_session_v1';
export const STORAGE_KEY_SETTINGS = 'minmin_flashcard_settings_v1';
export const STORAGE_KEY_PROMPTS = 'minmin_flashcard_prompts_v1';
export const STORAGE_KEY_ACTIVE_PROMPT = 'minmin_flashcard_active_prompt_v1';

export function getDeviceId() {
  if (typeof window === 'undefined') return 'device_default';
  const KEY = 'minmin_device_id_v1';
  let id = localStorage.getItem(KEY);
  if (!id) {
    const rand =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    id = `dev_${rand}`;
    try {
      localStorage.setItem(KEY, id);
    } catch (_) {}
  }
  return id;
}

export function getActivityStorageKey() {
  return `minmin_flashcard_activity_${getDeviceId()}`;
}

export const STORAGE_KEY_ACTIVITY =
  typeof window !== 'undefined' ? getActivityStorageKey() : 'minmin_flashcard_activity_default';

export function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function safeSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn('LocalStorage quota exceeded for key:', key);
      try {
        window.dispatchEvent(new CustomEvent('minmin_quota_error', { detail: { key } }));
      } catch {
        // Ignore in non-window environments
      }
    }
  }
}

export function getAllDescendantFolderIds(rootFolderId, allFolders) {
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
