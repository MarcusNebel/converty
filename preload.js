const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  theme: {
    get: () => ipcRenderer.invoke("theme:get"),
    set: (theme) => ipcRenderer.invoke("theme:set", theme),
  },

  setup: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    selectFolder: () => ipcRenderer.invoke("select-folder"),
    saveSetupData: (data) => ipcRenderer.invoke("setup:saveData", data),
    getSetupData: () => ipcRenderer.invoke("setup:getData"),
  },

  app: {
    getLocale: () => ipcRenderer.invoke("app:getLocale"),
  },

  store: {
    get: (key) => ipcRenderer.invoke("store:get", key),
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
  },
  converts: {
    media: {
      convertFiles: (files) => ipcRenderer.invoke("media:convertFiles", files),
      selectFiles: () => ipcRenderer.invoke("media:selectFiles"),
    },
    image: {
      convertFiles: (files, format) => ipcRenderer.invoke("image:convertFiles", files, format),
      selectFiles: () => ipcRenderer.invoke("image:selectFiles"),
    },
    archive: {
      convertFiles: (files, format) => ipcRenderer.invoke("archive:convertFiles", files, format),
      selectFiles: () => ipcRenderer.invoke("archive:selectFiles"),
    },
    document: {
      convertFiles: (files) => ipcRenderer.invoke("document:convertFiles", files),
      selectFiles: () => ipcRenderer.invoke("document:selectFiles"),
    },
  },

  libreoffice: {
    checkInstalled: () => ipcRenderer.invoke("libreoffice:checkInstalled"),
    downloadAndInstall: () => ipcRenderer.invoke("libreoffice:downloadAndInstall"),
  },

  on: (channel, callback) => {
    const validChannels = ["debug-log"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
});
