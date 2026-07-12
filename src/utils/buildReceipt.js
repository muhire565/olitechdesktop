/** Build a printable receipt object from getSale() response data. */
export function buildReceiptFromSale({ sale, items = [], payments = [], cashierName }) {
  if (!sale) return null;
  const createdAt = new Date(sale.created_at);
  const pad = (n) => String(n).padStart(2, "0");
  const date = Number.isNaN(createdAt.getTime())
    ? ""
    : `${createdAt.getFullYear()}-${pad(createdAt.getMonth() + 1)}-${pad(createdAt.getDate())}`;
  const time = Number.isNaN(createdAt.getTime())
    ? ""
    : `${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}:${pad(createdAt.getSeconds())}`;

  const paid = payments.reduce((a, p) => a + Number(p.amount || 0), 0);
  const total = Number(sale.total_amount || 0);
  const discount = Number(sale.discount_amount || 0);

  return {
    receipt_number: sale.receipt_number,
    store_name: "OlitechHub",
    store_address: "Kimironko, Kigali, Rwanda",
    store_phone: "0788308035",
    date,
    time,
    cashier_name: cashierName || `#${sale.cashier_id || "—"}`,
    items: items.map((item) => ({
      product_name: item.products?.name || item.product_name || "Product",
      sold_as: item.sold_as,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
    })),
    subtotal: total + discount,
    discount_amount: discount,
    total,
    payments: payments.map((p) => ({ method: p.method, amount: Number(p.amount) })),
    change_due: Math.max(0, paid - total),
    totalPaid: paid,
    receipt_footer: "Thank you for shopping with us.",
    currency: "RWF",
  };
}
