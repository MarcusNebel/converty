import { app, ipcMain, dialog } from "electron";
import Store from 'electron-store';
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { fileURLToPath } from "url";
import { spawn, exec, execSync, execFile } from "child_process";
import os from "os";
import https from "https";

let ffmpegPath = ffmpegInstaller.path;

if (app.isPackaged) {
  // Dynamischer Pfad nach OS
  if (process.platform === "win32") {
    ffmpegPath = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      "@ffmpeg-installer",
      "win32-x64",
      "ffmpeg.exe"
    );
  } else if (process.platform === "darwin") {
    ffmpegPath = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      "@ffmpeg-installer",
      "osx-x64",
      "ffmpeg"
    );
  } else if (process.platform === "linux") {
    ffmpegPath = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      "@ffmpeg-installer",
      "linux-x64",
      "ffmpeg"
    );
  }
}

ffmpeg.setFfmpegPath(ffmpegPath);
console.log("ffmpeg Path:", ffmpegPath);

// __filename & __dirname definieren
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("__dirname:", __dirname);

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

// --- Dynamische Pfad-Erkennung für 7-Zip ---
export function get7ZipPath() {
  const platform = process.platform;
  let finalPath;

  if (!app.isPackaged) {
    // Entwicklungsmodus
    finalPath = path.join(
      __dirname,
      "..",
      "bin",
      platform,
      "7zip",
      platform === "win32" ? "x64" : "",
      platform === "win32" ? "7za.exe" : "7zz"
    );
  } else {
    // Produktionsmodus
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
    throw new Error(
      `7-Zip nicht gefunden!\nPfad: ${finalPath}`
    );
  }

  console.log("🔍 7-Zip final path:", finalPath);
  return finalPath;
}

// Format Mapping für 7-Zip Argumente
const formatMap = {
  zip: "zip",
  "7z": "7z",
  tar: "tar",
  gz: "gzip",
  rar: "rar", // Nur entpacken möglich, 7-Zip free kann kein RAR erstellen
};

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

