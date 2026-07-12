import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  PieChart,
  Package,
  Percent,
  Receipt,
} from "lucide-react";
import {
  getDailySales,
  getExpensesSummary,
  getProductSales,
  getPaymentMethods,
  getProfitLoss,
  exportReport,
} from "../../api/reports.api";
import { today } from "../../utils/dateUtils";
import { getReportRange, REPORT_PRESETS } from "../../utils/reportDateRange";
import { formatRWF } from "../../utils/formatRWF";
import { PageHeader, DataTable } from "../../components/shared/UiShared";

const PAY_COLORS = {
  CASH: "#16a34a",
  MOMO_CODE: "#d97706",
  PHONE_NUMBER: "#2563eb",
  POS: "#7c3aed",
};

export default function DailySales() {
  const [preset, setPreset] = useState("daily");
  const [anchorDate, setAnchorDate] = useState(today());

  const { from, to, label } = useMemo(() => getReportRange(preset, anchorDate), [preset, anchorDate]);

  const qDaily = useQuery({ queryKey: ["r-daily", from, to], queryFn: () => getDailySales({ from, to }) });
  const qProducts = useQuery({
    queryKey: ["r-products", from, to],
    queryFn: () => getProductSales(from, to),
  });
  const qPayments = useQuery({
    queryKey: ["r-payments", from, to],
    queryFn: () => getPaymentMethods(from, to),
  });
  const qProfit = useQuery({
    queryKey: ["r-profit", from, to],
    queryFn: () => getProfitLoss(from, to),
  });
  const qExpenses = useQuery({
    queryKey: ["r-expenses", from, to],
    queryFn: () => getExpensesSummary(from, to),
  });

  const daily = qDaily.data?.data || {};
  const productsRaw = qProducts.data?.data;
  const products = Array.isArray(productsRaw) ? productsRaw : [];
  const payments = qPayments.data?.data || {};
  const profit = qProfit.data?.data || {};
  const expenses = qExpenses.data?.data || {};

  const paymentData = Object.entries(payments)
    .map(([name, value]) => ({
      name,
      value: Number(value),
      color: PAY_COLORS[name] || "#94a3b8",
    }))
    .filter((x) => x.value > 0);

  const payTotal = paymentData.reduce((a, x) => a + x.value, 0);
  const topProducts = products.slice(0, 5);
  const maxProduct = Math.max(...topProducts.map((p) => Number(p.total || 0)), 1);

  const isLoading =
    qDaily.isLoading || qProducts.isLoading || qPayments.isLoading || qProfit.isLoading || qExpenses.isLoading;

  const revenue = Number(daily.revenue || 0);
  const accumulatedProfit = Number(profit.profit || 0);
  const txs = Number(daily.transactions || 0);
  const cogs = Number(profit.cost_of_goods || 0);
  const expenseTotal = Number(expenses.total || 0);
  const lineRevenue = Number(profit.revenue ?? 0);
  const marginPct = lineRevenue > 0 ? Math.round((accumulatedProfit / lineRevenue) * 100) : 0;
  const avgSale = txs > 0 ? revenue / txs : 0;
  const netAfterExpenses = accumulatedProfit - expenseTotal;
  const rangeLine = from === to ? from : `${from} → ${to}`;

  const kpis = [
    { label: "Total sales", value: formatRWF(revenue), icon: TrendingUp, tone: "ok" },
    { label: "Accumulated profit", value: formatRWF(accumulatedProfit), icon: DollarSign, tone: "warn" },
    { label: "Profit margin", value: `${marginPct}%`, icon: Percent, tone: "info" },
    { label: "Operating expenses", value: formatRWF(expenseTotal), icon: Receipt, tone: "bad" },
    { label: "Net after expenses", value: formatRWF(netAfterExpenses), icon: DollarSign, tone: "ok" },
    { label: "Transactions", value: txs, icon: ShoppingBag, tone: "info" },
    { label: "Cost of goods sold", value: formatRWF(cogs), icon: PieChart, tone: "bad" },
    { label: "Average sale", value: txs > 0 ? formatRWF(avgSale) : "—", icon: Receipt, tone: "ok" },
  ];

  return (
    <div className="page-wrap analytics-page">
      <PageHeader
        title="Sales & performance report"
        subtitle={`Figures for the selected period (${label}).`}
        action={
          <div className="report-toolbar">
            <div className="preset-tabs">
              {REPORT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={preset === p.id ? "is-active" : ""}
                  onClick={() => setPreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="date-pill">
              <Calendar size={16} />
              <input
                type="date"
                value={anchorDate}
                onChange={(e) => setAnchorDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-soft"
              onClick={() => exportReport("daily-sales", from, to)}
            >
              <Download size={16} /> PDF
            </button>
          </div>
        }
      />

      <p className="range-line">
        Active range: <strong>{rangeLine}</strong>
        <span>·</span>
        {label}
      </p>

      <div className="kpi-grid">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="kpi-card">
              <div>
                <p>{k.label}</p>
                <strong>{isLoading ? "…" : k.value}</strong>
              </div>
              <span className={`kpi-card__icon is-${k.tone === "info" ? "ok" : k.tone}`}>
                <Icon size={18} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <section className="panel-card">
          <div className="section-head">
            <Package size={18} />
            <h2>Top 5 products</h2>
          </div>
          {topProducts.length === 0 ? (
            <div className="page-state">No product sales in this range.</div>
          ) : (
            <div className="hbar-list">
              {topProducts.map((p) => (
                <div key={p.product_id || p.product_name} className="hbar-row">
                  <div className="hbar-row__meta">
                    <strong>{p.product_name}</strong>
                    <span>{formatRWF(p.total)}</span>
                  </div>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill"
                      style={{ width: `${(Number(p.total || 0) / maxProduct) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel-card">
          <div className="section-head">
            <PieChart size={18} />
            <h2>Payment breakdown</h2>
          </div>
          {paymentData.length === 0 ? (
            <div className="page-state">No payment data in this range.</div>
          ) : (
            <div className="pay-mix">
              {paymentData.map((p) => {
                const pct = payTotal > 0 ? Math.round((p.value / payTotal) * 100) : 0;
                return (
                  <div key={p.name} className="pay-mix__row">
                    <div className="pay-mix__label">
                      <i style={{ background: p.color }} />
                      <strong>{p.name.replace(/_/g, " ")}</strong>
                      <span>{pct}%</span>
                    </div>
                    <div className="hbar-track">
                      <div
                        className="hbar-fill"
                        style={{ width: `${pct}%`, background: p.color }}
                      />
                    </div>
                    <em>{formatRWF(p.value)}</em>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="panel-card overflow-hidden">
        <div className="panel-card__head">
          <h2>Product performance detail</h2>
        </div>
        <DataTable
          loading={isLoading}
          data={products}
          emptyMessage="No products sold in this range."
          columns={[
            { key: "product_name", label: "Product" },
            {
              key: "qty",
              label: "Qty sold",
              render: (r) => <span className="mono">{r.qty}</span>,
            },
            {
              key: "total",
              label: "Revenue",
              render: (r) => <span className="mono strong is-ok">{formatRWF(r.total)}</span>,
            },
          ]}
        />
      </section>
    </div>
  );
}
