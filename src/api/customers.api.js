import { api } from "./axiosInstance";

export const listCustomers = async (params) => {
  const { data } = await api.get("/api/customers", { params });
  return data;
};

export const createCustomer = async (payload) => {
  const { data } = await api.post("/api/customers", payload);
  return data;
};

export const updateCustomer = async (id, payload) => {
  const { data } = await api.put(`/api/customers/${id}`, payload);
  return data;
};

export const getCustomer = async (id) => {
  const { data } = await api.get(`/api/customers/${id}`);
  return data;
};
