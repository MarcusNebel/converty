import { createContext } from "react";

export type SettingsContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);