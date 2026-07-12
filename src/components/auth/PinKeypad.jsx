import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Delete, Loader2 } from "lucide-react";

const PIN_LENGTH = 6;
const MIN_PIN = 4;

function hapticTap() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(8);
  }
}

function PinDots({ value, maxLength, isPending, isSuccess, hasError }) {
  return (
    <div
      className={hasError ? "animate-shake" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "12px 0 8px",
        position: "relative",
      }}
      aria-label={`PIN entry, ${value.length} of ${maxLength} digits`}
    >
      {Array.from({ length: maxLength }).map((_, i) => {
        const filled = i < value.length;
        const isActive = i === value.length && !isPending && !isSuccess && !hasError;
        const showBeam = filled && i > 0 && i <= value.length;

        let dotClass = "";
        if (isSuccess && filled) dotClass = "pin-dot-success";
        else if (isPending && filled) dotClass = "pin-dot-verify";
        else if (filled) dotClass = "pin-dot-filled";
        else if (isActive) dotClass = "pin-dot-active";

        const borderColor = hasError
          ? "#dc2626"
          : filled || isSuccess
            ? "#16a34a"
            : isActive
              ? "#16a34a"
              : "#cbd5e1";

        const bg = hasError && filled
          ? "#dc2626"
          : isSuccess && filled
            ? "#16a34a"
            : filled
              ? "#16a34a"
              : "transparent";

        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {showBeam && (
              <div
                className="pin-beam"
                style={{
                  width: "14px",
                  height: "2px",
                  background: hasError
                    ? "linear-gradient(90deg, #dc2626, #f87171)"
                    : "linear-gradient(90deg, #16a34a, #4ade80)",
                  borderRadius: "2px",
                  marginRight: "-1px",
                }}
              />
            )}
            <div
              className={dotClass}
              style={{
                width: isActive ? "18px" : "14px",
                height: isActive ? "18px" : "14px",
                borderRadius: "50%",
                background: bg,
                border: `2.5px solid ${borderColor}`,
                transition: "width 0.15s ease, height 0.15s ease, background 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isActive && !hasError
                  ? "0 0 16px rgba(22,163,74,0.35)"
                  : filled && !hasError
                    ? "0 0 10px rgba(22,163,74,0.2)"
                    : "none",
              }}
            >
              {isSuccess && filled && (
                <Check size={8} color="#fff" strokeWidth={3.5} />
              )}
            </div>
            {i < maxLength - 1 && (
              <div style={{ width: "14px", flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function KeyButton({
  children,
  onClick,
  disabled,
  ariaLabel,
  variant = "digit",
  keyIndex,
  highlighted,
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (disabled) return;
    hapticTap();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rip) => rip.id !== id)), 450);
    onClick?.();
  };

  const isAction = variant === "action";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      aria-label={ariaLabel}
      className="pin-key-enter"
      style={{
        ...digitKeyStyle(disabled, isAction, highlighted),
        "--key-i": keyIndex,
      }}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pin-key-ripple"
          style={{
            position: "absolute",
            left: r.x,
            top: r.y,
            width: "20px",
            height: "20px",
            marginLeft: "-10px",
            marginTop: "-10px",
            borderRadius: "50%",
            background: isAction ? "rgba(100,116,139,0.25)" : "rgba(22,163,74,0.28)",
            pointerEvents: "none",
          }}
        />
      ))}
      {children}
    </button>
  );
}

