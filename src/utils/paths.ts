/**
 * Normalizes a URL path by removing trailing slashes and converting to lowercase
 */
export function normalizePath(path: string): string {
  if (!path) return '';
  const normalized = path.replace(/\/+$/, '').toLowerCase();
  return normalized || '/';
}
