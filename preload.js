const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  magickCheck: () => ipcRenderer.invoke("magick-check"),
  ffmpegCheck: () => ipcRenderer.invoke("ffmpeg-check"),
  admZipCheck: () => ipcRenderer.invoke("admzip-check"),
});
