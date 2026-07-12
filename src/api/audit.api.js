import { api, extractData } from "./axiosInstance";

export const listAuditLogs = async (filters) =>
  extractData(await api.get("/api/audit", { params: filters }));

export const getAuditLog = async (id) => extractData(await api.get(`/api/audit/${id}`));
