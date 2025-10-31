// src/pages/converts/ConvertPage.tsx
import { useEffect, useState, useMemo, type FC } from "react";
import "../../styles/Converts.css";
import CustomSelect from "../../components/CustomSelect";
import { useTranslation } from "react-i18next";
import { FaCheck, FaTrash } from "react-icons/fa";
import { CgSandClock } from "react-icons/cg";

interface FileItem {
  path: string;
  name: string;
  size: number;
  targetFormat: string;
  status?: "queued" | "processing" | "done";
}

interface FileConvert {
  path: string;
  targetFormat: string;
}

interface ConvertPageProps {
  icon: FC<any>;
  type: string;
  formats: { value: string; label: string }[];
  electronHandler: {
    convertFiles: (files: FileConvert[]) => Promise<{ success: boolean; files: string[]; message: string }>;
    selectFiles: () => Promise<string[]>;
  };
}

const ConvertPage: FC<ConvertPageProps> = ({ icon: Icon, type, formats, electronHandler }) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [globalFormat, setGlobalFormat] = useState(formats[0].value);

  useEffect(() => {
    const channel = `${type}:status`;
    const handleStatus = (_: any, { index, status }: { index: number; status: string }) => {
      setFiles(prev => {
        const copy = [...prev];
        if (copy[index]) copy[index].status = status as "queued" | "processing" | "done";
        return copy;
      });
    };

    window.electron.ipcRenderer.on(channel, handleStatus);

    return () => {
      window.electron.ipcRenderer.removeAllListeners(channel);
    };
  }, [type]);

  const allSameFormat = useMemo(() => {
    if (files.length === 0) return true;
    const first = files[0].targetFormat;
    return files.every(f => f.targetFormat === first);
  }, [files]);

  const handleGlobalChange = (value: string) => {
    setGlobalFormat(value);
    setFiles(prev => prev.map(f => ({ ...f, targetFormat: value })));
  };

  const handleConvert = async () => {
    if (!files.length) {
      return alert(t(`converts.${type}.no_file_selected`));
    }

    console.log(`Starte Konvertierung von ${files.length} Datei(en)...`);
    setFiles(prev => prev.map(f => ({ ...f, status: "processing" })));

    const fileConverts = files.map(f => ({
      path: f.path,
      targetFormat: f.targetFormat,
    }));

    // Zeitmessung starten
    const startTime = performance.now();

    const result = await window.electron.converts[type].convertFiles(fileConverts);

    // Zeitmessung beenden
    const endTime = performance.now();
    let durationSeconds = (endTime - startTime) / 1000;
    let durationSecondsRounded = durationSeconds.toFixed(2);
    console.log(`Konvertierung abgeschlossen in ${durationSecondsRounded} s`);

    if (result.success) {
      const successfulFiles = result.convertedFiles || files;
      const successfulCount = successfulFiles.length;

      // Alte Werte aus Store holen
      const existingCount = (await window.electron.store.get("fileCount")) || 0;
      const existingSize = (await window.electron.store.get("totalSize")) || "0 B";
      const lastFiles = (await window.electron.store.get("lastFiles")) || [];
      const existingAvgTime = (await window.electron.store.get("avgConversionTime")) || "0 s";

      console.log(`Vorherige durchschnittliche Zeit: ${existingAvgTime}`);

      const existingAvgTimeNum = parseFloat(existingAvgTime as string) || 0;
      const durationSecondsNum = Number(durationSecondsRounded) || 0;

      let newAvgTime: number;

      if (existingAvgTimeNum > 0) {
        // Wenn es bereits einen Durchschnitt gibt → Mittelwert bilden
        newAvgTime = (existingAvgTimeNum + durationSecondsNum) / 2;
      } else {
        // Wenn noch kein Durchschnitt vorhanden → neuen Wert übernehmen
        newAvgTime = durationSecondsNum;
      }

      console.log(`Neue durchschnittliche Zeit: ${newAvgTime.toFixed(2)} s`);

      // Helfer zum Umrechnen
      const parseSize = (sizeStr: string) => {
        const units = { B: 1 / (1024 * 1024), KB: 1 / 1024, MB: 1, GB: 1024 };
        const match = sizeStr.match(/([\d.]+)\s*(B|KB|MB|GB)/i);
        if (!match) return 0;
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        return value * (units[unit as keyof typeof units] || 0);
      };

      const formatSize = (mb: number) => {
        if (mb >= 1024) return (mb / 1024).toFixed(2) + " GB";
        return mb.toFixed(2) + " MB";
      };

      // Gesamtgröße in MB
      let totalMb = parseSize(existingSize);

      for (const file of successfulFiles) {
        const path = file.path;
        if (!path) {
          console.warn("Datei hat keinen Pfad:", file);
          continue;
        }

        const bytes = await window.electron.getFileSize(path);
        totalMb += bytes / (1024 * 1024);
        console.log(`${path} = ${(bytes / (1024 * 1024)).toFixed(2)} MB`);
      }

      const newTotalCount = existingCount + successfulCount;
      const newTotalSize = formatSize(totalMb);

      const updatedLastFiles = [
        ...successfulFiles.flatMap(f => {
          const inputName = f.name || f.path.split("/").pop() || "Unbekannt";
          const inputExt = inputName.split(".").pop() || "";
          const outputExt = f.targetFormat;
          const outputName = inputName.replace(new RegExp(`${inputExt}$`, "i"), outputExt);

          return [
            {
              input: inputName,
              output: outputName,
              size: f.size ? formatBytes(f.size) : "",
            },
          ];
        }),
        ...lastFiles,
      ].slice(0, 6); // Count of Files

      // Store aktualisieren
      await window.electron.store.set("fileCount", newTotalCount);
      await window.electron.store.set("totalSize", newTotalSize);
      await window.electron.store.set("lastFiles", updatedLastFiles);
      await window.electron.store.set("avgConversionTime", newAvgTime);

      console.log(`✅ Erfolgreich ${successfulCount} Datei(en) konvertiert.`);
      console.log(`📦 Gesamt: ${newTotalCount} Dateien (${newTotalSize})`);

      // UI aktualisieren
      setFiles(prev => prev.map(f => ({ ...f, status: "done" })));
    } else {
      console.error(`❌ Fehler bei der Konvertierung:`, result.message);
      alert(t(`converts.${type}.convert_failed`) + ": " + result.message);
    }
  };

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  return (
    <div className="convert-page">
      <h2><Icon /> {t(`converts.${type}.title`)}</h2>
      <h3>{t(`converts.${type}.subtitle`)}</h3>

      <div className="top-controls">
        <div className="left">
          <span>{t(`converts.${type}.global_label`)}</span>
          <CustomSelect
            options={[
              !allSameFormat ? { value: "mixed", label: t(`converts.${type}.mixed_formats`) } : undefined,
              ...formats
            ].filter((o): o is { value: string; label: string } => !!o)}
            value={allSameFormat ? globalFormat : "mixed"}
            onChange={(value) => {
              if (value !== "mixed") handleGlobalChange(value);
            }}
          />
        </div>

        <div className="right">
          <button
            type="button"
            className="upload-btn"
            onClick={async () => {
              const paths = await electronHandler.selectFiles();
              if (!paths?.length) return;

              const selectedFiles: FileItem[] = await Promise.all(
                paths.map(async (p) => {
                  const name = p.split(/[/\\]/).pop() || "unknown";
                  const size = await window.electron.getFileSize(p); // async

                  return {
                    path: p,
                    name,
                    size,
                    targetFormat: globalFormat,
                    status: "queued",
                  };
                })
              );

              setFiles(prev => [...prev, ...selectedFiles]);
            }}
          >
            {t(`converts.${type}.select_files`)}
          </button>

          <button className="convert-btn" onClick={handleConvert}>
            {t(`converts.${type}.convert`)}
          </button>

          <button className="clean-list-btn" onClick={() => setFiles([])}>
            <FaTrash />
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="convert-list">
          {files.map((file, idx) => (
            <div key={idx} className="convert-card-full">
              <span className="file-name">{file.name}</span>
              <div className="file-options">
                <span>
                  {formatBytes(file.size)}
                </span>
                <CustomSelect
                  options={formats}
                  value={file.targetFormat}
                  onChange={(value) =>
                    setFiles(prev => {
                      const copy = [...prev];
                      copy[idx].targetFormat = value;
                      return copy;
                    })
                  }
                />
              </div>

              <span className={`status-text ${file.status ?? ""}`}>
                {file.status === "queued" && <><CgSandClock /></>}
                {file.status === "processing" && (
                  <>
                    <span className="processing-dot" /><span className="processing-dot" /><span className="processing-dot" />
                  </>
                )}
                {file.status === "done" && <><FaCheck /></>}
              </span>

              <button className="remove-btn" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConvertPage;
