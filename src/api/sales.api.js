import { api, extractData } from "./axiosInstance";

export const createSale = async (data) => extractData(await api.post("/api/sales", data));

export const listSales = async (filters) =>
  extractData(await api.get("/api/sales", { params: filters }));

export const getSale = async (id) => extractData(await api.get(`/api/sales/${id}`));

export const getReceipt = async (id) =>
  extractData(await api.get(`/api/sales/${id}/receipt`));

export const voidSale = async (id, void_reason) =>
  extractData(await api.post(`/api/sales/${id}/void`, { void_reason }));
