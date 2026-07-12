import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
} from "lucide-react";
import { getCashierPerformance } from "../../api/eod.api";
import { today } from "../../utils/dateUtils";
import { formatRWF } from "../../utils/formatRWF";
import { PageHeader } from "../../components/shared/UiShared";

export default function CashierPerformance() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["cashier-performance", from, to],
    queryFn: () => getCashierPerformance({ from, to }),
  });

  const report = reportData?.data || [];

  const filteredReport = useMemo(
    () =>
      report.filter((row) =>
        String(row.cashier_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [report, searchTerm]
  );

  const stats = useMemo(() => {
    const totalSales = report.reduce((acc, row) => acc + Number(row.cash_sales || 0), 0);
    const totalShortage = report.reduce(
      (acc, row) => acc + (row.discrepancy < 0 ? Math.abs(row.discrepancy) : 0),
      0
    );
    const totalExcess = report.reduce(
      (acc, row) => acc + (row.discrepancy > 0 ? row.discrepancy : 0),
      0
    );
    const perfectCount = report.filter((row) => row.is_balanced).length;
    return { totalSales, totalShortage, totalExcess, perfectCount };
  }, [report]);

  return (
    <div className="page-wrap analytics-page">
      <PageHeader
        title="Cashier Performance"
        subtitle={`Audit summary for ${from} to ${to}`}
        action={
          <div className="report-toolbar">
            <div className="date-pill">
              <Calendar size={16} />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span>|</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button type="button" className="btn-primary" onClick={() => window.print()}>
              <Download size={16} /> Export PDF
            </button>
          </div>
        }
      />

      <div className="kpi-grid kpi-grid--4">
        <div className="kpi-card">
          <div>
            <p>Total Cash Sales</p>
            <strong className="is-ok">{formatRWF(stats.totalSales)}</strong>
          </div>
          <span className="kpi-card__icon is-ok">
            <TrendingUp size={18} />
          </span>
        </div>
        <div className="kpi-card">
          <div>
            <p>Total Shortages</p>
            <strong className="is-bad">{formatRWF(stats.totalShortage)}</strong>
          </div>
          <span className="kpi-card__icon is-bad">
            <TrendingDown size={18} />
          </span>
        </div>
        <div className="kpi-card">
          <div>
            <p>Total Excess</p>
            <strong className="is-ok">{formatRWF(stats.totalExcess)}</strong>
          </div>
          <span className="kpi-card__icon is-ok">
            <TrendingUp size={18} />
          </span>
        </div>
        <div className="kpi-card">
          <div>
            <p>Perfect Audits</p>
            <strong>
              {stats.perfectCount} / {report.length}
            </strong>
          </div>
          <span className="kpi-card__icon">
            <CheckCircle2 size={18} />
          </span>
        </div>
      </div>

      <div className="report-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by cashier name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="filter-count">
          <Filter size={14} /> {filteredReport.length} records
        </span>
      </div>

      <div className="panel-card overflow-hidden">
        <div className="data-table__scroll">
          <table className="mgmt-table">
            <thead>
              <tr>
                {[
                  "Cashier",
                  "Date",
                  "Opening",
                  "Sales",
                  "Expenses",
                  "Status",
                  "Difference",
                  "Balanced",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="page-state">
                    Loading performance...
                  </td>
                </tr>
              ) : filteredReport.length === 0 ? (
                <tr>
                  <td colSpan={8} className="page-state">
                    No audit records found for this period.
                  </td>
                </tr>
              ) : (
                filteredReport.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-icon">
                          {String(row.cashier_name || "?").charAt(0)}
                        </div>
                        <strong>{row.cashier_name}</strong>
                      </div>
                    </td>
                    <td>{row.date}</td>
                    <td className="mono">{formatRWF(row.opening_balance)}</td>
                    <td className="mono strong">{formatRWF(row.cash_sales)}</td>
                    <td className="mono is-bad">-{formatRWF(row.cash_expenses)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          row.performance_status === "PERFECT"
                            ? "status-badge--ok"
                            : row.performance_status === "SHORTAGE"
                              ? "status-badge--bad"
                              : "status-badge--warn"
                        }`}
                      >
                        {row.performance_status}
                      </span>
                    </td>
                    <td
                      className={`mono strong ${
                        row.discrepancy < 0 ? "is-bad" : row.discrepancy > 0 ? "is-ok" : "muted"
                      }`}
                    >
                      {row.discrepancy > 0 ? "+" : ""}
                      {formatRWF(row.discrepancy)}
                    </td>
                    <td>
                      {row.is_balanced ? (
                        <CheckCircle2 className="is-ok" size={18} />
                      ) : (
                        <XCircle className="is-bad" size={18} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
