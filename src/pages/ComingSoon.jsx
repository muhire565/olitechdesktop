import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

const TITLES = {
  "/pos": "POS",
  "/sales": "Sales",
  "/customers": "Customers",
  "/eod/submit": "Submit EOD",
  "/savings": "Cash Savings",
};

export default function ComingSoon() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || "This section";

  return (
    <div className="coming-soon">
      <div className="coming-soon__card">
        <div className="coming-soon__icon">
          <Construction size={28} strokeWidth={2} />
        </div>
        <h1>{title}</h1>
        <p>
          Sidebar navigation is ready. We’ll implement this screen next with the same API and
          live-update logic as the web app.
        </p>
      </div>
    </div>
  );
}
