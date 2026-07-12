import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const root = resolve(import.meta.dirname);

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(root, "electron/main/index.js"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(root, "electron/preload/index.js"),
      },
    },
  },
  renderer: {
    root: resolve(root, "src"),
    envDir: root,
    build: {
      rollupOptions: {
        input: resolve(root, "src/index.html"),
      },
    },
    resolve: {
      alias: {
        "@": resolve(root, "src"),
        "socket.io-client": resolve(root, "node_modules/socket.io-client"),
      },
    },
    optimizeDeps: {
      include: ["socket.io-client"],
    },
    server: {
      fs: {
        allow: [root],
      },
    },
    plugins: [react()],
  },
});
