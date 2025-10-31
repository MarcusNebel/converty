import React from "react";
import { FaFileAlt, FaCog, FaQuestionCircle, FaVideo, FaImage, FaArchive } from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";
import { useTranslation } from "react-i18next";
import "../styles/Sidebar.css";

type SidebarProps = {
  active: string;
  onSelect: (section: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ active, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div className="sidebar">

      <div className="top">
        <h1 className="head-title">Converty</h1>

        {/* Dashboard */}
        <div
          className={`sidebar-item ${active === "dashboard" ? "active" : ""}`}
          onClick={() => onSelect("dashboard")}
        >
          <span className="icon"><MdSpaceDashboard /></span>
          <span className="label">{t("sidebar.dashboard")}</span>
        </div>

        {/* Konvertierungen */}
        <div
          className={`sidebar-item  ${active === "convert-media" ? "active" : ""}`}
          onClick={() => onSelect("convert-media")}
        >
          <span className="icon"><FaVideo /></span>
          <span className="label">{t("sidebar.media")}</span>
        </div>
        <div
          className={`sidebar-item  ${active === "convert-image" ? "active" : ""}`}
          onClick={() => onSelect("convert-image")}
        >
          <span className="icon"><FaImage /></span>
          <span className="label">{t("sidebar.image")}</span>
        </div>
        <div
          className={`sidebar-item  ${active === "convert-archive" ? "active" : ""}`}
          onClick={() => onSelect("convert-archive")}
        >
          <span className="icon"><FaArchive /></span>
          <span className="label">{t("sidebar.archive")}</span>
        </div>
        <div
          className={`sidebar-item  ${active === "convert-document" ? "active" : ""}`}
          onClick={() => onSelect("convert-document")}
        >
          <span className="icon"><FaFileAlt /></span>
          <span className="label">{t("sidebar.document")}</span>
        </div>
      </div>

      <div className="bottom">
        {/* Einstellungen */}
        <div
          className={`sidebar-item ${active === "settings" ? "active" : ""}`}
          onClick={() => onSelect("settings")}
        >
          <span className="icon"><FaCog /></span>
          <span className="label">{t("sidebar.settings")}</span>
        </div>

        {/* Hilfe */}
        <div
          className={`sidebar-item ${active === "help" ? "active" : ""}`}
          onClick={() => onSelect("help")}
        >
          <span className="icon"><FaQuestionCircle /></span>
          <span className="label">{t("sidebar.help")}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
