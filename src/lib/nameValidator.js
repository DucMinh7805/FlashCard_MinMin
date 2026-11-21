/**
 * Utility validator for user names in FlashCard MinMin.
 * Disallows default or placeholder names like 'Học viên', 'Học viên 1', 'Thành viên', or empty string.
 */
export const isDefaultOrEmptyName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const clean = name.trim().toLowerCase();
  return (
    clean === '' ||
    clean === 'học viên' ||
    clean === 'học viên 1' ||
    clean === 'hoc vien' ||
    clean === 'hoc vien 1' ||
    clean === 'thành viên' ||
    clean === 'thanh vien'
  );
};
