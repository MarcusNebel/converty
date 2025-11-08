import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  registerSetupIPC,
  registerThemeIPC,
  registerAppIPC,
  registerStoreIPC,
  registerConvertMediaIPC,
  registerConvertImageIPC,
  registerConvertArchiveIPC,
  registerConvertDocumentIPC,
  registerLibreOfficeIPC
} from './main/ipcHandlers.js';
import { registerUpdateIPC } from "./main/updateHandler.js";
import Store from "electron-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();

const preloadPath = app.isPackaged
  ? path.join(process.resourcesPath, "app.asar.unpacked", "preload.js")
  : path.join(__dirname, "preload.js");

if (!fs.existsSync(preloadPath))
  console.error("Preload nicht gefunden:", preloadPath);
else console.log("Preload gefunden:", preloadPath);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true, // Pflicht für contextBridge
    nodeIntegration: false,  // Sicherheitsmaßnahme
    },
  });
  if (app.isPackaged) {
    win.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  } else {
    win.loadURL("http://localhost:5678"); // Vite dev server
  }
}

export function clearTempFiles() {
  const tempFiles = store.get("temp-dir-files", []);
  const remaining = [];

  for (const file of tempFiles) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log("Gelöscht:", file);
      }
    } catch (err) {
      console.warn("Konnte Datei nicht löschen:", file, err.message);
      remaining.push(file);
    }
  }

  store.set("temp-dir-files", remaining);
}

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle("get-file-size", (event, path) => {
  console.log("get-file-size aufgerufen für:", path);
  try {
    const size = fs.statSync(path).size;
    console.log("Größe (Bytes):", size);
    return size;
  } catch (e) {
    console.error("Dateigröße konnte nicht gelesen werden:", path, e);
    return 0;
  }
});

app.whenReady().then(() => {
  clearTempFiles();
  registerSetupIPC();
  registerThemeIPC();
  createWindow();
  registerAppIPC();
  registerStoreIPC();
  registerConvertMediaIPC();
  registerConvertImageIPC();
  registerConvertArchiveIPC();
  registerConvertDocumentIPC();
  registerLibreOfficeIPC();
  registerUpdateIPC();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});