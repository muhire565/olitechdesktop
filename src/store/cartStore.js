import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  items: [],
  discount: 0,
  paymentRows: [{ method: "PHONE_NUMBER", amount: 0 }],
  printReceipt: false,
  selectedCustomer: null,
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  clearCustomer: () => set({ selectedCustomer: null }),
  addItem: (product, soldAs, quantity = null) =>
    set((s) => {
      const id = `${product.id}-${soldAs}`;
      const qtyStep = product?.is_weighed ? 0.25 : 1;
      const qty = Number(quantity ?? qtyStep);
      const found = s.items.find((i) => i.id === id);
      if (found) {
        return {
          items: s.items.map((i) =>
            i.id === id ? { ...i, quantity: Number((i.quantity + qty).toFixed(3)) } : i
          ),
        };
      }
      const unit_price =
        soldAs === "package" ? product.package_selling_price : product.selling_price;
      return {
        items: [
          ...s.items,
          {
            id,
            product_id: product.id,
            name: product.name,
            sold_as: soldAs,
            quantity: Number(qty.toFixed(3)),
            is_weighed: Boolean(product?.is_weighed),
            unit_of_measure: product?.unit_of_measure || "piece",
            unit_price,
            product,
          },
        ],
      };
    }),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  updateQty: (id, qty) =>
    set((s) => ({
      items: s.items.map((i) => {
        if (i.id !== id) return i;
        const minQty = i.is_weighed ? 0.05 : 1;
        return { ...i, quantity: Number(Math.max(minQty, Number(qty || 0)).toFixed(3)) };
      }),
    })),
  setDiscount: (val) => set({ discount: Number(val || 0) }),
  addPaymentRow: () =>
    set((s) => ({ paymentRows: [...s.paymentRows, { method: "PHONE_NUMBER", amount: 0 }] })),
  updatePaymentRow: (idx, field, val) =>
    set((s) => ({
      paymentRows: s.paymentRows.map((r, i) =>
        i === idx
          ? { ...r, [field]: field === "amount" ? Math.round(Number(val || 0)) : val }
          : r
      ),
    })),
  removePaymentRow: (idx) =>
    set((s) => ({ paymentRows: s.paymentRows.filter((_, i) => i !== idx) })),
  clearCart: () =>
    set({
      items: [],
      discount: 0,
      paymentRows: [{ method: "PHONE_NUMBER", amount: 0 }],
      printReceipt: false,
      selectedCustomer: null,
    }),
  togglePrintReceipt: () => set((s) => ({ printReceipt: !s.printReceipt })),
  subtotal: () =>
    get().items.reduce((a, i) => a + Math.round(Number(i.unit_price) * Number(i.quantity)), 0),
  total: () => Math.round(get().subtotal() - Number(get().discount || 0)),
  totalPaid: () =>
    get().paymentRows.reduce((a, p) => a + Math.round(Number(p.amount || 0)), 0),
  changeDue: () => Math.max(0, get().totalPaid() - get().total()),
  isPaymentComplete: () => get().totalPaid() >= get().total(),
}));
