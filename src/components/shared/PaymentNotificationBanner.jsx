import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, BellRing, X } from "lucide-react";
import { useState } from "react";
import { listActivePaymentNotifications } from "../../api/paymentNotifications.api";
import { today } from "../../utils/dateUtils";

export default function PaymentNotificationBanner() {
  const [dismissed, setDismissed] = useState(new Set());

  const q = useQuery({
    queryKey: ["payment-notifs-active"],
    queryFn: listActivePaymentNotifications,
    staleTime: 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  });

  const notifications = (q.data?.data || []).filter((n) => {
    const isToday = n.created_at && n.created_at.startsWith(today());
    return isToday && !dismissed.has(n.id);
  });

  if (!notifications.length) return null;

  const dismiss = (id) => setDismissed((s) => new Set([...s, id]));

  const sorted = [...notifications].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  return (
    <div className="pos-banners">
      {sorted.map((n) => {
        const Icon = n.severity === "info" ? Info : AlertTriangle;
        return (
          <div key={n.id} className={`pos-banner pos-banner--${n.severity || "warning"}`} role="alert">
            <div className="pos-banner__icon">
              <Icon size={18} />
            </div>
            <div className="pos-banner__body">
              <div className="pos-banner__title-row">
                <p>{n.title}</p>
                {n.is_reminder && (
                  <span>
                    <BellRing size={9} /> Payment Reminder
                  </span>
                )}
              </div>
              <p>{n.body}</p>
            </div>
            <button type="button" className="pos-icon-btn" onClick={() => dismiss(n.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
