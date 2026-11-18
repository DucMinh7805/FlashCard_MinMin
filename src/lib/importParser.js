export function normalizeCardObject(raw, idx) {
  if (!raw || !raw.front) return null;
  const front = String(raw.front).trim();
  const back = String(raw.back || '').trim();
  const isCloze = /\{\{c\d+::.*?\}\}/.test(front);
  return {
    id: raw.id || `card_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
    type: raw.type || (isCloze ? 'cloze' : 'basic'),
    front,
    back: back || front,
    hint: String(raw.hint || '').trim(),
    extra: String(raw.extra || raw.note || '').trim(),
    image: String(raw.image || '').trim(),
  };
}

export function parseImportInput(rawText) {
  const trimmed = (rawText || '').trim();
  if (!trimmed) return { cards: [], deckName: '', folderPath: [] };

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return {
          cards: parsed.map((c, idx) => normalizeCardObject(c, idx)).filter(Boolean),
          deckName: '',
          folderPath: [],
        };
      }
      if (parsed && Array.isArray(parsed.cards)) {
        return {
          cards: parsed.cards.map((c, idx) => normalizeCardObject(c, idx)).filter(Boolean),
          deckName: parsed.deck || parsed.title || '',
          folderPath: Array.isArray(parsed.folderPath)
            ? parsed.folderPath
            : parsed.subject
              ? [parsed.subject]
              : [],
        };
      }
    } catch {
      // Fallback to line parser
    }
  }

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const cards = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && /^front\s*[|,;\t]\s*back/i.test(line)) continue;
    const parts = (line.includes('|')
      ? line.split('|')
      : line.includes('\t')
        ? line.split('\t')
        : line.split(',')
    ).map((p) => p.trim());

    if (parts.length >= 2 && parts[0] && parts[1]) {
      const front = parts[0];
      const back = parts[1];
      const hint = parts[2] || '';
      const extra = parts[3] || '';
      const isCloze = /\{\{c\d+::.*?\}\}/.test(front);
      cards.push({
        id: `card_${Date.now()}_${i}`,
        type: isCloze ? 'cloze' : 'basic',
        front,
        back,
        hint,
        extra,
        image: '',
      });
    }
  }
  return { cards, deckName: '', folderPath: [] };
}
