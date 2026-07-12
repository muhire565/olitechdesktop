import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, Undo2 } from "lucide-react";
import { getStockHistory } from "../../api/inventory.api";
import { getProduct } from "../../api/products.api";
import { formatRwandaDateTime } from "../../utils/dateUtils";

const MOVEMENT_META = {
  stock_in: { label: "Stock In", className: "is-ok", icon: TrendingUp },
  sale: { label: "Sale", className: "is-warn", icon: TrendingDown },
  adjustment: { label: "Adjustment", className: "is-info", icon: RefreshCw },
  void_return: { label: "Void Return", className: "is-muted", icon: Undo2 },
};

export default function StockHistory() {
  const { product_id } = useParams();
  const nav = useNavigate();

  const p = useQuery({ queryKey: ["product", product_id], queryFn: () => getProduct(product_id) });
  const h = useQuery({
    queryKey: ["stock-history", product_id],
    queryFn: () => getStockHistory(product_id),
  });

  const product = p.data?.data;
  const history = h.data?.data || [];

  return (
    <div className="page-wrap">
      <div className="form-page__top">
        <button type="button" className="icon-back" onClick={() => nav("/inventory")}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title">{product ? `History: ${product.name}` : "Stock History"}</h1>
          <p className="page-sub">
            {product ? `Internal ID: #${product.id}` : "Movement history for product."}
          </p>
        </div>
      </div>

      <div className="panel-card overflow-hidden">
        {h.isLoading || p.isLoading ? (
          <div className="page-state">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="page-state">No stock movements yet.</div>
        ) : (
          <div className="data-table__scroll">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>Movement</th>
                  <th>Change</th>
                  <th>Note</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => {
                  const meta = MOVEMENT_META[r.movement_type] || {
                    label: r.movement_type,
                    className: "",
                    icon: RefreshCw,
                  };
                  const Icon = meta.icon;
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className={`movement-type ${meta.className}`}>
                          <Icon size={14} /> {meta.label}
                        </span>
                      </td>
                      <td>
                        <strong className={r.quantity_change > 0 ? "is-ok" : "is-bad"}>
                          {r.quantity_change > 0 ? `+${r.quantity_change}` : r.quantity_change}
                        </strong>
                      </td>
                      <td className="muted">{r.note || "—"}</td>
                      <td className="muted">{formatRwandaDateTime(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
