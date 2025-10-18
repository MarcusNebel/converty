import { useEffect, useState } from "react";
import type { FC } from "react";
import "../styles/IntroScreen.css";

// Props typisieren
interface IntroScreenProps {
  onFinish: () => void;
}

const IntroScreen: FC<IntroScreenProps> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Nach 3 Sekunden ausblenden und Setup starten
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 1000); // Warte auf FadeOut-Animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`intro-screen ${fadeOut ? "fade-out" : ""}`}>
      <div className={`intro-text ${fadeOut ? "fade-out" : ""}`}>
        Willkommen bei <br />
        <span className="intro-main">Converty</span>
      </div>
    </div>
  );
};

export default IntroScreen;
