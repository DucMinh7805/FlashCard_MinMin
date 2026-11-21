function generateCardId(prefix = 'card', idx = 0) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeCardObject(raw, idx = 0) {
  if (!raw || !raw.front) return null;
  const front = String(raw.front).trim();
  const back = String(raw.back || '').trim();
  const isCloze = /\{\{c\d+::.*?\}\}/.test(front);
  return {
    id: raw.id || generateCardId('card', idx),
    type: raw.type || (isCloze ? 'cloze' : 'basic'),
    front,
    back: back || front,
    hint: String(raw.hint || '').trim(),
    extra: String(raw.extra || raw.note || '').trim(),
    image: String(raw.image || '').trim(),
  };
}

export function cleanFileNameToTitle(fileName = '') {
  return String(fileName || '')
    .replace(/\.[^/.]+$/, '') // bỏ đuôi .json, .csv, .txt
    .replace(/[_-]+/g, ' ')   // thay gạch dưới, gạch ngang thành dấu cách
    .replace(/\s+/g, ' ')     // gộp khoảng trắng thừa
    .trim();
}

export function parseFileOrTextToDecks(rawContent, fileName = '') {
  const fallbackTitle = cleanFileNameToTitle(fileName) || 'Bài học mới';
  let trimmed = (rawContent || '').trim();
  if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  if (!trimmed) {
    return [
      {
        id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fileName,
        deckName: fallbackTitle,
        note: '',
        cards: [],
        isValid: false,
        error: 'Nội dung file rỗng',
        clozeCount: 0,
        caseCount: 0,
        basicCount: 0,
      },
    ];
  }

  // 1. JSON handling
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);

      // Case A: Multi-deck array: [ { deck/title: "...", cards: [...] }, ... ]
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((item) => item && (item.cards || item.deck || item.title))) {
        const deckItems = [];
        parsed.forEach((d, dIdx) => {
          if (!d) return;
          const rawCards = Array.isArray(d.cards) ? d.cards : Array.isArray(d) ? d : [];
          const cards = rawCards.map((c, cIdx) => normalizeCardObject(c, cIdx)).filter(Boolean);
          const dName = String(d.deck || d.title || d.name || `${fallbackTitle} (Phần ${dIdx + 1})`).trim();
          const note = String(d.note || d.summary || '').trim();
          const clozeCount = cards.filter((c) => c.type === 'cloze').length;
          const caseCount = cards.filter((c) => c.type === 'case').length;
          const basicCount = cards.filter((c) => c.type === 'basic').length;

          deckItems.push({
            id: `batch_${Date.now()}_${dIdx}_${Math.random().toString(36).slice(2, 6)}`,
            fileName: fileName ? `${fileName} [#${dIdx + 1}]` : '',
            deckName: dName,
            note,
            cards,
            isValid: cards.length > 0,
            error: cards.length === 0 ? 'Mục này không có thẻ hợp lệ' : null,
            clozeCount,
            caseCount,
            basicCount,
          });
        });
        if (deckItems.length > 0) return deckItems;
      }

      // Case B: Multi-deck object: { decks: [ { name: "...", cards: [...] } ] }
      if (parsed && Array.isArray(parsed.decks) && parsed.decks.length > 0) {
        const deckItems = [];
        parsed.decks.forEach((d, dIdx) => {
          if (!d) return;
          const rawCards = Array.isArray(d.cards) ? d.cards : [];
          const cards = rawCards.map((c, cIdx) => normalizeCardObject(c, cIdx)).filter(Boolean);
          const dName = String(d.deck || d.title || d.name || `${fallbackTitle} (Phần ${dIdx + 1})`).trim();
          const note = String(d.note || d.summary || '').trim();
          const clozeCount = cards.filter((c) => c.type === 'cloze').length;
          const caseCount = cards.filter((c) => c.type === 'case').length;
          const basicCount = cards.filter((c) => c.type === 'basic').length;

          deckItems.push({
            id: `batch_${Date.now()}_${dIdx}_${Math.random().toString(36).slice(2, 6)}`,
            fileName: fileName ? `${fileName} [#${dIdx + 1}]` : '',
            deckName: dName,
            note,
            cards,
            isValid: cards.length > 0,
            error: cards.length === 0 ? 'Mục này không có thẻ hợp lệ' : null,
            clozeCount,
            caseCount,
            basicCount,
          });
        });
        if (deckItems.length > 0) return deckItems;
      }

      // Case C: Single deck JSON: { deck: "...", note: "...", cards: [...] }
      if (parsed && Array.isArray(parsed.cards)) {
        const cards = parsed.cards.map((c, idx) => normalizeCardObject(c, idx)).filter(Boolean);
        const dName = String(parsed.deck || parsed.title || parsed.name || fallbackTitle).trim();
        const note = String(parsed.note || parsed.summary || '').trim();
        const clozeCount = cards.filter((c) => c.type === 'cloze').length;
        const caseCount = cards.filter((c) => c.type === 'case').length;
        const basicCount = cards.filter((c) => c.type === 'basic').length;

        return [
          {
            id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            fileName,
            deckName: dName,
            note,
            cards,
            isValid: cards.length > 0,
            error: cards.length === 0 ? 'File JSON không chứa thẻ hợp lệ nào trong mảng cards[]' : null,
            clozeCount,
            caseCount,
            basicCount,
          },
        ];
      }

      // Case D: Array of raw cards: [ { front, back }, ... ]
      if (Array.isArray(parsed)) {
        const cards = parsed.map((c, idx) => normalizeCardObject(c, idx)).filter(Boolean);
        const clozeCount = cards.filter((c) => c.type === 'cloze').length;
        const caseCount = cards.filter((c) => c.type === 'case').length;
        const basicCount = cards.filter((c) => c.type === 'basic').length;

        return [
          {
            id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            fileName,
            deckName: fallbackTitle,
            note: '',
            cards,
            isValid: cards.length > 0,
            error: cards.length === 0 ? 'Không tìm thấy thẻ hợp lệ nào' : null,
            clozeCount,
            caseCount,
            basicCount,
          },
        ];
      }

      return [
        {
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fileName,
          deckName: fallbackTitle,
          note: '',
          cards: [],
          isValid: false,
          error: 'JSON không chứa danh sách thẻ hợp lệ (cần mảng cards[] hoặc mảng các thẻ).',
          clozeCount: 0,
          caseCount: 0,
          basicCount: 0,
        },
      ];
    } catch (err) {
      return [
        {
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fileName,
          deckName: fallbackTitle,
          note: '',
          cards: [],
          isValid: false,
          error: `Lỗi cú pháp JSON: ${err.message}`,
          clozeCount: 0,
          caseCount: 0,
          basicCount: 0,
        },
      ];
    }
  }

  // 2. CSV / TSV / Pipe text
  const res = parseImportInput(trimmed);
  const clozeCount = res.cards.filter((c) => c.type === 'cloze').length;
  const caseCount = res.cards.filter((c) => c.type === 'case').length;
  const basicCount = res.cards.filter((c) => c.type === 'basic').length;

  return [
    {
      id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fileName,
      deckName: res.deckName || fallbackTitle,
      note: res.note || '',
      cards: res.cards,
      isValid: res.cards.length > 0,
      error: res.cards.length === 0 ? 'Không nhận diện được dòng câu hỏi/đáp án hợp lệ nào' : null,
      clozeCount,
      caseCount,
      basicCount,
    },
  ];
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
      // Quote-aware CSV splitter: handles commas inside quotation marks "..." and escaped quotes \"
      parts = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        const isEscaped = c > 0 && line[c - 1] === '\\';
        if ((ch === '"' || ch === "'") && !isEscaped) {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          parts.push(current.trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"'));
          current = '';
        } else {
          current += ch;
        }
      }
      parts.push(current.trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"'));
    }

    if (parts.length >= 2 && parts[0] && parts[1]) {
      const front = parts[0];
      const back = parts[1];
      const hint = parts[2] || '';
      const extra = parts[3] || '';
      const isCloze = /\{\{c\d+::.*?\}\}/.test(front);
      cards.push({
        id: generateCardId('card', i),
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
