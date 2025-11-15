import React, { useState, useRef, useEffect } from "react";
import {
  FaFileAlt,
  FaCog,
  FaQuestionCircle,
  FaVideo,
  FaImage,
  FaArchive,
  FaBell,
} from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";
import { useTranslation } from "react-i18next";
import "../styles/Sidebar.css";

type SidebarProps = {
  active: string;
  onSelect: (section: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ active, onSelect }) => {
  const { t } = useTranslation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [closing, setClosing] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [notifications, {/*setNotifications*/}] = useState<string[]>([
    "Datei erfolgreich konvertiert",
    "Update verfügbar",
    "3 neue Dateien gefunden",
  ]);

  const toggleNotifications = () => {
    if (showNotifications) {
      setClosing(true);
    } else {
      setShowNotifications(true);
    }
  };

  // Klick außerhalb schließt Panel mit Animation
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".sidebar-item.notifications")
      ) {
        setClosing(true); // Animation starten
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sidebar">
      <div className="top">
        <h1 className="head-title">Converty</h1>

        <div
          className={`sidebar-item ${active === "dashboard" ? "active" : ""}`}
          onClick={() => onSelect("dashboard")}
        >
          <span className="icon">
            <MdSpaceDashboard />
          </span>
          <span className="label">{t("sidebar.dashboard")}</span>
        </div>

        <div
          className={`sidebar-item ${
            active === "convert-media" ? "active" : ""
          }`}
          onClick={() => onSelect("convert-media")}
        >
          <span className="icon">
            <FaVideo />
          </span>
          <span className="label">{t("sidebar.media")}</span>
        </div>

        <div
          className={`sidebar-item ${
            active === "convert-image" ? "active" : ""
          }`}
          onClick={() => onSelect("convert-image")}
        >
          <span className="icon">
            <FaImage />
          </span>
          <span className="label">{t("sidebar.image")}</span>
        </div>

        <div
          className={`sidebar-item ${
            active === "convert-archive" ? "active" : ""
          }`}
          onClick={() => onSelect("convert-archive")}
        >
          <span className="icon">
            <FaArchive />
          </span>
          <span className="label">{t("sidebar.archive")}</span>
        </div>

        <div
          className={`sidebar-item ${
            active === "convert-document" ? "active" : ""
          }`}
          onClick={() => onSelect("convert-document")}
        >
          <span className="icon">
            <FaFileAlt />
          </span>
          <span className="label">{t("sidebar.document")}</span>
        </div>
      </div>

      <div className="bottom">
        {/* Benachrichtigungen */}
        <div
          className={`sidebar-item notifications`}
          onClick={toggleNotifications}
        >
          <span className="icon notification-icon">
            <FaBell />
            {notifications.length > 0 && (
              <span className="notification-badge">
                {notifications.length}
              </span>
            )}
          </span>
          <span className="label">{t("sidebar.notifications")}</span>
        </div>

        {/* Einstellungen */}
        <div
          className={`sidebar-item ${active === "settings" ? "active" : ""}`}
          onClick={() => onSelect("settings")}
        >
          <span className="icon">
            <FaCog />
          </span>
          <span className="label">{t("sidebar.settings")}</span>
        </div>

        {/* Hilfe */}
        <div
          className={`sidebar-item ${active === "help" ? "active" : ""}`}
          onClick={() => onSelect("help")}
        >
          <span className="icon">
            <FaQuestionCircle />
          </span>
          <span className="label">{t("sidebar.help")}</span>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div
          ref={notificationRef}
          className={`notification-panel ${closing ? "closing" : ""}`}
          onAnimationEnd={() => {
            if (closing) {
              setShowNotifications(false);
              setClosing(false);
            }
          }}
        >
          <h3>{t("sidebar.notifications")}</h3>
          <ul>
            <li>Datei erfolgreich konvertiert</li>
            <li>Update verfügbar</li>
            <li>3 neue Dateien gefunden</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
