import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, Calendar } from "lucide-react";
import { listSales } from "../api/sales.api";
import { PageHeader, DataTable, StatusBadge } from "../components/shared/UiShared";
import { formatRWF } from "../utils/formatRWF";
import { formatRwandaDateTime, today } from "../utils/dateUtils";
import { useAuthStore } from "../store/authStore";
import { normalizeRole } from "../utils/roles";
import { useSocket } from "../hooks/useSocket";

const PAGE_SIZE = 20;

function productLine(sale) {
  const items = sale.sale_items || [];
  const names = items
    .map((si) => {
      const p = si.products;
      const name = Array.isArray(p) ? p[0]?.name : p?.name;
      const qty = Number(si?.quantity || 0);
      const qtyLabel = qty > 0 ? ` x${qty}` : "";
      return name ? `${name}${qtyLabel}` : `Product #${si?.product_id || "?"}${qtyLabel}`;
    })
    .filter(Boolean);
  if (!names.length) return "No items";
  return names.join(", ");
}

export default function SalesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = normalizeRole(useAuthStore((s) => s.role));
  const isCashier = role === "cashier";

  const [page, setPage] = useState(1);
  const [date, setDate] = useState(isCashier ? today() : "");

  useSocket("sale:new", (payload) => {
    if (payload?.event === "sale_voided") {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.error(`Sale voided`, { icon: "🚫" });
      return;
    }

    const newSale = payload?.sale || payload;
    if (!newSale?.id) return;

    if (page === 1) {
      queryClient.setQueryData(["sales", page, PAGE_SIZE, date], (old) => {
        if (!old?.data) return old;
        if (old.data.some((s) => s.id === newSale.id)) return old;
        return {
          ...old,
          data: [newSale, ...old.data],
          pagination: {
            ...old.pagination,
            total: (old.pagination?.total || 0) + 1,
          },
        };
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    }

    if (newSale.receipt_number) {
      toast.success(`New Sale: ${newSale.receipt_number}`, { icon: "💰" });
    }
  });

  const q = useQuery({
    queryKey: ["sales", page, PAGE_SIZE, date],
    queryFn: async () => {
      const filters = { page, limit: PAGE_SIZE };
      if (date) filters.date = date;
      return listSales(filters);
    },
    placeholderData: (prev) => prev,
  });

  const rows = q.data?.data ?? [];
  const total = q.data?.pagination?.total ?? 0;

  const columns = [
    {
      key: "receipt_number",
      label: "Receipt no.",
      render: (r) => <span className="mono-strong">{r.receipt_number}</span>,
    },
    {
      key: "products",
      label: "Products",
      render: (r) => {
        const display = productLine(r);
        return (
          <div className="sales-products" title={display}>
            {display}
          </div>
        );
      },
    },
    {
      key: "total_amount",
      label: "Total",
      render: (r) => <span className="accent-strong">{formatRWF(r.total_amount)}</span>,
    },
    {
      key: "created_at",
      label: "Date & time",
      render: (r) => (
        <span className="muted-num">{formatRwandaDateTime(r.created_at)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  if (!isCashier) {
    columns.push({
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          type="button"
          className="btn-soft"
          onClick={() => navigate(`/sales/${r.id}`)}
        >
          <Eye size={15} strokeWidth={2.25} />
          Details
        </button>
      ),
    });
  }

  return (
    <div className="page-wrap sales-page">
      <div className="page-toolbar">
        <PageHeader
          title={isCashier ? "My daily sales" : "Sales history"}
          subtitle={
            isCashier
              ? `Viewing your transactions for ${date || "today"}`
              : "Completed and voided transactions."
          }
        />

        <div className="date-pill">
          <Calendar size={16} />
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
          {date && !isCashier && (
            <button
              type="button"
              className="date-pill__clear"
              onClick={() => {
                setDate("");
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable
        loading={q.isLoading}
        data={rows}
        columns={columns}
        emptyMessage={date ? `No sales for ${date} have been made.` : "No sales found."}
        pagination={{ page, limit: PAGE_SIZE, total }}
        onPage={setPage}
      />
    </div>
  );
}
