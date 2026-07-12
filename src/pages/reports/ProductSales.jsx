import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Calendar, Download } from "lucide-react";
import { getProductSales, exportReport } from "../../api/reports.api";
import { today } from "../../utils/dateUtils";
import { formatRWF } from "../../utils/formatRWF";
import { PageHeader } from "../../components/shared/UiShared";

const PAYMENT_METHOD_LABELS = {
  CASH: "Cash",
  MOMO_CODE: "MoMo Code",
  PHONE_NUMBER: "Phone Pay",
  POS: "POS Card",
};

export default function ProductSales() {
  const [searchParams] = useSearchParams();
  const paymentMethod = String(searchParams.get("payment_method") || "").toUpperCase();
  const paymentMethodLabel = PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod;
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const q = useQuery({
    queryKey: ["r-prod", from, to, paymentMethod],
    queryFn: () => getProductSales(from, to, paymentMethod || undefined),
  });

  const rows = Array.isArray(q.data?.data) ? q.data.data : [];

  return (
    <div className="page-wrap analytics-page">
      <PageHeader
        title="Product Sales"
        subtitle="Revenue by product for the selected range."
        action={
          <div className="report-toolbar">
            <div className="date-pill">
              <Calendar size={16} />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <span>|</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button
              type="button"
              className="btn-soft"
              onClick={() =>
                exportReport("product-sales", from, to, {
                  payment_method: paymentMethod || undefined,
                })
              }
            >
              <Download size={16} /> PDF
            </button>
          </div>
        }
      />

      {paymentMethod ? (
        <p className="range-line">
          Payment filter: <strong>{paymentMethodLabel}</strong>
        </p>
      ) : null}

      <div className="panel-card overflow-hidden">
        {q.isLoading ? (
          <div className="page-state">Loading product sales...</div>
        ) : rows.length === 0 ? (
          <div className="page-state">No products sold for this filter and date range.</div>
        ) : (
          <div className="data-table__scroll">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.product_id}>
                    <td>
                      <strong>{row.product_name}</strong>
                    </td>
                    <td className="mono">{Number(row.qty || 0)}</td>
                    <td className="mono strong">{formatRWF(row.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
