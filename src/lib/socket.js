import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const socket = io(API_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  transports: ["websocket", "polling"],
});

export default socket;
