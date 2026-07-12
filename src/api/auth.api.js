import { api, extractData } from "./axiosInstance";

export const login = async (username, password) =>
  extractData(await api.post("/api/auth/login", { email: username, password }));

export const loginPin = async (pin) =>
  extractData(await api.post("/api/auth/login-pin", { pin }));

export const logout = async () => extractData(await api.post("/api/auth/logout"));

export const refreshToken = async (refresh_token) =>
  extractData(await api.post("/api/auth/refresh", { refresh_token }));

export const getMe = async () => extractData(await api.get("/api/auth/me"));

export const updateCredentials = async ({ username, current_password, new_password }) =>
  extractData(
    await api.patch("/api/auth/credentials", { username, current_password, new_password })
  );

export const setOwnPin = async ({ pin, current_password }) =>
  extractData(await api.patch("/api/auth/pin", { pin, current_password }));

export const clearOwnPin = async ({ current_password }) =>
  extractData(await api.delete("/api/auth/pin", { data: { current_password } }));
