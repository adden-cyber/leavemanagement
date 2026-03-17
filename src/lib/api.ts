export const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || '';

export function apiUrl(path: string) {
  // Ensure path begins with /
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${normalized}`;
}

export async function apiFetch(input: string, init?: RequestInit) {
  return fetch(apiUrl(input), init);
}
