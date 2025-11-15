import { ipcMain, app, shell } from "electron";
import { spawn } from "child_process";
import axios from "axios";
import semver from "semver";
import fs from "fs";
import path from "path";
import os from "os";
import Store from "electron-store";

const store = new Store();

const REPO_OWNER = "MarcusNebel";
const REPO_NAME = "converty";
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

function getLocalVersion() {
  try {
    const pkgPath = path.join(app.getAppPath(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return pkg.version;
  } catch (err) {
    console.error("Error reading local version:", err);
    return "0.0.0";
  }
}

function isNewerVersion(remote, local) {
  try {
    return semver.gt(remote, local);
  } catch {
    return false;
  }
}

// Determines platform-specific asset
function getPlatformAsset(assets) {
  const platform = os.platform();
  let asset = null;

  if (platform === "win32") {
    asset = assets.find(a => a.name.endsWith(".exe"));
  } else if (platform === "darwin") {
    asset = assets.find(a => a.name.endsWith(".dmg") || a.name.endsWith(".pkg") || a.name.endsWith(".zip"));
  } else if (platform === "linux") {
    asset = assets.find(a => a.name.endsWith(".AppImage") || a.name.endsWith(".deb") || a.name.endsWith(".rpm"));
  }

  return asset ? asset.browser_download_url : null;
}

const deleteSetupFile = async (filePath) => {
  let retries = 10;
  while (retries > 0) {
    try {
      fs.unlinkSync(filePath);
      console.log("Setup file deleted.");
      return;
    } catch (err) {
      if (err.code === "EBUSY" || err.code === "EPERM") {
        // File still in use, wait 500ms
        await new Promise(res => setTimeout(res, 500));
        retries--;
      } else {
        console.error("Error deleting setup file:", err);
        return;
      }
    }
  }
  console.warn("Setup file could not be deleted after multiple attempts:", filePath);
};

export function registerUpdateIPC() {
  ipcMain.handle("update:check", async () => {
    const localVersion = getLocalVersion();

    try {
      const { data } = await axios.get(GITHUB_API_URL, { headers: { "User-Agent": "Converty-Updater" } });

      const remoteVersion = data.tag_name?.replace(/^v/, "") || "0.0.0";
      const notes = data.body || "No release notes available.";
      const downloadUrl = getPlatformAsset(data.assets || []);

      const updateAvailable = isNewerVersion(remoteVersion, localVersion);

      return {
        updateAvailable,
        localVersion,
        remoteVersion,
        notes,
        downloadUrl,
        title: data.name || "New Release",
      };
    } catch (err) {
      console.error("Update check failed:", err.message);
      return {
        updateAvailable: false,
        error: "Failed to fetch update information.",
      };
    }
  });

  ipcMain.handle("update:download", async (event, url) => {
    if (!url) return { success: false, error: "No download URL provided." };

    try {
      const tempDir = os.tmpdir();
      const fileName = path.basename(url);
      const filePath = path.join(tempDir, fileName);

      // Add setup file to temp file array
      const tempFiles = store.get("temp-dir-files", []);
      tempFiles.push(filePath);
      store.set("temp-dir-files", tempFiles);

      const response = await axios.get(url, { responseType: "stream" });
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;

      const writer = fs.createWriteStream(filePath);
      response.data.on('data', (chunk) => {
        downloaded += chunk.length;
        event.sender.send("update:download-progress", { downloaded, total: totalSize });
      });
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      event.sender.send("update:status", "Opening update…");

      // Launch installer **do not await**
      shell.openPath(filePath);
      app.quit();

      return { success: true };
    } catch (err) {
      console.error("Error downloading/opening update:", err);
      return { success: false, error: err.message };
    }
  });
}
