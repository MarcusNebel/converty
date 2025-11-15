import { FaArchive } from "react-icons/fa";
import ConvertPage from "./ConvertPage";
import type { NotificationItem } from "../../components/Sidebar";

const formats = [
  { value: "7z", label: "7-Zip (.7z)" },
  { value: "bz2", label: "BZIP2 (.tar.bz2)" },
  { value: "gz", label: "GZIP (.tar.gz)" },
  { value: "tar", label: "TAR (.tar)" },
  { value: "xz", label: "XZ (.tar.xz)" },
  { value: "zip", label: "ZIP (.zip)" },
];

interface ArchiveProps {
  isConverting: boolean;
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification?: (note: NotificationItem) => void;
}

const Archive: React.FC<ArchiveProps> = ({ isConverting, setIsConverting }) => (
  <ConvertPage
    icon={FaArchive}
    type="archive"
    formats={formats}
    electronHandler={window.electron.converts.archive}
    isConverting={isConverting}
    setIsConverting={setIsConverting}
  />
);

export default Archive;
