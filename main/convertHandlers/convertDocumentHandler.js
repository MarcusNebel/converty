import { ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import store from "../electronStore.js"

function getLibreOfficePath() {
  const platform = process.platform;

  if (platform === "win32") {
    // Default Windows paths
    const possiblePaths = [
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (platform === "darwin") {
    // macOS path
    const macPath = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
    if (fs.existsSync(macPath)) return macPath;
  } else if (platform === "linux") {
    // Common Linux paths
    const linuxPaths = [
      "/usr/bin/libreoffice",
      "/usr/local/bin/libreoffice",
      "/snap/bin/libreoffice",
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  console.error("[DEBUG] LibreOffice could not be found!");
  return null;
}

export function registerConvertDocumentIPC() {
  const supportedInputFormats = ["doc", "docx", "odt", "xls", "xlsx", "ppt", "pptx"];

  // Mapping of input → allowed output formats
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
    console.log("[DEBUG][Documents] Starting document conversion...");

    try {
      if (!Array.isArray(files) || files.length === 0) {
        return { success: false, message: "No files provided." };
      }

      const setupData = store.get("setupData");
      const outputDir = path.join(setupData.folder, "documents");
      fs.mkdirSync(outputDir, { recursive: true });

      const librePath = await getLibreOfficePath();
      if (!librePath) throw new Error("LibreOffice not found.");

      const results = [];
      let hasError = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputFile = file.path;
        const ext = path.extname(inputFile).slice(1).toLowerCase();
        const targetFormat = file.targetFormat?.toLowerCase() || "pdf";

        // 🔹 Status: file is being processed
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
            const args = ["--headless", "--convert-to", targetFormat, "--outdir", outputDir, inputFile];
            execFile(librePath, args, (error) => {
              if (error) reject(error);
              else resolve(null);
            });
          });

          const baseName = path.basename(inputFile, path.extname(inputFile));
          results.push(path.join(outputDir, `${baseName}.${targetFormat}`));

          // 🔹 Status: done
          event.sender.send("document:status", { index: i, status: "done" });
        } catch (err) {
          console.error(`[ERROR][Documents] File could not be converted: ${inputFile}`, err);
          results.push({ file: inputFile, success: false, message: err.message });
          hasError = true;

          // 🔹 Status: error
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
