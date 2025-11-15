// src/pages/converts/ConvertPage.tsx
import { useEffect, useState, useMemo, type FC } from "react";
import "../../styles/Converts.css";
import CustomSelect from "../../components/CustomSelect";
import { useTranslation } from "react-i18next";
import { FaCheck, FaTrash } from "react-icons/fa";
import { CgSandClock } from "react-icons/cg";
import { AudioIcon, DocumentIcon, ImageIcon, VideoIcon, ZipIcon, EmptyIcon } from "../../file-type-icons/index";
import type { NotificationItem } from "../../components/Sidebar";

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
  isConverting: boolean;
  setIsConverting: (value: boolean) => void;
  addNotification?: (note: NotificationItem) => void;
}

const ConvertPage: FC<ConvertPageProps> = ({ icon: Icon, type, formats, electronHandler, setIsConverting, addNotification }) => {
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

  type ConvertHandler = {
    convertFiles: (files: FileConvert[]) => Promise<{ success: boolean; convertedFiles?: FileItem[]; message: string }>;
    selectFiles: () => Promise<string[]>;
  };

  const handleConvert = async () => {
    if (!files.length) return alert(t(`converts.${type}.no_file_selected`));

    setIsConverting(true); // Tab-Wechsel blockieren
    console.log(`Starte Konvertierung von ${files.length} Datei(en)...`);
    setFiles(prev => prev.map(f => ({ ...f, status: "processing" })));

    const fileConverts = files.map(f => ({ path: f.path, targetFormat: f.targetFormat }));
    const startTime = performance.now();

    const converts = window.electron.converts as Record<string, ConvertHandler>;
    if (!(type in converts)) {
      console.error("Ungültiger Convert-Typ:", type);
      setIsConverting(false);
      return;
    }

    const result = await converts[type].convertFiles(fileConverts);

    const endTime = performance.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const durationSecondsRounded = durationSeconds.toFixed(2);
    console.log(`Konvertierung abgeschlossen in ${durationSecondsRounded} s`);

    if (result.success) {
      const successfulFiles = result.convertedFiles || files;
      const successfulCount = successfulFiles.length;

      // Alte Werte aus Store holen
      const existingCount = (await window.electron.store.get("fileCount")) || 0;
      const existingSize = (await window.electron.store.get("totalSize")) || "0 B";
      const lastFiles = (await window.electron.store.get("lastFiles")) || [];
      const existingAvgTime = (await window.electron.store.get("avgConversionTime")) || "0 s";

      const existingAvgTimeNum = parseFloat(existingAvgTime as string) || 0;
      const durationSecondsNum = Number(durationSecondsRounded) || 0;
      const newAvgTime = existingAvgTimeNum > 0
        ? (existingAvgTimeNum + durationSecondsNum) / 2
        : durationSecondsNum;

      const parseSize = (sizeStr: string) => {
        const units = { B: 1 / (1024 * 1024), KB: 1 / 1024, MB: 1, GB: 1024 };
        const match = sizeStr.match(/([\d.]+)\s*(B|KB|MB|GB)/i);
        if (!match) return 0;
        return parseFloat(match[1]) * (units[match[2].toUpperCase() as keyof typeof units] || 0);
      };

      const formatSize = (mb: number) => mb >= 1024 ? (mb / 1024).toFixed(2) + " GB" : mb.toFixed(2) + " MB";

      let totalMb = parseSize(existingSize);
      for (const file of successfulFiles) {
        if (!file.path) continue;
        const bytes = await window.electron.getFileSize(file.path);
        totalMb += bytes / (1024 * 1024);
      }

      const newTotalCount = existingCount + successfulCount;
      const newTotalSize = formatSize(totalMb);

      const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      const updatedLastFiles = [
        ...successfulFiles.flatMap((f: FileItem) => {
          const inputName = f.name || f.path.split("/").pop() || "Unbekannt";
          const inputExt = inputName.split(".").pop() || "";
          const outputName = inputName.replace(new RegExp(`${inputExt}$`, "i"), f.targetFormat);
          return [{ input: inputName, output: outputName, size: f.size ? formatBytes(f.size) : "" }];
        }),
        ...lastFiles,
      ].slice(0, 6);

      await window.electron.store.set("fileCount", newTotalCount);
      await window.electron.store.set("totalSize", newTotalSize);
      await window.electron.store.set("lastFiles", updatedLastFiles);
      await window.electron.store.set("avgConversionTime", newAvgTime);

      setFiles(prev => prev.map(f => ({ ...f, status: "done" })));

      const successNotification: NotificationItem = {
        key: "notifications.success",
        params: {
          count: successfulFiles.length,
          duration: durationSecondsRounded
        }
      };

      // Panel-Benachrichtigung
      if (window.notificationFn) {
        addNotification?.(successNotification);
      }

      // Desktop-Benachrichtigung
      const body = `${t("notifications.success.part-one")}${successNotification.params?.count}${t("notifications.success.part-two")}${successNotification.params?.duration}${t("notifications.success.part-three")}`;

      window.electron.ipcRenderer.send('show-notification', {title: 'Converty', body});

      // In den Store schreiben
      const oldNotifications: NotificationItem[] = (await window.electron.store.get("notifications")) || [];
      const newNotifications = [successNotification, ...oldNotifications];
      await window.electron.store.set("notifications", newNotifications);

      const newNotificationSound = new Audio("sounds/new-notification.wav");
      newNotificationSound.play().catch(e => console.log("Sound konnte nicht abgespielt werden:", e));

    } else {
      console.error(`Error while converting:`, result.message);

      const errorNotification: NotificationItem = {
        key: "notifications.error",
        params: { message: result.message }
      };

      // Panel-Benachrichtigung
      if (window.notificationFn) {
        addNotification?.(errorNotification);
      }

      // Desktop-Benachrichtigung für Fehler
      const errorBody = `${t("notifications.error.part-one")} ${result.message}`;
      window.electron.ipcRenderer.send('show-notification', { title: 'Converty', body: errorBody });

      // In den Store schreiben
      const oldNotifications: NotificationItem[] = (await window.electron.store.get("notifications")) || [];
      const newNotifications = [errorNotification, ...oldNotifications];
      await window.electron.store.set("notifications", newNotifications);

      // Fehler-Sound
      const errorSound = new Audio("sounds/new-notification-error.wav");
      errorSound.play().catch(e => console.log("Sound konnte nicht abgespielt werden:", e));
    }

    setIsConverting(false); // Tab-Wechsel wieder erlauben
  };

  // Hilfsfunktion zum Formatieren
  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    if (["mp3", "wav", "aac", "flac", "ogg", "aiff", "ac3", "opus", "amr", "alac"].includes(ext)) return AudioIcon;
    if (["pdf", "odt", "rtf", "txt", "html", "xlsx", "csv", "doc", "docx", "xls", "ppt", "pptx"].includes(ext)) return DocumentIcon
    if (["jpg", "jpeg", "png", "webp", "bmp", "tiff", "gif", "heif", "heic", "avif", "gif", "svg"].includes(ext)) return ImageIcon;
    if (["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "mpg", "ts", "gif", "hevc_mp4"].includes(ext)) return VideoIcon;
    if (["7z", "bz2", "gz", "tar", "xz", "zip", "rar", "wim", "cab", "arj", "chm", "cpio", "iso", "vhd", "vhdx", "swm", "z", "rar"].includes(ext)) return ZipIcon;

    return EmptyIcon;
  };

  useEffect(() => {
    const saved = localStorage.getItem(`convert-files-${type}`);
    if (saved) {
      try {
        const parsed: FileItem[] = JSON.parse(saved);
        setFiles(parsed);
      } catch (_) {}
    }
  }, [type]);

  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem(`convert-files-${type}`, JSON.stringify(files));
    } else {
      localStorage.removeItem(`convert-files-${type}`);
    }
  }, [files, type]);
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

          <button 
            className="clean-list-btn" 
            onClick={() => {
              setFiles([]);
              setIsConverting(false);
            }}>
            <FaTrash />
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="convert-list">
          {files.map((file, idx) => {
            const Icon = getFileIcon(file.name);
          
          return (
            <div key={idx} className="convert-card-full">
              <Icon className="file-type-icon" />
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

              <button
                className="remove-btn" 
                onClick={() => {
                  setFiles(prev => prev.filter((_, i) => i !== idx));
                  setIsConverting(false);
                }}
              >
                <FaTrash />
              </button>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default ConvertPage;
