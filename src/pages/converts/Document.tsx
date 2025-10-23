import { FaFileWord } from "react-icons/fa";
import ConvertPage from "./ConvertPage";

const formats = [
  { value: "pdf", label: "PDF (.pdf)" },
  { value: "odt", label: "OpenDocument (.odt)" },
  { value: "rtf", label: "Rich Text (.rtf)" },
  { value: "txt", label: "Text (.txt)" },
  { value: "html", label: "HTML (.html)" }
];


const Document = () => (
  <ConvertPage
    icon={FaFileWord}
    type="document"
    formats={formats}
    electronHandler={window.electron.converts.document}
  />
);

export default Document;
