import React, { useEffect, useState } from "react";
import "../styles/Modal.css"

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  description,
  confirmText = "Bestätigen",
  cancelText = "Abbrechen",
  onConfirm,
  onCancel,
}) => {
  const [render, setRender] = useState(false); // steuert, ob das Modal im DOM ist
  const [animate, setAnimate] = useState(false); // steuert CSS-Klasse für Animation

  // Wenn `visible` true wird → Modal rendern und Animation starten
  useEffect(() => {
    if (visible) {
      setRender(true); // Modal wird im DOM
      setTimeout(() => setAnimate(true), 10); // Klasse .show nach Rendern setzen
    } else {
      setAnimate(false); // Klasse .show entfernen → Fade-Out
      const timer = setTimeout(() => setRender(false), 300); // nach Animation entfernen
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!render) return null;

  return (
    <div className={`modal-backdrop ${animate ? "show" : ""}`}>
      <div className="modal-content">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        <div className="modal-buttons">
          <button className="btn-warning" onClick={onConfirm}>{confirmText}</button>
          <button className="btn-settings" onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
