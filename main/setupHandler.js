import { ipcMain } from "electron";
import store from "./electronStore.js";

export function registerSetupIPC() {
  ipcMain.handle('setup:isCompleted', () => store.get('setupCompleted', false));
  ipcMain.handle('setup:complete', () => store.set('setupCompleted', true));
  ipcMain.handle('setup:reset', () => store.clear());

  // Neues IPC für Setup-Daten
  ipcMain.handle('setup:saveData', (event, data) => {
    if (!data || typeof data !== 'object') return false;
    store.set('setupData', data);   // Daten speichern
    store.set('setupCompleted', true);
    return true;                    // zurück an Renderer
  });

  ipcMain.handle('setup:getData', () => {
    const data = store.get('setupData');
    return data ?? {}; // Falls noch nichts gespeichert ist, leeres Objekt
  });

  ipcMain.handle('setup:getElectronStoreData', () => {
    const data = store.get();
    return data ?? {};
  });
}