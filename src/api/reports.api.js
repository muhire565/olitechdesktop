import { api, extractData } from "./axiosInstance";

/** @param {string | { date?: string, from?: string, to?: string }} dateOrRange */
export const getDailySales = async (dateOrRange) => {
  const params =
    typeof dateOrRange === "string"
      ? { date: dateOrRange }
      : dateOrRange?.from && dateOrRange?.to
        ? { from: dateOrRange.from, to: dateOrRange.to }
        : { date: dateOrRange?.date };
  return extractData(await api.get("/api/reports/daily-sales", { params }));
};

export const getDashboardSummary = async (dateOrRange) => {
  const params =
    typeof dateOrRange === "string"
      ? { date: dateOrRange }
      : dateOrRange?.from && dateOrRange?.to
        ? { from: dateOrRange.from, to: dateOrRange.to }
        : { date: dateOrRange?.date };
  return extractData(await api.get("/api/reports/dashboard-summary", { params }));
};

export const getProductSales = async (from, to, paymentMethod) =>
  extractData(
    await api.get("/api/reports/product-sales", {
      params: { from, to, ...(paymentMethod ? { payment_method: paymentMethod } : {}) },
    })
  );

export const getStockReport = async () => extractData(await api.get("/api/reports/stock"));

export const getProfitLoss = async (from, to) =>
  extractData(await api.get("/api/reports/profit-loss", { params: { from, to } }));

export const getPaymentMethods = async (from, to) =>
  extractData(await api.get("/api/reports/payment-methods", { params: { from, to } }));

export const getExpensesSummary = async (from, to) =>
  extractData(await api.get("/api/reports/expenses", { params: { from, to } }));

export const exportReport = async (type, from, to, extraParams = {}) => {
  const params = { from, to, export: "pdf", ...extraParams };
  const response = await api.get(`/api/reports/${type}`, { params, responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank");
};
