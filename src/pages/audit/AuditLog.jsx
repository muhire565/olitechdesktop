import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "../../api/audit.api";
import { PageHeader, DataTable } from "../../components/shared/UiShared";
import { formatRwandaDateTime } from "../../utils/dateUtils";

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const limit = 25;

  const q = useQuery({
    queryKey: ["audit", page, limit],
    queryFn: () => listAuditLogs({ page, limit }),
    placeholderData: (prev) => prev,
  });

  const rows = q.data?.data || [];

  return (
    <div className="page-wrap system-page">
      <PageHeader
        title="Audit Log"
        subtitle="Full system activity trail for security and compliance."
      />

      <DataTable
        loading={q.isLoading}
        data={rows}
        pagination={q.data?.pagination ? { ...q.data.pagination, limit } : undefined}
        onPage={setPage}
        emptyMessage="No audit events yet."
        columns={[
          {
            key: "created_at",
            label: "Timestamp",
            render: (r) => (
              <span className="mono muted">{formatRwandaDateTime(r.created_at)}</span>
            ),
          },
          {
            key: "user_id",
            label: "User",
            render: (r) => r.profiles?.full_name || r.user_id || "—",
          },
          { key: "action", label: "Action", render: (r) => <span className="chip">{r.action}</span> },
          { key: "entity_type", label: "Entity" },
          { key: "entity_id", label: "ID", render: (r) => <span className="mono">{r.entity_id || "—"}</span> },
          { key: "ip_address", label: "IP", render: (r) => r.ip_address || "—" },
          {
            key: "details",
            label: "Details",
            render: (r) => (
              <pre className="audit-details">{JSON.stringify(r.details ?? {}, null, 0)}</pre>
            ),
          },
        ]}
      />
    </div>
  );
}
