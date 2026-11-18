export const DEFAULT_SUPABASE_URL = 'https://yelhofqqohaseuvhukte.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_ZxaxQF8bn8DZrn1gK3WDLQ_KQRpe7Hp';

export function buildSupabaseHeaders(key, extra = {}) {
  const headers = { apikey: key, ...extra };
  if (key && !headers.Authorization) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

export function normalizeCurriculumData(data) {
  if (!data?.folders) return data;
  const hasOldYkhoa = data.folders.some((f) => f.id === 'fld_ykhoa');
  if (!hasOldYkhoa) return data;

  let updatedFolders = data.folders
    .filter((f) => f.id !== 'fld_ykhoa')
    .map((f) => {
      if (f.parentId === 'fld_ykhoa') return { ...f, parentId: null };
      if (f.id === 'fld_avcn' && (f.icon === '🇬🇧' || !f.icon)) return { ...f, icon: '🌐' };
      return f;
    });

  if (!updatedFolders.some((f) => f.id === 'fld_yhcs')) {
    const insertIdx = updatedFolders.findIndex((f) => f.id === 'fld_avcn');
    const yhcsFolder = {
      id: 'fld_yhcs',
      name: 'Y học cơ sở (Giải phẫu, Sinh lý, Dược lý...)',
      icon: '🧬',
      parentId: null,
    };
    if (insertIdx >= 0) {
      updatedFolders.splice(insertIdx, 0, yhcsFolder);
    } else {
      updatedFolders.push(yhcsFolder);
    }
  }

  return { ...data, folders: updatedFolders };
}

/**
 * Atomic CRUD: Upsert a single folder in mm_folders
 */
export async function atomicUpsertFolder(url, key, folder) {
  if (!url || !key || !folder) return false;
  const base = url.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/rest/v1/mm_folders`, {
      method: 'POST',
      headers: buildSupabaseHeaders(key, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        id: folder.id,
        name: folder.name,
        icon: folder.icon || '📁',
        parent_id: folder.parentId || null,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Atomic CRUD: Delete a single folder in mm_folders
 */
export async function atomicDeleteFolder(url, key, folderId) {
  if (!url || !key || !folderId) return false;
  const base = url.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/rest/v1/mm_folders?id=eq.${encodeURIComponent(folderId)}`, {
      method: 'DELETE',
      headers: buildSupabaseHeaders(key),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Atomic CRUD: Upsert a deck and its cards into mm_decks & mm_cards
 */
export async function atomicUpsertDeckWithCards(url, key, deck, cards = []) {
  if (!url || !key || !deck) return false;
  const base = url.replace(/\/$/, '');
  try {
    // 1. Upsert deck metadata (name, note, author, folder_id)
    const deckBody = {
      id: deck.id,
      folder_id: deck.folderId || null,
      name: deck.name,
      note: deck.note || '',
      author: deck.author || '',
      updated_at: deck.updatedAt || new Date().toLocaleDateString('sv-SE'),
    };
    await fetch(`${base}/rest/v1/mm_decks`, {
      method: 'POST',
      headers: buildSupabaseHeaders(key, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify(deckBody),
    });

    // 2. Upsert cards belonging to this deck
    if (Array.isArray(cards) && cards.length > 0) {
      const cardPayload = cards.map((c, idx) => ({
        id: c.id,
        deck_id: deck.id,
        type: c.type || 'basic',
        front: c.front,
        back: c.back,
        hint: c.hint || '',
        extra: c.extra || '',
        image: c.image || '',
        sort_order: idx,
      }));
      await fetch(`${base}/rest/v1/mm_cards`, {
        method: 'POST',
        headers: buildSupabaseHeaders(key, {
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        }),
        body: JSON.stringify(cardPayload),
      });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Atomic CRUD: Update deck metadata (name, note, author, folderId)
 */
export async function atomicUpdateDeckMeta(url, key, deckId, updates = {}) {
  if (!url || !key || !deckId) return false;
  const base = url.replace(/\/$/, '');
  try {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.note !== undefined) payload.note = updates.note;
    if (updates.author !== undefined) payload.author = updates.author;
    if (updates.folderId !== undefined) payload.folder_id = updates.folderId || null;
    payload.updated_at = new Date().toLocaleDateString('sv-SE');

    const res = await fetch(`${base}/rest/v1/mm_decks?id=eq.${encodeURIComponent(deckId)}`, {
      method: 'PATCH',
      headers: buildSupabaseHeaders(key, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Atomic CRUD: Delete a deck in mm_decks (CASCADE deletes its mm_cards automatically)
 */
export async function atomicDeleteDeck(url, key, deckId) {
  if (!url || !key || !deckId) return false;
  const base = url.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/rest/v1/mm_decks?id=eq.${encodeURIComponent(deckId)}`, {
      method: 'DELETE',
      headers: buildSupabaseHeaders(key),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Atomic CRUD: Update a single flashcard
 */
export async function atomicUpdateCard(url, key, card) {
  if (!url || !key || !card?.id) return false;
  const base = url.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/rest/v1/mm_cards?id=eq.${encodeURIComponent(card.id)}`, {
      method: 'PATCH',
      headers: buildSupabaseHeaders(key, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        type: card.type || 'basic',
        front: card.front,
        back: card.back,
        hint: card.hint || '',
        extra: card.extra || '',
        image: card.image || '',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Snapshot backup to minmin_store (safety net for offline / full restore)
 */
export async function pushCloudData(url, key, appData) {
  if (!url || !key || !appData) return { ok: false, mode: 'none' };
  const base = url.replace(/\/$/, '');

  try {
    const res = await fetch(`${base}/rest/v1/minmin_store`, {
      method: 'POST',
      headers: buildSupabaseHeaders(key, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({
        id: 'shared_drive',
        payload: appData,
        updated_at: new Date().toISOString(),
      }),
    });
    return { ok: res.ok, mode: 'cloud' };
  } catch {
    return { ok: false, mode: 'error' };
  }
}

/**
 * Pull full data from Cloud.
 * Reads relational tables (mm_folders, mm_decks, mm_cards) first,
 * falls back to minmin_store.
 */
export async function pullCloudData(url, key) {
  if (!url || !key) return null;
  const base = url.replace(/\/$/, '');

  // 1. Try relational tables
  try {
    const [fRes, dRes, cRes] = await Promise.all([
      fetch(`${base}/rest/v1/mm_folders?select=*`, { headers: buildSupabaseHeaders(key) }),
      fetch(`${base}/rest/v1/mm_decks?select=*`, { headers: buildSupabaseHeaders(key) }),
      fetch(`${base}/rest/v1/mm_cards?select=*&order=sort_order.asc`, { headers: buildSupabaseHeaders(key) }),
    ]);

    if (fRes.ok && dRes.ok && cRes.ok) {
      const [folders, decks, cards] = await Promise.all([fRes.json(), dRes.json(), cRes.json()]);
      if (Array.isArray(folders) && Array.isArray(decks) && (folders.length > 0 || decks.length > 0)) {
        const cardsByDeck = {};
        for (const c of cards) {
          if (!cardsByDeck[c.deck_id]) cardsByDeck[c.deck_id] = [];
          cardsByDeck[c.deck_id].push({
            id: c.id,
            type: c.type || 'basic',
            front: c.front,
            back: c.back,
            hint: c.hint || '',
            extra: c.extra || '',
            image: c.image || '',
          });
        }
        return normalizeCurriculumData({
          folders: folders.map((f) => ({
            id: f.id,
            name: f.name,
            icon: f.icon || '📁',
            parentId: f.parent_id || null,
          })),
          decks: decks.map((d) => ({
            id: d.id,
            folderId: d.folder_id || null,
            name: d.name,
            note: d.note || '',
            author: d.author || '',
            updatedAt: d.updated_at || '',
            cards: cardsByDeck[d.id] || [],
          })),
        });
      }
    }
  } catch {
    // Relational read failed, fall through to minmin_store
  }

  // 2. Fallback to minmin_store
  try {
    const res = await fetch(`${base}/rest/v1/minmin_store?id=eq.shared_drive&select=payload`, {
      headers: buildSupabaseHeaders(key),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.payload && Array.isArray(data[0].payload.folders)) {
      return normalizeCurriculumData(data[0].payload);
    }
    return null;
  } catch {
    return null;
  }
}
