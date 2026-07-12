import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Trash2,
  Receipt,
  CreditCard,
  ShoppingBag,
  Info,
  Printer,
} from "lucide-react";
import { getSale, voidSale } from "../api/sales.api";
import { PageHeader, StatusBadge, ConfirmDialog } from "../components/shared/UiShared";
import ReceiptPrintFrame from "../components/shared/ReceiptPrintFrame";
import { formatRWF } from "../utils/formatRWF";
import { formatRwandaDateTime } from "../utils/dateUtils";
import { invalidateSalesRelatedQueries } from "../utils/invalidateSalesCaches";
import { buildReceiptFromSale } from "../utils/buildReceipt";
import { printReceipt } from "../utils/receiptPrinter";
import { normalizeRole } from "../utils/roles";
import { useAuthStore } from "../store/authStore";

export default function SaleDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const role = normalizeRole(useAuthStore((s) => s.role));
  const user = useAuthStore((s) => s.user);
  const isOwner = role === "owner";

  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [printPayload, setPrintPayload] = useState(null);

  const q = useQuery({ queryKey: ["sale", id], queryFn: () => getSale(id) });

  const mVoid = useMutation({
    mutationFn: (reason) => voidSale(id, reason),
    onSuccess: () => {
      toast.success("Sale voided successfully");
      qc.invalidateQueries({ queryKey: ["sale", id] });
      invalidateSalesRelatedQueries(qc);
      setShowVoidDialog(false);
      setVoidReason("");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Void failed"),
  });

  if (q.isLoading) {
    return <div className="page-state">Loading transaction...</div>;
  }

  const { sale, items = [], payments = [] } = q.data?.data || {};

  if (!sale) {
    return <div className="page-state">Sale not found.</div>;
  }

  const handleReprint = () => {
    const receipt = buildReceiptFromSale({
      sale,
      items,
      payments,
      cashierName: user?.full_name || user?.username,
    });
    setPrintPayload(receipt);
    window.setTimeout(() => {
      printReceipt();
      window.setTimeout(() => setPrintPayload(null), 4000);
    }, 80);
  };

  return (
    <div className="page-wrap sale-detail">
      <div className="sale-detail__top">
        <button type="button" className="icon-back" onClick={() => nav("/sales")}>
          <ArrowLeft size={16} />
        </button>
        <PageHeader
          title={`Transaction: ${sale.receipt_number}`}
          subtitle={formatRwandaDateTime(sale.created_at)}
        />
        <div className="sale-detail__actions">
          <button type="button" className="btn-soft" onClick={handleReprint}>
            <Printer size={15} />
            Reprint
          </button>
          {sale.status === "completed" && isOwner && (
            <button type="button" className="btn-danger-outline" onClick={() => setShowVoidDialog(true)}>
              <Trash2 size={15} />
              Void Transaction
            </button>
          )}
        </div>
      </div>

      <div className="sale-detail__grid">
        <div className="detail-card">
          <div className="detail-card__head">
            <Info size={16} />
            <h3>Summary</h3>
          </div>
          <div className="detail-rows">
            <div>
              <span>Status</span>
              <StatusBadge status={sale.status} />
            </div>
            <div>
              <span>Gross Amount</span>
              <strong>
                {formatRWF(Number(sale.total_amount) + Number(sale.discount_amount || 0))}
              </strong>
            </div>
            <div>
              <span>Discount</span>
              <strong className="is-danger">-{formatRWF(sale.discount_amount)}</strong>
            </div>
            <div className="is-total">
              <span>Net Total</span>
              <strong className="is-ok">{formatRWF(sale.total_amount)}</strong>
            </div>
          </div>
        </div>

        <div className="detail-card detail-card--wide">
          <div className="detail-card__head detail-card__head--bar">
            <ShoppingBag size={16} />
            <h3>Purchased Items</h3>
          </div>
          <table className="detail-items">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>
                    <p>{it.products?.name || "Unknown Product"}</p>
                    <span>{it.sold_as}</span>
                  </td>
                  <td>{it.quantity}</td>
                  <td>{formatRWF(it.unit_price)}</td>
                  <td>{formatRWF(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="detail-card">
          <div className="detail-card__head">
            <CreditCard size={16} />
            <h3>Payment Methods</h3>
          </div>
          <div className="payment-list">
            {payments.map((p, i) => (
              <div key={i} className="payment-chip">
                <span>{p.method}</span>
                <strong>{formatRWF(p.amount)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-card detail-card--wide detail-card--audit">
          <div className="audit-icon">
            <Receipt size={20} />
          </div>
          <div>
            <h4>Audit Information</h4>
            <p>
              This transaction was processed by cashier{" "}
              <strong>#{sale.cashier_id}</strong>.
            </p>
            {sale.void_reason && (
              <div className="void-reason">Void Reason: {sale.void_reason}</div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showVoidDialog}
        title="Void Transaction"
        danger
        loading={mVoid.isPending}
        confirmLabel="Void Sale"
        message={
          <div className="void-form">
            <p>
              Are you sure you want to void this transaction? This will restore inventory stock
              and mark the sale as voided.
            </p>
            <input
              className="field-input"
              placeholder="Enter reason for voiding..."
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
          </div>
        }
        onConfirm={() => {
          if (!voidReason.trim()) return toast.error("Please provide a reason");
          mVoid.mutate(voidReason);
        }}
        onClose={() => setShowVoidDialog(false)}
      />

      {printPayload && createPortal(<ReceiptPrintFrame receipt={printPayload} />, document.body)}
    </div>
  );
}
