import { setTimeout as delay } from 'timers/promises';

type NameApiEnv = {
  baseUrl: string;
  token: string;
};

function getEnv(): NameApiEnv {
  const isProd = process.env.NODE_ENV === 'production';
  const baseUrl = isProd
    ? process.env.NAME_API_BASE_URL_PROD
    : process.env.NAME_API_BASE_URL_DEV;
  const token = isProd
    ? process.env.NAME_API_TOKEN_PROD
    : process.env.NAME_API_TOKEN_DEV;
  if (!baseUrl || !token) {
    throw new Error('[nameApi] Missing NAME_API_* envs. Please configure .env');
  }
  return { baseUrl, token } as NameApiEnv;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, token } = getEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      method: init?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[nameApi] ${res.status} ${res.statusText} :: ${text}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// Example wrapper methods. Replace `/ping` and `/whoami` with actual endpoints.
export const nameApi = {
  ping: () => fetchJson<{ ok: boolean }>(`/ping`),
  whoAmI: () => fetchJson<{ ip: string; user?: string }>(`/whoami`),
};

export default nameApi;
