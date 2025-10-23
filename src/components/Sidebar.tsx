import React, { useState } from "react";
import { FaFileAlt, FaCog, FaQuestionCircle, FaVideo, FaImage, FaArchive } from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";
import "../styles/Sidebar.css";

type SidebarProps = {
  active: string;
  onSelect: (section: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ active, onSelect }) => {
  const [convertOpen, setConvertOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <MdSpaceDashboard /> },
    { id: "convert", label: "Konvertierungen", icon: <FaFileAlt />, submenu: [
      { id: "convert-media", label: "Medien", icon: <FaVideo /> },
      { id: "convert-image", label: "Bild", icon: <FaImage /> },
      { id: "convert-archive", label: "Archiv", icon: <FaArchive /> },
      { id: "convert-document", label: "Dokument", icon: <FaFileAlt /> },
    ] },
    { id: "settings", label: "Einstellungen", icon: <FaCog /> },
    { id: "help", label: "Hilfe", icon: <FaQuestionCircle /> },
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if(item.submenu) {
      setConvertOpen(!convertOpen); // nur Untermenü auf-/zuklappen
    } else {
      onSelect(item.id);
    }
  }

  const isConvertActive = menuItems[1].submenu?.some(sub => sub.id === active);

  return (
    <div className="sidebar">
      <h1 className="head-title">Converty</h1>
      {menuItems.map((item) => (
        <React.Fragment key={item.id}>
          <div
            className={`sidebar-item ${active === item.id || (item.id === "convert" && isConvertActive) ? "active" : ""}`}
            onClick={() => handleItemClick(item)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </div>

          {item.submenu && convertOpen && (
            <div className="submenu">
              {item.submenu.map(sub => (
                <div
                  key={sub.id}
                  className={`sidebar-item sub-item ${active === sub.id ? "active" : ""}`}
                  onClick={() => onSelect(sub.id)}
                >
                  <span className="icon">{sub.icon}</span>
                  <span className="label">{sub.label}</span>
                </div>
              ))}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Sidebar;
