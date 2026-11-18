export function getCardProgress(progressMap, cardId) {
  const p = progressMap?.[cardId];
  if (!p || !p.lastReviewed) {
    return { status: 'new', box: 0, dueDate: 0, lastReviewed: 0 };
  }
  return p;
}

export function isCardDue(progressMap, cardId) {
  const p = getCardProgress(progressMap, cardId);
  if (p.status === 'new') return true;
  return Date.now() >= (p.dueDate || 0);
}

export function computeStatsForCards(cards, progressMap) {
  let newCount = 0;
  let red = 0;
  let yellow = 0;
  let green = 0;
  let due = 0;
  for (const c of cards || []) {
    const p = getCardProgress(progressMap, c.id);
    if (p.status === 'green') green++;
    else if (p.status === 'yellow') yellow++;
    else if (p.status === 'red') red++;
    else newCount++;

    if (isCardDue(progressMap, c.id)) due++;
  }
  return { total: (cards || []).length, newCount, red, yellow, green, due };
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

export function computeStudyStreak(activityLogs = {}) {
  // activityLogs is an object: { 'YYYY-MM-DD': count }
  const today = new Date().toLocaleDateString('sv-SE');
  let streak = 0;
  let checkDate = new Date();

  // If user hasn't studied today, check if they studied yesterday to keep streak alive
  const todayCount = activityLogs[today] || 0;
  if (!todayCount) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = checkDate.toLocaleDateString('sv-SE');
    if (activityLogs[key] && activityLogs[key] > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak, todayCount };
}

