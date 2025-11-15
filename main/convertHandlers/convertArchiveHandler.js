import { app, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

export function get7ZipPath() {
  const platform = process.platform;
  let finalPath;

  if (!app.isPackaged) {
    // Development mode
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
    // Production mode
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
    throw new Error(`7-Zip not found!\nPath: ${finalPath}`);
  }

  console.log("7-Zip final path:", finalPath);
  return finalPath;
}

// Format mapping for 7-Zip arguments
const formatMap = {
  zip: "zip",
  "7z": "7z",
  tar: "tar",
  gz: "gzip",
  rar: "rar",
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

      // Always extract into the same directory
      console.log(`Extracting ${current} to ${outputDir}...`);
      await run7zip(sevenZipPath, ["x", current, `-o${outputDir}`, "-y"]);
      console.log("Extraction successful.");

      const innerFiles = fs
        .readdirSync(outputDir)
        .map((f) => path.join(outputDir, f))
        .filter((f) => f !== current); // avoid reprocessing the original file

      queue.push(...innerFiles);

      // Delete extracted archive if it’s not the root input
      if (current !== inputPath) fs.unlinkSync(current);
    }
  }

  const archiveExtensions = [
    "7z", "zip", "tar", "gz", "bz2", "xz", "wim", "cab", "arj", "chm", "cpio",
    "iso", "vhd", "vhdx", "swm", "z", "rar"
  ];

  function getCleanBaseName(filePath) {
    let name = path.basename(filePath);
    let ext = path.extname(name).slice(1).toLowerCase();

    // Loop: remove all known archive extensions from the end
    while (archiveExtensions.includes(ext)) {
      name = path.basename(name, path.extname(name));
      ext = path.extname(name).slice(1).toLowerCase();
    }

    return name;
  }

  ipcMain.handle("archive:convertFiles", async (event, files) => {
    try {
      if (!Array.isArray(files) || files.length === 0)
        return { success: false, files: [], message: "No files provided." };

      const setupData = store.get("setupData");
      if (!setupData?.folder)
        throw new Error("No output folder defined in setup.");

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

      const singleFileFormats = ["gz", "bz2", "xz"]; // these require .tar creation first

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputFile = file.path;
        const targetFormat = file.targetFormat?.toLowerCase() || "zip";
        const baseName = getCleanBaseName(inputFile);
        const tempDir = path.join(outputDir, `${baseName}_tmp`);
        fs.mkdirSync(tempDir, { recursive: true });

        // 🔹 Status: file processing
        event.sender.send("archive:status", { index: i, status: "processing" });

        try {
          console.log("Extracting input...");
          await extractRecursive(sevenZipPath, inputFile, tempDir);
          console.log("Recursive extraction completed.");

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

          // 🔹 Status: done
          event.sender.send("archive:status", { index: i, status: "done" });
        } catch (err) {
          console.error("Error during conversion:", err);
          results.push({ file: inputFile, message: `Error: ${err.message}`, success: false });
          event.sender.send("archive:status", { index: i, status: "error", message: err.message });
        } finally {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }

      return { success: true, files: results };
    } catch (err) {
      console.error("Error in archive handler:", err);
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
