import { ipcMain, dialog, app } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { execFile } from "child_process";
import store from "../electronStore.js";

// Aktuelles Verzeichnis der Datei (anstatt __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------
// GET INTERNAL LIBREOFFICE PATH
// ---------------------------
function getInternalLibreOfficeBinary() {
  let basePath;

  if (!app.isPackaged) {
    // Development
    basePath = path.join(__dirname, "..", "..", "libreoffice");
  } else {
    // Production → resources/app.asar.unpacked/libreoffice
    basePath = path.join(
      app.getPath("userData"),
      "libreoffice"
    );
  }

  switch (process.platform) {
    case "win32":
      return path.join(basePath, "win32", "LibreOfficePortable", "App", "libreoffice", "program", "soffice.exe");

    case "darwin":
      return path.join(basePath, "darwin", "LibreOffice", "LibreOffice.app", "Contents", "MacOS", "soffice");

    default:
      return path.join(basePath, "linux", "LibreOffice", "LibreOfficePortable.AppImage");
  }
}

// ---------------------------
// IPC: DOCUMENT CONVERSION
// ---------------------------
export function registerConvertDocumentIPC() {
  const supportedInputFormats = ["doc", "docx", "odt", "xls", "xlsx", "ppt", "pptx"];

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
    return allowedOutputMap[inputExt.toLowerCase()] || [];
  });

  ipcMain.handle("document:convertFiles", async (event, files) => {
    try {
      if (!Array.isArray(files) || files.length === 0) {
        return { success: false, message: "No files provided." };
      }

      const setupData = store.get("setupData");
      const outputDir = path.join(setupData.folder, "documents");
      fs.mkdirSync(outputDir, { recursive: true });

      const librePath = getInternalLibreOfficeBinary();

      if (!fs.existsSync(librePath)) {
        throw new Error("Internal LibreOffice installation not found.");
      }

      const results = [];
      let hasError = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputFile = file.path;
        const ext = path.extname(inputFile).slice(1).toLowerCase();
        const targetFormat = file.targetFormat?.toLowerCase() || "pdf";

        event.sender.send("document:status", { index: i, status: "processing" });

        try {
          if (!supportedInputFormats.includes(ext)) {
            throw new Error(`Input format ${ext} is not supported.`);
          }

          const allowedOutputs = allowedOutputMap[ext];
          if (!allowedOutputs.includes(targetFormat)) {
            throw new Error(`Target format ${targetFormat} is not allowed for ${ext}.`);
          }

          await new Promise((resolve, reject) => {
            const args = [
              "--headless",
              "--convert-to",
              targetFormat,
              "--outdir",
              outputDir,
              inputFile
            ];

            execFile(librePath, args, (error) => {
              if (error) reject(error);
              else resolve(null);
            });
          });

          const baseName = path.basename(inputFile, path.extname(inputFile));
          results.push(path.join(outputDir, `${baseName}.${targetFormat}`));
          event.sender.send("document:status", { index: i, status: "done" });

        } catch (err) {
          results.push({ file: inputFile, success: false, message: err.message });
          hasError = true;
          event.sender.send("document:status", { index: i, status: "error", message: err.message });
        }
      }

      return {
        success: !hasError,
        files: results,
        message: hasError ? "At least one file could not be converted." : undefined
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
