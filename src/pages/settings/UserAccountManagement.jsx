import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  UserX,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listUsers,
  blockUser,
  unblockUser,
  forceLogout,
  setUserPin,
  clearUserPin,
} from "../../api/users.api";
import { useAuthStore } from "../../store/authStore";
import { ConfirmDialog } from "../../components/shared/UiShared";
import { formatRwandaDateTime } from "../../utils/dateUtils";

export default function UserAccountManagement() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState(null);
  const [pinAction, setPinAction] = useState(null);
  const [pinValue, setPinValue] = useState("");

  const { data: usersData, isLoading, isFetching } = useQuery({
    queryKey: ["users-mgmt", page],
    queryFn: () => listUsers({ page, limit: 10 }),
    staleTime: 30000,
  });

  const mBlock = useMutation({
    mutationFn: ({ id, reason }) => blockUser(id, reason),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users-mgmt"] });
      toast.success(`${res.data.full_name} has been blocked.`);
      setConfirmAction(null);
    },
    onError: (e) => toast.error(e.response?.data?.error || "Action failed"),
  });

  const mUnblock = useMutation({
    mutationFn: unblockUser,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users-mgmt"] });
      toast.success(`${res.data.full_name} has been unblocked.`);
      setConfirmAction(null);
    },
    onError: (e) => toast.error(e.response?.data?.error || "Action failed"),
  });

  const mLogout = useMutation({
    mutationFn: forceLogout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-mgmt"] });
      toast.success("User has been logged out.");
      setConfirmAction(null);
    },
    onError: (e) => toast.error(e.response?.data?.error || "Action failed"),
  });

  const mSetPin = useMutation({
    mutationFn: ({ id, pin }) => setUserPin(id, pin),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users-mgmt"] });
      toast.success(`PIN updated for ${res?.data?.user?.full_name || "user"}.`);
      setPinAction(null);
      setPinValue("");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Could not update PIN"),
  });

  const mClearPin = useMutation({
    mutationFn: clearUserPin,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["users-mgmt"] });
      toast.success(`PIN removed for ${res?.data?.user?.full_name || "user"}.`);
      setPinAction(null);
      setPinValue("");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Could not remove PIN"),
  });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        const matchesSearch =
          String(u.full_name || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          String(u.email || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          String(u.username || "")
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "blocked" ? u.is_blocked : !u.is_blocked);
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [users, search, roleFilter, statusFilter]
  );

  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
  };

  return (
    <div className="uam">
      <div className="uam-filters">
        <div className="search-field">
          <Search size={16} />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="field-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="owner">Owners</option>
          <option value="cashier">Cashiers</option>
          <option value="developer">Developers</option>
        </select>
        <select
          className="field-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <button
          type="button"
          className="icon-edit"
          title="Refresh"
          onClick={() => qc.invalidateQueries({ queryKey: ["users-mgmt"] })}
        >
          <RefreshCw size={16} className={isFetching ? "spin" : ""} />
        </button>
      </div>

      <div className="panel-card overflow-hidden">
        <div className="data-table__scroll">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Last Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="page-state">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="page-state">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const online = isOnline(u.last_seen_at);
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className={u.is_blocked ? "is-blocked" : ""}>
                      <td>
                        <div className="product-cell">
                          <div className={`product-icon ${online ? "is-ok" : ""}`}>
                            {String(u.full_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>
                              {u.full_name}
                              {isSelf ? " (You)" : ""}
                            </strong>
                            <p className="muted" style={{ margin: "2px 0 0" }}>
                              <span className="chip">{u.role}</span>
                              {u.pin_set ? <span className="chip">PIN</span> : null}{" "}
                              {u.email || u.username || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {u.is_blocked ? (
                          <span className="status-badge status-badge--bad">
                            <ShieldAlert size={12} /> Blocked
                          </span>
                        ) : (
                          <span className="status-badge status-badge--ok">
                            <ShieldCheck size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td className="muted">
                        <Clock size={12} />{" "}
                        {u.last_seen_at ? formatRwandaDateTime(u.last_seen_at) : "Never"}
                      </td>
                      <td>
                        {!isSelf && (
                          <div className="toolbar-actions">
                            <button
                              type="button"
                              className="icon-edit"
                              title={u.pin_set ? "Reset PIN" : "Set PIN"}
                              onClick={() => {
                                setPinAction(u);
                                setPinValue("");
                              }}
                            >
                              <KeyRound size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-edit"
                              title="Force Logout"
                              onClick={() => setConfirmAction({ type: "logout", user: u })}
                            >
                              <LogOut size={16} />
                            </button>
                            {u.is_blocked ? (
                              <button
                                type="button"
                                className="icon-edit"
                                title="Unblock"
                                onClick={() => setConfirmAction({ type: "unblock", user: u })}
                              >
                                <UserCheck size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="icon-danger"
                                title="Block"
                                onClick={() => setConfirmAction({ type: "block", user: u })}
                              >
                                <UserX size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pagination?.pages > 1 && (
          <div className="data-table__pager">
            <span>
              Page {page} of {pagination.pages}
            </span>
            <div>
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "logout"
            ? "Force Logout"
            : confirmAction?.type === "block"
              ? "Block Account"
              : "Unblock Account"
        }
        message={
          confirmAction?.type === "logout"
            ? `Force logout ${confirmAction?.user?.full_name}?`
            : confirmAction?.type === "block"
              ? `Block ${confirmAction?.user?.full_name}? They will lose access immediately.`
              : `Unblock ${confirmAction?.user?.full_name}?`
        }
        confirmLabel={
          confirmAction?.type === "logout"
            ? "Logout User"
            : confirmAction?.type === "block"
              ? "Block Account"
              : "Unblock User"
        }
        danger={confirmAction?.type === "block"}
        loading={mLogout.isPending || mBlock.isPending || mUnblock.isPending}
        onConfirm={() => {
          if (confirmAction.type === "logout") mLogout.mutate(confirmAction.user.id);
          if (confirmAction.type === "block")
            mBlock.mutate({ id: confirmAction.user.id, reason: "Developer forced block" });
          if (confirmAction.type === "unblock") mUnblock.mutate(confirmAction.user.id);
        }}
      />

      <ConfirmDialog
        open={!!pinAction}
        onClose={() => {
          setPinAction(null);
          setPinValue("");
        }}
        title={pinAction?.pin_set ? "Reset Staff PIN" : "Set Staff PIN"}
        message={
          <div>
            <p>
              Set a 4–6 digit PIN for <strong>{pinAction?.full_name}</strong>.
            </p>
            <input
              className="field-input"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 4–6 digit PIN"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {pinAction?.pin_set && (
              <button
                type="button"
                className="text-link"
                disabled={mClearPin.isPending}
                onClick={() => mClearPin.mutate(pinAction.id)}
              >
                {mClearPin.isPending ? "Removing PIN..." : "Remove PIN instead"}
              </button>
            )}
          </div>
        }
        confirmLabel={pinAction?.pin_set ? "Update PIN" : "Set PIN"}
        loading={mSetPin.isPending || mClearPin.isPending}
        onConfirm={() => {
          if (!/^\d{4,6}$/.test(pinValue)) {
            toast.error("PIN must be 4 to 6 digits.");
            return;
          }
          mSetPin.mutate({ id: pinAction.id, pin: pinValue });
        }}
      />
    </div>
  );
}
