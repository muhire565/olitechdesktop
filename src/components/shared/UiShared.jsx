export function StatusBadge({ status }) {
  const tone =
    status === "completed" || status === "approved"
      ? "ok"
      : status === "pending" || status === "flagged"
        ? "warn"
        : status === "voided" || status === "critical"
          ? "bad"
          : "muted";

  return <span className={`status-badge status-badge--${tone}`}>{status || "—"}</span>;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="page-header__action">{action}</div> : null}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onClose,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
}) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" role="presentation" onClick={onClose}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{title}</h3>
        <div className="confirm-dialog__body">{message}</div>
        <div className="confirm-dialog__actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DataTable({ columns, data = [], loading, pagination, onPage, emptyMessage }) {
  const limit = Number(pagination?.limit || 20);
  const total = Number(pagination?.total ?? 0);
  const page = Number(pagination?.page || 1);
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const showEmpty = !loading && data.length === 0;

  return (
    <div className="data-table">
      <div className="data-table__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="data-table__state">
                  Loading results...
                </td>
              </tr>
            ) : showEmpty ? (
              <tr>
                <td colSpan={columns.length} className="data-table__state">
                  {emptyMessage || "No records found."}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && typeof onPage === "function" && total > 0 && (
        <div className="data-table__pager">
          <span>
            {total} items · Page {page} / {totalPages}
          </span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
