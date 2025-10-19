import { useEffect, useRef, useState } from "react";

export type LocationMessage = {
  type: "location_update";
  rideId: string;
  lat: number;
  lng: number;
  who: "rider" | "driver" | "unknown";
  at: number;
};

type Options = {
  rideId: string;
  who: "rider" | "driver";
  onMessage?: (msg: LocationMessage) => void;
};

export function useRideWebSocket({ rideId, who, onMessage }: Options) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Derive WS URL from VITE_API_URL when present, otherwise same-origin
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
        const data = JSON.parse(event.data) as LocationMessage;
        if (data.type === "location_update" && data.rideId === rideId) {
          onMessage?.(data);
        }
      } catch {}
    };

    return () => ws.close();
  }, [rideId, onMessage]);

  const sendLocation = (lat: number, lng: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const msg: LocationMessage = {
      type: "location_update",
      rideId,
      lat,
      lng,
      who,
      at: Date.now(),
    } as any;
    wsRef.current.send(JSON.stringify(msg));
  };

  return { connected, sendLocation };
}
