import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  CheckCircle2,
  FileText,
  Keyboard,
  Tag,
  Printer,
  User,
} from "lucide-react";
import { listProducts } from "../api/products.api";
import { createSale, listSales } from "../api/sales.api";
import { getEODPreview, setOpeningBalance } from "../api/eod.api";
import { today } from "../utils/dateUtils";
import { formatRWF } from "../utils/formatRWF";
import { printReceipt } from "../utils/receiptPrinter";
import { invalidateSalesRelatedQueries } from "../utils/invalidateSalesCaches";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { useSocket } from "../hooks/useSocket";
import { normalizeRole } from "../utils/roles";
import PaymentNotificationBanner from "../components/shared/PaymentNotificationBanner";
import CustomerSearch from "../components/shared/CustomerSearch";
import ReceiptPrintFrame from "../components/shared/ReceiptPrintFrame";

const PAYMENT_METHOD_ORDER = ["PHONE_NUMBER", "CASH", "POS", "CREDIT"];

const METHOD_META = {
  CASH: { label: "Cash", icon: Banknote },
  POS: { label: "POS Card", icon: CreditCard },
  PHONE_NUMBER: { label: "Phone Pay", icon: Smartphone },
  CREDIT: { label: "Credit", icon: FileText },
};

function getStock(product) {
  return Array.isArray(product.inventory)
    ? Number(product.inventory?.[0]?.quantity_in_stock || 0)
    : Number(product.inventory?.quantity_in_stock || 0);
}

function StockBadge({ qty, threshold }) {
  if (qty <= 0) return <span className="pos-stock pos-stock--out">Out</span>;
  if (qty < threshold) return <span className="pos-stock pos-stock--low">Low</span>;
  return <span className="pos-stock pos-stock--ok">{qty}</span>;
}

