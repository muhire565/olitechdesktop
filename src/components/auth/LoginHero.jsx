import { useEffect, useState } from "react";
import { Monitor, Shield, ShoppingCart, Sparkles, Wifi } from "lucide-react";

const BRAND_GREEN_DARK = "#15803d";

const heroImages = import.meta.glob("../../assets/branding/login-hero.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});
const loginHeroBg = Object.values(heroImages)[0] ?? null;

const logoImages = import.meta.glob("../../assets/branding/logo.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  import: "default",
});
const brandLogo = Object.values(logoImages)[0] ?? null;

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="login-live-clock" style={{ textAlign: "left" }}>
      <p style={{
        margin: 0, fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 800,
        color: "#fff", letterSpacing: "-0.03em", lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>
        {time}
      </p>
      <p style={{
        margin: "6px 0 0", fontSize: "13px", fontWeight: 600,
        color: "rgba(255,255,255,0.72)", letterSpacing: "0.02em",
      }}>
        {date}
      </p>
    </div>
  );
}

export default function LoginHero() {
  const hasHeroImage = Boolean(loginHeroBg);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100%",
      overflow: "hidden",
      background: hasHeroImage
        ? `url(${loginHeroBg}) center/cover no-repeat`
        : `linear-gradient(145deg, ${BRAND_GREEN_DARK} 0%, #14532d 42%, #052e16 100%)`,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: hasHeroImage
          ? "linear-gradient(105deg, rgba(5,46,22,0.78) 0%, rgba(5,46,22,0.48) 36%, rgba(15,23,42,0.18) 58%, rgba(15,23,42,0.06) 100%), linear-gradient(180deg, rgba(15,23,42,0.35) 0%, transparent 28%, transparent 72%, rgba(5,46,22,0.42) 100%)"
          : "radial-gradient(circle at 18% 78%, rgba(255,255,255,0.1) 0%, transparent 48%), radial-gradient(circle at 82% 22%, rgba(74,222,128,0.12) 0%, transparent 42%)",
        pointerEvents: "none",
      }} />

      {!hasHeroImage && (
        <div className="login-hero-shimmer" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      )}

      {!hasHeroImage && (
        <>
          <div
            className="login-hero-orb"
            style={{
              position: "absolute", top: "14%", right: "10%",
              width: "160px", height: "160px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(74,222,128,0.28) 0%, transparent 70%)",
              filter: "blur(2px)", pointerEvents: "none",
            }}
          />
          <div
            className="login-hero-orb"
            style={{
              position: "absolute", bottom: "20%", left: "8%",
              width: "110px", height: "110px", borderRadius: "50%",
              background: "radial-gradient(circle, rgba(22,163,74,0.22) 0%, transparent 70%)",
              filter: "blur(1px)", pointerEvents: "none",
              animationDelay: "-5s",
            }}
          />
        </>
      )}

      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "40px 44px 48px",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "8px 14px", borderRadius: "999px",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}>
            <Monitor size={13} color="#4ade80" strokeWidth={2.5} />
            <span style={{
              fontSize: "11px", fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#fff",
            }}>
              Desktop App
            </span>
          </div>
        </div>

        <div style={{ maxWidth: "380px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "72px", height: "72px", borderRadius: "20px",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            marginBottom: "24px",
            border: "1px solid rgba(255,255,255,0.15)",
            overflow: "hidden",
          }}>
            {brandLogo ? (
              <img
                src={brandLogo}
                alt="OlitechHub"
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6px" }}
              />
            ) : (
              <ShoppingCart size={34} strokeWidth={2} color="#fff" />
            )}
          </div>

          <h2 style={{
            margin: "0 0 12px", fontSize: "clamp(1.85rem, 3vw, 2.35rem)",
            fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.1,
          }}>
            Olitech
            <br />
            <span style={{ color: "#4ade80" }}>Hub</span>
          </h2>
          <p style={{
            margin: 0, fontSize: "14.5px", fontWeight: 500,
            color: "rgba(255,255,255,0.78)", lineHeight: 1.6,
          }}>
            Staff &amp; administration portal powered by OlitechHub. Fast, secure, desktop-ready.
          </p>

          <div style={{
            display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "22px",
          }}>
            {[
              { label: "POS Ready", icon: ShoppingCart },
              { label: "Offline capable", icon: Wifi },
              { label: "Secure auth", icon: Shield },
            ].map(({ label, icon: Icon }) => (
              <span key={label} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", borderRadius: "999px",
                fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}>
                <Icon size={12} color="#4ade80" />
                {label}
              </span>
            ))}
          </div>

          <div style={{
            marginTop: "28px",
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "8px 14px", borderRadius: "12px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)",
          }}>
            <Sparkles size={13} color="#4ade80" />
            Optimized for cashier terminals
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
        }}>
          <LiveClock />
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 14px", borderRadius: "12px",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}>
            <Shield size={15} color="#4ade80" strokeWidth={2.5} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
              End-to-end secured
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
