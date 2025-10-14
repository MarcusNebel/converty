import { useEffect, useState } from "react";

export default function App() {
  const [results, setResults] = useState<{
    magick: string | null;
    ffmpeg: string | null;
    admzip: string | null;
  }>({
    magick: null,
    ffmpeg: null,
    admzip: null,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAll() {
      try {
        const magick = await window.electron.magickCheck();
        const ffmpeg = await window.electron.ffmpegCheck();
        const admzip = await window.electron.admZipCheck();
        setResults({ magick, ffmpeg, admzip });
      } catch (err: any) {
        setError(err?.message || String(err));
      }
    }
    checkAll();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Converty</h1>

      {error && <p style={{ color: "red" }}>❌ Fehler: {error}</p>}

      <h3>🧙‍♂️ ImageMagick</h3>
      <pre>{results.magick || "Wird geprüft..."}</pre>

      <h3>🎬 FFmpeg</h3>
      <pre>{results.ffmpeg || "Wird geprüft..."}</pre>

      <h3>🗜️ Adm-Zip</h3>
      <pre>{results.admzip || "Wird geprüft..."}</pre>
    </div>
  );
}
