import { api, extractData } from "./axiosInstance";

export const listExpenses = async (params) =>
  extractData(await api.get("/api/expenses", { params }));

export const createExpense = async (data) =>
  extractData(await api.post("/api/expenses", data));

export const deleteExpense = async (id) =>
  extractData(await api.delete(`/api/expenses/${id}`));
