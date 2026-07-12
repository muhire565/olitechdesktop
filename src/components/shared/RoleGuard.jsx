import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { normalizeRole } from "../../utils/roles";

export default function RoleGuard({ roles, children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = normalizeRole(useAuthStore((s) => s.role));

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const allowed = (roles || []).map(normalizeRole);
  if (allowed.length && !allowed.includes(role)) {
    return (
      <div className="coming-soon">
        <div className="coming-soon__card">
          <h1>Access Denied</h1>
          <p>Your account role cannot open this section.</p>
        </div>
      </div>
    );
  }

  return children;
}
