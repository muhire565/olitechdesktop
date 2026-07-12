import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { deactivateProduct, listProducts } from "../../api/products.api";
import { formatRWF } from "../../utils/formatRWF";
import { getStockQty, formatPkgStock } from "../../utils/stock";

const PAGE_SIZE = 15;

function StockBadge({ qty, threshold }) {
  if (qty <= 0) return <span className="status-badge status-badge--bad">Out</span>;
  if (qty < threshold) return <span className="status-badge status-badge--warn">Low</span>;
  return <span className="status-badge status-badge--ok">OK</span>;
}

export default function ProductList() {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const q = useQuery({
    queryKey: ["products", "admin-list", page, debouncedSearch, PAGE_SIZE],
    queryFn: () =>
      listProducts({
        page,
        limit: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  const deactivate = useMutation({
    mutationFn: (id) => deactivateProduct(id),
    onSuccess: () => {
      toast.success("Product deactivated");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(e.response?.data?.error || "Failed to deactivate"),
  });

  const rows = q.data?.data ?? [];
  const total = Number(q.data?.pagination?.total ?? 0);
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;

  return (
    <div className="page-wrap products-page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">{total === 0 ? "No products yet" : `${total} in catalog`}</p>
        </div>
        <Link to="/products/new" className="btn-primary">
          <Plus size={18} /> Add product
        </Link>
      </div>

      <div className="panel-card">
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="panel-card overflow-hidden">
        {q.isLoading ? (
          <div className="page-state">Loading products...</div>
        ) : rows.length === 0 ? (
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
                    {["Product", "Category", "Stock", "Pkg Stock", "Buying", "Selling", "Status", "Actions"].map(
                      (label) => (
                        <th key={label}>{label}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const qty = getStockQty(p);
                    const pkg = formatPkgStock(qty, p.package_size);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-icon">
                              <Package size={16} />
                            </div>
                            <strong>{p.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="chip">{p.categories?.name || "—"}</span>
                        </td>
                        <td>
                          <div className="stock-cell">
                            <strong>{qty}</strong>
                            <StockBadge qty={qty} threshold={p.low_stock_threshold || 10} />
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
                        <td className="mono">{formatRWF(p.buying_price)}</td>
                        <td className="mono strong">{formatRWF(p.selling_price)}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              p.is_active ? "status-badge--ok" : "status-badge--bad"
                            }`}
                          >
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="row-menu">
                            <button
                              type="button"
                              className="icon-edit"
                              onClick={() => setOpenMenuId((prev) => (prev === p.id ? null : p.id))}
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === p.id && (
                              <div className="row-menu__dropdown">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigate(`/products/${p.id}`);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Eye size={15} /> View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigate(`/products/${p.id}/edit`);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Pencil size={15} /> Edit
                                </button>
                                {p.is_active && (
                                  <button
                                    type="button"
                                    className="is-danger"
                                    onClick={() => {
                                      deactivate.mutate(p.id);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    <XCircle size={15} /> Deactivate
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {total > PAGE_SIZE && (
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
    </div>
  );
}
