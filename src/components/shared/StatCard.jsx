import { ArrowRight } from "lucide-react";

const VARIANT = {
  revenue: { bg: "var(--accent-light)", fg: "var(--accent-primary)" },
  profit: { bg: "var(--warning-bg)", fg: "var(--warning)" },
  warning: { bg: "var(--warning-bg)", fg: "var(--warning)" },
  info: { bg: "var(--info-bg)", fg: "var(--info)" },
  transactions: { bg: "var(--stat-transactions-bg)", fg: "var(--stat-transactions-fg)" },
  success: { bg: "var(--success-bg)", fg: "var(--success)" },
};

export default function StatCard({
  label,
  value,
  onClick,
  icon: Icon,
  variant = "revenue",
  pulse = false,
  subLabel,
  index = 0,
}) {
  const t = VARIANT[variant] || VARIANT.revenue;

  return (
    <button
      type="button"
      className="stat-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="stat-card__top">
        <div className="stat-card__copy">
          <p className="stat-card__label">{label}</p>
          <p className="stat-card__value">{value ?? "—"}</p>
          {subLabel ? <p className="stat-card__sub">{subLabel}</p> : null}
        </div>
        {Icon ? (
          <div
            className={`stat-card__icon${pulse ? " is-pulse" : ""}`}
            style={{ background: t.bg, color: t.fg }}
          >
            <Icon size={18} strokeWidth={2.25} aria-hidden />
          </div>
        ) : null}
      </div>
      <div className="stat-card__link">
        View details
        <ArrowRight size={12} strokeWidth={2.25} aria-hidden />
      </div>
    </button>
  );
}
