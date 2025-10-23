import { FaVideo } from "react-icons/fa";
import ConvertPage from "./ConvertPage";

const formats = [
  { value: "mp3", label: "MP3 (.mp3)" },
  { value: "wav", label: "WAV (.wav)" },
  { value: "aac", label: "AAC (.aac, .m4a)" },
  { value: "flac", label: "FLAC (.flac)" },
  { value: "ogg", label: "OGG (.ogg)" },
  { value: "aiff", label: "AIFF (.aiff, .aif)" },
  { value: "ac3", label: "AC3 (.ac3)" },
  { value: "opus", label: "Opus (.opus)" },
  { value: "amr", label: "AMR (.amr)" },
  { value: "alac", label: "ALAC (.alac)" },
  { value: "mp4", label: "MP4 (.mp4)" },
  { value: "avi", label: "AVI (.avi)" },
  { value: "mkv", label: "MKV (.mkv)" },
  { value: "mov", label: "MOV (.mov)" },
  { value: "wmv", label: "WMV (.wmv)" },
  { value: "flv", label: "FLV (.flv)" },
  { value: "webm", label: "WEBM (.webm)" },
];

const Media = () => (
  <ConvertPage
    icon={FaVideo}
    type="media"
    formats={formats}
    electronHandler={window.electron.converts.media}
  />
);

export default Media;
