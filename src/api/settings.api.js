import { api, extractData } from "./axiosInstance";

export const getSettings = async () => extractData(await api.get("/api/settings"));
export const updateSettings = async (data) => extractData(await api.put("/api/settings", data));
export const updatePaymentMethods = async (accepted_payment_methods) =>
  extractData(await api.patch("/api/settings/payment-methods", { accepted_payment_methods }));
export const updateLowStockThreshold = async (default_low_stock_threshold) =>
  extractData(
    await api.patch("/api/settings/low-stock-threshold", { default_low_stock_threshold })
  );
