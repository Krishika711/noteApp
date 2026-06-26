import { useState, useEffect } from "react";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import AuthModal from "./components/AuthModal";
import "./App.css";

const moodThemes = {
  sunny: {
    bg: "linear-gradient(135deg, #1a1200 0%, #2d1f00 40%, #1a1200 100%)",
    accent: "#FFD700",
    accentSoft: "#FFF176",
    particleColor: "#FFD700",
    overlay: "rgba(255, 200, 0, 0.07)",
    name: "Sunny",
    emoji: "☀️",
  },
  rainy: {
    bg: "linear-gradient(135deg, #050d1a 0%, #0a1628 40%, #050d1a 100%)",
    accent: "#4FC3F7",
    accentSoft: "#B3E5FC",
    particleColor: "#4FC3F7",
    overlay: "rgba(79, 195, 247, 0.06)",
    name: "Rainy",
    emoji: "🌧️",
  },
  stormy: {
    bg: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 40%, #0a0a0a 100%)",
    accent: "#CE93D8",
    accentSoft: "#E1BEE7",
    particleColor: "#CE93D8",
    overlay: "rgba(206, 147, 216, 0.06)",
    name: "Stormy",
    emoji: "⛈️",
  },
  cloudy: {
    bg: "linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 40%, #0d0d0d 100%)",
    accent: "#B0BEC5",
    accentSoft: "#ECEFF1",
    particleColor: "#B0BEC5",
    overlay: "rgba(176, 190, 197, 0.05)",
    name: "Cloudy",
    emoji: "☁️",
  },
  foggy: {
    bg: "linear-gradient(135deg, #0d1a0d 0%, #1a2e1a 40%, #0d1a0d 100%)",
    accent: "#A5D6A7",
    accentSoft: "#C8E6C9",
    particleColor: "#A5D6A7",
    overlay: "rgba(165, 214, 167, 0.05)",
    name: "Foggy",
    emoji: "🌫️",
  },
};

export default function App() {
  const [mood, setMood] = useState(null);
  const [authModal, setAuthModal] = useState(null); // null | 'signin' | 'create'
  const [theme, setTheme] = useState({
    bg: "linear-gradient(135deg, #0a0a0a 0%, #1a1200 40%, #0a0a0a 100%)",
    accent: "#C9A84C",
    accentSoft: "#FFE082",
    particleColor: "#C9A84C",
    overlay: "rgba(201, 168, 76, 0.05)",
    name: null,
    emoji: null,
  });

  useEffect(() => {
    if (mood && moodThemes[mood]) {
      setTheme(moodThemes[mood]);
    }
  }, [mood]);

  return (
    <div className="app" style={{ background: theme.bg, transition: "background 1.2s ease" }}>
      <div className="overlay" style={{ background: theme.overlay, transition: "background 1.2s ease" }} />

      <nav className="nav">
        <div className="nav-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 3C14 3 7 8 7 14C7 18.4 10.1 22 14 22C17.9 22 21 18.4 21 14C21 8 14 3 14 3Z" stroke={theme.accent} strokeWidth="1.5" fill="none"/>
            <path d="M14 22V25M10 25H18" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="3" fill={theme.accent} opacity="0.3"/>
            <path d="M9 11C9 11 8 13 9 15M19 11C19 11 20 13 19 15" stroke={theme.accent} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ color: theme.accent }}>MindBridge+</span>
        </div>
        <div className="nav-actions">
          <button className="nav-btn-ghost" onClick={() => setAuthModal("signin")}>Sign In</button>
          <button className="nav-btn-primary" style={{ background: theme.accent, color: "#0a0a0a" }} onClick={() => setAuthModal("signin")}>Get Access</button>
        </div>
      </nav>

      <HeroSection theme={theme} mood={mood} setMood={setMood} moodThemes={moodThemes} setAuthModal={setAuthModal} />
      <AboutSection theme={theme} />

      {authModal && (
        <AuthModal type={authModal} theme={theme} onClose={() => setAuthModal(null)} switchTo={setAuthModal} />
      )}
    </div>
  );
}
