interface ElectronAPI {
  theme: {
    get: () => Promise<string>;
    set: (theme: string) => Promise<void>;
  };
  setup: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    selectFolder: () => Promise<string | null>;
    saveSetupData: (data: any) => Promise<boolean>;
    getSetupData: () => Promise<any>;
  };
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  app: {
    getLocale: () => Promise<string>;
  };
  converts: {
    media: {
      convertFiles: (files: { path: string; targetFormat: string }[]) => Promise<{ success: boolean; files: string[]; message: string }>;
      selectFiles: () => Promise<string[]>;
    };
    video: {
      convertFiles: (files: { path: string; targetFormat: string }[]) => Promise<{ success: boolean; files: string[]; message: string }>;
      selectFiles: () => Promise<string[]>;
    };
    image: {
      convertFiles: (files: { path: string; targetFormat: string }[]) => Promise<{ success: boolean; files: string[]; message: string }>;
      selectFiles: () => Promise<string[]>;
    };
    archive: {
      convertFiles: (files: { path: string; targetFormat: string }[]) => Promise<{ success: boolean; files: string[]; message: string }>;
      selectFiles: () => Promise<string[]>;
    };
    document: {
      convertFiles: (files: { path: string; targetFormat: string }[]) => Promise<{ success: boolean; files: string[]; message: string }>;
      selectFiles: () => Promise<string[]>;
    };
  };
  libreoffice: {
    checkInstalled: () => Promise<boolean>;
    downloadAndInstall: () => Promise<void>;
  };
  on: (channel: string, callback: (event: any, msg: any) => void) => void;
  ipcRenderer: {
    on: <T = any>(channel: string, listener: (event: Electron.IpcRendererEvent, args: T) => void) => void;
    removeAllListeners: (channel: string) => void;
    removeListener?: (channel: string, listener: (event: Electron.IpcRendererEvent, args: any) => void) => void;
    send: (channel: string, data?: any) => void;
    invoke(channel: string, ...args: any[]): Promise<any>;
  };
  update: {
    check(): Promise<any>;
  };

  getFileSize: (path: string) => Promise<number>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

declare module "*setupStatus" {
  export function checkSetup(): Promise<boolean>;
  export function completeSetup(): Promise<void>;
  export function resetSetupStatus(): Promise<void>;
}

declare module "*.jsx" {
  import { FC } from "react";
  const value: FC<any>;
  export default value;
}

declare module "*.tsx" {
  import { FC } from "react";
  const value: FC<any>;
  export default value;
}

export {};
