import { api, extractData } from "./axiosInstance";

export const listUsers = async (params) => extractData(await api.get("/api/users", { params }));
export const createUser = async (data) => extractData(await api.post("/api/users", data));
export const getUser = async (id) => extractData(await api.get(`/api/users/${id}`));
export const updateUser = async (id, data) => extractData(await api.put(`/api/users/${id}`, data));
export const deactivateUser = async (id) =>
  extractData(await api.patch(`/api/users/${id}/deactivate`));
export const resetPassword = async (id, email) =>
  extractData(await api.patch(`/api/users/${id}/reset-password`, { email }));
export const blockUser = async (id, reason) =>
  extractData(await api.post(`/api/users/${id}/block`, { reason }));
export const unblockUser = async (id) => extractData(await api.post(`/api/users/${id}/unblock`));
export const forceLogout = async (id) =>
  extractData(await api.post(`/api/users/${id}/force-logout`));
export const setUserPin = async (id, pin) =>
  extractData(await api.patch(`/api/users/${id}/pin`, { pin }));
export const clearUserPin = async (id) => extractData(await api.delete(`/api/users/${id}/pin`));
