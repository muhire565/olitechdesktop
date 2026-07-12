import { useEffect, useRef } from "react";
import socket from "../lib/socket";

export const useSocket = (eventName, callback) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!eventName) return;

    const handler = (data) => {
      if (callbackRef.current) callbackRef.current(data);
    };

    socket.on(eventName, handler);
    return () => socket.off(eventName, handler);
  }, [eventName]);
};
