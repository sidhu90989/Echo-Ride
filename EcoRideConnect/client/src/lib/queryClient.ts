import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { withApiBase } from "./apiBase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    let reason = res.statusText;
    try {
      if (ct.includes("application/json")) {
        const data = await res.json();
        reason = data?.error || data?.message || JSON.stringify(data);
      } else {
        reason = (await res.text()) || res.statusText;
      }
    } catch {
      // fall back to status text
    }
    throw new Error(`${res.status}: ${reason}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(withApiBase(url), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(withApiBase(queryKey.join("/") as string), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
