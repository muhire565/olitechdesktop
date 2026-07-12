import { api } from "./axiosInstance";

export const listLoginLogs = async (params = {}) => {
  const res = await api.get("/api/auth/login-logs", { params });
  return res.data;
};

export const deleteLoginLog = async (id) => {
  const res = await api.delete(`/api/auth/login-logs/${id}`);
  return res.data;
};

export const clearAllLoginLogs = async () => {
  const res = await api.delete("/api/auth/login-logs/all");
  return res.data;
};
