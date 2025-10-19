export function apiBase(): string {
  const base = (import.meta as any).env?.VITE_API_URL || "";
  return typeof base === "string" ? base.replace(/\/$/, "") : "";
}

export function withApiBase(path: string): string {
  if (!path) return apiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase()}${p}`;
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = withApiBase(input);
  return fetch(url, { credentials: "include", ...init });
}
