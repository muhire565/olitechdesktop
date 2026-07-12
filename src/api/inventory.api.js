import { api, extractData } from "./axiosInstance";

export const listInventory = async (params) =>
  extractData(await api.get("/api/inventory", { params }));

export const stockIn = async (data) =>
  extractData(await api.post("/api/inventory/stock-in", data));

export const adjustment = async (data) =>
  extractData(await api.post("/api/inventory/adjustment", data));

export const getStockHistory = async (productId) =>
  extractData(await api.get(`/api/inventory/${productId}/history`));
