import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Package } from "lucide-react";
import { getProduct } from "../../api/products.api";
import { formatRWF } from "../../utils/formatRWF";
import { getStockQty, formatPkgStock } from "../../utils/stock";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => getProduct(id) });
  const p = q.data?.data;

  if (q.isLoading) return <div className="page-state">Loading product...</div>;
  if (!p) return <div className="page-state">Product not found.</div>;

  const qty = getStockQty(p);
  const pkg = formatPkgStock(qty, p.package_size);

  return (
    <div className="page-wrap">
      <div className="sale-detail__top">
        <button type="button" className="icon-back" onClick={() => nav("/products")}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title">{p.name}</h1>
          <p className="page-sub">{p.categories?.name || "Uncategorized"}</p>
        </div>
        <div className="sale-detail__actions">
          <Link to={`/products/${id}/edit`} className="btn-soft">
            <Pencil size={15} /> Edit
          </Link>
          <Link to={`/inventory/${id}/history`} className="btn-soft">
            <Package size={15} /> Stock history
          </Link>
        </div>
      </div>

      <div className="sale-detail__grid">
        <div className="detail-card">
          <div className="detail-card__head">
            <h3>Details</h3>
          </div>
          <div className="detail-rows">
            <div>
              <span>Status</span>
              <strong>{p.is_active ? "Active" : "Inactive"}</strong>
            </div>
            <div>
              <span>Barcode</span>
              <strong>{p.barcode || "—"}</strong>
            </div>
            <div>
              <span>Package size</span>
              <strong>{p.is_package ? p.package_size : "—"}</strong>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-card__head">
            <h3>Pricing</h3>
          </div>
          <div className="detail-rows">
            <div>
              <span>Buying</span>
              <strong>{formatRWF(p.buying_price)}</strong>
            </div>
            <div>
              <span>Selling</span>
              <strong className="is-ok">{formatRWF(p.selling_price)}</strong>
            </div>
            {p.is_package && (
              <>
                <div>
                  <span>Pkg buying</span>
                  <strong>{formatRWF(p.package_buying_price)}</strong>
                </div>
                <div>
                  <span>Pkg selling</span>
                  <strong>{formatRWF(p.package_selling_price)}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="detail-card detail-card--wide">
          <div className="detail-card__head">
            <h3>Stock</h3>
          </div>
          <div className="detail-rows">
            <div>
              <span>On hand</span>
              <strong>{qty} pcs</strong>
            </div>
            <div>
              <span>As packages</span>
              <strong>
                {pkg ? `${pkg.pkgs} pkgs${pkg.pcs ? ` + ${pkg.pcs} pcs` : ""}` : "—"}
              </strong>
            </div>
            <div>
              <span>Low stock threshold</span>
              <strong>{p.low_stock_threshold ?? 10} pcs</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
