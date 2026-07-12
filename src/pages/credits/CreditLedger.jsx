import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  User,
  Phone,
  CreditCard,
  Banknote,
  History,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { listCredits, recordInstallment, getInstallments } from "../../api/credits.api";
import { formatRWF } from "../../utils/formatRWF";

const STATUSES = ["all", "unpaid", "partially_paid", "paid"];

function CreditStatusBadge({ status }) {
  const map = {
    unpaid: "status-badge--bad",
    partially_paid: "status-badge--warn",
    paid: "status-badge--ok",
  };
  return (
    <span className={`status-badge ${map[status] || "status-badge--muted"}`}>
      {String(status || "").replace("_", " ")}
    </span>
  );
}

function InstallmentHistory({ creditId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["installments", creditId],
    queryFn: () => getInstallments(creditId),
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-card__head">
          <h2>Payment History</h2>
          <button type="button" className="icon-edit" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="history-list">
          {isLoading ? (
            <div className="page-state">Loading history...</div>
          ) : !data?.data?.length ? (
            <div className="page-state">No payments recorded yet</div>
          ) : (
            data.data.map((ins) => (
              <div key={ins.id} className="history-item">
                <div className="history-item__left">
                  <div className="product-icon">
                    {ins.payment_method === "CASH" ? <Banknote size={16} /> : <CreditCard size={16} />}
                  </div>
                  <div>
                    <strong>{formatRWF(ins.amount)}</strong>
                    <p>{new Date(ins.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="chip">{String(ins.payment_method || "").replace("_", " ")}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreditLedger() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page] = useState(1);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const queryClient = useQueryClient();

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["credits", { page, search, status }],
    queryFn: () => listCredits({ page, search, status }),
    staleTime: 0,
    retry: 2,
  });

  const credits = data?.data || [];
  const isLoading = isPending || (isFetching && credits.length === 0);

  const installmentMutation = useMutation({
    mutationFn: recordInstallment,
    onSuccess: () => {
      toast.success("Payment recorded!");
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setSelectedCredit(null);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Failed to record payment"),
  });

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    installmentMutation.mutate({
      credit_sale_id: selectedCredit.id,
      amount: formData.get("amount"),
      payment_method: formData.get("method"),
    });
  };

  const outstanding = credits.reduce((acc, c) => acc + Number(c.balance_remaining || 0), 0);
  const paid = credits.reduce((acc, c) => acc + Number(c.amount_paid || 0), 0);
  const active = credits.filter((c) => c.status !== "paid").length;

  return (
    <div className="page-wrap credits-page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Credit Ledger</h1>
          <p className="page-sub">Track customer debts and installments</p>
        </div>
        <div className="credits-filters">
          <div className="search-field">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search customer or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="status-tabs">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={status === s ? "is-active" : ""}
                onClick={() => setStatus(s)}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!isLoading && credits.length > 0 && (
        <div className="stat-grid">
          <div className="kpi-card">
            <div>
              <p>Total Outstanding</p>
              <strong className="is-bad">{formatRWF(outstanding)}</strong>
            </div>
          </div>
          <div className="kpi-card">
            <div>
              <p>Total Paid</p>
              <strong className="is-ok">{formatRWF(paid)}</strong>
            </div>
          </div>
          <div className="kpi-card">
            <div>
              <p>Active Debts</p>
              <strong>{active}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="credits-grid">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="credit-card skeleton" />)
        ) : isError ? (
          <div className="page-state panel-card">
            <CreditCard size={40} strokeWidth={1.5} />
            <p>Failed to load credits</p>
            <span>{error?.message || "Check your connection"}</span>
          </div>
        ) : credits.length === 0 ? (
          <div className="page-state panel-card">
            <CreditCard size={40} strokeWidth={1.5} />
            <p>No credit records found</p>
          </div>
        ) : (
          credits.map((credit) => (
            <div key={credit.id} className="credit-card">
              <div className="credit-card__top">
                <div className="credit-card__user">
                  <div className="product-icon">
                    <User size={20} />
                  </div>
                  <div>
                    <strong>{credit.customers?.full_name || "Deleted Customer"}</strong>
                    <p>
                      <Phone size={12} /> {credit.customers?.phone_number || "N/A"}
                    </p>
                  </div>
                </div>
                <CreditStatusBadge status={credit.status} />
              </div>

              <div className="credit-card__amounts">
                <div>
                  <span>Total Credit</span>
                  <strong>{formatRWF(credit.total_amount)}</strong>
                </div>
                <div>
                  <span>Paid</span>
                  <strong className="is-ok">{formatRWF(credit.amount_paid)}</strong>
                </div>
              </div>

              <div className="credit-card__balance">
                <div>
                  <span>Balance Due</span>
                  <strong className="is-bad">{formatRWF(credit.balance_remaining)}</strong>
                </div>
                <div className="text-right">
                  <span>Receipt</span>
                  <strong>#{credit.sales?.receipt_number || "N/A"}</strong>
                  <em>{new Date(credit.created_at).toLocaleDateString()}</em>
                </div>
              </div>

              <div className="credit-card__actions">
                {credit.status !== "paid" && (
                  <button type="button" className="btn-dark" onClick={() => setSelectedCredit(credit)}>
                    <Plus size={16} /> Record Payment
                  </button>
                )}
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => setShowHistory(credit.id)}
                  title="Payment history"
                >
                  <History size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedCredit &&
        createPortal(
          <div className="modal-overlay" onClick={() => setSelectedCredit(null)} role="presentation">
            <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog">
              <h2>Record Installment</h2>
              <p className="page-sub">For {selectedCredit.customers?.full_name}</p>

              <form className="payment-form" onSubmit={handleRecordPayment}>
                <label>
                  <span>Amount to Pay</span>
                  <div className="amount-field">
                    <em>RWF</em>
                    <input
                      name="amount"
                      type="number"
                      required
                      max={selectedCredit.balance_remaining}
                      placeholder="0"
                      className="field-input"
                    />
                  </div>
                  <small>Remaining: {formatRWF(selectedCredit.balance_remaining)}</small>
                </label>

                <fieldset>
                  <legend>Payment Method</legend>
                  <div className="method-grid">
                    {["CASH", "PHONE_NUMBER", "POS"].map((m) => (
                      <label key={m} className="method-option">
                        <input type="radio" name="method" value={m} defaultChecked={m === "CASH"} />
                        <span>{m.replace("_", " ")}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="form-page__actions">
                  <button type="button" className="btn-ghost" onClick={() => setSelectedCredit(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={installmentMutation.isPending}
                  >
                    Confirm Payment
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {showHistory &&
        createPortal(
          <InstallmentHistory creditId={showHistory} onClose={() => setShowHistory(null)} />,
          document.body
        )}
    </div>
  );
}
