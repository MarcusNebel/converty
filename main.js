import { app, BrowserWindow, ipcMain, dialog, Menu, Notification } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  registerThemeIPC,
  registerAppIPC,
  registerStoreIPC
} from './main/ipcHandlers.js';
import { registerConvertArchiveIPC } from "./main/convertHandlers/convertArchiveHandler.js"
import { registerConvertDocumentIPC } from "./main/convertHandlers/convertDocumentHandler.js"
import { registerConvertImageIPC } from "./main/convertHandlers/convertImageHandler.js"
import { registerConvertMediaIPC } from "./main/convertHandlers/convertMediaHandler.js"
import { registerLibreOfficeIPC } from "./main/convertHandlers/libreofficeHandler.js"
import { registerUpdateIPC } from "./main/updateHandler.js";
import { registerSetupIPC } from "./main/setupHandler.js";
import store from "./main/electronStore.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const preloadPath = app.isPackaged
  ? path.join(process.resourcesPath, "app.asar.unpacked", "preload.js")
  : path.join(__dirname, "preload.js");

if (!fs.existsSync(preloadPath))
  console.error("Preload not found:", preloadPath);
else console.log("Preload found:", preloadPath);

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
    win.loadURL('http://localhost:5678');
  }
}

ipcMain.on('show-notification', (_, { title, body }) => {
  const notify = new Notification({
    title,
    body,
    icon: path.join(__dirname, 'public/icon.png'),
    silent: true, // kein Windows-Sound
  });
  notify.show();
});

ipcMain.handle("app:getVersion", () => {
  return app.getVersion();
});

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
  console.log(`[TempCleanup] Starting cleanup, ${tempFiles.length} files in temp folder.`);

  const remaining = [];

  for (const file of tempFiles) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`[TempCleanup] Deleted: ${file}`);
      }
    } catch (err) {
      console.warn(`[TempCleanup] Could not delete file: ${file} (${err.message})`);
      remaining.push(file);
    }
  }

  store.set("temp-dir-files", remaining);
  console.log(`[TempCleanup] Cleanup finished. Remaining: ${remaining.length}`);
}

function safeRegister(name, registerFn) {
  if (typeof registerFn !== "function") {
    console.warn(`[WARN] Handler "${name}" was not imported correctly.`);
    return;
  }
  try {
    registerFn();
    console.log(`[OK] Handler "${name}" loaded successfully.`);
  } catch (err) {
    console.error(`[ERROR] Failed to initialize "${name}":`, err.message);
  }
}

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle("get-file-size", (event, path) => {
  console.log("get-file-size called for:", path);
  try {
    const size = fs.statSync(path).size;
    console.log("Size (bytes):", size);
    return size;
  } catch (e) {
    console.error("Could not read file size:", path, e);
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

  safeRegister("Setup", registerSetupIPC);
  safeRegister("Theme", registerThemeIPC);
  safeRegister("App", registerAppIPC);
  safeRegister("Store", registerStoreIPC);
  safeRegister("ConvertMedia", registerConvertMediaIPC);
  safeRegister("ConvertImage", registerConvertImageIPC);
  safeRegister("ConvertArchive", registerConvertArchiveIPC);
  safeRegister("ConvertDocument", registerConvertDocumentIPC);
  safeRegister("LibreOffice", registerLibreOfficeIPC);
  safeRegister("Update", registerUpdateIPC);

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
