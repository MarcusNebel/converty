import { FaImage } from "react-icons/fa";
import ConvertPage from "./ConvertPage";
import type { NotificationItem } from "../../components/Sidebar";

const formats = [
  { value: "jpeg", label: "JPEG (.jpeg)" },
  { value: "jpg", label: "JPG (.jpg)" },
  { value: "png", label: "PNG (.png)" },
  { value: "webp", label: "WEBP (.webp)" },
  { value: "bmp", label: "BMP (.bmp)" },
  { value: "tiff", label: "TIFF (.tiff)" },
  { value: "gif", label: "GIF (.gif)" },
  { value: "heif", label: "HEIF (.heif)" },
  { value: "heic", label: "HEIC (.heic)" },
  { value: "avif", label: "AVIF (.avif)" },
].filter(Boolean);

interface ImageProps {
  isConverting: boolean;
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification?: (note: NotificationItem) => void;
}

const Image: React.FC<ImageProps> = ({ isConverting, setIsConverting }) => (
  <ConvertPage
    icon={FaImage}
    type="image"
    formats={formats}
    electronHandler={window.electron.converts.image}
    isConverting={isConverting}
    setIsConverting={setIsConverting}
  />
);

export default Image;
