import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users,
  FileText,
  Bell,
  Store,
  CreditCard,
  AlertTriangle,
  Save,
  ChevronRight,
  Activity,
  Shield,
  Database,
  Zap,
  Code2,
  RefreshCw,
  CheckCircle2,
  Download,
} from "lucide-react";
import {
  getSettings,
  updateSettings,
  updatePaymentMethods,
  updateLowStockThreshold,
} from "../../api/settings.api";
import { listAllPaymentNotifications } from "../../api/paymentNotifications.api";
import { listLoginLogs } from "../../api/loginLogs.api";
import { useAuthStore } from "../../store/authStore";
import UserAccountManagement from "./UserAccountManagement";

const PAYMENT_METHODS = [
  { key: "CASH", label: "Cash", desc: "Physical cash payments" },
  { key: "PHONE_NUMBER", label: "Phone Pay", desc: "Mobile money by phone number" },
  { key: "POS", label: "POS Card", desc: "Card / point-of-sale terminal" },
];

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const notifQ = useQuery({
    queryKey: ["payment-notifs-all"],
    queryFn: listAllPaymentNotifications,
    staleTime: 30000,
  });
  const logsQ = useQuery({
    queryKey: ["login-logs", 1],
    queryFn: () => listLoginLogs({ limit: 5 }),
    staleTime: 30000,
  });

  const s = settingsQ.data?.data || {};
  const [storeForm, setStoreForm] = useState({});
  const [threshold, setThreshold] = useState("");
  const [selectedPayments, setSelectedPayments] = useState(null);
  const [appVersion, setAppVersion] = useState("—");
  const [updateStatus, setUpdateStatus] = useState("idle"); // idle | checking | available | ready | uptodate | error | web

  useEffect(() => {
    window.electronAPI?.getAppVersion?.().then((v) => setAppVersion(v || "—"));
  }, []);

  useEffect(() => {
    const api = window.electronAPI?.updater;
    if (!api) {
      setUpdateStatus("web");
      return undefined;
    }

    const offStatus = api.onStatus?.((data) => {
      if (data?.status === "checking") setUpdateStatus("checking");
      if (data?.status === "up-to-date") setUpdateStatus("uptodate");
    });
    const offAvailable = api.onAvailable?.(() => setUpdateStatus("available"));
    const offDownloaded = api.onDownloaded?.(() => setUpdateStatus("ready"));
    const offError = api.onError?.((err) => {
      setUpdateStatus("error");
      toast.error(err?.message || "Update check failed");
    });

    return () => {
      offStatus?.();
      offAvailable?.();
      offDownloaded?.();
      offError?.();
    };
  }, []);

  const checkForUpdates = async () => {
    const api = window.electronAPI?.updater;
    if (!api) {
      toast.error("Install the desktop app to receive automatic updates");
      return;
    }
    setUpdateStatus("checking");
    const result = await api.check();
    if (!result?.ok) {
      setUpdateStatus("error");
      toast.error(result?.error || "Could not reach the update server");
      return;
    }
    toast.success("Checking for updates…");
  };

  const saveStoreMut = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Store info saved!");
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Save failed"),
  });

  const savePayMut = useMutation({
    mutationFn: updatePaymentMethods,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Payment methods updated!");
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Save failed"),
  });

  const saveThreshMut = useMutation({
    mutationFn: updateLowStockThreshold,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Threshold saved!");
    },
    onError: (e) => toast.error(e?.response?.data?.error || "Save failed"),
  });

  const currentPayments =
    selectedPayments ?? (s.accepted_payment_methods || ["CASH", "PHONE_NUMBER", "POS"]);

  const togglePayment = (key) => {
    setSelectedPayments((prev) => {
      const base = prev ?? (s.accepted_payment_methods || []);
      return base.includes(key) ? base.filter((k) => k !== key) : [...base, key];
    });
  };

  const activeNotifs = (notifQ.data?.data || []).filter((n) => !n.is_cleared);
  const recentLogins = logsQ.data?.data || [];
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const greetName = user?.username || user?.full_name?.split(" ")[0] || "Developer";

  return (
    <div className="page-wrap system-page">
      <div className="dev-hero">
        <div>
          <span className="chip">
            <Code2 size={12} /> Developer Console
          </span>
          <h1 className="page-title">
            {greeting}, <em>{greetName}</em>
          </h1>
          <p className="page-sub">{s.store_name || "Supermarket"} · Full system access</p>
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn-soft"
            onClick={() => navigate("/developer/notifications")}
          >
            <Bell size={15} /> Notifications
            {activeNotifs.length > 0 && <span className="count-pill">{activeNotifs.length}</span>}
          </button>
          <button
            type="button"
            className="btn-soft"
            onClick={() => navigate("/developer/login-activity")}
          >
            <Activity size={15} /> Login Activity
          </button>
        </div>
      </div>

      <div className="kpi-grid kpi-grid--4">
        {[
          {
            icon: Users,
            label: "User Management",
            value: "Users",
            sub: "Create & manage accounts",
            to: "/users",
          },
          {
            icon: FileText,
            label: "Audit Log",
            value: "Audit",
            sub: "System activity trail",
            to: "/audit",
          },
          {
            icon: Bell,
            label: "Active Alerts",
            value: notifQ.isLoading ? "—" : String(activeNotifs.length),
            sub: "Payment notifications",
            to: "/developer/notifications",
          },
          {
            icon: Activity,
            label: "Recent Logins",
            value: logsQ.isLoading ? "—" : String(logsQ.data?.pagination?.total ?? 0),
            sub: "Total login events",
            to: "/developer/login-activity",
          },
        ].map(({ icon: Icon, label, value, sub, to }) => (
          <button key={label} type="button" className="kpi-card is-clickable" onClick={() => navigate(to)}>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              <em>{sub}</em>
            </div>
            <span className="kpi-card__icon">
              <Icon size={18} />
            </span>
          </button>
        ))}
      </div>

      <div className="charts-grid">
        <section className="panel-card">
          <div className="section-head">
            <Store size={18} />
            <h2>Store Information</h2>
          </div>
          {settingsQ.isLoading ? (
            <div className="page-state">Loading settings...</div>
          ) : (
            <div className="form-grid">
              {[
                { key: "store_name", label: "Store Name" },
                { key: "store_address", label: "Address" },
                { key: "store_phone", label: "Phone" },
              ].map(({ key, label }) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    className="field-input"
                    defaultValue={s[key] || ""}
                    onChange={(e) => setStoreForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </label>
              ))}
              <label className="span-2">
                <span>Receipt Footer</span>
                <textarea
                  className="field-input field-textarea"
                  defaultValue={s.receipt_footer || ""}
                  onChange={(e) => setStoreForm((f) => ({ ...f, receipt_footer: e.target.value }))}
                />
              </label>
              <button
                type="button"
                className="btn-primary span-2"
                disabled={saveStoreMut.isPending || Object.keys(storeForm).length === 0}
                onClick={() => saveStoreMut.mutate(storeForm)}
              >
                {saveStoreMut.isPending ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
                Save Store Info
              </button>
            </div>
          )}
        </section>

        <div className="stack-gap">
          <section className="panel-card">
            <div className="section-head">
              <CreditCard size={18} />
              <h2>Payment Methods</h2>
            </div>
            <div className="pay-toggle-grid">
              {PAYMENT_METHODS.map(({ key, label, desc }) => {
                const active = currentPayments.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`pay-toggle ${active ? "is-active" : ""}`}
                    onClick={() => togglePayment(key)}
                  >
                    <div>
                      <strong>{label}</strong>
                      <span>{desc}</span>
                    </div>
                    {active && <CheckCircle2 size={16} />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%", marginTop: 14 }}
              disabled={savePayMut.isPending}
              onClick={() => savePayMut.mutate(currentPayments)}
            >
              {savePayMut.isPending ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
              Save Payment Methods
            </button>
          </section>

          <section className="panel-card">
            <div className="section-head">
              <AlertTriangle size={18} />
              <h2>Low Stock Threshold</h2>
            </div>
            <div className="threshold-row">
              <input
                className="field-input"
                type="number"
                min={1}
                placeholder={String(s.default_low_stock_threshold ?? 10)}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                disabled={saveThreshMut.isPending || !threshold}
                onClick={() => {
                  const v = Number(threshold);
                  if (!v || v < 1) return toast.error("Enter a valid threshold");
                  saveThreshMut.mutate(v);
                }}
              >
                {saveThreshMut.isPending ? <RefreshCw size={15} className="spin" /> : <Save size={15} />}
                Save
              </button>
            </div>
            <p className="muted">
              Current: <strong>{s.default_low_stock_threshold ?? 10} units</strong>
            </p>
          </section>
        </div>
      </div>

      <section className="panel-card overflow-hidden">
        <div className="panel-card__head flex-between">
          <div className="section-head" style={{ margin: 0 }}>
            <Shield size={18} />
            <h2>Recent Login Activity</h2>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={() => navigate("/developer/login-activity")}
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        {logsQ.isLoading ? (
          <div className="page-state">Loading...</div>
        ) : recentLogins.length === 0 ? (
          <div className="page-state">No login events recorded yet.</div>
        ) : (
          <div className="login-preview">
            {recentLogins.map((log) => {
              const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
              return (
                <div key={log.id} className="login-preview__row">
                  <div className="product-icon">
                    {(profile?.full_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{profile?.full_name || "Unknown User"}</strong>
                    <p className="muted">
                      {profile?.role || "—"}
                      {log.ip_address ? ` · ${log.ip_address}` : ""}
                    </p>
                  </div>
                  <span className="mono muted">
                    {new Date(log.logged_in_at).toLocaleString("en-GB", {
                      timeZone: "Africa/Kigali",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel-card">
        <div className="section-head">
          <Shield size={18} />
          <h2>User Account Management</h2>
        </div>
        <p className="page-sub" style={{ marginBottom: 16 }}>
          Control sessions, block accounts, and manage staff PINs.
        </p>
        <UserAccountManagement />
      </section>

      <section className="panel-card overflow-hidden">
        <div className="panel-card__head">
          <div className="section-head" style={{ margin: 0 }}>
            <Database size={18} />
            <h2>System Information</h2>
          </div>
        </div>
        <div className="sys-info-grid">
          {[
            { label: "Frontend", value: "Electron + React", icon: Zap },
            { label: "Backend", value: "Node.js + Express", icon: Code2 },
            { label: "Database", value: "Supabase (PostgreSQL)", icon: Database },
            { label: "App version", value: appVersion, icon: CheckCircle2 },
          ].map(({ label, value, icon: Ic }) => (
            <div key={label}>
              <p>
                <Ic size={14} /> {label}
              </p>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="update-panel" style={{ marginTop: 20 }}>
          <div>
            <p className="update-panel__title">
              <Download size={15} /> Desktop updates
            </p>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              {updateStatus === "web" && "Automatic updates run in the installed OLITECHHUB desktop app."}
              {updateStatus === "idle" && "Updates download in the background, like VS Code or Cursor."}
              {updateStatus === "checking" && "Checking the update server…"}
              {updateStatus === "available" && "A new version was found. Downloading in the background…"}
              {updateStatus === "ready" && "Update downloaded. Use Restart & update in the banner at the top."}
              {updateStatus === "uptodate" && "You are on the latest version."}
              {updateStatus === "error" && "Could not check updates. Confirm the release files are hosted online."}
            </p>
          </div>
          <div className="update-panel__actions">
            {updateStatus === "ready" ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.electronAPI?.updater?.install()}
              >
                <RefreshCw size={15} /> Restart &amp; update
              </button>
            ) : (
              <button
                type="button"
                className="btn-soft"
                onClick={checkForUpdates}
                disabled={updateStatus === "checking" || updateStatus === "web"}
              >
                {updateStatus === "checking" ? (
                  <RefreshCw size={15} className="spin" />
                ) : (
                  <Download size={15} />
                )}
                Check for updates
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
