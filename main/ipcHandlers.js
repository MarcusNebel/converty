import { ipcMain } from 'electron';
import Store from 'electron-store';

const store = new Store();

export function registerSetupIPC() {
  ipcMain.handle('setup:isCompleted', () => store.get('setupCompleted', false));
  ipcMain.handle('setup:complete', () => store.set('setupCompleted', true));
  ipcMain.handle('setup:reset', () => store.delete('setupCompleted'));

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
}

export function registerThemeIPC() {
  // Theme lesen
  ipcMain.handle("theme:get", () => {
    return store.get("theme") || "system";
  });

  // Theme speichern
  ipcMain.handle("theme:set", (_, theme) => {
    store.set("theme", theme);
    return theme;
  });
}