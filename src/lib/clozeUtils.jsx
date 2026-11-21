import React from 'react';

export function formatClozeParts(rawText, revealed) {
  const parts = [];
  const regex = /\{\{c\d+::(.*?)\}\}/g;
  let lastIndex = 0;
  let match;
  let idx = 0;
  while ((match = regex.exec(rawText || '')) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t_${idx++}`}>{rawText.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <span key={`c_${idx++}`} className={revealed ? 'cloze-revealed' : 'cloze-blank'}>
        {revealed ? match[1] : '[ ... ]'}
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < (rawText || '').length) {
    parts.push(<span key={`t_${idx++}`}>{rawText.slice(lastIndex)}</span>);
  }
  return parts;
}
