import { api, extractData } from "./axiosInstance";

export const createPaymentNotification = async (data) =>
  extractData(await api.post("/api/payment-notifications", data));

export const listAllPaymentNotifications = async () =>
  extractData(await api.get("/api/payment-notifications/all"));

export const listActivePaymentNotifications = async () =>
  extractData(await api.get("/api/payment-notifications"));

export const clearPaymentNotification = async (id) =>
  extractData(await api.patch(`/api/payment-notifications/${id}/clear`));

export const restorePaymentNotification = async (id) =>
  extractData(await api.patch(`/api/payment-notifications/${id}/restore`));

export const deletePaymentNotification = async (id) =>
  extractData(await api.delete(`/api/payment-notifications/${id}`));
