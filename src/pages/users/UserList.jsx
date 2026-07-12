import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import { listUsers } from "../../api/users.api";
import { PageHeader, DataTable } from "../../components/shared/UiShared";

export default function UserList() {
  const q = useQuery({ queryKey: ["users"], queryFn: () => listUsers({ limit: 100 }) });
  const rows = q.data?.data || [];

  return (
    <div className="page-wrap system-page">
      <PageHeader
        title="Users"
        subtitle="Create and edit system accounts."
        action={
          <Link to="/users/new" className="btn-primary">
            <Plus size={16} /> New user
          </Link>
        }
      />

      <DataTable
        loading={q.isLoading}
        data={rows}
        emptyMessage="No users found."
        columns={[
          {
            key: "full_name",
            label: "Name",
            render: (r) => (
              <div className="product-cell">
                <div className="product-icon">{String(r.full_name || "?").charAt(0)}</div>
                <div>
                  <strong>{r.full_name}</strong>
                  <p className="muted" style={{ margin: 0 }}>
                    {r.username || r.email || "—"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            label: "Role",
            render: (r) => <span className="chip">{r.role}</span>,
          },
          {
            key: "is_active",
            label: "Status",
            render: (r) => (
              <span
                className={`status-badge ${
                  r.is_blocked
                    ? "status-badge--bad"
                    : r.is_active === false
                      ? "status-badge--muted"
                      : "status-badge--ok"
                }`}
              >
                {r.is_blocked ? "Blocked" : r.is_active === false ? "Inactive" : "Active"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <Link to={`/users/${r.id}/edit`} className="btn-soft">
                <Pencil size={14} /> Edit
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
