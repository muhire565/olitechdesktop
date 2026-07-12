import { api } from "./axiosInstance";

export const listCredits = async (params) => {
  const { data } = await api.get("/api/credits", { params });
  return data;
};

export const recordInstallment = async (payload) => {
  const { data } = await api.post("/api/credits/installments", payload);
  return data;
};

export const getInstallments = async (id) => {
  const { data } = await api.get(`/api/credits/${id}/installments`);
  return data;
};