function getLibreOfficePath() {
  const platform = process.platform;

  if (platform === "win32") {
    // Standardpfad bei Windows
    const possiblePaths = [
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (platform === "darwin") {
    // macOS
    const macPath = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
    if (fs.existsSync(macPath)) return macPath;
  } else if (platform === "linux") {
    // Linux
    const linuxPaths = [
      "/usr/bin/libreoffice",
      "/usr/local/bin/libreoffice",
      "/snap/bin/libreoffice",
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  console.error("[DEBUG] LibreOffice konnte nicht gefunden werden!");
  return null;
}

export function registerSetupIPC() {
  ipcMain.handle('setup:isCompleted', () => store.get('setupCompleted', false));
  ipcMain.handle('setup:complete', () => store.set('setupCompleted', true));
  ipcMain.handle('setup:reset', () => store.delete('setupCompleted'));

  // Neues IPC für Setup-Daten
  ipcMain.handle('setup:saveData', (event, data) => {
    if (!data || typeof data !== 'object') return false;
    store.set('setupData', data);   // Daten speichern
    store.set('setupCompleted', true);
    return true;                    // zurück an Renderer
  });

  ipcMain.handle('setup:getData', () => {
    const data = store.get();
    return data ?? {}; // Falls noch nichts gespeichert ist, leeres Objekt
  });
}

export function registerThemeIPC() {
  // Theme lesen
  ipcMain.handle("theme:get", () => {
    return store.get("theme") || "system";
  });

  // Theme speichern
  ipcMain.handle("theme:set", (_, theme) => {
    store.set("theme", theme);
    return theme;
  });
}

export function registerAppIPC() {
  ipcMain.handle("app:getLocale", () => {
    try {
      // Liefert die Systemsprache des OS (z. B. "de" oder "en-US")
      const locale = app.getLocale();

      // Optional: auf vollständiges Locale normalisieren
      return locale || "en";
    } catch (err) {
      console.error("Fehler beim Auslesen der Systemsprache:", err);
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

export function registerConvertMediaIPC() {
  const formatMap = {
    // Audio
    mp3: { container: "mp3", audioCodec: "libmp3lame" },
    wav: { container: "wav", audioCodec: "pcm_s16le" },
    flac: { container: "flac", audioCodec: "flac" },
    aiff: { container: "aiff", audioCodec: "pcm_s16be" },
    alac: { container: "ipod", audioCodec: "alac" },
    aac: { container: "ipod", audioCodec: "aac" },
    opus: { container: "ogg", audioCodec: "libopus" },
    ogg: { container: "ogg", audioCodec: "libvorbis" },
    ac3: { container: "ac3", audioCodec: "ac3" },
    amr: {
      container: os.platform() === "win32" ? "wav" : "amr_nb",
      audioCodec: "pcm_s16le",
    },
    // Video
    mp4: { container: "mp4", videoCodec: "libx264", audioCodec: "aac" },
    webm: { container: "webm", videoCodec: "libvpx-vp9", audioCodec: "libopus" },
    avi: { container: "avi", videoCodec: "mpeg4", audioCodec: "libmp3lame" },
    mov: { container: "mov", videoCodec: "prores", audioCodec: "aac" },
    mkv: { container: "matroska", videoCodec: "libx264", audioCodec: "aac" },
    wmv: { container: "asf", videoCodec: "wmv2", audioCodec: "wmav2" },
    flv: { container: "flv", videoCodec: "flv", audioCodec: "aac" },
  };

  ipcMain.handle("media:convertFiles", async (event, files) => {
    try {
      const setupData = store.get("setupData");
      if (!setupData?.folder) throw new Error("Output-Ordner ist nicht gesetzt!");

      const outputDir = path.join(setupData.folder, "media");
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const results = [];

      // Jede Datei einzeln konvertieren + Status senden
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        const file = fileObj.path;
        const targetFormat = fileObj.targetFormat || "mp4";
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        const destPath = path.join(outputDir, `${baseName}.${targetFormat}`);

        const format = formatMap[targetFormat];
        if (!format) throw new Error(`Format ${targetFormat} wird nicht unterstützt`);

        // 🔹 Status: Datei wird verarbeitet
        event.sender.send("media:status", { index: i, status: "processing" });

        await new Promise((resolve, reject) => {
          const cmd = ffmpeg(file).toFormat(format.container);

          if (format.audioCodec) cmd.audioCodec(format.audioCodec);
          if (format.videoCodec) cmd.videoCodec(format.videoCodec);

          cmd
            .on("end", () => {
              // 🔹 Status: Fertig
              event.sender.send("media:status", { index: i, status: "done" });
              resolve(null);
            })
            .on("error", (err) => {
              // 🔹 Status: Fehler (optional)
              event.sender.send("media:status", { index: i, status: "error", message: err.message });
              reject(err);
            })
            .save(destPath);
        });

        results.push(destPath);
      }

      return { success: true, files: results, message: "Konvertierung abgeschlossen" };
    } catch (err) {
      console.error("Fehler im Media-Handler:", err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle("media:selectFiles", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Media", extensions: Object.keys(formatMap) }],
    });
    return canceled ? [] : filePaths;
  });
}

export function registerConvertImageIPC() {
  ipcMain.handle("image:convertFiles", async (event, files) => {
    try {
      if (!Array.isArray(files) || !files.length)
        return { success: false, message: "Keine Dateien übergeben" };

      const sharp = (await import("sharp")).default;
      const setupData = store.get("setupData");
      if (!setupData?.folder) throw new Error("Output-Ordner ist nicht gesetzt!");

      const outputDir = path.join(setupData.folder, "images");
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const formatMap = {
        jpeg: (img) => img.jpeg(),
        jpg: (img) => img.jpeg(),
        png: (img) => img.png(),
        webp: (img) => img.webp(),
        bmp: (img) => img.png(),    // Sharp kann kein BMP schreiben
        tiff: (img) => img.tiff(),
        heif: (img) => img.jpeg(),  // HEIF → JPEG
        heic: (img) => img.jpeg(),  // HEIC → JPEG
        avif: (img) => img.avif(),
        gif: (img) => img.gif(),
      };

      const results = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const targetFormat = f.targetFormat?.toLowerCase() || "png";
        const converter = formatMap[targetFormat];
        if (!converter) throw new Error(`Format ${targetFormat} wird nicht unterstützt`);

        // 🔹 Status: Datei wird verarbeitet
        event.sender.send("image:status", { index: i, status: "processing" });

        try {
          let ext = targetFormat.toLowerCase();
          if (ext === "jpeg") ext = "jpeg";

          const dest = path.join(
            outputDir,
            `${path.basename(f.path, path.extname(f.path))}.${ext}`
          );

          await converter(sharp(f.path)).toFile(dest);
          results.push(dest);

          // 🔹 Status: Fertig
          event.sender.send("image:status", { index: i, status: "done" });
        } catch (err) {
          console.error(`Fehler beim Konvertieren von ${f.path}:`, err);
          event.sender.send("image:status", {
            index: i,
            status: "error",
            message: err.message,
          });
        }
      }

      return { success: true, files: results, message: "Konvertierung abgeschlossen" };
    } catch (err) {
      console.error("Fehler im Image-Handler:", err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle("image:selectFiles", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Bilder",
          extensions: ["svg", "png", "jpg", "jpeg", "webp", "bmp", "tiff", "gif", "avif", "heic", "heif"],
        },
      ],
    });
    return canceled ? [] : filePaths;
  });
}

export function registerConvertArchiveIPC() {
  const supportedArchiveFormats = {
    "7z": "-t7z",
    "zip": "-tzip",
    "tar": "-ttar",
    "gz": "-tgzip",
    "bz2": "-tbzip2",
    "xz": "-txz",
    "rar": "-trar",
  };

  async function extractRecursive(sevenZipPath, inputPath, outputDir) {
    const queue = [inputPath];

    while (queue.length) {
      const current = queue.shift();
      const ext = path.extname(current).slice(1).toLowerCase();

      if (!supportedArchiveFormats[ext]) continue;

      // Entpacke immer in den selben Ordner
      console.log(`Entpacke ${current} nach ${outputDir}...`);
      await run7zip(sevenZipPath, ["x", current, `-o${outputDir}`, "-y"]);
      console.log("Entpacken erfolgreich.");

      const innerFiles = fs.readdirSync(outputDir)
        .map(f => path.join(outputDir, f))
        .filter(f => f !== current); // vermeide die Originaldatei

      queue.push(...innerFiles);

      // lösche die Originaldatei, wenn es nicht der Startinput ist
      if (current !== inputPath) fs.unlinkSync(current);
    }
  }

  const archiveExtensions = ["7z","zip","tar","gz","bz2","xz","wim","cab","arj","chm","cpio","iso","vhd","vhdx","swm","z","rar"];

  function getCleanBaseName(filePath) {
    let name = path.basename(filePath);
    let ext = path.extname(name).slice(1).toLowerCase();

    // Schleife: entferne alle bekannten Archiv-Extensions vom Ende
    while (archiveExtensions.includes(ext)) {
      name = path.basename(name, path.extname(name));
      ext = path.extname(name).slice(1).toLowerCase();
    }

    return name;
  }

  ipcMain.handle("archive:convertFiles", async (event, files) => {
    try {
      if (!Array.isArray(files) || files.length === 0)
        return { success: false, files: [], message: "Keine Dateien übergeben." };

      const setupData = store.get("setupData");
      if (!setupData?.folder)
        throw new Error("Kein Ausgabeordner im Setup festgelegt.");

      const outputDir = path.join(setupData.folder, "archives");
      fs.mkdirSync(outputDir, { recursive: true });

      const sevenZipPath = get7ZipPath();
      console.log("7-Zip Path:", sevenZipPath);

      const results = [];

      const creatableFormats = {
        "7z": "-t7z",
        "zip": "-tzip",
        "tar": "-ttar",
        "gz": "-tgzip",
        "bz2": "-tbzip2",
        "xz": "-txz",
      };

      const singleFileFormats = ["gz", "bz2", "xz"]; // zuerst .tar erstellen

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputFile = file.path;
        const targetFormat = file.targetFormat?.toLowerCase() || "zip";
        const baseName = getCleanBaseName(inputFile);
        const tempDir = path.join(outputDir, `${baseName}_tmp`);
        fs.mkdirSync(tempDir, { recursive: true });

        // 🔹 Status: Datei wird verarbeitet
        event.sender.send("archive:status", { index: i, status: "processing" });

        try {
          console.log("Entpacke Input...");
          await extractRecursive(sevenZipPath, inputFile, tempDir);
          console.log("Rekursives Entpacken abgeschlossen.");

          let outputFile = path.join(outputDir, `${baseName}.${targetFormat}`);

          if (singleFileFormats.includes(targetFormat)) {
            const tarFile = path.join(tempDir, `${baseName}.tar`);
            await run7zip(sevenZipPath, ["a", "-ttar", tarFile, "*"], { cwd: tempDir });
            outputFile = path.join(outputDir, `${baseName}.tar.${targetFormat}`);
            await run7zip(sevenZipPath, ["a", creatableFormats[targetFormat], outputFile, tarFile]);
          } else {
            await run7zip(sevenZipPath, ["a", creatableFormats[targetFormat], outputFile, "*"], { cwd: tempDir });
          }

          results.push(outputFile);

          // 🔹 Status: Fertig
          event.sender.send("archive:status", { index: i, status: "done" });
        } catch (err) {
          console.error("Fehler während der Konvertierung:", err);
          results.push({ file: inputFile, message: `Fehler: ${err.message}`, success: false });
          event.sender.send("archive:status", { index: i, status: "error", message: err.message });
        } finally {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }

      return { success: true, files: results };
    } catch (err) {
      console.error("Fehler im Archive-Handler:", err);
      return { success: false, files: [], message: err.message };
    }
  });

  ipcMain.handle("archive:selectFiles", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Archive",
          extensions: Object.keys(supportedArchiveFormats),
        },
      ],
    });
    return canceled ? [] : filePaths;
  });
}

export function registerConvertDocumentIPC() {
  const supportedInputFormats = ["doc", "docx", "odt", "xls", "xlsx", "ppt", "pptx"];

  // Mapping von Input → erlaubte Output-Formate
  const allowedOutputMap = {
    doc: ["pdf", "odt", "rtf", "txt", "html"],
    docx: ["pdf", "odt", "rtf", "txt", "html"],
    odt: ["pdf", "docx", "rtf", "txt", "html"],
    xls: ["pdf", "xlsx", "csv"],
    xlsx: ["pdf", "xlsx", "csv"],
    ppt: ["pdf"],
    pptx: ["pdf"]
  };

  ipcMain.handle("document:getAllowedOutputs", async (_, inputExt) => {
    const ext = inputExt.toLowerCase();
    return allowedOutputMap[ext] || [];
  });

  ipcMain.handle("document:convertFiles", async (event, files) => {
    console.log("[DEBUG][Documents] Starte Dokumenten-Konvertierung...");

    try {
      if (!Array.isArray(files) || files.length === 0) {
        return { success: false, message: "Keine Dateien übergeben." };
      }

      const setupData = store.get("setupData");
      const outputDir = path.join(setupData.folder, "documents");
      fs.mkdirSync(outputDir, { recursive: true });

      const librePath = await getLibreOfficePath();
      if (!librePath) throw new Error("LibreOffice wurde nicht gefunden.");

      const results = [];
      let hasError = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputFile = file.path;
        const ext = path.extname(inputFile).slice(1).toLowerCase();
        const targetFormat = file.targetFormat?.toLowerCase() || "pdf";

        // 🔹 Status: Datei wird verarbeitet
        event.sender.send("document:status", { index: i, status: "processing" });

        try {
          if (!supportedInputFormats.includes(ext)) {
            throw new Error(`Input-Format ${ext} nicht unterstützt.`);
          }

          const allowedOutputs = allowedOutputMap[ext];
          if (!allowedOutputs.includes(targetFormat)) {
            throw new Error(`Ziel-Format ${targetFormat} für ${ext} nicht erlaubt.`);
          }

          await new Promise((resolve, reject) => {
            const args = ["--headless", "--convert-to", targetFormat, "--outdir", outputDir, inputFile];
            execFile(librePath, args, (error) => {
              if (error) reject(error);
              else resolve(null);
            });
          });

          const baseName = path.basename(inputFile, path.extname(inputFile));
          results.push(path.join(outputDir, `${baseName}.${targetFormat}`));

          // 🔹 Status: Fertig
          event.sender.send("document:status", { index: i, status: "done" });
        } catch (err) {
          console.error(`[ERROR][Documents] Datei konnte nicht konvertiert werden: ${inputFile}`, err);
          results.push({ file: inputFile, success: false, message: err.message });
          hasError = true;

          // 🔹 Status: Fehler
          event.sender.send("document:status", { index: i, status: "error", message: err.message });
        }
      }

      return {
        success: !hasError,
        files: results,
        message: hasError ? "Mindestens eine Datei konnte nicht konvertiert werden." : undefined
      };
    } catch (err) {
      return { success: false, files: [], message: err.message };
    }
  });

  ipcMain.handle("document:selectFiles", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Documents", extensions: supportedInputFormats }],
    });
    return canceled ? [] : filePaths;
  });
}

