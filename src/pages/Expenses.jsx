import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet, CalendarDays, Receipt, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { formatRWF } from "../utils/formatRWF";
import { formatRwandaDateTime } from "../utils/dateUtils";
import { createExpense, deleteExpense, listExpenses } from "../api/expenses.api";
import { useAuthStore } from "../store/authStore";

const LIMIT = 30;
const CATEGORIES = ["Operations", "Utilities", "Stock Transport", "Salaries", "Maintenance", "Other"];

export default function Expenses() {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const isOwner = role === "owner";

  const [page, setPage] = useState(1);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Operations");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const q = useQuery({
    queryKey: ["expenses", page, LIMIT],
    queryFn: () => listExpenses({ page, limit: LIMIT }),
    placeholderData: (prev) => prev,
  });

  const items = q.data?.data || [];
  const pagination = q.data?.pagination;

  const addM = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense added.");
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message || "Could not add expense."),
  });

  const delM = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense removed.");
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message || "Could not remove expense."),
  });

  const totals = useMemo(() => {
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const thisMonth = items
      .filter((x) => String(x.expense_date || "").startsWith(monthPrefix))
      .reduce((acc, x) => acc + Number(x.amount || 0), 0);
    const overall = items.reduce((acc, x) => acc + Number(x.amount || 0), 0);
    return { thisMonth, overall };
  }, [items]);

  const addExpense = (e) => {
    e.preventDefault();
    const cleanDescription = String(description || "").trim();
    const value = Number(amount);
    if (!cleanDescription || !Number.isFinite(value) || value <= 0 || !date) {
      toast.error("Enter description, valid amount, and date.");
      return;
    }
    addM.mutate({
      description: cleanDescription,
      category,
      amount: value,
      expense_date: date,
      payment_method: "CASH",
    });
    setDescription("");
    setAmount("");
    setCategory("Operations");
    setDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="page-wrap expenses-page">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-sub">Track business costs with quick entry.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="kpi-card">
          <div>
            <p>This month</p>
            <strong>{formatRWF(totals.thisMonth)}</strong>
          </div>
          <span className="kpi-card__icon">
            <CalendarDays size={18} />
          </span>
          <em>Updated {formatRwandaDateTime(new Date().toISOString())}</em>
        </div>
        <div className="kpi-card">
          <div>
            <p>Overall (page)</p>
            <strong>{formatRWF(totals.overall)}</strong>
          </div>
          <span className="kpi-card__icon">
            <Wallet size={18} />
          </span>
        </div>
        <div className="kpi-card">
          <div>
            <p>Records</p>
            <strong>{pagination?.total ?? items.length}</strong>
          </div>
          <span className="kpi-card__icon">
            <Receipt size={18} />
          </span>
        </div>
      </div>

      <section className="panel-card">
        <h2 className="panel-card__title">Add Expense</h2>
        <form className="expense-form" onSubmit={addExpense}>
          <input
            className="field-input"
            placeholder="Description (e.g. transport, supplies)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            className="field-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            className="field-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={addM.isPending}>
            <Plus size={16} />
            {addM.isPending ? "Adding..." : "Add"}
          </button>
        </form>
      </section>

      <section className="panel-card overflow-hidden">
        <div className="panel-card__head">
          <h2>Recent Expenses</h2>
        </div>
        {q.isLoading ? (
          <div className="page-state">Loading expenses...</div>
        ) : items.length === 0 ? (
          <div className="page-state">No expenses yet. Add your first record above.</div>
        ) : (
          <>
            <div className="data-table__scroll">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Amount</th>
                    {isOwner && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <strong>{x.description}</strong>
                      </td>
                      <td>
                        <span className="chip">{x.category}</span>
                      </td>
                      <td>{x.expense_date}</td>
                      <td className="mono strong">{formatRWF(x.amount)}</td>
                      {isOwner && (
                        <td>
                          <button
                            type="button"
                            className="icon-danger"
                            title="Delete expense"
                            disabled={delM.isPending}
                            onClick={() => delM.mutate(x.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination?.total > LIMIT && (
              <div className="data-table__pager">
                <span>
                  Page {pagination.page} · {pagination.total} total
                </span>
                <div>
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
