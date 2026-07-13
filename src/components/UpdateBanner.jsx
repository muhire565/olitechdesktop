import { useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";

/**
 * Listens for electron-updater events and shows a non-blocking banner
 * when a feature update is available / ready to install.
 */
export default function UpdateBanner() {
  const [phase, setPhase] = useState("idle"); // idle | checking | available | downloading | ready | error
  const [version, setVersion] = useState("");
  const [percent, setPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const api = window.electronAPI?.updater;
    if (!api) return undefined;

    const offStatus = api.onStatus?.((data) => {
      if (data?.status === "checking") {
        setPhase("checking");
        setErrorMsg("");
      }
      if (data?.status === "up-to-date") {
        setPhase("idle");
        setErrorMsg("");
      }
    });
    const offAvailable = api.onAvailable?.((info) => {
      setVersion(info?.version || "");
      setPhase("available");
      setDismissed(false);
      setErrorMsg("");
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
      setErrorMsg("");
    });
    const offError = api.onError?.((err) => {
      setPhase("error");
      setErrorMsg(err?.message || "Could not check for updates");
      setDismissed(false);
    });

    // Trigger a check as soon as the UI is ready (packaged app only).
    api.check?.().catch(() => {});

    return () => {
      offStatus?.();
      offAvailable?.();
      offProgress?.();
      offDownloaded?.();
      offError?.();
    };
  }, []);

  if (dismissed || phase === "idle" || !window.electronAPI?.updater) return null;

  return (
    <div className={`update-banner${phase === "error" ? " update-banner--error" : ""}`} role="status">
      <div className="update-banner__body">
        {phase === "checking" && (
          <>
            <RefreshCw size={16} strokeWidth={2.4} className="spin" />
            <span>Checking for updates…</span>
          </>
        )}
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
        {phase === "error" && (
          <>
            <RefreshCw size={16} strokeWidth={2.4} />
            <span>
              Update check failed: <strong>{errorMsg}</strong>. Go to Settings → Check for updates,
              or publish a newer release on GitHub.
            </span>
            <button
              type="button"
              className="update-banner__cta"
              onClick={() => {
                setDismissed(false);
                setPhase("checking");
                window.electronAPI?.updater?.check?.();
              }}
            >
              Retry
            </button>
          </>
        )}
      </div>
      {phase !== "downloading" && phase !== "checking" && (
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
