import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuthStore } from "../../store/authStore";
import { SocketProvider } from "../../context/SocketContext";
import { useSessionKeepAlive } from "../../hooks/useSessionKeepAlive";

const SIDEBAR_COLLAPSED_KEY = "sm_sidebar_desktop_collapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function isSalesWorkspace(pathname) {
  return pathname === "/pos" || pathname.startsWith("/sales");
}

export default function AppShell() {
  const role = useAuthStore((s) => s.role);
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const isPos = pathname === "/pos";
  const overlayMode = isSalesWorkspace(pathname);

  useSessionKeepAlive();

  const toggleCollapse = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const closeOverlay = useCallback(() => setOverlayOpen(false), []);
  const openOverlay = useCallback(() => setOverlayOpen(true), []);

  useEffect(() => {
    setOverlayOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!overlayMode || !overlayOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOverlayOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [overlayMode, overlayOpen]);

  return (
    <SocketProvider>
      <div
        className={[
          "app-shell",
          !overlayMode && collapsed ? "is-collapsed" : "",
          overlayMode ? "is-overlay-mode" : "",
          overlayMode && overlayOpen ? "is-overlay-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {overlayMode && (
          <button
            type="button"
            className="shell-menu-btn"
            onClick={openOverlay}
            aria-label="Open navigation"
            title="Menu"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
        )}

        {overlayMode && (
          <div
            className={`shell-overlay-backdrop${overlayOpen ? " is-visible" : ""}`}
            onClick={closeOverlay}
            aria-hidden={!overlayOpen}
          />
        )}

        <Sidebar
          role={role}
          collapsed={overlayMode ? false : collapsed}
          onToggleCollapse={toggleCollapse}
          overlay={overlayMode}
          overlayOpen={overlayOpen}
          onOverlayClose={closeOverlay}
        />

        <main
          className={[
            "app-shell__main",
            isPos ? "is-pos" : "",
            overlayMode ? "is-sales-workspace" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Outlet />
        </main>
      </div>
    </SocketProvider>
  );
}
