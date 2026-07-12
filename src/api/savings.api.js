import { api } from "./axiosInstance";

export const listSavings = async (params) => {
  const { data } = await api.get("/api/savings", { params });
  return data;
};

export const recordSavings = async (payload) => {
  const { data } = await api.post("/api/savings", payload);
  return data;
};

export const getSavingsSummary = async () => {
  const { data } = await api.get("/api/savings/summary");
  return data;
};
