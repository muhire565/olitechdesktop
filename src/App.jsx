import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import SalesList from "./pages/SalesList";
import SaleDetail from "./pages/SaleDetail";
import CustomerList from "./pages/CustomerList";
import ProductList from "./pages/products/ProductList";
import ProductForm from "./pages/products/ProductForm";
import ProductDetail from "./pages/products/ProductDetail";
import Expenses from "./pages/Expenses";
import InventoryList from "./pages/inventory/InventoryList";
import StockIn from "./pages/inventory/StockIn";
import StockAdjustment from "./pages/inventory/StockAdjustment";
import StockHistory from "./pages/inventory/StockHistory";
import CreditLedger from "./pages/credits/CreditLedger";
import DailySales from "./pages/reports/DailySales";
import ProductSales from "./pages/reports/ProductSales";
import CashierPerformance from "./pages/reports/CashierPerformance";
import EODList from "./pages/eod/EODList";
import EODDetail from "./pages/eod/EODDetail";
import EODSubmit from "./pages/eod/EODSubmit";
import AccountSettings from "./pages/settings/AccountSettings";
import DeveloperDashboard from "./pages/settings/Settings";
import UserList from "./pages/users/UserList";
import UserForm from "./pages/users/UserForm";
import AuditLog from "./pages/audit/AuditLog";
import DeveloperNotifications from "./pages/developer/DeveloperNotifications";
import LoginActivity from "./pages/developer/LoginActivity";
import ComingSoon from "./pages/ComingSoon";
import AppShell from "./components/layout/AppShell";
import RoleGuard from "./components/shared/RoleGuard";
import UpdateBanner from "./components/UpdateBanner";

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  if (isAuthenticated) {
    const dest =
      role === "cashier" ? "/pos" : role === "developer" ? "/settings" : "/dashboard";
    return <Navigate to={dest} replace />;
  }
  return children;
}

const PLACEHOLDER_ROUTES = ["/savings"];

export default function App() {
  return (
    <HashRouter>
      <UpdateBanner />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/pos"
            element={
              <RoleGuard roles={["cashier", "owner"]}>
                <POS />
              </RoleGuard>
            }
          />
          <Route
            path="/sales"
            element={
              <RoleGuard roles={["owner", "cashier"]}>
                <SalesList />
              </RoleGuard>
            }
          />
          <Route
            path="/sales/:id"
            element={
              <RoleGuard roles={["owner"]}>
                <SaleDetail />
              </RoleGuard>
            }
          />
          <Route
            path="/customers"
            element={
              <RoleGuard roles={["owner", "cashier"]}>
                <CustomerList />
              </RoleGuard>
            }
          />
          <Route
            path="/products"
            element={
              <RoleGuard roles={["owner"]}>
                <ProductList />
              </RoleGuard>
            }
          />
          <Route
            path="/products/new"
            element={
              <RoleGuard roles={["owner"]}>
                <ProductForm />
              </RoleGuard>
            }
          />
          <Route
            path="/products/:id"
            element={
              <RoleGuard roles={["owner"]}>
                <ProductDetail />
              </RoleGuard>
            }
          />
          <Route
            path="/products/:id/edit"
            element={
              <RoleGuard roles={["owner"]}>
                <ProductForm />
              </RoleGuard>
            }
          />
          <Route
            path="/expenses"
            element={
              <RoleGuard roles={["owner"]}>
                <Expenses />
              </RoleGuard>
            }
          />
          <Route
            path="/inventory"
            element={
              <RoleGuard roles={["owner"]}>
                <InventoryList />
              </RoleGuard>
            }
          />
          <Route
            path="/inventory/stock-in"
            element={
              <RoleGuard roles={["owner"]}>
                <StockIn />
              </RoleGuard>
            }
          />
          <Route
            path="/inventory/adjustment"
            element={
              <RoleGuard roles={["owner"]}>
                <StockAdjustment />
              </RoleGuard>
            }
          />
          <Route
            path="/inventory/:product_id/history"
            element={
              <RoleGuard roles={["owner"]}>
                <StockHistory />
              </RoleGuard>
            }
          />
          <Route
            path="/credits"
            element={
              <RoleGuard roles={["owner"]}>
                <CreditLedger />
              </RoleGuard>
            }
          />
          <Route
            path="/reports/daily-sales"
            element={
              <RoleGuard roles={["owner"]}>
                <DailySales />
              </RoleGuard>
            }
          />
          <Route
            path="/reports/product-sales"
            element={
              <RoleGuard roles={["owner"]}>
                <ProductSales />
              </RoleGuard>
            }
          />
          <Route
            path="/reports/cashier-performance"
            element={
              <RoleGuard roles={["owner"]}>
                <CashierPerformance />
              </RoleGuard>
            }
          />
          <Route
            path="/eod"
            element={
              <RoleGuard roles={["owner"]}>
                <EODList />
              </RoleGuard>
            }
          />
          <Route
            path="/eod/submit"
            element={
              <RoleGuard roles={["cashier", "owner"]}>
                <EODSubmit />
              </RoleGuard>
            }
          />
          <Route
            path="/eod/:id"
            element={
              <RoleGuard roles={["owner"]}>
                <EODDetail />
              </RoleGuard>
            }
          />
          <Route
            path="/account-settings"
            element={
              <RoleGuard roles={["owner"]}>
                <AccountSettings />
              </RoleGuard>
            }
          />
          <Route
            path="/users"
            element={
              <RoleGuard roles={["developer"]}>
                <UserList />
              </RoleGuard>
            }
          />
          <Route
            path="/users/new"
            element={
              <RoleGuard roles={["developer"]}>
                <UserForm />
              </RoleGuard>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <RoleGuard roles={["developer"]}>
                <UserForm />
              </RoleGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleGuard roles={["developer"]}>
                <DeveloperDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/developer/notifications"
            element={
              <RoleGuard roles={["developer"]}>
                <DeveloperNotifications />
              </RoleGuard>
            }
          />
          <Route
            path="/developer/login-activity"
            element={
              <RoleGuard roles={["developer"]}>
                <LoginActivity />
              </RoleGuard>
            }
          />
          <Route
            path="/audit"
            element={
              <RoleGuard roles={["developer"]}>
                <AuditLog />
              </RoleGuard>
            }
          />
          <Route path="/categories" element={<Navigate to="/products" replace />} />
          {PLACEHOLDER_ROUTES.map((path) => (
            <Route key={path} path={path} element={<ComingSoon />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
