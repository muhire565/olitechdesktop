import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Clock,
  RefreshCw,
  DollarSign,
  Banknote,
  Smartphone,
  CreditCard,
  Archive,
  Wallet,
  Calendar,
} from "lucide-react";
import { getDashboardSummary } from "../api/reports.api";
import { getLowStockProducts } from "../api/products.api";
import { listEOD } from "../api/eod.api";
import { formatRWF } from "../utils/formatRWF";
import { today } from "../utils/dateUtils";
import { useAuthStore } from "../store/authStore";
import { useSocketContext } from "../context/SocketContext";
import StatCard from "../components/shared/StatCard";

const PAY_KEYS = [
  { key: "CASH", label: "Cash Sales", color: "var(--accent-primary)" },
  { key: "PHONE_NUMBER", label: "Phone Pay", color: "var(--info)" },
  { key: "POS", label: "POS Card", color: "var(--stat-transactions-fg)" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [salesDate, setSalesDate] = useState(today());

  const qSummary = useQuery({
    queryKey: ["dashboard-summary", salesDate],
    queryFn: () => getDashboardSummary(salesDate),
  });
  const low = useQuery({ queryKey: ["low-stock"], queryFn: getLowStockProducts });
  const eod = useQuery({
    queryKey: ["eod"],
    queryFn: () => listEOD({ status: "pending" }),
  });

  const summary = qSummary.data?.data || {};
  const stat = summary.daily || {};
  const profitData = summary.profit || {};
  const expensesData = summary.expenses || {};
  const stockReport = summary.stock || {};
  const paymentRaw = summary.payments || {};
  const pendingEodCount = (eod.data?.data?.data || []).filter((x) => x.status === "pending").length;

  const lowStockData = (low.data?.data || []).map((p) => {
    const qty = Array.isArray(p.inventory)
      ? Number(p.inventory?.[0]?.quantity_in_stock || 0)
      : Number(p.inventory?.quantity_in_stock || 0);
    const thr =
      p.low_stock_threshold === null || p.low_stock_threshold === undefined
        ? Number(summary.default_low_stock_threshold || 10)
        : Number(p.low_stock_threshold);
    return { ...p, stock_value: qty, threshold_value: thr };
  });

  const payTotal =
    Number(paymentRaw.CASH || 0) +
    Number(paymentRaw.PHONE_NUMBER || 0) +
    Number(paymentRaw.POS || 0);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    qc.invalidateQueries({ queryKey: ["low-stock"] });
    qc.invalidateQueries({ queryKey: ["eod"] });
    qc.invalidateQueries({ queryKey: ["sales-recent"] });
  }, [qc]);

  const { connected, isReconnecting, transport } = useSocketContext();
  const kpiLoading = qSummary.isLoading || low.isLoading;

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const greetingName =
    user?.username ||
    (typeof user?.full_name === "string" ? user.full_name.split(" ")[0] : "") ||
    (typeof user?.email === "string" ? user.email.split("@")[0] : "") ||
    "Owner";

  const liveLabel =
    connected && transport === "ws"
      ? "Live"
      : connected && transport === "sse"
        ? "Fallback"
        : isReconnecting
          ? "Reconnecting"
          : "Offline";

  const liveTone =
    connected && transport === "ws"
      ? "is-live"
      : connected || isReconnecting
        ? "is-warn"
        : "is-offline";

  const openProductSalesByMethod = (method) =>
    navigate(`/reports/product-sales?payment_method=${encodeURIComponent(method)}`);

  return (
    <div className="dash">
      <div className="dash__header">
        <div>
          <h1 className="dash__title">
            {greeting}, <span>{greetingName}</span>
          </h1>
          <p className="dash__subtitle">
            Overview for {salesDate === today() ? "Today" : salesDate.split("-").reverse().join("/")}
          </p>
        </div>
        <div className="dash__actions">
          <label className="dash__date">
            <Calendar size={16} />
            <input
              type="date"
              value={salesDate}
              max={today()}
              onChange={(e) => setSalesDate(e.target.value)}
            />
          </label>
          <button type="button" className="dash__refresh" onClick={refresh}>
            <RefreshCw size={15} className={kpiLoading ? "is-spinning" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="dash__live-row">
        <span className={`dash__live ${liveTone}`}>
          <span className="dash__live-dot" />
          {liveLabel}
        </span>
      </div>

      {kpiLoading ? (
        <div className="dash__skeleton-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dash__skeleton" />
          ))}
        </div>
      ) : (
        <div className="dash__grid dash__grid--4">
          <StatCard
            index={0}
            label="Today's Revenue"
            value={formatRWF(stat.revenue)}
            icon={TrendingUp}
            variant="revenue"
            onClick={() => navigate("/reports/daily-sales")}
          />
          <StatCard
            index={1}
            label="Estimated Profit"
            value={formatRWF(profitData.profit)}
            icon={DollarSign}
            variant="profit"
            onClick={() => navigate("/reports/daily-sales")}
          />
          <StatCard
            index={2}
            label="Cash Savings"
            value={formatRWF(summary.savings?.total || 0)}
            icon={Archive}
            variant="warning"
            onClick={() => navigate("/savings")}
          />
          <StatCard
            index={3}
            label="Today's Expenses"
            value={formatRWF(expensesData.total || 0)}
            icon={Wallet}
            variant="info"
            onClick={() => navigate("/expenses")}
          />
        </div>
      )}

      <section className="dash__section">
        <h2 className="dash__section-title">Financial Breakdown</h2>

        <div className="dash__grid dash__grid--3">
          <StatCard
            index={0}
            label="Pending EOD"
            value={String(pendingEodCount)}
            icon={Clock}
            variant="warning"
            pulse={pendingEodCount > 0}
            onClick={() => navigate("/eod")}
          />
          <StatCard
            index={1}
            label="Transactions"
            value={String(stat.transactions ?? 0)}
            icon={ShoppingBag}
            variant="transactions"
            onClick={() => navigate("/sales")}
          />
          <StatCard
            index={2}
            label="Low Stock Items"
            value={String(lowStockData.length)}
            icon={AlertTriangle}
            variant="warning"
            pulse={lowStockData.length > 0}
            onClick={() => navigate("/inventory")}
          />
        </div>

        <div className="dash__grid dash__grid--6">
          <StatCard
            label="Cash Sales"
            value={formatRWF(paymentRaw.CASH || 0)}
            icon={Banknote}
            variant="revenue"
            onClick={() => openProductSalesByMethod("CASH")}
          />
          <StatCard
            label="Phone Pay"
            value={formatRWF(paymentRaw.PHONE_NUMBER || 0)}
            icon={Smartphone}
            variant="info"
            onClick={() => openProductSalesByMethod("PHONE_NUMBER")}
          />
          <StatCard
            label="POS Card"
            value={formatRWF(paymentRaw.POS || 0)}
            icon={CreditCard}
            variant="transactions"
            onClick={() => openProductSalesByMethod("POS")}
          />
          <StatCard
            label="Total Debt"
            value={formatRWF(summary.credits?.outstanding || 0)}
            icon={TrendingUp}
            variant="warning"
            onClick={() => navigate("/credits")}
          />
          <StatCard
            label="Today's Credit"
            value={formatRWF(paymentRaw.CREDIT || 0)}
            icon={TrendingUp}
            variant="warning"
            onClick={() => navigate("/credits")}
          />
          <StatCard
            label="Cash Savings"
            value={formatRWF(summary.savings?.total || 0)}
            icon={Archive}
            variant="revenue"
            onClick={() => navigate("/savings")}
          />
        </div>

        <div className="dash__grid dash__grid--2">
          <StatCard
            label="Total Stock Value"
            value={formatRWF(stockReport.total_value)}
            icon={Archive}
            variant="info"
            onClick={() => navigate("/inventory")}
          />
          <StatCard
            label="Expected Revenue"
            value={formatRWF(stockReport.total_expected_revenue)}
            icon={TrendingUp}
            variant="success"
            onClick={() => navigate("/inventory")}
          />
        </div>

        <div className="dash__panel">
          <div className="dash__panel-head">
            <h3>Payment mix</h3>
            <span>{formatRWF(payTotal)}</span>
          </div>
          <div className="dash__panel-row">
            <span>Cost of goods</span>
            <strong>{formatRWF(profitData.cost_of_goods)}</strong>
          </div>
          <div className="dash__pay-bars">
            {PAY_KEYS.map((row) => {
              const v = Number(paymentRaw[row.key] || 0);
              const pct = payTotal > 0 ? Math.round((v / payTotal) * 100) : 0;
              return (
                <div key={row.key} className="dash__pay-row">
                  <span>{row.label}</span>
                  <strong>{formatRWF(v)}</strong>
                  <div className="dash__bar-track">
                    <div
                      className="dash__bar-fill"
                      style={{ width: `${pct}%`, background: row.color }}
                    />
                  </div>
                  <em>{pct}%</em>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
