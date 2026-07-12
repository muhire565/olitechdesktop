import { useForm } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ShieldAlert,
  User,
  Lock,
  Store,
  ChevronRight,
  Loader2,
  KeyRound,
  Hash,
  Shield,
} from "lucide-react";
import { login, loginPin } from "../api/auth.api";
import { useAuthStore } from "../store/authStore";
import { routeForRole, normalizeRole } from "../utils/roles";
import { getRecentStaff, rememberStaff } from "../utils/recentStaff";
import PinKeypad from "../components/auth/PinKeypad";
import LoginHero from "../components/auth/LoginHero";

const schema = z.object({
  username: z.string().min(2, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const BRAND_GREEN = "#16a34a";
const BRAND_GREEN_DARK = "#15803d";

function LoginModeToggle({ mode, onChange }) {
  const modes = [
    { id: "pin", label: "PIN", icon: Hash },
    { id: "password", label: "Password", icon: KeyRound },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "5px",
        padding: "5px",
        borderRadius: "16px",
        background: "linear-gradient(180deg, #f1f5f9 0%, #e8edf4 100%)",
        marginBottom: "24px",
        boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)",
      }}
      role="tablist"
      aria-label="Sign in method"
    >
      {modes.map(({ id, label, icon: Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              height: "44px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 800,
              color: active ? "#fff" : "#64748b",
              background: active
                ? `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DARK} 100%)`
                : "transparent",
              boxShadow: active ? "0 4px 16px rgba(22,163,74,0.32)" : "none",
              transition: "all 0.22s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <Icon size={15} strokeWidth={2.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function BlockedAlert({ isBlocked }) {
  if (!isBlocked) return null;
  return (
    <div className="animate-shake" style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "14px 16px", borderRadius: "14px",
      borderLeft: "5px solid #dc2626", background: "#fef2f2",
      marginBottom: "18px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "36px", height: "36px", borderRadius: "50%",
        background: "#fee2e2", flexShrink: 0,
      }}>
        <ShieldAlert size={18} color="#dc2626" />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#dc2626" }}>
          Access Restricted
        </p>
        <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#ef4444" }}>
          Contact OlitechHub admin for assistance
        </p>
      </div>
    </div>
  );
}

function RecentStaffRow({ staff, selectedId, onSelect }) {
  if (!staff.length) return null;

  return (
    <div style={{ marginBottom: "18px" }}>
      <p style={{
        margin: "0 0 10px", fontSize: "10.5px", fontWeight: 800,
        letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8",
        textAlign: "center",
      }}>
        Frequently on this terminal
      </p>
      <div style={{
        display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap",
      }}>
        {staff.map((person) => {
          const selected = selectedId === person.id;
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelect(selected ? null : person.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "6px", background: "none", border: "none",
                cursor: "pointer", padding: "4px",
              }}
              aria-pressed={selected}
            >
              <div style={{
                width: "46px", height: "46px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 800,
                color: selected ? "#fff" : BRAND_GREEN,
                background: selected
                  ? `linear-gradient(135deg, ${BRAND_GREEN}, ${BRAND_GREEN_DARK})`
                  : "#f0fdf4",
                border: selected ? "none" : "2px solid #bbf7d0",
                boxShadow: selected
                  ? "0 4px 16px rgba(22,163,74,0.35)"
                  : "0 2px 8px rgba(15,23,42,0.04)",
                transition: "all 0.2s ease",
              }}>
                {person.initials}
              </div>
              <span style={{
                fontSize: "10.5px", fontWeight: 700,
                color: selected ? BRAND_GREEN : "#64748b",
                maxWidth: "64px", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {person.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PasswordLoginForm({
  register, errors, showPassword, setShowPassword,
  isPending, isBlocked, rememberMe, setRememberMe,
}) {
  return (
    <div className="login-mode-enter" style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%" }}>
      <BlockedAlert isBlocked={isBlocked} />

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginLeft: "2px" }}>
          Username
        </label>
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: "15px", top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8",
            display: "flex", alignItems: "center", pointerEvents: "none",
          }}>
            <User size={17} strokeWidth={2.5} />
          </div>
          <input
            className="input"
            style={{
              height: "50px", paddingLeft: "46px",
              borderRadius: "12px", background: "#f8fafc",
              border: "1.5px solid #e2e8f0", fontSize: "14.5px",
              width: "100%", boxSizing: "border-box",
            }}
            placeholder="e.g. admin_user"
            autoComplete="username"
            {...register("username")}
          />
        </div>
        {errors.username && (
          <p style={{ margin: 0, fontSize: "11.5px", fontWeight: 700, color: "#dc2626", marginLeft: "2px" }}>
            {errors.username.message}
          </p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
          Password
        </label>
        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: "15px", top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8",
            display: "flex", alignItems: "center", pointerEvents: "none",
          }}>
            <Lock size={17} strokeWidth={2.5} />
          </div>
          <input
            className="input"
            style={{
              height: "50px", paddingLeft: "46px", paddingRight: "46px",
              borderRadius: "12px", background: "#f8fafc",
              border: "1.5px solid #e2e8f0", fontSize: "14.5px",
              width: "100%", boxSizing: "border-box",
            }}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
          />
          <button
            type="button"
            style={{
              position: "absolute", right: "10px", top: "50%",
              transform: "translateY(-50%)", display: "flex",
              alignItems: "center", justifyContent: "center",
              width: "34px", height: "34px", borderRadius: "8px",
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8",
            }}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {errors.password && (
          <p style={{ margin: 0, fontSize: "11.5px", fontWeight: 700, color: "#dc2626", marginLeft: "2px" }}>
            {errors.password.message}
          </p>
        )}
      </div>

      <label style={{
        display: "inline-flex", alignItems: "center", gap: "10px",
        cursor: "pointer", fontSize: "13.5px", fontWeight: 600, color: "#334155",
      }}>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          style={{
            width: "17px", height: "17px", accentColor: BRAND_GREEN, cursor: "pointer",
          }}
        />
        Remember me
      </label>

      <button type="submit" disabled={isPending} style={submitButtonStyle(isPending)}>
        {isPending ? (
          <Loader2 size={20} className="is-spinning" />
        ) : (
          <>
            <span>Sign In</span>
            <ChevronRight size={18} />
          </>
        )}
      </button>

      <TrustDivider />
    </div>
  );
}

function PinLoginPanel({
  pin, setPin, onSubmit, isPending, isSuccess, isBlocked, errorMessage,
  recentStaff, selectedStaffId, onSelectStaff,
}) {
  const greeting = selectedStaffId
    ? recentStaff.find((s) => s.id === selectedStaffId)?.name?.split(" ")[0]
    : recentStaff[0]?.name?.split(" ")[0];

  return (
    <div className="login-mode-enter" style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
      <BlockedAlert isBlocked={isBlocked} />

      <RecentStaffRow
        staff={recentStaff}
        selectedId={selectedStaffId}
        onSelect={onSelectStaff}
      />

      <p style={{
        margin: 0, textAlign: "center", fontSize: "14px",
        fontWeight: 700, color: "#334155", lineHeight: 1.5,
      }}>
        {greeting ? (
          <>Welcome back, <span style={{ color: BRAND_GREEN }}>{greeting}</span></>
        ) : (
          "Enter your staff PIN for quick access"
        )}
      </p>
      <p style={{
        margin: "-6px 0 0", textAlign: "center", fontSize: "12px",
        fontWeight: 600, color: "#94a3b8",
      }}>
        4–6 digits · auto-submits when complete
      </p>

      <PinKeypad
        value={pin}
        onChange={setPin}
        onComplete={onSubmit}
        disabled={isBlocked}
        isPending={isPending}
        isSuccess={isSuccess}
        hasError={!!errorMessage}
        maxLength={6}
        minLength={4}
      />

      {errorMessage && (
        <p
          role="alert"
          aria-live="polite"
          style={{
            margin: 0, textAlign: "center", fontSize: "12.5px",
            fontWeight: 700, color: "#dc2626",
            padding: "10px 14px", borderRadius: "10px",
            background: "#fef2f2", border: "1px solid #fecaca",
          }}
        >
          {errorMessage}
        </p>
      )}

      <TrustDivider />
    </div>
  );
}

function TrustDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "4px" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)" }} />
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#94a3b8",
      }}>
        <Shield size={12} strokeWidth={2.5} />
        Secured by OlitechHub
      </span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #e2e8f0, transparent)" }} />
    </div>
  );
}

const submitButtonStyle = (isPending) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  width: "100%",
  height: "52px",
  borderRadius: "14px",
  background: isPending
    ? BRAND_GREEN_DARK
    : `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_GREEN_DARK} 100%)`,
  color: "#fff",
  fontSize: "15px",
  fontWeight: 800,
  letterSpacing: "0.02em",
  border: "none",
  cursor: isPending ? "not-allowed" : "pointer",
  boxShadow: "0 6px 28px rgba(22,163,74,0.3)",
  transition: "all 0.18s ease",
  opacity: isPending ? 0.75 : 1,
});

