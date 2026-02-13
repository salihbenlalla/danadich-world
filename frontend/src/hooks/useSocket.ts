"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Role = "dandouch" | "dandoucha";
type Stage = "ritual" | "dreamIntro" | "mainExperience";

export interface ServerMessage {
  type:
    | "HEART_START"
    | "HEART_STOP"
    | "NEW_WHISPER"
    | "STAGE_SYNC"
    | "TOGETHER"
    | "PARTNER_CONNECTED"
    | "PARTNER_DISCONNECTED";
  role?: Role;
  text?: string;
  from?: Role;
  stage?: Stage;
  active?: boolean;
}

export interface ClientMessage {
  type: "JOIN" | "HEART_START" | "HEART_STOP" | "NEW_WHISPER" | "STAGE_SYNC";
  role?: Role;
  text?: string;
  stage?: Stage;
}

interface UseSocketOptions {
  onMessage?: (msg: ServerMessage) => void;
}

interface UseSocketReturn {
  send: (msg: ClientMessage) => void;
  lastMessage: ServerMessage | null;
  isConnected: boolean;
}

/** WebSocket URL - uses current hostname when in browser for local network access */
function getWsUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  const wsPort = process.env.NEXT_PUBLIC_WS_PORT || "3001";
  // Use env URL if set and not localhost (production deployment)
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }
  // In browser: use current hostname so devices on LAN connect correctly
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.hostname}:${wsPort}/ws`;
  }
  return envUrl || `ws://localhost:${wsPort}/ws`;
}

const WS_URL = getWsUrl();
const MAX_RECONNECT_DELAY = 10000;

export function useSocket(role: Role, options?: UseSocketOptions): UseSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectDelayRef = useRef(1000);
  const cancelledRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const roleRef = useRef(role);
  const onMessageRef = useRef(options?.onMessage);
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => {
    onMessageRef.current = options?.onMessage;
    return () => {
      onMessageRef.current = undefined;
    };
  }, [options?.onMessage]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const connect = useCallback(() => {
    // Don't connect if effect has been cleaned up (React Strict Mode)
    if (cancelledRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelledRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        reconnectDelayRef.current = 1000;
        ws.send(JSON.stringify({ type: "JOIN", role: roleRef.current }));
      };

      ws.onmessage = (event) => {
        if (cancelledRef.current) return;
        try {
          const data: ServerMessage = JSON.parse(event.data);
          onMessageRef.current?.(data);
          setLastMessage(data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Only reconnect if not cancelled
        if (!cancelledRef.current) {
          const delay = reconnectDelayRef.current;
          reconnectDelayRef.current = Math.min(
            delay * 2,
            MAX_RECONNECT_DELAY
          );
          reconnectTimeoutRef.current = setTimeout(
            () => connectRef.current(),
            delay
          );
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      if (!cancelledRef.current) {
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
        reconnectTimeoutRef.current = setTimeout(
          () => connectRef.current(),
          delay
        );
      }
    }
  }, []);

  useEffect(() => {
    connectRef.current = connect;
    cancelledRef.current = false;
    // Defer connection by one tick so React Strict Mode's mount→unmount→remount
    // doesn't close a WebSocket before it's established (avoids "closed before connection" error)
    const connectTimeoutId = setTimeout(() => {
      connect();
    }, 0);

    return () => {
      cancelledRef.current = true;
      clearTimeout(connectTimeoutId);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, lastMessage, isConnected };
}
