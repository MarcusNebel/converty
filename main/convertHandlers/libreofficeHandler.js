import { ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { exec, execSync } from "child_process";
import os from "os";
import https from "https";

export function registerLibreOfficeIPC() {
  const DOWNLOAD_URLS = {
    win32: "https://mirror.netcologne.de/tdf/libreoffice/stable/25.8.2/win/x86_64/LibreOffice_25.8.2_Win_x86-64.msi",
    darwin: "https://ftp.halifax.rwth-aachen.de/tdf/libreoffice/stable/25.8.2/mac/x86_64/LibreOffice_25.8.2_MacOS_x86-64.dmg",
    linux: "https://tdf.bio.lmu.de/libreoffice/stable/25.8.2/deb/x86_64/LibreOffice_25.8.2_Linux_x86-64_deb.tar.gz",
  };

  function isLibreOfficeInstalledWin() {
    try {
      console.log("[DEBUG] Checking LibreOffice on Windows...");
      const result = execSync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "LibreOffice"'
      ).toString();
      const installed = result.includes("LibreOffice");
      console.log("[DEBUG] Result:", installed);
      return installed;
    } catch (err) {
      console.error("[DEBUG] Error while checking on Windows:", err);
      return false;
    }
  }

  function isLibreOfficeInstalledMac() {
    try {
      console.log("[DEBUG] Checking LibreOffice on macOS...");
      execSync("which soffice");
      console.log("[DEBUG] LibreOffice found!");
      return true;
    } catch (err) {
      console.log("[DEBUG] LibreOffice not found:", err.message);
      return false;
    }
  }

  function isLibreOfficeInstalledLinux() {
    try {
      console.log("[DEBUG] Checking LibreOffice on Linux...");
      execSync("which soffice");
      console.log("[DEBUG] LibreOffice found!");
      return true;
    } catch (err) {
      console.log("[DEBUG] LibreOffice not found:", err.message);
      return false;
    }
  }

  function isLibreOfficeInstalled() {
    const platform = process.platform;
    console.log("[DEBUG] Current OS:", platform);
    if (platform === "win32") return isLibreOfficeInstalledWin();
    if (platform === "darwin") return isLibreOfficeInstalledMac();
    if (platform === "linux") return isLibreOfficeInstalledLinux();
    return false;
  }

  ipcMain.handle("libreoffice:checkInstalled", async () => {
    const installed = isLibreOfficeInstalled();
    console.log("[DEBUG] checkInstalled returned:", installed);
    return installed;
  });

  ipcMain.handle("libreoffice:downloadAndInstall", async () => {
    const platform = process.platform;
    const url = DOWNLOAD_URLS[platform] || DOWNLOAD_URLS.linux;
    const tmpPath = path.join(os.tmpdir(), path.basename(url));

    console.log("[DEBUG] Downloading LibreOffice from:", url);
    console.log("[DEBUG] Temporary path:", tmpPath);

    try {
      // Download
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tmpPath);
        https.get(url, (response) => {
          console.log("[DEBUG] Download started...");
          response.pipe(file);
          file.on("finish", () => {
            console.log("[DEBUG] Download completed!");
            file.close(resolve);
          });
        }).on("error", (err) => {
          console.error("[DEBUG] Download error:", err);
          reject(err);
        });
      });

      console.log("[DEBUG] Starting installation...");

      // Function to delete temporary file with retry
      const deleteTempFile = () => {
        try {
          fs.unlinkSync(tmpPath);
          console.log("[DEBUG] Temporary file deleted:", tmpPath);
        } catch (err) {
          if (err.code === "EBUSY") {
            console.log("[DEBUG] File still in use, retrying in 2 seconds...");
            setTimeout(deleteTempFile, 2000);
          } else {
            console.warn("[DEBUG] Could not delete temp file:", err);
          }
        }
      };

      // Installation command per platform
      let installCmd;
      if (platform === "win32") {
        installCmd = `powershell -Command "Start-Process msiexec -ArgumentList '/i \\"${tmpPath}\\" /quiet' -Wait -Verb RunAs"`;
      } else if (platform === "darwin") {
        installCmd = `hdiutil attach "${tmpPath}"`;
      } else if (platform === "linux") {
        installCmd = `tar -xzf "${tmpPath}" -C /tmp && sudo dpkg -i /tmp/LibreOffice*/DEBS/*.deb`;
      }

      // Execute installer and wait for completion
      const installer = exec(installCmd, (err, stdout, stderr) => {
        if (err) console.error(`[DEBUG] Installation error (${platform}):`, err);
        else console.log(`[DEBUG] Installation finished (${platform})`, stdout, stderr);

        // Delete temp file
        deleteTempFile();
      });
    } catch (err) {
      console.error("[DEBUG] downloadAndInstall error:", err);
      throw err;
    }
  });
}
