import { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Phone, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { listCustomers, createCustomer, updateCustomer } from "../api/customers.api";
import { useSocket } from "../hooks/useSocket";

const PAGE_SIZE = 20;

export default function CustomerList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const queryClient = useQueryClient();

  useSocket("customers:updated", () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  });

  useSocket("credits:updated", () => {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  });

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { page, search, limit: PAGE_SIZE }],
    queryFn: () => listCustomers({ page, search, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: (payload) =>
      editingCustomer ? updateCustomer(editingCustomer.id, payload) : createCustomer(payload),
    onSuccess: () => {
      toast.success(editingCustomer ? "Customer updated!" : "Customer registered!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowModal(false);
      setEditingCustomer(null);
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Operation failed"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    mutation.mutate({
      full_name: formData.get("full_name"),
      phone_number: formData.get("phone_number"),
      address: formData.get("address"),
    });
  };

  const customers = data?.data || [];
  const total = data?.pagination?.total ?? customers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-wrap customers-page">
      <div className="customers-toolbar">
        <div>
          <h1>Customers</h1>
          <p>Manage your client database</p>
        </div>

        <div className="customers-toolbar__right">
          <div className="search-field">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button
            type="button"
            className="btn-dark"
            onClick={() => {
              setEditingCustomer(null);
              setShowModal(true);
            }}
          >
            <Plus size={18} />
            Register Customer
          </button>
        </div>
      </div>

      <div className="customers-table-card">
        <table className="customers-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Outstanding Debt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="is-skeleton">
                  <td colSpan={5}>
                    <div className="skeleton-line" />
                  </td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="customers-empty">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar">
                        {(customer.full_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span>{customer.full_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="contact-line">
                      <Phone size={14} />
                      {customer.phone_number || "—"}
                    </span>
                  </td>
                  <td>{customer.address || "—"}</td>
                  <td>
                    {Number(customer.total_debt) > 0 ? (
                      <span className="debt-badge">
                        {Number(customer.total_debt).toLocaleString()} RWF
                      </span>
                    ) : (
                      <span className="no-debt">No Debt</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-edit"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setShowModal(true);
                      }}
                      aria-label="Edit customer"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="data-table__pager">
          <span>
            {total} customers · Page {page} / {totalPages}
          </span>
          <div>
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModal &&
        createPortal(
          <div
            className="pos-modal-overlay"
            onClick={() => {
              setShowModal(false);
              setEditingCustomer(null);
            }}
          >
            <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="customer-modal-title">
                {editingCustomer ? "Edit Customer" : "Register Customer"}
              </h3>

              <form onSubmit={handleSubmit} className="customer-form">
                <label>
                  <span>Full Name</span>
                  <input
                    name="full_name"
                    defaultValue={editingCustomer?.full_name}
                    required
                    placeholder="John Doe"
                    className="field-input"
                  />
                </label>

                <label>
                  <span>Phone Number</span>
                  <input
                    name="phone_number"
                    defaultValue={editingCustomer?.phone_number}
                    required
                    placeholder="078..."
                    className="field-input"
                  />
                </label>

                <label>
                  <span>Physical Address</span>
                  <input
                    name="address"
                    defaultValue={editingCustomer?.address}
                    placeholder="Kigali, Rwanda"
                    className="field-input"
                  />
                </label>

                <div className="customer-form__actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCustomer(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-dark" disabled={mutation.isPending}>
                    {editingCustomer ? "Save Changes" : "Register Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
