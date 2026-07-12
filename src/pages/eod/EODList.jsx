import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, AlertCircle, Eye, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { listEOD, deleteEOD } from "../../api/eod.api";
import { PageHeader, DataTable, ConfirmDialog } from "../../components/shared/UiShared";
import { formatRWF } from "../../utils/formatRWF";
import { formatRwandaDateTime } from "../../utils/dateUtils";

const LIMIT = 15;

export default function EODList() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const del = useMutation({
    mutationFn: (eodId) => deleteEOD(eodId),
    onSuccess: () => {
      toast.success("EOD record deleted.");
      qc.invalidateQueries({ queryKey: ["eod"] });
    },
    onError: (e) => toast.error(e.response?.data?.error || "Delete failed"),
  });

  const q = useQuery({
    queryKey: ["eod", page, LIMIT],
    queryFn: () => listEOD({ page, limit: LIMIT }),
    placeholderData: (prev) => prev,
  });

  const rows = q.data?.data || [];
  const deleteTargetRow =
    deleteTargetId != null ? rows.find((row) => String(row.id) === String(deleteTargetId)) : null;

  const columns = [
    {
      key: "date",
      label: "Business Date",
      render: (r) => (
        <div className="product-cell">
          <div className="product-icon">
            <Clock size={16} />
          </div>
          <strong>{r.date}</strong>
        </div>
      ),
    },
    {
      key: "cashier_name",
      label: "Cashier",
      render: (r) => <strong>{r.profiles?.full_name || "Unknown"}</strong>,
    },
    {
      key: "expected_cash",
      label: "System Expected",
      render: (r) => <span className="mono">{formatRWF(r.expected_cash)}</span>,
    },
    {
      key: "counted_cash",
      label: "Physical Count",
      render: (r) => <span className="mono strong">{formatRWF(r.counted_cash)}</span>,
    },
    {
      key: "discrepancy",
      label: "Cash Feedback",
      render: (r) => {
        const diff = Number(r.counted_cash) - Number(r.expected_cash);
        return (
          <div>
            <strong className={diff < 0 ? "is-bad" : diff > 0 ? "is-ok" : "muted"}>
              {diff > 0 ? "+" : ""}
              {formatRWF(diff)}
            </strong>
            <p className="muted" style={{ margin: "2px 0 0" }}>
              {diff < 0 ? "Shortage reported" : diff > 0 ? "Excess reported" : "Settled (Exact Match)"}
            </p>
          </div>
        );
      },
    },
    {
      key: "submitted_at",
      label: "Submitted",
      render: (r) => <span className="muted">{formatRwandaDateTime(r.created_at)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const s = String(r.status || "").toUpperCase();
        if (s === "APPROVED")
          return (
            <span className="status-badge status-badge--ok">
              <CheckCircle2 size={10} /> Approved
            </span>
          );
        if (s === "FLAGGED")
          return (
            <span className="status-badge status-badge--bad">
              <AlertCircle size={10} /> Flagged
            </span>
          );
        return (
          <span className="status-badge status-badge--warn">
            <Clock size={10} /> Pending
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="toolbar-actions">
          <button type="button" className="icon-edit" title="Review" onClick={() => nav(`/eod/${r.id}`)}>
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="icon-danger"
            title="Delete"
            disabled={del.isPending}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTargetId(r.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrap analytics-page">
      <PageHeader
        title="End of Day Reviews"
        subtitle="Verify daily cash counts and approve business settlements."
        action={
          <button type="button" className="btn-primary" onClick={() => nav("/eod/submit")}>
            <Plus size={16} /> New Settlement
          </button>
        }
      />

      <DataTable
        loading={q.isLoading}
        data={rows}
        pagination={q.data?.pagination ? { ...q.data.pagination, limit: LIMIT } : undefined}
        onPage={setPage}
        columns={columns}
      />

      <ConfirmDialog
        open={deleteTargetId != null}
        title="Delete this settlement?"
        message={
          deleteTargetRow ? (
            <div>
              <p>This permanently removes the end-of-day record for:</p>
              <div className="confirm-snippet">
                <p>
                  <strong>{deleteTargetRow.date}</strong>
                </p>
                <p>{deleteTargetRow.profiles?.full_name || "Cashier"}</p>
              </div>
              <p className="muted">The cashier can submit a new EOD for that date.</p>
            </div>
          ) : (
            <p>Remove this end-of-day record?</p>
          )
        }
        danger
        confirmLabel={del.isPending ? "Deleting…" : "Delete"}
        loading={del.isPending}
        onClose={() => !del.isPending && setDeleteTargetId(null)}
        onConfirm={() => {
          const eid = deleteTargetId;
          setDeleteTargetId(null);
          if (eid != null) del.mutate(eid);
        }}
      />
    </div>
  );
}
