import { useEffect, useState } from "react";
import { Minus, Square, X } from "lucide-react";
import BrandLogo from "../shared/BrandLogo";

function RestoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="3.5" y="0.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="0.5" y="3.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function TitleBar() {
  const win = window.electronAPI?.window;
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!win) return undefined;
    win.isMaximized().then(setMaximized).catch(() => {});
    return win.onMaximizedChange(setMaximized);
  }, [win]);

  useEffect(() => {
    if (!win) return undefined;
    document.documentElement.style.setProperty("--titlebar-offset", "var(--titlebar-height)");
    return () => document.documentElement.style.removeProperty("--titlebar-offset");
  }, [win]);

  if (!win) return null;

  const handleDoubleClick = () => {
    win.maximize().catch(() => {});
  };

  return (
    <header className="app-titlebar">
      <div className="app-titlebar__brand">
        <div className="app-titlebar__logo-wrap">
          <BrandLogo size={24} alt="" />
        </div>
        <div className="app-titlebar__text">
          <span className="app-titlebar__name">OlitechHub</span>
          <span className="app-titlebar__sep" aria-hidden>—</span>
          <span className="app-titlebar__tag">Desktop POS</span>
        </div>
      </div>

      <div
        className="app-titlebar__drag"
        onDoubleClick={handleDoubleClick}
        aria-hidden
      />

      <div className="app-titlebar__controls">
        <button
          type="button"
          className="app-titlebar__btn"
          onClick={() => win.minimize()}
          aria-label="Minimize"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="app-titlebar__btn"
          onClick={() => win.maximize()}
          aria-label={maximized ? "Restore" : "Maximize"}
        >
          {maximized ? (
            <RestoreIcon />
          ) : (
            <Square size={14} strokeWidth={2.5} />
          )}
        </button>
        <button
          type="button"
          className="app-titlebar__btn app-titlebar__btn--close"
          onClick={() => win.close()}
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
