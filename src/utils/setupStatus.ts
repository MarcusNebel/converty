// src/utils/setupStatus.ts
export async function checkSetup(): Promise<boolean> {
  return window.electron.setup.invoke("setup:isCompleted");
}

export async function completeSetup(): Promise<void> {
  return window.electron.setup.invoke("setup:complete");
}

export async function resetSetupStatus(): Promise<void> {
  return window.electron.setup.invoke("setup:reset");
}