export default function PinKeypad({
  value,
  onChange,
  onComplete,
  disabled = false,
  isPending = false,
  isSuccess = false,
  hasError = false,
  maxLength = PIN_LENGTH,
  minLength = MIN_PIN,
}) {
  const completedRef = useRef(false);
  const [highlightedKey, setHighlightedKey] = useState(null);

  useEffect(() => {
    completedRef.current = false;
  }, [value, hasError]);

  useEffect(() => {
    if (
      value.length === maxLength &&
      !completedRef.current &&
      !disabled &&
      !isPending &&
      !isSuccess
    ) {
      completedRef.current = true;
      onComplete?.(value);
    }
  }, [value, maxLength, disabled, isPending, isSuccess, onComplete]);

  const press = useCallback((digit) => {
    if (disabled || isPending || isSuccess || value.length >= maxLength) return;
    onChange(value + digit);
  }, [disabled, isPending, isSuccess, value, maxLength, onChange]);

  const backspace = useCallback(() => {
    if (disabled || isPending || isSuccess || !value.length) return;
    onChange(value.slice(0, -1));
  }, [disabled, isPending, isSuccess, value, onChange]);

  const clear = useCallback(() => {
    if (disabled || isPending || isSuccess) return;
    onChange("");
  }, [disabled, isPending, isSuccess, onChange]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (disabled || isPending || isSuccess) return;
      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        setHighlightedKey(key);
        press(key);
        setTimeout(() => setHighlightedKey(null), 120);
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        e.preventDefault();
        setHighlightedKey("back");
        backspace();
        setTimeout(() => setHighlightedKey(null), 120);
        return;
      }
      if (key === "Escape") {
        e.preventDefault();
        clear();
        return;
      }
      if (key === "Enter" && value.length >= minLength) {
        e.preventDefault();
        onComplete?.(value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled, isPending, isSuccess, press, backspace, clear, value, minLength, onComplete]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];
  const auraOpacity = 0.25 + (value.length / maxLength) * 0.45;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <div
          className="pin-aura"
          aria-hidden
          style={{
            position: "absolute",
            inset: "-20px -12px",
            borderRadius: "24px",
            background: hasError
              ? `radial-gradient(ellipse at center, rgba(220,38,38,${auraOpacity * 0.5}) 0%, transparent 70%)`
              : `radial-gradient(ellipse at center, rgba(22,163,74,${auraOpacity}) 0%, transparent 70%)`,
            pointerEvents: "none",
            transition: "background 0.3s ease",
          }}
        />
        <PinDots
          value={value}
          maxLength={maxLength}
          isPending={isPending}
          isSuccess={isSuccess}
          hasError={hasError}
        />
      </div>

      <div
        style={{
          position: "relative",
          padding: "16px",
          borderRadius: "22px",
          background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)",
          border: "1.5px solid rgba(226,232,240,0.9)",
          boxShadow: "0 8px 32px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            maxWidth: "320px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {keys.map((key, idx) => {
            if (key === "clear") {
              return (
                <KeyButton
                  key={key}
                  keyIndex={idx}
                  variant="action"
                  disabled={disabled || isPending || isSuccess || !value.length}
                  onClick={clear}
                  ariaLabel="Clear PIN"
                  highlighted={highlightedKey === "clear"}
                >
                  Clear
                </KeyButton>
              );
            }
            if (key === "back") {
              return (
                <KeyButton
                  key={key}
                  keyIndex={idx}
                  variant="action"
                  disabled={disabled || isPending || isSuccess || !value.length}
                  onClick={backspace}
                  ariaLabel="Delete last digit"
                  highlighted={highlightedKey === "back"}
                >
                  <Delete size={18} />
                </KeyButton>
              );
            }
            const keyDisabled = disabled || isPending || isSuccess || value.length >= maxLength;
            return (
              <KeyButton
                key={key}
                keyIndex={idx}
                disabled={keyDisabled}
                onClick={() => press(key)}
                ariaLabel={`Digit ${key}`}
                highlighted={highlightedKey === key}
              >
                {key}
              </KeyButton>
            );
          })}
        </div>
      </div>

      {isPending && (
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: "10px", color: "#64748b", fontSize: "13px", fontWeight: 700,
        }}>
          <Loader2 size={17} className="is-spinning" style={{ color: "#16a34a" }} />
          Verifying your PIN…
        </div>
      )}

      {isSuccess && (
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center",
          gap: "8px", color: "#16a34a", fontSize: "14px", fontWeight: 800,
        }}>
          <Check size={18} strokeWidth={3} />
          Access granted
        </div>
      )}

      {value.length >= minLength && value.length < maxLength && !isPending && !isSuccess && (
        <button
          type="button"
          onClick={() => onComplete?.(value)}
          style={{
            width: "100%",
            maxWidth: "320px",
            margin: "0 auto",
            height: "48px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 6px 22px rgba(22,163,74,0.28)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          Sign in with PIN
        </button>
      )}

      <p style={{
        margin: 0, textAlign: "center", fontSize: "11px",
        fontWeight: 600, color: "#94a3b8", letterSpacing: "0.02em",
      }}>
        Keyboard supported · Enter to confirm
      </p>
    </div>
  );
}

const digitKeyStyle = (disabled, isAction, highlighted) => ({
  position: "relative",
  overflow: "hidden",
  height: "58px",
  borderRadius: "16px",
  border: highlighted
    ? "2px solid #16a34a"
    : "1.5px solid #e2e8f0",
  background: disabled
    ? "#f8fafc"
    : highlighted
      ? "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)"
      : isAction
        ? "#f1f5f9"
        : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  color: isAction ? "#64748b" : "#0f172a",
  fontSize: isAction ? "12px" : "24px",
  fontWeight: isAction ? 700 : 800,
  cursor: disabled ? "not-allowed" : "pointer",
  boxShadow: disabled
    ? "none"
    : highlighted
      ? "0 0 0 3px rgba(22,163,74,0.15), 0 4px 14px rgba(22,163,74,0.12)"
      : "0 3px 10px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
  transition: "all 0.12s ease",
  opacity: disabled ? 0.5 : 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transform: highlighted ? "scale(0.97)" : "scale(1)",
});
