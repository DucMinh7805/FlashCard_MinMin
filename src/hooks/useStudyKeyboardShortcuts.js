import { useEffect } from 'react';

export function useStudyKeyboardShortcuts({
  triggerFlip,
  onRate,
  onUndo,
  onToggleHint,
  onEditCard,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Space') {
        e.preventDefault();
        triggerFlip();
      } else if (e.key === '1') {
        onRate('red');
      } else if (e.key === '2') {
        onRate('yellow');
      } else if (e.key === '3') {
        onRate('green');
      } else if (e.key.toLowerCase() === 'z') {
        onUndo();
      } else if (e.key.toLowerCase() === 'h') {
        onToggleHint();
      } else if (e.key.toLowerCase() === 'e') {
        onEditCard?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [triggerFlip, onRate, onUndo, onToggleHint, onEditCard]);
}
