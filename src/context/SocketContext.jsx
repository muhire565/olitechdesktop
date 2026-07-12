import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import socket from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

const SocketContext = createContext({
  socket: null,
  connected: false,
  isReconnecting: false,
  transport: null,
  error: null,
});

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [isReconnecting, setReconnecting] = useState(false);
  const [transport, setTransport] = useState(null);
  const [error, setError] = useState(null);

  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sseRef = useRef(null);
  const wsFailCount = useRef(0);

  useRealtimeSync();

  const closeSse = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  };

  const openSse = (tok) => {
    if (sseRef.current) return;
    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    closeSse();
    const url = `${API}/api/stream?_token=${encodeURIComponent(tok)}`;
    const sse = new EventSource(url);
    sseRef.current = sse;

    sse.addEventListener("connected", () => {
      setConnected(true);
      setTransport("sse");
      setReconnecting(false);
      setError(null);
      toast.success("Live updates via fallback stream", { id: "sse-ok", duration: 3000 });
    });

    sse.onerror = () => {
      setConnected(false);
      setTransport(null);
    };
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      socket.auth = { token };
      socket.connect();
    } else {
      socket.disconnect();
      closeSse();
      setConnected(false);
      setTransport(null);
    }

    const onConnect = () => {
      wsFailCount.current = 0;
      setConnected(true);
      setReconnecting(false);
      setTransport("ws");
      setError(null);
      closeSse();
    };

    const onDisconnect = (reason) => {
      setConnected(false);
      if (reason !== "io server disconnect" && reason !== "io client disconnect") {
        setReconnecting(true);
      } else {
        setReconnecting(false);
      }
    };

    const onConnectError = (err) => {
      console.error("[Socket] Connection Error:", err.message);
      setError(err.message);
      setConnected(false);
      setReconnecting(false);
      wsFailCount.current += 1;

      if (wsFailCount.current >= 3 && token && !sseRef.current) {
        console.warn("[Socket] Falling back to SSE after 3 WS failures");
        openSse(token);
      }
    };

    const onReconnectAttempt = () => {
      setReconnecting(true);
      setError(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("reconnect_attempt", onReconnectAttempt);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("reconnect_attempt", onReconnectAttempt);
    };
  }, [token, isAuthenticated]);

  useEffect(() => () => closeSse(), []);

  return (
    <SocketContext.Provider value={{ socket, connected, isReconnecting, transport, error }}>
      {children}
    </SocketContext.Provider>
  );
};
