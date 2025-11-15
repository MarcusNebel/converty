import { app, ipcMain } from "electron";
import Store from 'electron-store';

const store = new Store();

export function logToRenderer(win, ...args) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(
      "debug-log",
      args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : a).join(" ")
    );
  }
  console.log(...args);
}

export function registerThemeIPC() {
  // Read theme
  ipcMain.handle("theme:get", () => {
    return store.get("theme") || "system";
  });

  // Save theme
  ipcMain.handle("theme:set", (_, theme) => {
    store.set("theme", theme);
    return theme;
  });
}

export function registerAppIPC() {
  ipcMain.handle("app:getLocale", () => {
    try {
      // Returns the system locale (e.g., "de" or "en-US")
      const locale = app.getLocale();

      // Optionally normalize to a full locale string
      return locale || "en";
    } catch (err) {
      console.error("Error while reading system locale:", err);
      return "en";
    }
  });
}

export function registerStoreIPC() {
  ipcMain.handle("store:get", (_, key) => {
    return store.get(key);
  });

  ipcMain.handle("store:set", (_, key, value) => {
    store.set(key, value);
    return true;
  });
}
