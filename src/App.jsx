import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function App() {
  const [msg, setMsg] = useState("");

  const callRust = async () => {
    try {
      const result = await invoke("convert_video", {
        input: "video1.mp4",
        output: "video2.mp4",
      });
      console.log("Rust result:", result);
      setMsg(result);
    } catch (e) {
      console.error("Fehler beim Aufruf:", e);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "sans-serif" }}>
      <h1>Converty</h1>
      <button onClick={callRust}>Video konvertieren</button>
      <p>{msg ? msg : "Noch keine Antwort..."}</p>
    </div>
  );
}
