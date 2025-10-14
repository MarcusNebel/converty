declare global {
  interface Window {
    electron: {
      magickCheck: () => Promise<string>;
      ffmpegCheck: () => Promise<string>;
      admZipCheck: () => Promise<string>;
    };
  }
}

export {};
