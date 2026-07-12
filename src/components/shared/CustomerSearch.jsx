import { useState, useEffect } from "react";
import { Search, UserPlus, X, User } from "lucide-react";
import { listCustomers } from "../../api/customers.api";

export default function CustomerSearch({ onSelect, onCancel }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await listCustomers({ search });
        setResults(data.data || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="pos-modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="pos-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pos-modal__head">
          <div className="pos-modal__title">
            <User size={22} />
            <h3>Select Customer</h3>
          </div>
          <button type="button" className="pos-icon-btn" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="pos-search">
          <Search size={18} />
          <input
            autoFocus
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pos-customer-list">
          {loading && <p className="pos-muted-center">Searching...</p>}

          {!loading &&
            results.map((c) => (
              <button key={c.id} type="button" className="pos-customer-row" onClick={() => onSelect(c)}>
                <div>
                  <p className="pos-customer-row__name">{c.full_name}</p>
                  <p className="pos-customer-row__phone">{c.phone_number}</p>
                </div>
                <UserPlus size={18} />
              </button>
            ))}

          {!loading && search.length >= 2 && results.length === 0 && (
            <div className="pos-muted-center">
              <p>No customer found</p>
              <span>Register them first in Customers.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
