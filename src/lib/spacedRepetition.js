export function getCardProgress(progressMap, cardId) {
  return progressMap[cardId] || { status: 'red', box: 0, dueDate: 0, lastReviewed: 0 };
}

export function isCardDue(progressMap, cardId) {
  const p = getCardProgress(progressMap, cardId);
  if (p.status !== 'green') return true;
  return Date.now() >= (p.dueDate || 0);
}

export function computeStatsForCards(cards, progressMap) {
  let red = 0;
  let yellow = 0;
  let green = 0;
  let due = 0;
  for (const c of cards) {
    const p = getCardProgress(progressMap, c.id);
    if (p.status === 'green') green++;
    else if (p.status === 'yellow') yellow++;
    else red++;
    if (isCardDue(progressMap, c.id)) due++;
  }
  return { total: cards.length, red, yellow, green, due };
}

export function calculateNextProgress(prevProg, rating) {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  let nextBox = prevProg.box || 0;
  let nextDue = now;

  if (rating === 'red') {
    nextBox = 0;
    nextDue = now + DAY_MS;
  } else if (rating === 'yellow') {
    nextBox = 1;
    nextDue = now + 2 * DAY_MS;
  } else if (rating === 'green') {
    nextBox = Math.min(4, (prevProg.box || 0) + 1);
    const intervalDays = [3, 5, 9, 14, 21][nextBox] || 4;
    nextDue = now + intervalDays * DAY_MS;
  }

  return {
    status: rating,
    box: nextBox,
    dueDate: nextDue,
    lastReviewed: now,
  };
}
