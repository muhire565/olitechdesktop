import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  Plus,
  CheckCircle2,
  RefreshCw,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Info,
  X,
  BellRing,
} from "lucide-react";
import {
  createPaymentNotification,
  listAllPaymentNotifications,
  clearPaymentNotification,
  restorePaymentNotification,
  deletePaymentNotification,
} from "../../api/paymentNotifications.api";
import { formatRwandaDateTime } from "../../utils/dateUtils";
import { ConfirmDialog } from "../../components/shared/UiShared";

const SEVERITY = {
  info: { label: "Info", icon: Info, className: "sev-info" },
  warning: { label: "Warning", icon: AlertTriangle, className: "sev-warn" },
  critical: { label: "Critical", icon: AlertTriangle, className: "sev-critical" },
};

export default function DeveloperNotifications() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    severity: "warning",
    is_reminder: false,
  });
  const [filterCleared, setFilterCleared] = useState("active");
  const [deleteId, setDeleteId] = useState(null);

  const q = useQuery({
    queryKey: ["payment-notifs-all"],
    queryFn: listAllPaymentNotifications,
    staleTime: 20000,
  });

  const createMut = useMutation({
    mutationFn: createPaymentNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-notifs-all"] });
      toast.success("Notification sent to dashboards!");
      setForm({ title: "", body: "", severity: "warning", is_reminder: false });
      setShowForm(false);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Failed to create"),
  });

  const clearMut = useMutation({
    mutationFn: clearPaymentNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-notifs-all"] });
      toast.success("Marked as cleared");
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Failed"),
  });

  const restoreMut = useMutation({
    mutationFn: restorePaymentNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-notifs-all"] });
      toast.success("Notification restored");
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: deletePaymentNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-notifs-all"] });
      toast.success("Deleted");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Failed"),
  });

  const all = q.data?.data || [];
  const filtered =
    filterCleared === "all"
      ? all
      : filterCleared === "active"
        ? all.filter((n) => !n.is_cleared)
        : all.filter((n) => n.is_cleared);
  const activeCount = all.filter((n) => !n.is_cleared).length;

  return (
    <div className="page-wrap system-page notifs-page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Payment Notifications</h1>
          <p className="page-sub">
            Alerts that appear on owner & cashier dashboards. Clear when payment is received.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "New Notification"}
        </button>
      </div>

      <div className="kpi-grid kpi-grid--4">
        <div className="kpi-card">
          <div>
            <p>Active</p>
            <strong className="is-bad">{activeCount}</strong>
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <p>Cleared</p>
            <strong className="is-ok">{all.length - activeCount}</strong>
          </div>
        </div>
        <div className="kpi-card">
          <div>
            <p>Total</p>
            <strong>{all.length}</strong>
          </div>
        </div>
      </div>

      {showForm && (
        <section className="panel-card notif-form">
          <h2>Create Payment Notification</h2>
          <label>
            <span>Title *</span>
            <input
              className="field-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label>
            <span>Message *</span>
            <textarea
              className="field-input field-textarea"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </label>
          <div className="notif-form__row">
            <label>
              <span>Severity</span>
              <select
                className="field-input"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="pos-check">
              <input
                type="checkbox"
                checked={form.is_reminder}
                onChange={(e) => setForm((f) => ({ ...f, is_reminder: e.target.checked }))}
              />
              <BellRing size={14} /> Mark as Payment Reminder
            </label>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={createMut.isPending}
            onClick={() => {
              if (!form.title.trim() || !form.body.trim())
                return toast.error("Title and message are required");
              createMut.mutate(form);
            }}
          >
            {createMut.isPending ? <RefreshCw size={16} className="spin" /> : <Bell size={16} />}
            Send Notification
          </button>
        </section>
      )}

      <div className="status-tabs">
        {[
          { k: "active", l: "Active" },
          { k: "cleared", l: "Cleared" },
          { k: "all", l: "All" },
        ].map(({ k, l }) => (
          <button
            key={k}
            type="button"
            className={filterCleared === k ? "is-active" : ""}
            onClick={() => setFilterCleared(k)}
          >
            {l}
            {k === "active" && activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <div className="page-state">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="page-state panel-card">
          <Bell size={36} strokeWidth={1.5} />
          <p>No notifications here</p>
        </div>
      ) : (
        <div className="notif-list">
          {filtered.map((n) => {
            const cfg = SEVERITY[n.severity] || SEVERITY.warning;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`notif-card ${cfg.className} ${n.is_cleared ? "is-cleared" : ""}`}
              >
                <div className="notif-card__icon">
                  <Icon size={18} />
                </div>
                <div className="notif-card__body">
                  <div className="notif-card__tags">
                    <span className="chip">{cfg.label}</span>
                    {n.is_reminder && <span className="chip">Reminder</span>}
                    {n.is_cleared && <span className="chip">Cleared</span>}
                  </div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <em>
                    Created: {formatRwandaDateTime(n.created_at)}
                    {n.cleared_at ? ` · Cleared: ${formatRwandaDateTime(n.cleared_at)}` : ""}
                  </em>
                </div>
                <div className="toolbar-actions">
                  {!n.is_cleared ? (
                    <button
                      type="button"
                      className="btn-soft"
                      onClick={() => clearMut.mutate(n.id)}
                    >
                      <CheckCircle2 size={14} /> Clear
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-soft"
                      onClick={() => restoreMut.mutate(n.id)}
                    >
                      <RotateCcw size={14} /> Restore
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-danger"
                    onClick={() => setDeleteId(n.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="Delete notification?"
        message="This permanently removes the notification."
        danger
        confirmLabel={deleteMut.isPending ? "Deleting…" : "Delete"}
        loading={deleteMut.isPending}
        onClose={() => !deleteMut.isPending && setDeleteId(null)}
        onConfirm={() => deleteMut.mutate(deleteId)}
      />
    </div>
  );
}
