import { useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";

/**
 * Listens for electron-updater events and shows a non-blocking banner
 * when a feature update is available / ready to install.
 */
export default function UpdateBanner() {
  const [phase, setPhase] = useState("idle"); // idle | available | downloading | ready
  const [version, setVersion] = useState("");
  const [percent, setPercent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = window.electronAPI?.updater;
    if (!api) return undefined;

    const offAvailable = api.onAvailable?.((info) => {
      setVersion(info?.version || "");
      setPhase("available");
      setDismissed(false);
    });
    const offProgress = api.onProgress?.((p) => {
      setPhase("downloading");
      setPercent(Math.round(p?.percent || 0));
    });
    const offDownloaded = api.onDownloaded?.((info) => {
      setVersion(info?.version || "");
      setPhase("ready");
      setPercent(100);
      setDismissed(false);
    });

    return () => {
      offAvailable?.();
      offProgress?.();
      offDownloaded?.();
    };
  }, []);

  if (dismissed || phase === "idle" || !window.electronAPI?.updater) return null;

  return (
    <div className="update-banner" role="status">
      <div className="update-banner__body">
        {phase === "available" && (
          <>
            <Download size={16} strokeWidth={2.4} />
            <span>
              Update <strong>{version}</strong> is available. Downloading in the background…
            </span>
          </>
        )}
        {phase === "downloading" && (
          <>
            <Download size={16} strokeWidth={2.4} />
            <span>Downloading update{version ? ` ${version}` : ""}… {percent}%</span>
            <div className="update-banner__bar" aria-hidden>
              <i style={{ width: `${percent}%` }} />
            </div>
          </>
        )}
        {phase === "ready" && (
          <>
            <RefreshCw size={16} strokeWidth={2.4} />
            <span>
              Update <strong>{version || "ready"}</strong> downloaded. Restart to apply (finish
              any open sale first).
            </span>
            <button
              type="button"
              className="update-banner__cta"
              onClick={() => window.electronAPI.updater.install()}
            >
              Restart &amp; update
            </button>
          </>
        )}
      </div>
      {phase !== "downloading" && (
        <button
          type="button"
          className="update-banner__close"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
