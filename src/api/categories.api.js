import { api, extractData } from "./axiosInstance";

export const listCategories = async (params) =>
  extractData(await api.get("/api/categories", { params }));

export const createCategory = async (data) =>
  extractData(await api.post("/api/categories", data));
