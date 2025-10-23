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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`custom-select ${open ? "open" : ""}`}>
      <button className="custom-select-button" onClick={() => setOpen(!open)}>
        <span>{selected?.label || placeholder || "Select..."}</span>
        <ChevronDown className="custom-select-chevron" />
      </button>

      {open && (
        <div className="custom-select-list">
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
