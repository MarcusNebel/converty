// src/pages/Dashboard.tsx
import React from "react";
import { FaFileAlt, FaHdd, FaClock } from "react-icons/fa";
import "../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  // Platzhalter-Werte
  const convertedFiles = 245;
  const totalSize = "34.7 GB";
  const avgConversionTime = "12.4 s";

  // Letzte 5 konvertierte Dateien
  const lastFiles = [
    { name: "Urlaub_2025.mp4", size: "1.2 GB" },
    { name: "Präsentation.pdf", size: "34 MB" },
    { name: "Bild_001.png", size: "5.5 MB" },
    { name: "Audioaufnahme.wav", size: "22 MB" },
    { name: "Dokument.docx", size: "12 MB" },
    { name: "Video_Tutorial.mov", size: "700 MB" },
    { name: "E-Book.epub", size: "3 MB" },
    { name: "Musik_Album.zip", size: "150 MB" },
  ];

  const stats = [
    { label: "KONVERTIERTE DATEIEN", value: convertedFiles, icon: <FaFileAlt /> },
    { label: "GESAMTGRÖSSE", value: totalSize, icon: <FaHdd /> },
    { label: "DURCHSCHNITTLICHE ZEIT", value: avgConversionTime, icon: <FaClock /> },
  ];

  return (
    <div className="dashboard-container">
      <h2>GESAMTNUTZUNG</h2>
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

      <h2>LETZTE KONVERTIERTE DATEIEN</h2>
      <div className="files-grid">
        {lastFiles.map((file, idx) => (
          <div key={idx} className="file-card">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{file.size}</span>
          </div>
        ))}
      </div>

      <div className="actions-section">
        <button className="primary-btn">Neue Konvertierung starten</button>
        <div className="drag-drop-area">
          <p>Dateien hierher ziehen oder klicken, um hochzuladen</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
