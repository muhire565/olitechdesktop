import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { refreshAccessToken } from "../api/axiosInstance";

/** Refresh before typical Supabase JWT expiry (~1h) so the session never drops while the app is open. */
const REFRESH_INTERVAL_MS = 20 * 60 * 1000;
/** Skip immediate refresh right after login — the access token is already fresh. */
const INITIAL_DELAY_MS = 60 * 1000;

function tokenExpiresSoon(token, withinMs = 10 * 60 * 1000) {
  try {
    const payload = JSON.parse(atob(String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload?.exp) return true;
    return payload.exp * 1000 <= Date.now() + withinMs;
  } catch {
    return true;
  }
}

async function keepAlive({ force = false } = {}) {
  const { isAuthenticated, refresh_token, token } = useAuthStore.getState();
  if (!isAuthenticated || !refresh_token) return;
  if (!force && token && !tokenExpiresSoon(token)) return;
  try {
    await refreshAccessToken();
  } catch {
    // Leave session intact; interceptor retries on the next API 401.
  }
}

/**
 * Keeps the auth session alive indefinitely while the user remains logged in:
 * - waits briefly after login (token is already fresh)
 * - refreshes on a timer when near expiry
 * - refreshes when the window/app becomes visible again (if needed)
 */
export function useSessionKeepAlive() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const initial = setTimeout(() => keepAlive(), INITIAL_DELAY_MS);
    const timer = setInterval(() => keepAlive(), REFRESH_INTERVAL_MS);

    const onFocus = () => keepAlive();
    const onVisibility = () => {
      if (document.visibilityState === "visible") keepAlive();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated]);
}
