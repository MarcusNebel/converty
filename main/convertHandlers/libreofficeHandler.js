import { ipcMain, app } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { spawn } from "child_process";

// Aktuelles Verzeichnis der Datei (anstatt __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------- 7-Zip Helper ---------------------
function get7ZipPath() {
  const platform = process.platform;
  let finalPath;

  if (!app.isPackaged) {
    finalPath = path.join(
      __dirname,
      "..",
      "..",
      "bin",
      platform,
      "7zip",
      platform === "win32" ? "x64" : "",
      platform === "win32" ? "7za.exe" : "7zz"
    );
  } else {
    finalPath = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "bin",
      platform,
      "7zip",
      platform === "win32" ? "x64" : "",
      platform === "win32" ? "7za.exe" : "7zz"
    );
  }

  if (!fs.existsSync(finalPath)) {
    throw new Error(`7-Zip not found! Path: ${finalPath}`);
  }

  return finalPath;
}

function run7zip(execPath, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(execPath, args, options);
    let stderr = "";
    proc.stderr.on("data", (data) => (stderr += data.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(stderr.trim() || `7-Zip Exit Code: ${code}`));
    });
  });
}

// --------------------- LibreOffice Paths ---------------------
const getLibreOfficePath = () => {
  let basePath;

  if (!app.isPackaged) {
    // Development
    basePath = path.join(__dirname, "..", "..", "libreoffice");
  } else {
    // Production: resources/app.asar.unpacked/libreoffice
    basePath = path.join(app.getPath("userData"), "libreoffice");
  }

  switch (process.platform) {
    case "win32":
      return path.join(basePath, "win32");
    case "darwin":
      return path.join(basePath, "darwin");
    default:
      return path.join(basePath, "linux");
  }
};

const getLibreOfficeZipPath = () => {
  if (!app.isPackaged) {
    // Development
    switch (process.platform) {
      case "win32":
        return path.join(__dirname, "..", "..", "bin", "win32", "LibreOffice.zip");
      case "darwin":
        return path.join(__dirname, "..", "..", "bin", "darwin", "LibreOffice.zip");
      default:
        return path.join(__dirname, "..", "..", "bin", "linuxLibreOffice.zip");
    }
  } else {
    // Production: resources/app.asar.unpacked/bin/...
    switch (process.platform) {
      case "win32":
        return path.join(process.resourcesPath, "app.asar.unpacked", "bin", "win32", "LibreOffice.zip");
      case "darwin":
        return path.join(process.resourcesPath, "app.asar.unpacked", "bin", "darwin", "LibreOffice.zip");
      default:
        return path.join(process.resourcesPath, "app.asar.unpacked", "bin", "linux", "LibreOffice.zip");
    }
  }
};

function registerLibreOfficeIPC() {
  // --------------------- IPC Handlers ---------------------
  ipcMain.handle("libreoffice:checkInstalled", async () => {
    return fs.existsSync(getLibreOfficePath());
  });

  ipcMain.handle("libreoffice:prepare", async () => {
    const loPath = getLibreOfficePath();
    const zipPath = getLibreOfficeZipPath();
    const sevenZip = get7ZipPath();

    if (fs.existsSync(loPath)) return true; // schon entpackt

    fs.mkdirSync(loPath, { recursive: true });

    try {
      await run7zip(sevenZip, ["x", zipPath, `-o${loPath}`, "-y"]);
      return true;
    } catch (err) {
      console.error("Error extracting LibreOffice:", err);
      throw err;
    }
  });
}

export { registerLibreOfficeIPC };