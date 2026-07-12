import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  History,
  Settings2,
  Package,
  AlertTriangle,
  CircleOff,
  X,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { listInventory } from "../../api/inventory.api";
import { getLowStockProducts } from "../../api/products.api";
import { useSocket } from "../../hooks/useSocket";
import { formatRwandaDateTime } from "../../utils/dateUtils";
import { formatPkgStock } from "../../utils/stock";

const PAGE_SIZE = 15;

function StockBadge({ qty, threshold }) {
  if (qty <= 0) return <span className="status-badge status-badge--bad">Out</span>;
  if (qty <= threshold) return <span className="status-badge status-badge--warn">Low</span>;
  return <span className="status-badge status-badge--ok">OK</span>;
}

export default function InventoryList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tableAnchorRef = useRef(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stockModalRow, setStockModalRow] = useState(null);
  const lowOnly = searchParams.get("filter") === "low";

  useSocket("inventory:update", (newItem) => {
    queryClient.setQueryData(["inventory", page, PAGE_SIZE, debouncedSearch], (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: old.data.map((item) =>
          item.product_id === newItem.product_id ? { ...item, ...newItem } : item
        ),
      };
    });
    queryClient.invalidateQueries({ queryKey: ["inventory", "low-stock-all"] });
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const q = useQuery({
    queryKey: ["inventory", page, PAGE_SIZE, debouncedSearch],
    queryFn: () => listInventory({ page, limit: PAGE_SIZE, search: debouncedSearch }),
    enabled: !lowOnly,
  });

  const qLow = useQuery({
    queryKey: ["inventory", "low-stock-all"],
    queryFn: getLowStockProducts,
    staleTime: 30000,
  });

  const handleSearch = (val) => {
    setSearch(val);
    if (val.trim() && searchParams.get("filter")) setSearchParams({});
  };

  useEffect(() => {
    if (!stockModalRow) return;
    const onKey = (e) => {
      if (e.key === "Escape") setStockModalRow(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [stockModalRow]);

  const rows = q.data?.data ?? [];
  const lowRows = useMemo(
    () =>
      (qLow.data?.data || []).map((p) => {
        const qty = Array.isArray(p.inventory)
          ? Number(p.inventory?.[0]?.quantity_in_stock || 0)
          : Number(p.inventory?.quantity_in_stock || 0);
        return {
          id: `low-${p.id}`,
          product_id: p.id,
          products: {
            name: p.name,
            buying_price: p.buying_price,
            package_buying_price: p.package_buying_price,
            low_stock_threshold: Number(p.low_stock_threshold || 0),
            is_package: p.is_package,
            package_size: p.package_size,
          },
          quantity_in_stock: qty,
          last_updated: p.updated_at || p.created_at || new Date().toISOString(),
        };
      }),
    [qLow.data]
  );

  const tableRows = lowOnly ? lowRows : rows;
  const pagination = lowOnly ? undefined : q.data?.pagination;
  const summary = q.data?.summary ?? { low_stock: 0, out_of_stock: 0 };
  const totalProducts = Number(pagination?.total ?? 0);
  const lowStockCount = Number(qLow.data?.data?.length ?? summary.low_stock ?? 0);
  const totalPages =
    pagination?.total > 0 ? Math.max(1, Math.ceil(pagination.total / PAGE_SIZE)) : 1;

  const modalPid = stockModalRow?.product_id;
  const modalName = stockModalRow?.products?.name || (modalPid ? `Product #${modalPid}` : "");
  const modalQty = Number(stockModalRow?.quantity_in_stock || 0);
  const modalThreshold = stockModalRow?.products?.low_stock_threshold || 10;

  const stockValue = (r) => {
    const p = r.products || {};
    const qty = Number(r.quantity_in_stock || 0);
    if (p.is_package && Number(p.package_size || 0) > 0 && Number(p.package_buying_price || 0) > 0) {
      const pkgSize = Number(p.package_size);
      const packages = Math.floor(qty / pkgSize);
      const extraPieces = qty % pkgSize;
      return packages * Number(p.package_buying_price) + extraPieces * Number(p.buying_price || 0);
    }
    return qty * Number(p.buying_price || 0);
  };

  return (
    <div className="page-wrap inventory-page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-sub">Monitor stock levels. Click a row to stock in or adjust.</p>
        </div>
        <div className="toolbar-actions">
          <Link to="/inventory/stock-in" className="btn-primary">
            <Plus size={16} /> Stock In
          </Link>
          <Link to="/inventory/adjustment" className="btn-soft">
            <Settings2 size={16} /> Adjust
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <button type="button" className="kpi-card is-clickable" onClick={() => tableAnchorRef.current?.scrollIntoView({ behavior: "smooth" })}>
          <div>
            <p>Total products</p>
            <strong>{totalProducts || "—"}</strong>
          </div>
          <span className="kpi-card__icon is-ok">
            <Package size={20} />
          </span>
        </button>
        <button
          type="button"
          className="kpi-card is-clickable"
          onClick={() => {
            setSearchParams({ filter: "low" });
            tableAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div>
            <p>Low stock</p>
            <strong>{lowStockCount}</strong>
          </div>
          <span className="kpi-card__icon is-warn">
            <AlertTriangle size={20} />
          </span>
        </button>
        <button type="button" className="kpi-card is-clickable" onClick={() => tableAnchorRef.current?.scrollIntoView({ behavior: "smooth" })}>
          <div>
            <p>Out of stock</p>
            <strong>{summary.out_of_stock ?? 0}</strong>
          </div>
          <span className="kpi-card__icon is-bad">
            <CircleOff size={20} />
          </span>
        </button>
      </div>

      {lowOnly && (
        <div className="filter-banner">
          <p>Showing low-stock products only.</p>
          <button type="button" onClick={() => setSearchParams({})}>
            Show all
          </button>
        </div>
      )}

      <div className="panel-card">
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => handleSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div ref={tableAnchorRef} className="panel-card overflow-hidden">
        {q.isLoading && !tableRows.length ? (
          <div className="page-state">Loading inventory...</div>
        ) : tableRows.length === 0 ? (
          <div className="page-state">
            <Package size={40} strokeWidth={1.5} />
            <p>No products found</p>
          </div>
        ) : (
          <>
            <div className="data-table__scroll">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    {["Product", "Current stock", "Package stock", "Stock value", "Last updated", "Actions"].map(
                      (label) => (
                        <th key={label}>{label}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => {
                    const qty = Number(r.quantity_in_stock || 0);
                    const threshold = r.products?.low_stock_threshold || 10;
                    const pkg = formatPkgStock(qty, r.products?.package_size);
                    return (
                      <tr key={r.id || r.product_id} onClick={() => setStockModalRow(r)} className="is-clickable">
                        <td>
                          <strong>{r.products?.name || `#${r.product_id}`}</strong>
                        </td>
                        <td>
                          <div className="stock-cell">
                            <strong
                              className={
                                qty <= 0 ? "is-bad" : qty <= threshold ? "is-warn" : "is-ok"
                              }
                            >
                              {qty}
                            </strong>
                            <StockBadge qty={qty} threshold={threshold} />
                          </div>
                        </td>
                        <td>
                          {pkg ? (
                            <div className="pkg-cell">
                              <strong>{pkg.pkgs}</strong> <span>pkgs</span>
                              {pkg.pcs > 0 && (
                                <>
                                  {" "}
                                  <em>{pkg.pcs}</em> <span>pcs</span>
                                </>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="mono strong">
                          RWF {Math.round(stockValue(r)).toLocaleString()}
                        </td>
                        <td className="muted">{formatRwandaDateTime(r.last_updated)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-soft"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inventory/${r.product_id}/history`);
                            }}
                          >
                            <History size={14} /> History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagination?.total > PAGE_SIZE && (
              <div className="data-table__pager">
                <span>
                  Page {page} / {totalPages}
                </span>
                <div>
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {stockModalRow &&
        createPortal(
          <div className="modal-overlay" onClick={() => setStockModalRow(null)} role="presentation">
            <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog">
              <div className="modal-card__head">
                <div>
                  <p className="eyebrow">Inventory</p>
                  <h2>Update stock</h2>
                  <p className="page-sub">Choose how you want to change quantities.</p>
                </div>
                <button type="button" className="icon-edit" onClick={() => setStockModalRow(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="stock-modal-product">
                <div className="product-icon">
                  <Package size={20} />
                </div>
                <div>
                  <strong>{modalName}</strong>
                  <p>
                    On hand: <em>{modalQty}</em>
                  </p>
                </div>
              </div>
              <div className="stock-modal-actions">
                <Link
                  to={`/inventory/stock-in?product_id=${modalPid}`}
                  onClick={() => setStockModalRow(null)}
                  className="choice-card is-ok"
                >
                  <Plus size={20} />
                  <strong>Stock In</strong>
                  <span>Receive goods and increase on-hand quantity.</span>
                  <em>
                    Continue <ArrowRight size={12} />
                  </em>
                </Link>
                <Link
                  to={`/inventory/adjustment?product_id=${modalPid}`}
                  onClick={() => setStockModalRow(null)}
                  className="choice-card is-warn"
                >
                  <Settings2 size={20} />
                  <strong>Adjust Stock</strong>
                  <span>Correct counts, damage, or shrinkage (+ or −).</span>
                  <em>
                    Continue <ArrowRight size={12} />
                  </em>
                </Link>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setStockModalRow(null)}>
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