function CartItemRow({ item, index, onRemove, onUpdateQty }) {
  const step = item.is_weighed ? 0.25 : 1;
  return (
    <div className="pos-cart-item">
      <div className="pos-cart-item__index">{index + 1}</div>
      <div className="pos-cart-item__info">
        <p className="pos-cart-item__name">{item.name}</p>
        <p className="pos-cart-item__price">
          {formatRWF(item.unit_price)}
          <span> / {item.sold_as === "package" ? "pkg" : "piece"}</span>
        </p>
      </div>
      <div className="pos-qty">
        <button type="button" onClick={() => onUpdateQty(item.id, Number(item.quantity) - step)}>
          <Minus size={14} strokeWidth={3} />
        </button>
        <span>{item.quantity}</span>
        <button type="button" onClick={() => onUpdateQty(item.id, Number(item.quantity) + step)}>
          <Plus size={14} strokeWidth={3} />
        </button>
      </div>
      <div className="pos-cart-item__total">
        <p>{formatRWF(item.unit_price * item.quantity)}</p>
        <button type="button" className="pos-cart-item__remove" onClick={() => onRemove(item.id)}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function PaymentCardSelector({ selectedMethod, onSelect }) {
  return (
    <div className="pos-pay-grid">
      {PAYMENT_METHOD_ORDER.map((key) => {
        const meta = METHOD_META[key];
        const Icon = meta.icon;
        const active = selectedMethod === key;
        return (
          <button
            key={key}
            type="button"
            className={`pos-pay-method${active ? " is-active" : ""}`}
            onClick={() => onSelect(key)}
          >
            <Icon size={18} strokeWidth={active ? 2.75 : 2} />
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function KeyboardShortcutsOverlay({ onClose }) {
  const shortcuts = [
    { key: "F3", desc: "Focus product search" },
    { key: "F9", desc: "Complete sale" },
    { key: "F10", desc: "Clear cart" },
    { key: "Esc", desc: "Close modals / cancel" },
    { key: "Delete", desc: "Remove last cart item" },
  ];
  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal pos-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="pos-modal__head">
          <div className="pos-modal__title">
            <Keyboard size={22} />
            <h3>Shortcuts</h3>
          </div>
          <button type="button" className="pos-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="pos-shortcuts">
          {shortcuts.map(({ key, desc }) => (
            <div key={key} className="pos-shortcut-row">
              <kbd>{key}</kbd>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isCompletingSale, setIsCompletingSale] = useState(false);
  const [postSalePrintReceipt, setPostSalePrintReceipt] = useState(null);
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [productLimit] = useState(100);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [discountMode, setDiscountMode] = useState("flat");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [pendingMethodSelect, setPendingMethodSelect] = useState(null);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const searchInputRef = useRef(null);

  const user = useAuthStore((s) => s.user);
  const role = normalizeRole(useAuthStore((s) => s.role) || user?.role);
  const cart = useCartStore();
  const queryClient = useQueryClient();

  useSocket("inventory:update", () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  });

  useSocket("sale:new", () => {
    queryClient.invalidateQueries({ queryKey: ["sales-last"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  });

  const openingSession = useQuery({
    queryKey: ["opening-session", user?.id, today()],
    queryFn: () => getEODPreview(user?.id, today()),
    enabled: !!user?.id && role === "cashier",
  });

  const setOpeningBalanceMutation = useMutation({
    mutationFn: setOpeningBalance,
    onSuccess: () => {
      toast.success("Opening balance set!");
      openingSession.refetch();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Failed to set opening balance"),
  });

  useEffect(() => {
    if (role === "cashier" && openingSession.isSuccess && !openingSession.data?.data?.existing) {
      setShowOpeningModal(true);
    } else {
      setShowOpeningModal(false);
    }
  }, [role, user?.id, openingSession.isSuccess, openingSession.data]);

  const handleSetOpening = () => {
    if (openingAmount === "" || Number(openingAmount) < 0) {
      return toast.error("Enter a valid amount");
    }
    setOpeningBalanceMutation.mutate(
      { cashier_id: user.id, date: today(), amount: openingAmount },
      { onSuccess: () => setShowOpeningModal(false) }
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const completeSaleRef = useRef(() => {});

  const q = useQuery({
    queryKey: ["products", debouncedSearch, productLimit],
    queryFn: async () => {
      try {
        return await listProducts({ search: debouncedSearch, limit: productLimit });
      } catch (err) {
        if (!debouncedSearch) throw err;
        return listProducts({ limit: productLimit });
      }
    },
    staleTime: 60000,
  });

  const lastSales = useQuery({
    queryKey: ["sales-last"],
    queryFn: () => listSales({ page: 1, limit: 1 }),
  });

  const saleMutation = useMutation({
    mutationFn: createSale,
    onError: (e) => toast.error(e.response?.data?.error || "Sale failed"),
  });

  const rawProducts = q.data?.data || [];
  const products = useMemo(() => {
    const term = String(debouncedSearch || "").trim().toLowerCase();
    const bySearch = term
      ? rawProducts.filter((p) => {
          const name = String(p.name || "").toLowerCase();
          const category = String(p.categories?.name || "").toLowerCase();
          return name.includes(term) || category.includes(term);
        })
      : rawProducts;
    if (!hideOutOfStock) return bySearch;
    return bySearch.filter((p) => getStock(p) > 0);
  }, [rawProducts, hideOutOfStock, debouncedSearch]);

  const addProductToCart = (product, asPackage = false) => {
    if (asPackage && product.is_package) {
      cart.addItem({ ...product, selling_price: product.package_selling_price }, "package");
      toast.success(`Added Package: ${product.name}`);
    } else {
      cart.addItem(product, "unit");
      toast.success(`Added: ${product.name}`);
    }
  };

  useEffect(() => {
    if (cart.paymentRows.length === 1) {
      cart.updatePaymentRow(0, "amount", cart.total());
    }
  }, [cart.total(), cart.paymentRows.length]);

  useEffect(() => {
    if (!postSalePrintReceipt) return undefined;
    const trigger = window.setTimeout(() => printReceipt(), 100);
    const onAfterPrint = () => setPostSalePrintReceipt(null);
    window.addEventListener("afterprint", onAfterPrint);
    const fallback = window.setTimeout(() => setPostSalePrintReceipt(null), 5000);
    return () => {
      window.clearTimeout(trigger);
      window.clearTimeout(fallback);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [postSalePrintReceipt]);

  const completeSale = useCallback(() => {
    if (isCompletingSale || saleMutation.isPending) return;
    if (!cart.items.length) return toast.error("Empty cart");
    if (cart.totalPaid() < cart.total()) return toast.error("Short payment");
    setIsCompletingSale(true);
    saleMutation.mutate(
      {
        cashier_id: user.id,
        customer_id: cart.selectedCustomer?.id,
        print_receipt: cart.printReceipt,
        items: cart.items.map((i) => ({
          product_id: i.product_id,
          sold_as: i.sold_as,
          quantity: i.quantity,
        })),
        payments: cart.paymentRows,
        discount_amount: cart.discount,
      },
      {
        onSuccess: (res) => {
          const shouldPrint = cart.printReceipt;
          cart.clearCart();
          toast.success("Sale completed!");
          invalidateSalesRelatedQueries(queryClient);
          lastSales.refetch();
          if (shouldPrint) setPostSalePrintReceipt(res.data.receipt);
        },
        onError: (e) => toast.error(e?.response?.data?.error || "Sale failed"),
        onSettled: () => setIsCompletingSale(false),
      }
    );
  }, [isCompletingSale, saleMutation, cart, user?.id, queryClient, lastSales]);

  completeSaleRef.current = completeSale;

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const inInput = ["input", "textarea", "select"].includes(tag);

      if (e.key === "?") {
        setShowShortcuts((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setShowCustomerSearch(false);
        return;
      }
      if (e.key === "F3") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "F9") {
        e.preventDefault();
        completeSaleRef.current();
        return;
      }
      if (e.key === "F10") {
        e.preventDefault();
        useCartStore.getState().clearCart();
        return;
      }
      if (!inInput && e.key === "Delete") {
        const items = useCartStore.getState().items;
        if (items.length > 0) {
          e.preventDefault();
          useCartStore.getState().removeItem(items[items.length - 1].id);
          toast("Last item removed");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handlePaymentMethodSelect = (method) => {
    if (method === "CREDIT" && !cart.selectedCustomer) {
      setPendingMethodSelect(method);
      setShowCustomerSearch(true);
    } else {
      cart.updatePaymentRow(cart.paymentRows.length - 1, "method", method);
    }
  };

  const onCustomerSelected = (customer) => {
    cart.setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    if (pendingMethodSelect) {
      cart.updatePaymentRow(cart.paymentRows.length - 1, "method", pendingMethodSelect);
      setPendingMethodSelect(null);
    }
  };

  const remaining = Math.max(0, Number(cart.total() || 0) - Number(cart.totalPaid() || 0));
  const changeDue = cart.changeDue();
  const paymentComplete = cart.items.length > 0 && remaining === 0;
  const subtotal = cart.subtotal();

  return (
    <div className="pos">
      <PaymentNotificationBanner />

      <div className="pos__grid">
        <section className="pos-left">
          <div className="pos-panel pos-panel--search">
            <div className="pos-panel__head">
              <div className="pos-panel__title">
                <Search size={20} />
                <h2>Product Selection</h2>
              </div>
              <button type="button" className="pos-ghost-btn" onClick={() => setShowShortcuts(true)}>
                Shortcuts (?)
              </button>
            </div>

            <div className="pos-search pos-search--lg">
              <Search size={18} />
              <input
                ref={searchInputRef}
                placeholder="Search products by name... (F3)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <label className="pos-check">
              <input
                type="checkbox"
                checked={hideOutOfStock}
                onChange={(e) => setHideOutOfStock(e.target.checked)}
              />
              Hide out of stock
            </label>
          </div>

          <div className="pos-panel pos-panel--table">
            <div className="pos-table-wrap">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Add</th>
                  </tr>
                </thead>
                <tbody>
                  {q.isLoading && (
                    <tr>
                      <td colSpan={4} className="pos-empty-cell">
                        Loading products...
                      </td>
                    </tr>
                  )}
                  {!q.isLoading && products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="pos-empty-cell">
                        No products found
                      </td>
                    </tr>
                  )}
                  {products.map((p) => {
                    const stock = getStock(p);
                    const out = stock <= 0;
                    return (
                      <tr key={p.id} className={out ? "is-out" : ""}>
                        <td>
                          <p className="pos-prod-name">{p.name}</p>
                          <p className="pos-prod-cat">{p.categories?.name || "No Category"}</p>
                        </td>
                        <td>
                          <p className="pos-prod-price">{formatRWF(p.selling_price)}</p>
                          <p className="pos-prod-cat">Per piece</p>
                        </td>
                        <td>
                          <StockBadge qty={stock} threshold={Number(p.low_stock_threshold ?? 10)} />
                        </td>
                        <td>
                          <div className="pos-add-actions">
                            {p.is_package && (
                              <button
                                type="button"
                                className="pos-pkg-btn"
                                disabled={out}
                                onClick={() => !out && addProductToCart(p, true)}
                              >
                                Pkg
                              </button>
                            )}
                            <button
                              type="button"
                              className="pos-add-btn"
                              disabled={out}
                              onClick={() => !out && addProductToCart(p)}
                            >
                              <Plus size={18} strokeWidth={3} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="pos-right">
          <div className="pos-cart-head">
            <div className="pos-cart-head__left">
              <div className="pos-cart-head__icon">
                <ShoppingCart size={18} />
              </div>
              <div>
                <h2>Your Cart</h2>
                <p>{cart.items.length} items</p>
              </div>
            </div>
            <button type="button" className="pos-clear-btn" onClick={cart.clearCart}>
              Clear
            </button>
          </div>

          <div className="pos-cart-body">
            {cart.items.length === 0 ? (
              <div className="pos-cart-empty">
                <ShoppingCart size={64} strokeWidth={1.25} />
                <p>Cart is empty</p>
                <span>Select products from the list to begin</span>
              </div>
            ) : (
              <>
                <div className="pos-cart-list">
                  {cart.items.map((item, i) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      index={i}
                      onRemove={cart.removeItem}
                      onUpdateQty={cart.updateQty}
                    />
                  ))}
                </div>

                <div className="pos-pay-panel">
                  <div className="pos-pay-panel__head">
                    <h3>Payment Method</h3>
                    <button type="button" onClick={cart.addPaymentRow}>
                      + Split Pay
                    </button>
                  </div>

                  <PaymentCardSelector
                    selectedMethod={cart.paymentRows[cart.paymentRows.length - 1]?.method}
                    onSelect={handlePaymentMethodSelect}
                  />

                  {cart.selectedCustomer && (
                    <div className="pos-customer-chip">
                      <div>
                        <User size={16} />
                        <div>
                          <span>Customer for Credit</span>
                          <strong>{cart.selectedCustomer.full_name}</strong>
                        </div>
                      </div>
                      <button type="button" onClick={cart.clearCustomer}>
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className="pos-pay-rows">
                    {cart.paymentRows.map((r, i) => {
                      const M = METHOD_META[r.method] || METHOD_META.CASH;
                      const Ic = M.icon;
                      return (
                        <div key={i} className="pos-pay-row">
                          <div className="pos-pay-row__icon">
                            <Ic size={15} />
                          </div>
                          <div className="pos-pay-row__fields">
                            <span>{M.label}</span>
                            <input
                              type="number"
                              value={r.amount || ""}
                              onChange={(e) => cart.updatePaymentRow(i, "amount", e.target.value)}
                            />
                          </div>
                          {cart.paymentRows.length > 1 && (
                            <button type="button" onClick={() => cart.removePaymentRow(i)}>
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pos-totals-grid">
                    <div className="pos-discount-box">
                      <div className="pos-discount-box__head">
                        <span>
                          <Tag size={12} /> Discount
                        </span>
                        <div className="pos-discount-toggle">
                          <button
                            type="button"
                            className={discountMode === "flat" ? "is-active" : ""}
                            onClick={() => setDiscountMode("flat")}
                          >
                            RWF
                          </button>
                          <button
                            type="button"
                            className={discountMode === "pct" ? "is-active" : ""}
                            onClick={() => setDiscountMode("pct")}
                          >
                            %
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        placeholder="0"
                        value={
                          discountMode === "pct"
                            ? cart.discount > 0
                              ? Number(((cart.discount / subtotal) * 100).toFixed(1))
                              : ""
                            : cart.discount || ""
                        }
                        onChange={(e) => {
                          const raw = Number(e.target.value || 0);
                          if (discountMode === "pct") {
                            cart.setDiscount(Math.round(subtotal * (Math.min(100, raw) / 100)));
                          } else {
                            cart.setDiscount(Math.min(raw, subtotal));
                          }
                        }}
                      />
                    </div>

                    <div className="pos-bill-box">
                      <span>Total Bill</span>
                      <strong>{formatRWF(cart.total())}</strong>
                    </div>
                  </div>

                  <div className="pos-remain-box">
                    <div>
                      <span>Remaining</span>
                      <strong>{formatRWF(remaining)}</strong>
                    </div>
                    {changeDue > 0 && (
                      <div>
                        <span>Change Due</span>
                        <em>{formatRWF(changeDue)}</em>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pos-cart-footer">
            <label className="pos-check">
              <input
                type="checkbox"
                checked={cart.printReceipt}
                onChange={cart.togglePrintReceipt}
              />
              <Printer size={16} />
              Print Receipt
            </label>
            <button
              type="button"
              className={`pos-complete-btn${paymentComplete && !isCompletingSale ? " is-ready" : ""}`}
              disabled={!cart.items.length || !paymentComplete || isCompletingSale}
              onClick={completeSale}
            >
              <CheckCircle2 size={18} strokeWidth={2.75} />
              {isCompletingSale ? "Processing..." : "Complete Sale (F9)"}
            </button>
          </div>
        </section>
      </div>

      {postSalePrintReceipt &&
        createPortal(<ReceiptPrintFrame receipt={postSalePrintReceipt} />, document.body)}
      {showShortcuts && <KeyboardShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
      {showCustomerSearch && (
        <CustomerSearch
          onSelect={onCustomerSelected}
          onCancel={() => {
            setShowCustomerSearch(false);
            setPendingMethodSelect(null);
          }}
        />
      )}

      {showOpeningModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal pos-modal--opening">
            <div className="pos-opening-icon">
              <Banknote size={36} />
            </div>
            <h3>Opening Session</h3>
            <p>Enter your starting cash balance for today</p>
            <input
              type="number"
              autoFocus
              className="pos-opening-input"
              placeholder="0"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetOpening()}
            />
            <button
              type="button"
              className="pos-complete-btn is-ready"
              disabled={setOpeningBalanceMutation.isPending}
              onClick={handleSetOpening}
            >
              {setOpeningBalanceMutation.isPending ? "Starting..." : "Start Shift"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
