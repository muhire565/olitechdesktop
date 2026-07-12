import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  Shield,
  Clock,
  Globe,
  Monitor,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { listLoginLogs, deleteLoginLog, clearAllLoginLogs } from "../../api/loginLogs.api";
import { ConfirmDialog } from "../../components/shared/UiShared";

function parseUA(ua = "") {
  const s = String(ua || "");
  if (s.includes("Chrome")) return "Chrome";
  if (s.includes("Firefox")) return "Firefox";
  if (s.includes("Safari") && !s.includes("Chrome")) return "Safari";
  if (s.includes("Edge")) return "Edge";
  if (s.includes("Electron")) return "Desktop App";
  if (s.includes("PostmanRuntime")) return "Postman";
  if (s.includes("axios")) return "API Client";
  return s ? s.slice(0, 30) : "Unknown";
}

function parseDevice(ua = "") {
  const s = String(ua || "");
  if (s.includes("Mobile") || s.includes("Android") || s.includes("iPhone")) return "mobile";
  if (s.includes("Tablet") || s.includes("iPad")) return "tablet";
  return "desktop";
}

export default function LoginActivity() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const limit = 25;

  const q = useQuery({
    queryKey: ["login-logs", page],
    queryFn: () => listLoginLogs({ limit, page }),
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  const deleteOneMut = useMutation({
    mutationFn: deleteLoginLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["login-logs"] });
      toast.success("Entry removed");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Failed to delete"),
  });

  const clearAllMut = useMutation({
    mutationFn: clearAllLoginLogs,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["login-logs"] });
      toast.success("All logs cleared");
      setPage(1);
      setClearAllOpen(false);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Failed to clear"),
  });

  const logs = q.data?.data || [];
  const total = q.data?.pagination?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="page-wrap system-page">
      <div className="dev-hero is-dark">
        <div>
          <span className="chip">
            <Shield size={11} /> Security Log
          </span>
          <h1 className="page-title">Login Activity</h1>
          <p className="page-sub">Track every login event across all accounts</p>
        </div>
        <div className="dev-hero__stat">
          <Activity size={22} />
          <div>
            <strong>{total}</strong>
            <span>Total login events</span>
          </div>
        </div>
      </div>

      <div className="panel-card overflow-hidden">
        <div className="panel-card__head flex-between">
          <div className="section-head" style={{ margin: 0 }}>
            <Clock size={16} />
            <h2>Login Events</h2>
          </div>
          <div className="toolbar-actions">
            {total > 0 && (
              <button type="button" className="btn-danger-outline" onClick={() => setClearAllOpen(true)}>
                <Trash2 size={13} /> Clear All
              </button>
            )}
            <button type="button" className="btn-soft" onClick={() => q.refetch()}>
              <RefreshCw size={13} className={q.isFetching ? "spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {q.isLoading ? (
          <div className="page-state">Loading login events...</div>
        ) : logs.length === 0 ? (
          <div className="page-state">
            <Shield size={36} strokeWidth={1.5} />
            <p>No login events yet</p>
          </div>
        ) : (
          <>
            <div className="data-table__scroll">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    {["User", "Role", "Login Time", "IP Address", "Browser", "Device", ""].map(
                      (h) => (
                        <th key={h || "x"}>{h}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                    return (
                      <tr key={log.id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-icon">
                              {(profile?.full_name || "?").charAt(0).toUpperCase()}
                            </div>
                            <strong>{profile?.full_name || "Deleted User"}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="chip">{profile?.role || "—"}</span>
                        </td>
                        <td className="mono muted">
                          {new Date(log.logged_in_at).toLocaleString("en-GB", {
                            timeZone: "Africa/Kigali",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td>
                          {log.ip_address ? (
                            <span className="mono muted">
                              <Globe size={12} /> {log.ip_address}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{parseUA(log.user_agent)}</td>
                        <td>
                          <Monitor size={15} /> {parseDevice(log.user_agent)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="icon-danger"
                            onClick={() => setDeleteId(log.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="data-table__pager">
                <span>
                  Page {page} / {totalPages}
                </span>
                <div>
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={clearAllOpen}
        title="Clear all login logs?"
        message="This permanently deletes ALL login activity records. This cannot be undone."
        danger
        confirmLabel={clearAllMut.isPending ? "Clearing…" : "Clear All"}
        loading={clearAllMut.isPending}
        onClose={() => !clearAllMut.isPending && setClearAllOpen(false)}
        onConfirm={() => clearAllMut.mutate()}
      />

      <ConfirmDialog
        open={deleteId != null}
        title="Delete this login record?"
        message="Remove this single login event from the security log."
        danger
        confirmLabel={deleteOneMut.isPending ? "Deleting…" : "Delete"}
        loading={deleteOneMut.isPending}
        onClose={() => !deleteOneMut.isPending && setDeleteId(null)}
        onConfirm={() => deleteOneMut.mutate(deleteId)}
      />
    </div>
  );
}
