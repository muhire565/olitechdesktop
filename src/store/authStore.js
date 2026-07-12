import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeRole } from "../utils/roles";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      token: null,
      refresh_token: null,
      isAuthenticated: false,
      login: ({ user, role, token, refresh_token }) =>
        set({
          user,
          role: normalizeRole(role ?? user?.role),
          token,
          refresh_token,
          isAuthenticated: true,
        }),
      logout: () => {
        const token = get().token;
        set({
          user: null,
          role: null,
          token: null,
          refresh_token: null,
          isAuthenticated: false,
        });
        if (token && API_BASE) {
          fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      },
      setToken: (token) => set({ token }),
    }),
    { name: "supermarket-auth" }
  )
);
