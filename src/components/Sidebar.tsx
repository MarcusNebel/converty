import React, { useState, useEffect, useRef } from "react";
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

export type NotificationItem = {
  key: string;
  params?: Record<string, any>;
};

type SidebarProps = {
  active: string;
  onSelect: (section: string) => void;
  isConverting: boolean;
  addNotification?: (note: NotificationItem) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ active, onSelect, isConverting }) => {
  const { t } = useTranslation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [closing, setClosing] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Externe Funktion zum Hinzufügen von Notifications
  useEffect(() => {
    const interval = setInterval(async () => {
      const stored: NotificationItem[] = (await window.electron.store.get("notifications")) || [];
      setNotifications(stored);
    }, 1000); // alle 1s prüfen

    return () => clearInterval(interval);
  }, []);

  const toggleNotifications = () => {
    if (showNotifications) {
      setClosing(true);
    } else {
      setShowNotifications(true);
    }
  };

  // Klick außerhalb schließt das Panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".sidebar-item.notifications")
      ) {
        setClosing(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearNotifications = async () => {
    setNotifications([]);
    await window.electron.store.set("notifications", []);
  };

  return (
    <div className="sidebar">
      <div className="top">
        <h1 className="head-title">Converty</h1>

        {[
          { key: "dashboard", icon: <MdSpaceDashboard />, label: t("sidebar.dashboard") },
          { key: "convert-media", icon: <FaVideo />, label: t("sidebar.media") },
          { key: "convert-image", icon: <FaImage />, label: t("sidebar.image") },
          { key: "convert-archive", icon: <FaArchive />, label: t("sidebar.archive") },
          { key: "convert-document", icon: <FaFileAlt />, label: t("sidebar.document") },
        ].map(item => (
          <div
            key={item.key}
            className={`sidebar-item ${active === item.key ? "active" : ""}`}
            onClick={() => !isConverting && onSelect(item.key)}
            style={{
              pointerEvents: isConverting ? "none" : "auto",
              opacity: isConverting ? 0.5 : 1,
            }}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="bottom">
        <div
          className={`sidebar-item notifications`}
          onClick={() => !isConverting && toggleNotifications()}
          style={{
            pointerEvents: isConverting ? "none" : "auto",
            opacity: isConverting ? 0.5 : 1,
          }}
        >
          <span className="icon notification-icon">
            <FaBell />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </span>
          <span className="label">{t("sidebar.notifications")}</span>
        </div>

        <div
          className={`sidebar-item ${active === "settings" ? "active" : ""}`}
          onClick={() => !isConverting && onSelect("settings")}
          style={{
            pointerEvents: isConverting ? "none" : "auto",
            opacity: isConverting ? 0.5 : 1,
          }}
        >
          <span className="icon"><FaCog /></span>
          <span className="label">{t("sidebar.settings")}</span>
        </div>

        <div
          className={`sidebar-item ${active === "help" ? "active" : ""}`}
          onClick={() => !isConverting && onSelect("help")}
          style={{
            pointerEvents: isConverting ? "none" : "auto",
            opacity: isConverting ? 0.5 : 1,
          }}
        >
          <span className="icon"><FaQuestionCircle /></span>
          <span className="label">{t("sidebar.help")}</span>
        </div>
      </div>

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
          <div className="notification-panel-top">
            <h3>{t("sidebar.notifications")}</h3>
            <button className="clear-notifications-btn" onClick={clearNotifications}>{t("sidebar.clear-notifications")} </button>
          </div>
          <ul>
            {notifications.map((note, index) => (
              <li key={index}>
                {note.key === "notifications.success"
                  ? `${t("notifications.success.part-one")}${note.params?.count}${t("notifications.success.part-two")}${note.params?.duration}${t("notifications.success.part-three")}`
                  : note.key === "notifications.error"
                  ? `${t("notifications.error.part-one")} ${note.params?.message}`
                  : note.key === "notifications.update" && note.params
                  ? `${t("notifications.update")} ${note.params.version}`
                  : note.key === "notifications.update-error" && note.params
                  ? `${t("notifications.update-error")} ${note.params.message}`
                  : note.key || "Unknown notification"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
