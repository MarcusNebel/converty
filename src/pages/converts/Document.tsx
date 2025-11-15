import { FaFileAlt } from "react-icons/fa";
import ConvertPage from "./ConvertPage";
import type { NotificationItem } from "../../components/Sidebar";

const formats = [
  { value: "pdf", label: "PDF (.pdf)" },
  { value: "odt", label: "OpenDocument (.odt)" },
  { value: "rtf", label: "Rich Text (.rtf)" },
  { value: "txt", label: "Text (.txt)" },
  { value: "html", label: "HTML (.html)" }
];

interface DocumentProps {
  isConverting: boolean;
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification?: (note: NotificationItem) => void;
}

const Document: React.FC<DocumentProps> = ({ isConverting, setIsConverting }) => (
  <ConvertPage
    icon={FaFileAlt}
    type="document"
    formats={formats}
    electronHandler={window.electron.converts.document}
    isConverting={isConverting}
    setIsConverting={setIsConverting}
  />
);

export default Document;
