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
});
