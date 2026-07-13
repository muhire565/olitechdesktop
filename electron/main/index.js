import { app, BrowserWindow, shell, ipcMain, nativeImage, Menu } from "electron";
import { join } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const isDev = !app.isPackaged;

/** @type {BrowserWindow | null} */
let mainWindow = null;

function getProjectRoot() {
  return join(__dirname, "..", "..");
}

function resolveWindowIcon() {
  const root = getProjectRoot();
  const candidates = [
    join(root, "src", "assets", "branding", "logo.png"),
    join(root, "build", "icon.png"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      const image = nativeImage.createFromPath(p);
      if (!image.isEmpty()) return image;
    }
  }
  return undefined;
}

function resolvePreloadPath() {
  const mjs = join(__dirname, "../preload/index.mjs");
  const js = join(__dirname, "../preload/index.js");
  if (existsSync(mjs)) return mjs;
  return js;
}

function sendUpdater(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  const runUpdateCheck = () => {
    autoUpdater.checkForUpdates().catch((err) => {
      sendUpdater("updater:error", { message: err?.message || String(err) });
    });
  };

  autoUpdater.on("checking-for-update", () => {
    sendUpdater("updater:status", { status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    sendUpdater("updater:available", {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes ?? null,
    });
  });

  autoUpdater.on("update-not-available", () => {
    sendUpdater("updater:status", { status: "up-to-date" });
  });

  autoUpdater.on("download-progress", (progress) => {
    sendUpdater("updater:progress", {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendUpdater("updater:downloaded", {
      version: info.version,
      releaseNotes: info.releaseNotes ?? null,
    });
  });

  autoUpdater.on("error", (err) => {
    sendUpdater("updater:error", { message: err?.message || String(err) });
  });

  ipcMain.handle("updater:check", async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, version: result?.updateInfo?.version ?? null };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle("updater:install", () => {
    // isSilent=false, isForceRunAfter=true
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
    return { ok: true };
  });

  // Check after the UI loads, then again shortly after, then every 4 hours
  const scheduleChecks = () => {
    setTimeout(runUpdateCheck, 1_500);
    setTimeout(runUpdateCheck, 4_000);
  };

  if (mainWindow?.webContents.isLoading()) {
    mainWindow.webContents.once("did-finish-load", scheduleChecks);
  } else {
    scheduleChecks();
  }

  setInterval(runUpdateCheck, 4 * 60 * 60 * 1000);
}

function sendWindowState(maximized) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("window:maximized", { maximized });
  }
}

function setupWindowControls() {
  ipcMain.handle("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.handle("window:maximize", () => {
    if (!mainWindow) return { maximized: false };
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return { maximized: mainWindow.isMaximized() };
  });

  ipcMain.handle("window:close", () => {
    mainWindow?.close();
  });

  ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);
}

function createWindow() {
  const windowIcon = resolveWindowIcon();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    title: "OlitechHub — Desktop POS",
    backgroundColor: "#0a0c10",
    icon: windowIcon,
    webPreferences: {
      preload: resolvePreloadPath(),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenu(null);
  mainWindow.removeMenu();

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
    if (process.platform === "win32") {
      mainWindow?.maximize();
    }
  });

  mainWindow.on("maximize", () => sendWindowState(true));
  mainWindow.on("unmaximize", () => sendWindowState(false));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  ipcMain.handle("app:getVersion", () => app.getVersion());
  setupWindowControls();

  createWindow();
  setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
