import { ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import Store from "electron-store"

const store = new Store();

export function registerConvertImageIPC() {
  ipcMain.handle("image:convertFiles", async (event, files) => {
    try {
      if (!Array.isArray(files) || !files.length)
        return { success: false, message: "No files provided" };

      const sharp = (await import("sharp")).default;
      const setupData = store.get("setupData");
      if (!setupData?.folder) throw new Error("Output folder is not set");

      const outputDir = path.join(setupData.folder, "images");
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const formatMap = {
        jpeg: (img) => img.jpeg(),
        jpg: (img) => img.jpeg(),
        png: (img) => img.png(),
        webp: (img) => img.webp(),
        bmp: (img) => img.png(),
        tiff: (img) => img.tiff(),
        heif: (img) => img.jpeg(),
        heic: (img) => img.jpeg(),
        avif: (img) => img.avif(),
        gif: (img) => img.gif(),
      };

      const results = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const targetFormat = f.targetFormat?.toLowerCase() || "png";
        const converter = formatMap[targetFormat];
        if (!converter) throw new Error(`Format ${targetFormat} is not supported`);

        // 🔹 Status: file is being processed
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

          // 🔹 Status: done
          event.sender.send("image:status", { index: i, status: "done" });
        } catch (err) {
          console.error(`Error converting ${f.path}:`, err);
          event.sender.send("image:status", {
            index: i,
            status: "error",
            message: err.message,
          });
        }
      }

      return { success: true, files: results, message: "Conversion completed" };
    } catch (err) {
      console.error("Error in image handler:", err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle("image:selectFiles", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Images",
          extensions: ["svg", "png", "jpg", "jpeg", "webp", "bmp", "tiff", "gif", "avif", "heic", "heif"],
        },
      ],
    });
    return canceled ? [] : filePaths;
  });
}
