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
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

// Für SetupStatus-Utils
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

export {};
