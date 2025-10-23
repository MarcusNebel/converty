// src/pages/converts/ConvertPage.tsx
import { useState, useMemo, type FC } from "react";
import "../../styles/Converts.css";
import CustomSelect from "../../components/CustomSelect";
import { useTranslation } from "react-i18next";

interface FileItem {
  path: string;
  name: string;
  currentFormat: string;
  targetFormat: string;
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
    if (!files.length) return alert(t(`converts.${type}.no_file_selected`));

    // Typ korrekt: FileConvert[]
    const fileConverts: FileConvert[] = files.map(f => ({
      path: f.path,
      targetFormat: f.targetFormat
    }));

    const result = await electronHandler.convertFiles(fileConverts);

    if (result.success) {
      alert(t(`converts.${type}.convert_success`, { files: result.files.join("\n") }));
      setFiles([]);
    } else {
      alert(t(`converts.${type}.convert_error`, { message: result.message }));
    }
  };

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

              const selectedFiles: FileItem[] = paths.map((p) => {
                const name = p.split(/[/\\]/).pop() || "unknown";
                return {
                  path: p,
                  name,
                  currentFormat: name.split(".").pop()?.toLowerCase() || "",
                  targetFormat: globalFormat,
                };
              });

              setFiles((prev) => [...prev, ...selectedFiles]);
            }}
          >
            {t(`converts.${type}.select_files`)}
          </button>

          <button className="convert-btn" onClick={handleConvert}>
            {t(`converts.${type}.convert`)}
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
                  {t(`converts.${type}.current_format`)} {file.currentFormat}
                </span>
                <CustomSelect
                  options={formats}
                  value={file.targetFormat}
                  onChange={(value) =>
                    setFiles((prev) => {
                      const copy = [...prev];
                      copy[idx].targetFormat = value;
                      return copy;
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConvertPage;
