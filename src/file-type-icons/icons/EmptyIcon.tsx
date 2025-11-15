import React from "react";

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

const EmptyIcon: React.FC<IconProps> = ({ width = 40, height = 40, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" 
    width={width}
    height={height}
    fill="none"
    viewBox="0 0 40 40"
    className={className}
  >
    <path fill="#7F56D9" d="M4 4a4 4 0 0 1 4-4h16l12 12v24a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path fill="#fff" d="m24 0 12 12h-8a4 4 0 0 1-4-4z" opacity=".3" />
  </svg>

);

export default EmptyIcon;
