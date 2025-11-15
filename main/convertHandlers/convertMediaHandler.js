import { app, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { fileURLToPath } from "url";
import os from "os";
import Store from "electron-store";

const store = new Store();

let ffmpegPath = ffmpegInstaller.path;

if (app.isPackaged) {
  // Dynamic path depending on OS
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
console.log("FFmpeg path:", ffmpegPath);

// Define __filename & __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("__dirname:", __dirname);

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
    mpg: { container: "mpeg", videoCodec: "mpeg2video", audioCodec: "mp2" },
    ts: { container: "mpegts", videoCodec: "libx264", audioCodec: "aac" },
    gif: { container: "gif", videoCodec: "gif", audioCodec: "" }, // No audio
    hevc_mp4: { container: "mp4", videoCodec: "libx265", audioCodec: "aac" }
  };

  ipcMain.handle("media:convertFiles", async (event, files) => {
    try {
      const setupData = store.get("setupData");
      if (!setupData?.folder) throw new Error("Output folder is not set");

      const outputDir = path.join(setupData.folder, "media");
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const results = [];

      // Process each file and send status updates
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        const file = fileObj.path;
        const targetFormat = fileObj.targetFormat || "mp4";
        const ext = path.extname(file).toLowerCase();
        const baseName = path.basename(file, ext);
        const destPath = path.join(outputDir, `${baseName}.${targetFormat}`);

        const format = formatMap[targetFormat];
        if (!format) throw new Error(`Format ${targetFormat} is not supported`);

        // 🔹 Status: file is being processed
        event.sender.send("media:status", { index: i, status: "processing" });

        await new Promise((resolve, reject) => {
          const cmd = ffmpeg(file).toFormat(format.container);

          if (format.audioCodec) cmd.audioCodec(format.audioCodec);
          if (format.videoCodec) cmd.videoCodec(format.videoCodec);

          cmd
            .on("end", () => {
              // 🔹 Status: done
              event.sender.send("media:status", { index: i, status: "done" });
              resolve(null);
            })
            .on("error", (err) => {
              // 🔹 Status: error (optional)
              event.sender.send("media:status", { index: i, status: "error", message: err.message });
              reject(err);
            })
            .save(destPath);
        });

        results.push(destPath);
      }

      return { success: true, files: results, message: "Conversion completed" };
    } catch (err) {
      console.error("Error in media handler:", err);
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
