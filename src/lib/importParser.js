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
  let trimmed = (rawText || '').trim();
  if (!trimmed) return { cards: [], deckName: '', folderPath: [], isJsonError: false };

  // 1. Strip Markdown code fences (e.g. ```json ... ``` or ``` ... ```)
  if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // 2. If text starts with '{' or '[', parse strictly as JSON format
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return {
          cards: parsed.map((c, idx) => normalizeCardObject(c, idx)).filter(Boolean),
          deckName: '',
          folderPath: [],
          isJsonError: false,
        };
      }
      if (parsed && Array.isArray(parsed.cards)) {
        return {
          cards: parsed.cards.map((c, idx) => normalizeCardObject(c, idx)).filter(Boolean),
          deckName: parsed.deck || parsed.title || '',
          note: String(parsed.note || parsed.summary || '').trim(),
          folderPath: Array.isArray(parsed.folderPath)
            ? parsed.folderPath
            : parsed.subject
              ? [parsed.subject]
              : [],
          isJsonError: false,
        };
      }
      return {
        cards: [],
        deckName: '',
        folderPath: [],
        error: 'JSON không chứa danh sách thẻ bài học hợp lệ (cần mảng cards[] hoặc mảng các thẻ).',
        isJsonError: true,
      };
    } catch (err) {
      // DO NOT fall through to line parser, which shreds JSON by commas into broken cards
      return {
        cards: [],
        deckName: '',
        folderPath: [],
        error: `Cú pháp JSON không hợp lệ: ${err.message}`,
        isJsonError: true,
      };
    }
  }

  // 3. Line-by-line parser for CSV / TSV / Pipe-separated text
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const cards = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && /^front\s*[|,;\t]\s*back/i.test(line)) continue;

    let parts = [];
    if (line.includes('|')) {
      parts = line.split('|').map((p) => p.trim());
    } else if (line.includes('\t')) {
      parts = line.split('\t').map((p) => p.trim());
    } else {
      // Quote-aware CSV splitter: handles commas inside quotation marks "..."
      parts = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"' || ch === "'") {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          parts.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += ch;
        }
      }
      parts.push(current.trim().replace(/^["']|["']$/g, ''));
    }

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
  return { cards, deckName: '', folderPath: [], isJsonError: false };
}
