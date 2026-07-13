import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke("app:getVersion").catch(() => null),
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
    onMaximizedChange: (cb) => {
      const handler = (_e, data) => cb(Boolean(data?.maximized));
      ipcRenderer.on("window:maximized", handler);
      return () => ipcRenderer.removeListener("window:maximized", handler);
    },
  },
  updater: {
    check: () => ipcRenderer.invoke("updater:check"),
    install: () => ipcRenderer.invoke("updater:install"),
    onAvailable: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("updater:available", handler);
      return () => ipcRenderer.removeListener("updater:available", handler);
    },
    onProgress: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("updater:progress", handler);
      return () => ipcRenderer.removeListener("updater:progress", handler);
    },
    onDownloaded: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("updater:downloaded", handler);
      return () => ipcRenderer.removeListener("updater:downloaded", handler);
    },
    onError: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("updater:error", handler);
      return () => ipcRenderer.removeListener("updater:error", handler);
    },
    onStatus: (cb) => {
      const handler = (_e, data) => cb(data);
      ipcRenderer.on("updater:status", handler);
      return () => ipcRenderer.removeListener("updater:status", handler);
    },
  },
});
