import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { approveEOD, flagEOD, getEOD, deleteEOD } from "../../api/eod.api";
import { ConfirmDialog } from "../../components/shared/UiShared";
import { formatRWF } from "../../utils/formatRWF";

export default function EODDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["eod", id], queryFn: () => getEOD(id) });

  const a = useMutation({
    mutationFn: () => approveEOD(id),
    onSuccess: () => {
      toast.success("EOD Approved!");
      q.refetch();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Approval failed"),
  });

  const f = useMutation({
    mutationFn: () => flagEOD(id, "Flagged for manual review"),
    onSuccess: () => {
      toast.success("EOD Flagged!");
      q.refetch();
    },
    onError: (e) => toast.error(e.response?.data?.error || "Flagging failed"),
  });

  const rm = useMutation({
    mutationFn: () => deleteEOD(id),
    onSuccess: () => {
      toast.success("EOD record deleted.");
      qc.invalidateQueries({ queryKey: ["eod"] });
      nav("/eod");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Delete failed"),
  });

  const d = q.data?.data;

  if (q.isPending) return <div className="page-state">Loading…</div>;
  if (q.isError || !d) {
    return (
      <div className="page-state">
        <p>Could not load this settlement.</p>
        <button type="button" className="btn-primary" onClick={() => nav("/eod")}>
          Back to list
        </button>
      </div>
    );
  }

  const discrepancy = Number(d.counted_cash) - Number(d.expected_cash);
  const status = String(d.status || "").toUpperCase();
  const CASHIER_NOTE_SPLIT = " | Cashier Note: ";
  const rawNotes = String(d.notes || "").trim();
  let systemNoteLine = null;
  let cashierNoteBody = rawNotes;
  const splitAt = rawNotes.indexOf(CASHIER_NOTE_SPLIT);
  if (splitAt !== -1) {
    systemNoteLine = rawNotes.slice(0, splitAt).trim();
    cashierNoteBody = rawNotes.slice(splitAt + CASHIER_NOTE_SPLIT.length).trim();
  }

  return (
    <div className="page-wrap eod-detail">
      <div className="form-page__top">
        <button type="button" className="icon-back" onClick={() => nav("/eod")}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="page-title">Review Settlement</h1>
          <p className="page-sub">Report ID: #{String(id).slice(0, 8)}</p>
        </div>
        <div className="form-page__actions">
          {status !== "APPROVED" && (
            <button
              type="button"
              className="btn-primary"
              disabled={a.isPending || rm.isPending}
              onClick={() => a.mutate()}
            >
              <ShieldCheck size={16} /> {a.isPending ? "Approving..." : "Approve Day"}
            </button>
          )}
          {status !== "FLAGGED" && (
            <button
              type="button"
              className="btn-danger-outline"
              disabled={f.isPending || rm.isPending}
              onClick={() => f.mutate()}
            >
              <AlertTriangle size={16} /> {f.isPending ? "Flagging..." : "Flag for Audit"}
            </button>
          )}
          <button
            type="button"
            className="btn-soft"
            disabled={rm.isPending}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={16} /> {rm.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="eod-detail__grid">
        <div className="eod-detail__main">
          <section className="panel-card">
            <div className="eod-metrics">
              <div>
                <p>Opening Balance</p>
                <strong>{formatRWF(d.opening_balance)}</strong>
              </div>
              <div>
                <p>Cash Sales</p>
                <strong>{formatRWF(d.cash_sales)}</strong>
              </div>
              <div>
                <p className="is-bad">Cash Expenses</p>
                <strong className="is-bad">-{formatRWF(d.cash_expenses)}</strong>
              </div>
              <div>
                <p className="is-ok">Net Expected</p>
                <strong className="is-ok">{formatRWF(d.expected_cash)}</strong>
              </div>
            </div>

            <hr className="eod-divider" />

            <div className="eod-metrics eod-metrics--2">
              <div>
                <p>Physical Counted</p>
                <strong className="eod-big">{formatRWF(d.counted_cash)}</strong>
              </div>
              <div>
                <p>Expected Total</p>
                <strong className="eod-big muted">{formatRWF(d.expected_cash)}</strong>
              </div>
            </div>

            <div
              className={`eod-discrepancy ${
                discrepancy < 0 ? "is-bad" : discrepancy > 0 ? "is-ok" : ""
              }`}
            >
              <div>
                <p>Net Discrepancy</p>
                <strong>
                  {discrepancy > 0 ? "+" : ""}
                  {formatRWF(discrepancy)}
                </strong>
              </div>
              <div className="text-right">
                <p>
                  {discrepancy === 0
                    ? "Perfect Match"
                    : discrepancy < 0
                      ? "Cash Shortage"
                      : "Cash Surplus"}
                </p>
                <em>Audit level: {Math.abs(discrepancy) > 5000 ? "HIGH" : "NORMAL"}</em>
              </div>
            </div>
          </section>

          <div className="eod-meta-cards">
            <div className="panel-card eod-meta">
              <div className="product-icon">
                <User size={18} />
              </div>
              <div>
                <p>Submitted By</p>
                <strong>{d.cashier_name || "N/A"}</strong>
              </div>
            </div>
            <div className="panel-card eod-meta">
              <div className="product-icon">
                <Calendar size={18} />
              </div>
              <div>
                <p>Business Date</p>
                <strong>{d.date}</strong>
              </div>
            </div>
          </div>
        </div>

        <aside className="eod-detail__side">
          <section className="panel-card">
            <div className="section-head">
              {status === "APPROVED" ? (
                <CheckCircle2 size={16} className="is-ok" />
              ) : status === "FLAGGED" ? (
                <AlertTriangle size={16} className="is-bad" />
              ) : (
                <Clock size={16} className="is-warn" />
              )}
              <h2>Current Status</h2>
            </div>
            <p
              className={`eod-status ${
                status === "APPROVED" ? "is-ok" : status === "FLAGGED" ? "is-bad" : "is-warn"
              }`}
            >
              {status || "PENDING"}
            </p>
            <p className="page-sub">
              {status === "APPROVED"
                ? "This day has been officially closed and verified."
                : status === "FLAGGED"
                  ? "This day requires further manual investigation."
                  : "Awaiting owner verification."}
            </p>
          </section>

          <section className="panel-card eod-notes">
            <p className="eyebrow">Audit Logs & Notes</p>
            {rawNotes ? (
              <div className="eod-notes__blocks">
                {systemNoteLine && (
                  <div>
                    <span>System summary</span>
                    <p>{systemNoteLine}</p>
                  </div>
                )}
                <div>
                  <span>{systemNoteLine ? "Cashier notes" : "Notes"}</span>
                  <p>{cashierNoteBody || "—"}</p>
                </div>
              </div>
            ) : null}
            <ul>
              <li>System recorded sales and finalized expected cash at end of day.</li>
              <li>Cashier submitted physical count of {formatRWF(d.counted_cash)}.</li>
            </ul>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this settlement?"
        message={
          <div>
            <p>
              This permanently removes this end-of-day record. The cashier can submit a new EOD for{" "}
              <strong>{d.date}</strong>.
            </p>
            <p className="muted">This action cannot be undone.</p>
          </div>
        }
        danger
        confirmLabel={rm.isPending ? "Deleting…" : "Delete"}
        loading={rm.isPending}
        onClose={() => !rm.isPending && setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          rm.mutate();
        }}
      />
    </div>
  );
}
