import { api, extractData } from "./axiosInstance";

export const submitEOD = async (data) => extractData(await api.post("/api/eod/submit", data));
export const listEOD = async (params) => extractData(await api.get("/api/eod", { params }));
export const getEOD = async (id) => extractData(await api.get(`/api/eod/${id}`));
export const approveEOD = async (id) => extractData(await api.patch(`/api/eod/${id}/approve`));
export const flagEOD = async (id, notes) =>
  extractData(await api.patch(`/api/eod/${id}/flag`, { notes }));
export const deleteEOD = async (id) => extractData(await api.delete(`/api/eod/${id}`));

export const getEODPreview = async (cashier_id, date) =>
  extractData(await api.get("/api/eod/preview", { params: { cashier_id, date } }));

export const setOpeningBalance = async (data) =>
  extractData(await api.post("/api/eod/opening-balance", data));

export const getCashierPerformance = async (params) =>
  extractData(await api.get("/api/eod/performance", { params }));
