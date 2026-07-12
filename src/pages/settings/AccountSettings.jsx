import { useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, UserPlus, KeyRound } from "lucide-react";
import { updateCredentials, setOwnPin, clearOwnPin } from "../../api/auth.api";
import { createUser } from "../../api/users.api";
import { useAuthStore } from "../../store/authStore";

export default function AccountSettings() {
  const user = useAuthStore((s) => s.user);
  const initialUsernameRef = useRef(String(user?.username || "").trim().toLowerCase());
  const [username, setUsername] = useState(initialUsernameRef.current);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [cashierUsername, setCashierUsername] = useState("");
  const [cashierPassword, setCashierPassword] = useState("");
  const [cashierConfirmPassword, setCashierConfirmPassword] = useState("");
  const [cashierPin, setCashierPin] = useState("");
  const [ownPin, setOwnPin] = useState("");
  const [ownPinConfirm, setOwnPinConfirm] = useState("");
  const [ownPinPassword, setOwnPinPassword] = useState("");

  const credentialsMutation = useMutation({
    mutationFn: updateCredentials,
    onSuccess: (res) => {
      const nextUsername = res?.data?.username || String(username || "").trim().toLowerCase();
      toast.success(res?.message || "Credentials updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setUsername(nextUsername);
      useAuthStore.setState((prev) => ({
        user: prev.user ? { ...prev.user, username: nextUsername } : prev.user,
      }));
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || e.message || "Could not update credentials."),
  });

  const cashierMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success("Cashier account created.");
      setCashierName("");
      setCashierUsername("");
      setCashierPassword("");
      setCashierConfirmPassword("");
      setCashierPin("");
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || e.message || "Could not create cashier account."),
  });

  const pinMutation = useMutation({
    mutationFn: setOwnPin,
    onSuccess: () => {
      toast.success("PIN saved. Your password was not changed.");
      setOwnPin("");
      setOwnPinConfirm("");
      setOwnPinPassword("");
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message || "Could not update PIN."),
  });

  const clearPinMutation = useMutation({
    mutationFn: clearOwnPin,
    onSuccess: () => {
      toast.success("PIN removed.");
      setOwnPinPassword("");
    },
    onError: (e) => toast.error(e.response?.data?.error || e.message || "Could not remove PIN."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedUsername = String(username || "").trim().toLowerCase();
    const trimmedNewPassword = String(newPassword || "");
    if (!trimmedNewPassword && trimmedUsername === initialUsernameRef.current) {
      toast.error("Change your username and/or enter a new password to update credentials.");
      return;
    }
    if (trimmedUsername.includes("@")) {
      toast.error("Username cannot be an email address.");
      return;
    }
    if (trimmedNewPassword && trimmedNewPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    credentialsMutation.mutate({
      username: trimmedUsername !== initialUsernameRef.current ? trimmedUsername : undefined,
      current_password: currentPassword,
      new_password: trimmedNewPassword || undefined,
    });
  };

  const handleCreateCashier = (e) => {
    e.preventDefault();
    const full_name = String(cashierName || "").trim();
    const usernameValue = String(cashierUsername || "").trim().toLowerCase();
    if (!full_name || !usernameValue || !cashierPassword) {
      toast.error("Name, username and password are required.");
      return;
    }
    if (cashierPassword !== cashierConfirmPassword) {
      toast.error("Cashier password confirmation does not match.");
      return;
    }
    cashierMutation.mutate({
      full_name,
      username: usernameValue,
      password: cashierPassword,
      role: "cashier",
      pin: cashierPin || undefined,
    });
  };

  const handleSetOwnPin = (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(ownPin)) {
      toast.error("PIN must be 4 to 6 digits.");
      return;
    }
    if (ownPin !== ownPinConfirm) {
      toast.error("PIN confirmation does not match.");
      return;
    }
    if (!ownPinPassword) {
      toast.error("Current password is required to set a PIN.");
      return;
    }
    pinMutation.mutate({ pin: ownPin, current_password: ownPinPassword });
  };

  const handleClearOwnPin = () => {
    if (!ownPinPassword) {
      toast.error("Current password is required to remove your PIN.");
      return;
    }
    clearPinMutation.mutate({ current_password: ownPinPassword });
  };

  return (
    <div className="page-wrap system-page">
      <div>
        <h1 className="page-title">Account Settings</h1>
        <p className="page-sub">Update your username, password, PIN, and create cashier accounts.</p>
      </div>

      <section className="panel-card">
        <div className="section-head">
          <ShieldCheck size={18} />
          <h2>Account Security</h2>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              className="field-input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            <span>Current Password</span>
            <input
              className="field-input"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label>
            <span>New Password (optional)</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label>
            <span>Confirm New Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <div className="form-footer">
            <p className="muted">Changing username/password applies on your next login.</p>
            <button type="submit" className="btn-primary" disabled={credentialsMutation.isPending}>
              {credentialsMutation.isPending ? "Saving..." : "Update credentials"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <KeyRound size={18} />
          <h2>Quick PIN Sign-In</h2>
        </div>
        <form className="form-grid" onSubmit={handleSetOwnPin}>
          <label>
            <span>New PIN (4–6 digits)</span>
            <input
              className="field-input"
              inputMode="numeric"
              maxLength={6}
              value={ownPin}
              onChange={(e) => setOwnPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <label>
            <span>Confirm PIN</span>
            <input
              className="field-input"
              inputMode="numeric"
              maxLength={6}
              value={ownPinConfirm}
              onChange={(e) => setOwnPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <label className="span-2">
            <span>Current Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete="current-password"
              value={ownPinPassword}
              onChange={(e) => setOwnPinPassword(e.target.value)}
            />
          </label>
          <div className="form-footer">
            <p className="muted">Saving a PIN does not change your password.</p>
            <div className="toolbar-actions">
              <button
                type="button"
                className="btn-ghost"
                disabled={clearPinMutation.isPending}
                onClick={handleClearOwnPin}
              >
                {clearPinMutation.isPending ? "Removing..." : "Remove PIN"}
              </button>
              <button type="submit" className="btn-primary" disabled={pinMutation.isPending}>
                {pinMutation.isPending ? "Saving..." : "Save PIN"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <UserPlus size={18} />
          <h2>Create Cashier Account</h2>
        </div>
        <form className="form-grid" onSubmit={handleCreateCashier}>
          <label>
            <span>Cashier Name</span>
            <input
              className="field-input"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
            />
          </label>
          <label>
            <span>Username</span>
            <input
              className="field-input"
              autoComplete="off"
              value={cashierUsername}
              onChange={(e) => setCashierUsername(e.target.value)}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={cashierPassword}
              onChange={(e) => setCashierPassword(e.target.value)}
            />
          </label>
          <label>
            <span>Confirm Password</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={cashierConfirmPassword}
              onChange={(e) => setCashierConfirmPassword(e.target.value)}
            />
          </label>
          <label>
            <span>Quick PIN (optional)</span>
            <input
              className="field-input"
              inputMode="numeric"
              maxLength={6}
              value={cashierPin}
              onChange={(e) => setCashierPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <div className="form-footer">
            <p className="muted">Owners can create cashier accounts only.</p>
            <button type="submit" className="btn-primary" disabled={cashierMutation.isPending}>
              {cashierMutation.isPending ? "Creating..." : "Create cashier"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
