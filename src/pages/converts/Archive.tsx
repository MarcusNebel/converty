import { FaArchive } from "react-icons/fa";
import ConvertPage from "./ConvertPage";

const formats = [
  { value: "7z", label: "7-Zip (.7z)" },
  { value: "bz2", label: "BZIP2 (.tar.bz2)" },
  { value: "gz", label: "GZIP (.tar.gz)" },
  { value: "tar", label: "TAR (.tar)" },
  { value: "xz", label: "XZ (.tar.xz)" },
  { value: "zip", label: "ZIP (.zip)" },
];

const Archive = () => (
  <ConvertPage
    icon={FaArchive}
    type="archive"
    formats={formats}
    electronHandler={window.electron.converts.archive}
  />
);

export default Archive;