export function registerLibreOfficeIPC() {
  const DOWNLOAD_URLS = {
    win32: "https://mirror.netcologne.de/tdf/libreoffice/stable/25.8.2/win/x86_64/LibreOffice_25.8.2_Win_x86-64.msi",
    darwin: "https://ftp.halifax.rwth-aachen.de/tdf/libreoffice/stable/25.8.2/mac/x86_64/LibreOffice_25.8.2_MacOS_x86-64.dmg",
    linux: "https://tdf.bio.lmu.de/libreoffice/stable/25.8.2/deb/x86_64/LibreOffice_25.8.2_Linux_x86-64_deb.tar.gz",
  };

  function isLibreOfficeInstalledWin() {
    try {
      console.log("[DEBUG] Prüfe LibreOffice auf Windows...");
      const result = execSync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "LibreOffice"'
      ).toString();
      const installed = result.includes("LibreOffice");
      console.log("[DEBUG] Ergebnis:", installed);
      return installed;
    } catch (err) {
      console.error("[DEBUG] Fehler bei Windows-Check:", err);
      return false;
    }
  }

  function isLibreOfficeInstalledMac() {
    try {
      console.log("[DEBUG] Prüfe LibreOffice auf macOS...");
      execSync("which soffice");
      console.log("[DEBUG] LibreOffice gefunden!");
      return true;
    } catch (err) {
      console.log("[DEBUG] LibreOffice nicht gefunden:", err.message);
      return false;
    }
  }

  function isLibreOfficeInstalledLinux() {
    try {
      console.log("[DEBUG] Prüfe LibreOffice auf Linux...");
      execSync("which soffice");
      console.log("[DEBUG] LibreOffice gefunden!");
      return true;
    } catch (err) {
      console.log("[DEBUG] LibreOffice nicht gefunden:", err.message);
      return false;
    }
  }

  function isLibreOfficeInstalled() {
    const platform = process.platform;
    console.log("[DEBUG] Aktuelles OS:", platform);
    if (platform === "win32") return isLibreOfficeInstalledWin();
    if (platform === "darwin") return isLibreOfficeInstalledMac();
    if (platform === "linux") return isLibreOfficeInstalledLinux();
    return false;
  }

  ipcMain.handle("libreoffice:checkInstalled", async () => {
    const installed = isLibreOfficeInstalled();
    console.log("[DEBUG] checkInstalled zurück:", installed);
    return installed;
  });

  ipcMain.handle("libreoffice:downloadAndInstall", async () => {
    const platform = process.platform;
    const url = DOWNLOAD_URLS[platform] || DOWNLOAD_URLS.linux;
    const tmpPath = path.join(os.tmpdir(), path.basename(url));

    console.log("[DEBUG] Lade LibreOffice herunter von:", url);
    console.log("[DEBUG] Temporärer Pfad:", tmpPath);

    try {
      // Download
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tmpPath);
        https.get(url, (response) => {
          console.log("[DEBUG] Download gestartet...");
          response.pipe(file);
          file.on("finish", () => {
            console.log("[DEBUG] Download abgeschlossen!");
            file.close(resolve);
          });
        }).on("error", (err) => {
          console.error("[DEBUG] Downloadfehler:", err);
          reject(err);
        });
      });

      console.log("[DEBUG] Installation starten...");

      // Funktion zum Löschen der temporären Datei mit Retry
      const deleteTempFile = () => {
        try {
          fs.unlinkSync(tmpPath);
          console.log("[DEBUG] Temporäre Datei gelöscht:", tmpPath);
        } catch (err) {
          if (err.code === "EBUSY") {
            console.log("[DEBUG] Datei noch in Benutzung, retry in 2 Sekunden...");
            setTimeout(deleteTempFile, 2000);
          } else {
            console.warn("[DEBUG] Datei konnte nicht gelöscht werden:", err);
          }
        }
      };

      // Installationsbefehl pro Plattform
      let installCmd;
      if (platform === "win32") {
        installCmd = `powershell -Command "Start-Process msiexec -ArgumentList '/i \\"${tmpPath}\\" /quiet' -Wait -Verb RunAs"`;
      } else if (platform === "darwin") {
        installCmd = `hdiutil attach "${tmpPath}"`;
      } else if (platform === "linux") {
        installCmd = `tar -xzf "${tmpPath}" -C /tmp && sudo dpkg -i /tmp/LibreOffice*/DEBS/*.deb`;
      }

      // Installer ausführen und auf Abschluss warten
      const installer = exec(installCmd, (err, stdout, stderr) => {
        if (err) console.error(`[DEBUG] Installationsfehler ${platform}:`, err);
        else console.log(`[DEBUG] Installation abgeschlossen (${platform})`, stdout, stderr);

        // Temporäre Datei löschen
        deleteTempFile();
      });
    } catch (err) {
      console.error("[DEBUG] downloadAndInstall Fehler:", err);
      throw err;
    }
  });
}
