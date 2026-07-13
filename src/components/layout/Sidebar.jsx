import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Archive,
  Wallet,
  Receipt,
  BarChart2,
  Clock,
  Users,
  Settings,
  FileText,
  ClipboardList,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Activity,
  Code2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { logout as apiLogout } from "../../api/auth.api";
import BrandLogo from "../shared/BrandLogo";

const GROUPS = [
  {
    id: "operations",
    label: "Operations",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner"] },
      { to: "/pos", label: "POS", icon: ShoppingCart, roles: ["owner", "cashier"] },
      { to: "/sales", label: "Sales", icon: Receipt, roles: ["owner", "cashier"] },
      { to: "/customers", label: "Customers", icon: Users, roles: ["owner", "cashier"] },
      { to: "/eod/submit", label: "Submit EOD", icon: ClipboardList, roles: ["cashier"] },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      { to: "/products", label: "Products", icon: Package, roles: ["owner"] },
      { to: "/expenses", label: "Expenses", icon: Wallet, roles: ["owner"] },
      { to: "/inventory", label: "Inventory", icon: Archive, roles: ["owner"] },
      { to: "/credits", label: "Credit Ledger", icon: FileText, roles: ["owner"] },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      { to: "/reports/daily-sales", label: "Reports", icon: BarChart2, roles: ["owner"] },
      { to: "/reports/cashier-performance", label: "Cashier Performance", icon: Users, roles: ["owner"] },
      { to: "/eod", label: "EOD Reviews", icon: Clock, roles: ["owner"] },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { to: "/account-settings", label: "Account Settings", icon: Settings, roles: ["owner"] },
      { to: "/users", label: "Users", icon: Users, roles: ["developer"] },
      { to: "/settings", label: "Dev Dashboard", icon: Code2, roles: ["developer"] },
      { to: "/developer/notifications", label: "Notifications", icon: Bell, roles: ["developer"] },
      { to: "/developer/login-activity", label: "Login Activity", icon: Activity, roles: ["developer"] },
      { to: "/audit", label: "Audit Log", icon: FileText, roles: ["developer"] },
    ],
  },
];

export default function Sidebar({
  role,
  collapsed,
  onToggleCollapse,
  overlay = false,
  overlayOpen = false,
  onOverlayClose,
}) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const nav = useNavigate();

  const showLabels = overlay || !collapsed;

  const initials = (user?.full_name || user?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayName =
    user?.full_name || user?.username || user?.email?.split("@")[0] || "User";

  const roleLabel = String(role || "user").replace(/_/g, " ").toUpperCase();

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // local logout still proceeds
    }
    logout();
    toast.success("Signed out");
    nav("/login", { replace: true });
  };

  return (
    <aside
      className={[
        "app-sidebar",
        !overlay && collapsed ? "is-collapsed" : "",
        overlay ? "is-overlay" : "",
        overlay && overlayOpen ? "is-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={overlay ? !overlayOpen : undefined}
    >
      <div className="app-sidebar__brand">
        <div className="app-sidebar__brand-logo">
          <BrandLogo size={28} />
        </div>
        {showLabels && (
          <div className="app-sidebar__brand-text">
            <p className="app-sidebar__brand-title">OLITECHHUB</p>
            <p className="app-sidebar__brand-sub">SMART POS</p>
          </div>
        )}
        {overlay && (
          <button
            type="button"
            className="app-sidebar__close"
            onClick={onOverlayClose}
            aria-label="Close navigation"
          >
            <X size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      <nav className="app-sidebar__nav">
        {GROUPS.map((group, groupIndex) => {
          const visible = group.items.filter((i) => i.roles.includes(role));
          if (!visible.length) return null;
          return (
            <div
              key={group.id}
              className={`app-sidebar__group${groupIndex > 0 ? " is-spaced" : ""}`}
            >
              {showLabels && (
                <p className="app-sidebar__group-label">{group.label}</p>
              )}
              <div className="app-sidebar__links">
                {visible.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={!showLabels ? item.label : undefined}
                      onClick={() => {
                        if (overlay) onOverlayClose?.();
                      }}
                      className={({ isActive }) =>
                        `app-sidebar__link${isActive ? " is-active" : ""}`
                      }
                    >
                      <Icon size={18} strokeWidth={2} />
                      {showLabels && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="app-sidebar__footer">
        <div className={`app-sidebar__profile${!showLabels ? " is-collapsed" : ""}`}>
          <div className="app-sidebar__profile-row">
            <div className="app-sidebar__avatar">{initials}</div>
            {showLabels && (
              <div className="app-sidebar__user-meta">
                <p className="app-sidebar__user-name">{displayName}</p>
                <span className="app-sidebar__role-badge">{roleLabel}</span>
              </div>
            )}
            <button
              type="button"
              className="app-sidebar__logout"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {!overlay && (
          <button
            type="button"
            className="app-sidebar__collapse"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen size={14} strokeWidth={2} />
            ) : (
              <>
                <PanelLeftClose size={14} strokeWidth={2} />
                <span>COLLAPSE</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