function SignInHeader({ subtitle }) {
  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "52px", height: "52px", borderRadius: "14px",
        background: "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)",
        marginBottom: "22px",
        boxShadow: "0 4px 16px rgba(22,163,74,0.12)",
        border: "1px solid rgba(22,163,74,0.12)",
      }}>
        <Store size={28} color={BRAND_GREEN} strokeWidth={2.5} />
      </div>
      <h1 style={{
        margin: "0 0 8px",
        fontSize: "2rem",
        fontWeight: 900,
        color: "#0f172a",
        letterSpacing: "-0.6px",
        lineHeight: 1.08,
      }}>
        Welcome Back
      </h1>
      <p style={{
        margin: 0, fontSize: "14.5px", fontWeight: 500,
        color: "#64748b", lineHeight: 1.55,
      }}>
        {subtitle}
      </p>
    </>
  );
}

export default function SignIn() {
  const nav = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (isAuthenticated && role) {
      nav(routeForRole(role), { replace: true });
    }
  }, [isAuthenticated, role, nav]);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginMode, setLoginMode] = useState("pin");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [recentStaff] = useState(() => getRecentStaff());
  const [selectedStaffId, setSelectedStaffId] = useState(() => getRecentStaff()[0]?.id ?? null);
  const doLogin = useAuthStore((s) => s.login);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const handleAuthSuccess = useCallback(
    (res) => {
      const user = res?.data?.user || null;
      const authRole = res?.data?.role ?? user?.role;
      const token = res?.data?.token;
      const refresh_token = res?.data?.refresh_token;
      const normalizedRole = normalizeRole(authRole);

      if (!["owner", "cashier", "developer"].includes(normalizedRole)) {
        toast.error("Account role is missing or invalid. Contact admin.");
        return;
      }

      rememberStaff(user);
      toast.success("Welcome back!");
      doLogin({ user, role: authRole, token, refresh_token });
      nav(routeForRole(normalizedRole));
    },
    [doLogin, nav]
  );

  const passwordMutation = useMutation({
    mutationFn: (v) => login(v.username, v.password),
    onSuccess: handleAuthSuccess,
    onError: (e) => toast.error(e.response?.data?.error || "Login failed"),
  });

  const pinMutation = useMutation({
    mutationFn: loginPin,
    onSuccess: (res) => {
      setPinError("");
      setPinSuccess(true);
      setTimeout(() => {
        setPinSuccess(false);
        setPin("");
        handleAuthSuccess(res);
      }, 520);
    },
    onError: (e) => {
      const msg = e.response?.data?.error || "Invalid PIN";
      setPinError(msg);
      setPin("");
      setPinSuccess(false);
      if (e.response?.status !== 429) toast.error(msg);
      else toast.error("Too many attempts. Please wait and try again.");
    },
  });

  const submitPin = useCallback(
    (completedPin) => {
      if (pinMutation.isPending || pinSuccess) return;
      pinMutation.mutate(completedPin);
    },
    [pinMutation, pinSuccess]
  );

  const subtitle =
    loginMode === "pin"
      ? "Tap your PIN for fast staff sign-in."
      : "Enter your credentials to access the supermarket portal.";

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <div style={{
        position: "relative", width: "48%", height: "100%", flexShrink: 0,
      }}>
        <LoginHero />
      </div>

      <div style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        overflowY: "auto",
        background: "#ffffff",
        padding: "48px 40px",
        boxSizing: "border-box",
      }}>
        <div
          className="bg-dot-grid"
          aria-hidden
          style={{
            position: "absolute", inset: 0, opacity: 0.35,
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }} className="animate-page-enter">
          <div style={{ marginBottom: "30px" }}>
            <SignInHeader subtitle={subtitle} />
          </div>

          <LoginModeToggle
            mode={loginMode}
            onChange={(mode) => {
              setLoginMode(mode);
              setPinError("");
              setPin("");
              setPinSuccess(false);
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={loginMode}
              initial={{ opacity: 0, x: loginMode === "pin" ? -14 : 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: loginMode === "pin" ? 14 : -14 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {loginMode === "pin" ? (
                <PinLoginPanel
                  pin={pin}
                  setPin={(v) => { setPin(v); if (pinError) setPinError(""); }}
                  onSubmit={submitPin}
                  isPending={pinMutation.isPending}
                  isSuccess={pinSuccess}
                  isBlocked={false}
                  errorMessage={pinError}
                  recentStaff={recentStaff}
                  selectedStaffId={selectedStaffId}
                  onSelectStaff={setSelectedStaffId}
                />
              ) : (
                <form onSubmit={handleSubmit((v) => passwordMutation.mutate(v))}>
                  <PasswordLoginForm
                    register={register}
                    errors={errors}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    isPending={passwordMutation.isPending}
                    isBlocked={false}
                    rememberMe={rememberMe}
                    setRememberMe={setRememberMe}
                  />
                </form>
              )}
            </motion.div>
          </AnimatePresence>

          <div style={{ textAlign: "center", marginTop: "28px" }}>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 500, color: "#cbd5e1" }}>
              © 2026 OlitechHub. Staff &amp; Administration Portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
