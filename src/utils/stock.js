export function getStockQty(productOrRow) {
  const inv = productOrRow?.inventory ?? productOrRow;
  if (Array.isArray(inv)) return Number(inv?.[0]?.quantity_in_stock || 0);
  if (inv && typeof inv === "object" && "quantity_in_stock" in inv) {
    return Number(inv.quantity_in_stock || 0);
  }
  return Number(productOrRow?.quantity_in_stock || 0);
}

export function formatPkgStock(qty, packageSize) {
  const size = Number(packageSize || 0);
  if (size <= 0) return null;
  const pkgs = Math.floor(qty / size);
  const pcs = qty % size;
  return { pkgs, pcs };
}
