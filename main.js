import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { platform } from "os";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const preloadPath = app.isPackaged
  ? path.join(process.resourcesPath, "app.asar.unpacked", "preload.js")
  : path.join(__dirname, "preload.js");

if (!fs.existsSync(preloadPath))
  console.error("❌ Preload nicht gefunden:", preloadPath);
else console.log("✅ Preload gefunden:", preloadPath);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  } else {
    win.loadURL("http://localhost:5173");
  }
}

// 🔍 ImageMagick CLI prüfen
function getMagickPath() {
  const base = app.isPackaged
    ? path.join(process.resourcesPath, "bin")
    : path.join(__dirname, "bin");

  if (platform() === "win32")
    return path.join(base, "windows", "magick", "magick.exe");
  if (platform() === "darwin")
    return path.join(base, "macos", "magick");
  return path.join(base, "linux", "magick.AppImage");
}

ipcMain.handle("magick-check", async () => {
  const magickPath = getMagickPath();
  console.log("🔍 Prüfe ImageMagick:", magickPath);

  return new Promise((resolve, reject) => {
    execFile(magickPath, ["-version"], (err, stdout, stderr) => {
      if (err) reject(stderr || err.message);
      else resolve(stdout);
    });
  });
});

// 🔍 FFmpeg prüfen (per require)
ipcMain.handle("ffmpeg-check", async () => {
  try {
    const ffmpeg = require("@ffmpeg-installer/ffmpeg");
    return `FFmpeg geladen ✅\nPfad: ${ffmpeg.path}`;
  } catch (err) {
    console.error("❌ FFmpeg konnte nicht geladen werden:", err);
    throw new Error("FFmpeg konnte nicht geladen werden.");
  }
});

// 🔍 Adm-Zip prüfen (per require)
ipcMain.handle("admzip-check", async () => {
  try {
    require("adm-zip");
    return "Adm-Zip erfolgreich geladen ✅";
  } catch (err) {
    console.error("❌ Adm-Zip konnte nicht geladen werden:", err);
    throw new Error("Adm-Zip konnte nicht geladen werden.");
  }
});

app.whenReady().then(createWindow);
