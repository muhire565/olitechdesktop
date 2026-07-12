import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Settings2, ShieldAlert, Save } from "lucide-react";
import { adjustment } from "../../api/inventory.api";
import { getProduct } from "../../api/products.api";
import { useAuthStore } from "../../store/authStore";
import { getStockQty } from "../../utils/stock";

export default function StockAdjustment() {
  const [product, setProduct] = useState(null);
  const [productLoadFailed, setProductLoadFailed] = useState(false);
  const [change, setChange] = useState("");
  const [extraChange, setExtraChange] = useState("");
  const [note, setNote] = useState("");
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get("product_id");
  const preselected = Boolean(productIdParam);
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!productIdParam) return;
    setProductLoadFailed(false);
    let cancelled = false;
    (async () => {
      try {
        const res = await getProduct(productIdParam);
        const prod = res?.data;
        if (cancelled || !prod) return;
        setProduct(prod);
        toast.success(`Loaded: ${prod.name}`);
      } catch {
        if (!cancelled) {
          setProductLoadFailed(true);
          toast.error("Could not load product");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productIdParam]);

  const m = useMutation({
    mutationFn: adjustment,
    onSuccess: () => {
      toast.success("Stock adjusted successfully");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      nav("/inventory");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Adjustment failed"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product) {
      return toast.error(
        preselected ? "Product is still loading. Try again in a moment." : "Select a product first."
      );
    }

    const pkgSize = Number(product.package_size || 1);
    const calcTotal = Number(change || 0) * pkgSize + Number(extraChange || 0);
    if (calcTotal === 0) return toast.error("Enter non-zero change");

    m.mutate({
      product_id: product.id,
      quantity_change: calcTotal,
      performed_by: user.id,
      note: note || `Manual adjustment: ${change || 0} pkgs, ${extraChange || 0} pcs`,
    });
  };

  const stock = product ? getStockQty(product) : null;
  const totalPcs =
    product && (change || extraChange)
      ? Number(change || 0) * Number(product.package_size || 1) + Number(extraChange || 0)
      : 0;

  return (
    <div className="page-wrap form-page">
      <div className="form-page__top">
        <button type="button" className="icon-back" onClick={() => nav("/inventory")}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1>Inventory adjustment</h1>
          <p className="page-sub">Correct on-hand quantities with +/− changes.</p>
        </div>
      </div>

      <form className="panel-card stock-form is-warn" onSubmit={handleSubmit}>
        <div className="stock-form__product">
          <div className="product-icon is-warn">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="eyebrow">Selected product</p>
            <strong>{product ? product.name : "No product selected"}</strong>
            <p>
              {product ? (
                <>
                  Current stock: <em>{stock}</em> units
                </>
              ) : preselected ? (
                productLoadFailed ? (
                  <>
                    Could not load this product.{" "}
                    <button type="button" className="text-link" onClick={() => nav("/inventory")}>
                      Return to inventory
                    </button>
                  </>
                ) : (
                  "Loading product…"
                )
              ) : (
                "Select a product from the inventory list."
              )}
            </p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>Packages (+/−)</span>
            <input
              className="field-input"
              type="number"
              placeholder="e.g. -2 or +5"
              value={change}
              onChange={(e) => setChange(e.target.value)}
              disabled={!product}
            />
          </label>
          <label>
            <span>Pieces (+/−)</span>
            <input
              className="field-input"
              type="number"
              placeholder="e.g. -5"
              value={extraChange}
              onChange={(e) => setExtraChange(e.target.value)}
              disabled={!product}
            />
          </label>
          <label>
            <span>Adjustment reason</span>
            <input
              className="field-input"
              placeholder="e.g. Damaged"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!product}
            />
          </label>
        </div>

        {totalPcs !== 0 && (
          <div className="callout is-warn">Total pieces to adjust: {totalPcs} pcs</div>
        )}

        <div className="form-page__actions">
          <button type="button" className="btn-ghost" onClick={() => nav("/inventory")}>
            Cancel
          </button>
          <button type="submit" className="btn-primary is-amber" disabled={!product || m.isPending}>
            {m.isPending ? (
              <>
                <Settings2 size={16} /> Processing…
              </>
            ) : (
              <>
                <Save size={16} /> Apply adjustment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
