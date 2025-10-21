import { useEffect, useRef, useState } from "react";

export type AppWsMessage = {
  type: string;
  [key: string]: any;
};

export function useAppWebSocket(onMessage?: (msg: AppWsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
    let url: string;
    if (apiUrl) {
      try {
        const u = new URL(apiUrl);
        u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
        u.pathname = "/ws";
        u.search = "";
        url = u.toString();
      } catch {
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        url = `${protocol}://${window.location.host}/ws`;
      }
    } else {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      url = `${protocol}://${window.location.host}/ws`;
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AppWsMessage;
        onMessage?.(data);
      } catch {}
    };

    return () => ws.close();
  }, [onMessage]);

  return { connected };
}
