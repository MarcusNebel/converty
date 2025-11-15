import React, { useEffect, useState } from "react";
import { FaFileAlt, FaHdd, FaClock, FaArrowRight } from "react-icons/fa";
import "../styles/Dashboard.css";
import { useTranslation } from "react-i18next";

interface FileItem {
  input: string;
  output: string;
  size: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [convertedFiles, setConvertedFiles] = useState(0);
  const [totalSize, setTotalSize] = useState("0 B");
  const [avgConversionTime, setAvgConversionTime] = useState("0");
  const [lastFiles, setLastFiles] = useState<FileItem[]>([]);

  // Daten aus dem electron-store beim Mount laden
  useEffect(() => {
    const loadData = async () => {
      const fileCount = (await window.electron.store.get("fileCount")) || 0;
      const size = (await window.electron.store.get("totalSize")) || "0 B";
      const avgTime = (await window.electron.store.get("avgConversionTime")) || "0";
      const last = (await window.electron.store.get("lastFiles")) || [];

      const validLastFiles = Array.isArray(last)
        ? last
            .filter(f => f && f.input && f.output)
            .map(f => ({
              input: f.input,
              output: f.output,
              size: f.size || "–",
            }))
        : [];

      const avgTimeRounded = Number(avgTime).toFixed(2);

      setConvertedFiles(fileCount);
      setTotalSize(size);
      setAvgConversionTime(avgTimeRounded);
      setLastFiles(validLastFiles);
    };

    loadData();
  }, []);

  const stats = [
    { label: t("dashboard.converted_files"), value: convertedFiles, icon: <FaFileAlt /> },
    { label: t("dashboard.total_size"), value: totalSize, icon: <FaHdd /> },
    { label: t("dashboard.avg_conversion_time"), value: avgConversionTime + " s", icon: <FaClock /> },
  ];

  return (
    <div className="dashboard-container">
      <h2>{t("dashboard.overall_usage")}</h2>
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">{stat.icon}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
            <div className="stat-value digital-font">{stat.value}</div>
          </div>
        ))}
      </div>

      <h2>{t("dashboard.last_converted_files")}</h2>
      <div className="files-grid">
        {lastFiles.map((file, idx) => (
          <div key={idx} className="file-card">
            <div className="file-name">
              <span>{file.input}</span>
              <FaArrowRight className="file-arrow-right" />
              <span>{file.output}</span>
            </div>
            <span className="file-size">{file.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
