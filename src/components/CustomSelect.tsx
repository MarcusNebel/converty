import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "../styles/CustomSelect.css";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CustomSelect({ options, value, onChange, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [dropdownUp, setDropdownUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePosition = () => {
      if (!buttonRef.current || !listRef.current) return;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const listHeight = listRef.current.offsetHeight;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      setDropdownUp(spaceBelow < listHeight);
    };

    handlePosition();
    window.addEventListener("resize", handlePosition);
    window.addEventListener("scroll", handlePosition, true);

    return () => {
      window.removeEventListener("resize", handlePosition);
      window.removeEventListener("scroll", handlePosition, true);
    };
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`custom-select ${open ? "open" : ""}`}>
      <button
        ref={buttonRef}
        className="custom-select-button"
        onClick={() => setOpen(!open)}
      >
        <span>{selected?.label || placeholder || "Select..."}</span>
        <ChevronDown className="custom-select-chevron" />
      </button>

      {open && (
        <div
          ref={listRef}
          className={`custom-select-list ${dropdownUp ? "up" : "down"}`}
        >
          {options.map(opt => (
            <div
              key={opt.value}
              className={`custom-select-item ${value === opt.value ? "selected" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
