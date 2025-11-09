import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
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
  ? path.join(process.resourcesPath, "app.asar", "preload.js")
  : path.join(__dirname, "preload.js");

if (!fs.existsSync(preloadPath))
  console.error("Preload nicht gefunden:", preloadPath);
else console.log("Preload gefunden:", preloadPath);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5678'); // Vite dev server
  }
}

function buildDebugMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },

    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },

    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' }
      ]
    },

    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
  if (!app.isPackaged) {
    buildDebugMenu();
  } else {
    Menu.setApplicationMenu(null);
  }

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