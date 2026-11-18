export const DEFAULT_SUPABASE_URL = 'https://yelhofqqohaseuvhukte.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_ZxaxQF8bn8DZrn1gK3WDLQ_KQRpe7Hp';

export function buildSupabaseHeaders(key, extra = {}) {
  const headers = { apikey: key, ...extra };
  if (key && !headers.Authorization) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

async function deleteByIds(base, table, ids, key) {
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    await fetch(`${base}/rest/v1/${table}?id=in.(${chunk.map((id) => `"${id}"`).join(',')})`, {
      method: 'DELETE',
      headers: buildSupabaseHeaders(key),
    });
  }
}

/**
 * Push data to Supabase.
 * Supports relational tables (mm_folders, mm_decks, mm_cards) when created,
 * and seamlessly falls back to minmin_store JSON table.
 */
export async function pushCloudData(url, key, appData) {
  if (!url || !key) return { ok: false, mode: 'none' };
  const base = url.replace(/\/$/, '');

  // Always update minmin_store first (already created on user's Supabase)
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

    // Also try syncing relational tables if user ran supabase_schema.sql
    try {
      const checkRes = await fetch(`${base}/rest/v1/mm_folders?select=id&limit=1`, {
        headers: buildSupabaseHeaders(key),
      });
      if (checkRes.ok) {
        // Remove deleted folders/decks from relational tables so they don't resurrect on pull
        const [exFRes, exDRes] = await Promise.all([
          fetch(`${base}/rest/v1/mm_folders?select=id`, { headers: buildSupabaseHeaders(key) }),
          fetch(`${base}/rest/v1/mm_decks?select=id`, { headers: buildSupabaseHeaders(key) }),
        ]);
        if (exFRes.ok) {
          const exF = await exFRes.json();
          const keepF = new Set(appData.folders.map((f) => f.id));
          const delF = exF.filter((r) => !keepF.has(r.id)).map((r) => r.id);
          if (delF.length > 0) {
            await deleteByIds(base, 'mm_folders', delF, key);
          }
        }
        if (exDRes.ok) {
          const exD = await exDRes.json();
          const keepD = new Set(appData.decks.map((d) => d.id));
          const delD = exD.filter((r) => !keepD.has(r.id)).map((r) => r.id);
          if (delD.length > 0) {
            await deleteByIds(base, 'mm_decks', delD, key);
          }
        }

        // Remove deleted cards from surviving decks
        const allCardIds = [];
        for (const d of appData.decks) {
          if (Array.isArray(d.cards)) {
            for (const c of d.cards) {
              if (c?.id) allCardIds.push(c.id);
            }
          }
        }
        const keepC = new Set(allCardIds);
        try {
          const exCRes = await fetch(`${base}/rest/v1/mm_cards?select=id`, { headers: buildSupabaseHeaders(key) });
          if (exCRes.ok) {
            const exC = await exCRes.json();
            const delC = exC.filter((r) => !keepC.has(r.id)).map((r) => r.id);
            if (delC.length > 0) {
              await deleteByIds(base, 'mm_cards', delC, key);
            }
          }
        } catch {
          // ignore card deletion errors
        }

        if (appData.folders.length > 0) {
          await fetch(`${base}/rest/v1/mm_folders`, {
            method: 'POST',
            headers: buildSupabaseHeaders(key, {
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            }),
            body: JSON.stringify(
              appData.folders.map((f) => ({
                id: f.id,
                name: f.name,
                icon: f.icon || '📁',
                parent_id: f.parentId || null,
              }))
            ),
          });
        }
        if (appData.decks.length > 0) {
          await fetch(`${base}/rest/v1/mm_decks`, {
            method: 'POST',
            headers: buildSupabaseHeaders(key, {
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            }),
            body: JSON.stringify(
              appData.decks.map((d) => ({
                id: d.id,
                folder_id: d.folderId || null,
                name: d.name,
                updated_at: d.updatedAt || '',
              }))
            ),
          });
          const allCards = [];
          for (const d of appData.decks) {
            d.cards.forEach((c, idx) => {
              allCards.push({
                id: c.id,
                deck_id: d.id,
                type: c.type || 'basic',
                front: c.front,
                back: c.back,
                hint: c.hint || '',
                extra: c.extra || '',
                image: c.image || '',
                sort_order: idx,
              });
            });
          }
          if (allCards.length > 0) {
            await fetch(`${base}/rest/v1/mm_cards`, {
              method: 'POST',
              headers: buildSupabaseHeaders(key, {
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates',
              }),
              body: JSON.stringify(allCards),
            });
          }
        }
      }
    } catch {
      // Relational tables optional
    }

    return { ok: res.ok, mode: 'cloud' };
  } catch {
    return { ok: false, mode: 'error' };
  }
}

export async function pullCloudData(url, key) {
  if (!url || !key) return null;
  const base = url.replace(/\/$/, '');

  // Try relational tables first if available and populated
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
        return {
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
            updatedAt: d.updated_at || '',
            cards: cardsByDeck[d.id] || [],
          })),
        };
      }
    }
  } catch {
    // Fallback to minmin_store
  }

  try {
    const res = await fetch(`${base}/rest/v1/minmin_store?id=eq.shared_drive&select=payload`, {
      headers: buildSupabaseHeaders(key),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data[0] && data[0].payload && Array.isArray(data[0].payload.folders)) {
      return data[0].payload;
    }
    return null;
  } catch {
    return null;
  }
}
