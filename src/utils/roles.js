export const normalizeRole = (role) => String(role || "").trim().toLowerCase();

export const routeForRole = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "owner") return "/dashboard";
  if (normalized === "cashier") return "/pos";
  if (normalized === "developer") return "/settings";
  return "/login";
};
