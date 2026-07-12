import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 12000,
});

let refreshPromise = null;

async function refreshAccessToken() {
  const { refresh_token, login, user, role } = useAuthStore.getState();
  if (!refresh_token) throw new Error("No refresh token");

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`, { refresh_token })
      .then((resp) => {
        const { token, refresh_token: newRefresh } = resp.data.data;
        login({
          user: useAuthStore.getState().user || user,
          role: useAuthStore.getState().role || role,
          token,
          refresh_token: newRefresh,
        });
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 503) {
      toast.error(
        data?.error || "Server connection lost. Retrying...",
        { id: "server-timeout" }
      );
      return Promise.reject(error);
    }

    // Account blocked / inactive — end session immediately
    if (status === 403 && (data?.blocked || data?.code === 403)) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Admin force-logout / explicit revocation
    if (status === 401 && String(data?.error || "").toLowerCase().includes("revoked")) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Access token expired or invalid — refresh and retry (keep user logged in)
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refresh_token, logout } = useAuthStore.getState();

      if (refresh_token) {
        try {
          const token = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }

    return Promise.reject(error);
  }
);

export { refreshAccessToken };
export const extractData = (response) => response.data;
