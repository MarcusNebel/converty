import { useEffect, useState } from "react";
import type { FC } from "react";
import "../../styles/setup/IntroScreen.css";
import { useTranslation } from "react-i18next";

// Props typisieren
interface IntroScreenProps {
  onFinish: () => void;
}

const IntroScreen: FC<IntroScreenProps> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const { t } = useTranslation();

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
        <p className="welcome-to-text">{t("setup.intro.welcome_text")}</p>
        <span className="intro-main">{t("setup.intro.app_name")}</span>
      </div>
    </div>
  );
};

export default IntroScreen;
