import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Package, Archive, Save } from "lucide-react";
import { stockIn } from "../../api/inventory.api";
import { getProduct } from "../../api/products.api";
import { useAuthStore } from "../../store/authStore";

export default function StockIn() {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [extraPieces, setExtraPieces] = useState("");
  const [note, setNote] = useState("");
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get("product_id");
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!productIdParam) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getProduct(productIdParam);
        const prod = res?.data;
        if (cancelled || !prod) return;
        setProduct(prod);
        toast.success(`Loaded: ${prod.name}`);
      } catch {
        if (!cancelled) toast.error("Could not load product");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productIdParam]);

  const m = useMutation({
    mutationFn: stockIn,
    onSuccess: () => {
      toast.success("Stock added successfully");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      nav("/inventory");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Failed to add stock"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product) return toast.error("Select a product from inventory first");

    const pkgSize = Number(product.package_size || 1);
    const totalPieces = Number(quantity || 0) * pkgSize + Number(extraPieces || 0);
    if (totalPieces <= 0) return toast.error("Please enter a valid quantity");

    m.mutate({
      product_id: product.id,
      quantity: totalPieces,
      performed_by: user.id,
      note: note || `Stock In: ${product.name} (${quantity || 0} pkgs, ${extraPieces || 0} pcs)`,
    });
  };

  const totalPcs =
    product && (quantity || extraPieces)
      ? Number(quantity || 0) * Number(product.package_size || 1) + Number(extraPieces || 0)
      : 0;

  return (
    <div className="page-wrap form-page">
      <div className="form-page__top">
        <button type="button" className="icon-back" onClick={() => nav("/inventory")}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1>Stock In</h1>
          <p className="page-sub">Add inventory to a product.</p>
        </div>
      </div>

      <form className="panel-card stock-form" onSubmit={handleSubmit}>
        <div className="stock-form__product">
          <div className="product-icon is-ok">
            <Package size={20} />
          </div>
          <div>
            <strong>{product ? product.name : "No product selected"}</strong>
            <p>
              {product
                ? `ID: #${product.id}`
                : "Open Inventory and choose a product to stock in."}
            </p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>Packages</span>
            <input
              className="field-input"
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!product}
            />
          </label>
          <label>
            <span>Extra pieces</span>
            <input
              className="field-input"
              type="number"
              placeholder="0"
              value={extraPieces}
              onChange={(e) => setExtraPieces(e.target.value)}
              disabled={!product}
            />
          </label>
          <label>
            <span>Note (optional)</span>
            <input
              className="field-input"
              placeholder="e.g. Weekly replenishment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!product}
            />
          </label>
        </div>

        {totalPcs > 0 && (
          <div className="callout is-ok">Total pieces to add: {totalPcs} pcs</div>
        )}

        <div className="form-page__actions">
          <button type="button" className="btn-ghost" onClick={() => nav("/inventory")}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!product || m.isPending}>
            {m.isPending ? (
              <>
                <Archive size={16} /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Stock
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
