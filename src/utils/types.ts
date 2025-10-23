import type { TFunction } from "i18next";

export interface SetupData {
  name: string;
  folder: string;
  theme: string;
  videoFormat: string;
  imageFormat: string;
  archiveFormat: string;
  documentFormat: string;
  pushNotifications: boolean;
}

export interface SetupStepComponentProps {
  setupData: any;
  updateSetupData: (key: string, value: any) => void;
  applyTheme?: (theme: string) => void;
  t: TFunction;
}

export interface SetupStep {
  id: number;
  title: string;
  description: string;
  component: React.FC<SetupStepComponentProps>;
}