import { api, extractData } from "./axiosInstance";

export const listProducts = async (filters) =>
  extractData(await api.get("/api/products", { params: filters }));

export const createProduct = async (data) =>
  extractData(await api.post("/api/products", data));

export const getProduct = async (id) =>
  extractData(await api.get(`/api/products/${id}`));

export const updateProduct = async (id, data) =>
  extractData(await api.put(`/api/products/${id}`, data));

export const deactivateProduct = async (id) =>
  extractData(await api.patch(`/api/products/${id}/deactivate`));

export const getLowStockProducts = async () =>
  extractData(await api.get("/api/products/low-stock"));
