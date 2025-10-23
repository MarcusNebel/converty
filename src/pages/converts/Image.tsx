import { FaImage } from "react-icons/fa";
import ConvertPage from "./ConvertPage";

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

const Image = () => (
  <ConvertPage
    icon={FaImage}
    type="image"
    formats={formats}
    electronHandler={window.electron.converts.image}
  />
);

export default Image;
