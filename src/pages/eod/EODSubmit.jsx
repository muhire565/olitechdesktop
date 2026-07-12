import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Banknote,
  Save,
  ArrowLeft,
  History,
  Info,
  Plus,
  Receipt,
  Archive,
  Calculator,
} from "lucide-react";
import { getEODPreview, submitEOD } from "../../api/eod.api";
import { createExpense } from "../../api/expenses.api";
import { recordSavings } from "../../api/savings.api";
import { useAuthStore } from "../../store/authStore";
import { normalizeRole } from "../../utils/roles";
import { today } from "../../utils/dateUtils";
import { formatRWF } from "../../utils/formatRWF";

export default function EODSubmit() {
  const user = useAuthStore((s) => s.user);
  const role = normalizeRole(useAuthStore((s) => s.role));
  const nav = useNavigate();
  const [date] = useState(today());
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "Operations",
  });
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [newSavings, setNewSavings] = useState({ description: "", amount: "" });
  const [isAddingSavings, setIsAddingSavings] = useState(false);

  const preview = useQuery({
    queryKey: ["eod-preview", user?.id, date],
    queryFn: () => getEODPreview(user.id, date),
    enabled: Boolean(user?.id && date),
  });
  const cashierAlreadySubmitted = Boolean(preview.data?.data?.already_submitted);

  const m = useMutation({
    mutationFn: submitEOD,
    onSuccess: () => {
      toast.success("EOD Submitted successfully!");
      nav(role === "cashier" ? "/pos" : "/eod");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Submission failed"),
  });

  useEffect(() => {
    if (preview.data?.data?.existing?.notes) {
      setNotes(preview.data.data.existing.notes);
    }
  }, [preview.data?.data?.existing?.notes]);

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      return toast.error("Please provide description and amount");
    }
    setIsAddingExpense(true);
    try {
      await createExpense({
        ...newExpense,
        expense_date: date,
        payment_method: "CASH",
      });
      toast.success("Expense recorded");
      setNewExpense({ description: "", amount: "", category: "Operations" });
      setShowExpenseModal(false);
      preview.refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to record expense");
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleAddSavings = async () => {
    if (!newSavings.amount) {
      return toast.error("Please provide an amount");
    }
    setIsAddingSavings(true);
    try {
      await recordSavings({
        description: newSavings.description || "Boss withdrawal",
        amount: newSavings.amount,
        date,
      });
      toast.success("Boss Take recorded");
      setNewSavings({ description: "", amount: "" });
      setShowSavingsModal(false);
      preview.refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to record savings");
    } finally {
      setIsAddingSavings(false);
    }
  };

  const expected = preview.data?.data?.expected_cash || 0;
  const variance = Number(counted) - expected;
  const data = preview.data?.data || {};

  return (
    <div className="eod-submit">
      <header className="eod-submit__header">
        <button type="button" className="icon-back" onClick={() => nav(-1)}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1>Shift Settlement</h1>
          <span>{date}</span>
        </div>
        <button
          type="button"
          className="btn-soft"
          onClick={() => nav(role === "cashier" ? "/pos" : "/eod")}
        >
          <History size={14} />
          {role === "cashier" ? "Back to POS" : "History"}
        </button>
      </header>

      <div className="eod-submit__body">
        <aside className="eod-submit__side">
          <h2>
            <Calculator size={14} /> Shift Summary
          </h2>
          <div className="eod-summary">
            <div>
              <span>Opening Balance</span>
              <strong>{formatRWF(data.opening_balance || 0)}</strong>
            </div>
            <div>
              <span className="is-ok">+ Cash Sales</span>
              <strong className="is-ok">
                {role === "cashier" ? "••••••" : formatRWF(data.cash_sales || 0)}
              </strong>
            </div>

            <button
              type="button"
              className="eod-action is-expense"
              disabled={cashierAlreadySubmitted}
              onClick={() => setShowExpenseModal(true)}
            >
              <Receipt size={16} />
              <span>- Record Expense</span>
              <em>{role === "cashier" ? "ADD" : formatRWF(data.cash_expenses || 0)}</em>
              <Plus size={14} />
            </button>

            <button
              type="button"
              className="eod-action is-savings"
              disabled={cashierAlreadySubmitted}
              onClick={() => setShowSavingsModal(true)}
            >
              <Archive size={16} />
              <span>- Boss Withdrawal</span>
              <em>{role === "cashier" ? "ADD" : formatRWF(data.boss_savings || 0)}</em>
              <Plus size={14} />
            </button>

            {role !== "cashier" && (
              <div className="eod-expected">
                <span>Expected Cash</span>
                <strong>{formatRWF(expected)}</strong>
              </div>
            )}
          </div>

          {!cashierAlreadySubmitted && (
            <div className="eod-hint">
              <Info size={14} />
              <p>Enter physical cash counted in the drawer. The system compares it after submission.</p>
            </div>
          )}
        </aside>

        <main className="eod-submit__main">
          <div className="eod-count">
            <h3>Physical Count</h3>
            <p>Enter the actual cash currently in the drawer</p>

            <div className="eod-count__field">
              <Banknote size={28} />
              <input
                autoFocus
                type="number"
                placeholder="0"
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
                disabled={cashierAlreadySubmitted}
              />
              <em>RWF</em>
            </div>

            {counted && (
              <div className="eod-count__next">
                {role !== "cashier" && (
                  <div
                    className={`eod-variance ${
                      variance === 0 ? "is-ok" : variance < 0 ? "is-bad" : "is-warn"
                    }`}
                  >
                    <div>
                      <p>Shift Discrepancy</p>
                      <strong>
                        {variance > 0 ? "+" : ""}
                        {formatRWF(variance)}
                      </strong>
                    </div>
                    <span>
                      {variance === 0 ? "Balanced" : variance < 0 ? "Shortage" : "Excess"}
                    </span>
                  </div>
                )}

                <label>
                  Final Comments (Optional)
                  <textarea
                    placeholder="Any notes for the manager about today's shift?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="btn-dark eod-submit-btn"
                  disabled={m.isPending || cashierAlreadySubmitted}
                  onClick={() =>
                    m.mutate({
                      cashier_id: user.id,
                      date,
                      counted_cash: Number(counted),
                      notes: notes.trim() || undefined,
                    })
                  }
                >
                  {m.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Save size={20} /> Complete EOD Settlement
                    </>
                  )}
                </button>
              </div>
            )}

            {cashierAlreadySubmitted && !counted && (
              <div className="page-state">
                <Archive size={48} />
                <p>Settlement Already Submitted</p>
                <span>You have already finished the shift for today.</span>
              </div>
            )}
          </div>
        </main>
      </div>

      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Record Cash Expense</h2>
            <p className="page-sub">Deducted from drawer cash</p>
            <input
              className="field-input"
              placeholder="Description (e.g. Airtime)"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            />
            <input
              className="field-input"
              type="number"
              placeholder="Amount (RWF)"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            />
            <div className="form-page__actions">
              <button type="button" className="btn-ghost" onClick={() => setShowExpenseModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={isAddingExpense}
                onClick={handleAddExpense}
              >
                {isAddingExpense ? "Saving..." : "Record Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSavingsModal && (
        <div className="modal-overlay" onClick={() => setShowSavingsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Boss Take (Withdrawal)</h2>
            <p className="page-sub">Owner withdrawal from drawer</p>
            <input
              className="field-input"
              type="number"
              placeholder="Amount (RWF)"
              value={newSavings.amount}
              onChange={(e) => setNewSavings({ ...newSavings, amount: e.target.value })}
            />
            <input
              className="field-input"
              placeholder="Notes (Optional)"
              value={newSavings.description}
              onChange={(e) => setNewSavings({ ...newSavings, description: e.target.value })}
            />
            <div className="form-page__actions">
              <button type="button" className="btn-ghost" onClick={() => setShowSavingsModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary is-amber"
                disabled={isAddingSavings}
                onClick={handleAddSavings}
              >
                {isAddingSavings ? "Recording..." : "Confirm Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
