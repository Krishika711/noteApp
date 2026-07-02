import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import AuthModal from "./components/AuthModal";
import ChatPage from "./pages/ChatPage";
import "./App.css";

export const moodThemes = {
  sunny: {
    bg: "#0a0800",
    bgGradient: "radial-gradient(ellipse at 20% 50%, #2a1800 0%, #0a0800 60%)",
    accent: "#F5A623", accentSoft: "#FFD580", glow: "rgba(245,166,35,0.15)",
    overlay: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3CradialGradient id='sun' cx='75%25' cy='30%25' r='40%25'%3E%3Cstop offset='0%25' stop-color='%23F5A623' stop-opacity='0.18'/%3E%3Cstop offset='100%25' stop-color='%23F5A623' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23sun)'/%3E%3C/svg%3E")`,
    name: "Sunny", emoji: "☀️",
  },
  rainy: {
    bg: "#02080f",
    bgGradient: "radial-gradient(ellipse at 50% 0%, #051525 0%, #02080f 70%)",
    accent: "#38BDF8", accentSoft: "#7DD3FC", glow: "rgba(56,189,248,0.12)",
    overlay: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3ClinearGradient id='rain' x1='0%25' y1='0%25' x2='5%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2338BDF8' stop-opacity='0.06'/%3E%3Cstop offset='100%25' stop-color='%2338BDF8' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23rain)'/%3E%3C/svg%3E")`,
    name: "Rainy", emoji: "🌧️",
  },
  stormy: {
    bg: "#05020f",
    bgGradient: "radial-gradient(ellipse at 80% 20%, #150830 0%, #05020f 70%)",
    accent: "#A78BFA", accentSoft: "#C4B5FD", glow: "rgba(167,139,250,0.15)",
    overlay: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3CradialGradient id='storm' cx='60%25' cy='20%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23A78BFA' stop-opacity='0.12'/%3E%3Cstop offset='100%25' stop-color='%23A78BFA' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23storm)'/%3E%3C/svg%3E")`,
    name: "Stormy", emoji: "⛈️",
  },
  cloudy: {
    bg: "#080808",
    bgGradient: "radial-gradient(ellipse at 30% 40%, #141414 0%, #080808 70%)",
    accent: "#94A3B8", accentSoft: "#CBD5E1", glow: "rgba(148,163,184,0.1)",
    overlay: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3CradialGradient id='cloud' cx='50%25' cy='30%25' r='60%25'%3E%3Cstop offset='0%25' stop-color='%2394A3B8' stop-opacity='0.08'/%3E%3Cstop offset='100%25' stop-color='%2394A3B8' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23cloud)'/%3E%3C/svg%3E")`,
    name: "Cloudy", emoji: "☁️",
  },
  foggy: {
    bg: "#030a03",
    bgGradient: "radial-gradient(ellipse at 50% 60%, #0a150a 0%, #030a03 70%)",
    accent: "#6EE7B7", accentSoft: "#A7F3D0", glow: "rgba(110,231,183,0.12)",
    overlay: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3ClinearGradient id='fog' x1='0%25' y1='40%25' x2='100%25' y2='60%25'%3E%3Cstop offset='0%25' stop-color='%236EE7B7' stop-opacity='0.08'/%3E%3Cstop offset='50%25' stop-color='%236EE7B7' stop-opacity='0.04'/%3E%3Cstop offset='100%25' stop-color='%236EE7B7' stop-opacity='0.08'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23fog)'/%3E%3C/svg%3E")`,
    name: "Foggy", emoji: "🌫️",
  },
};

const defaultTheme = {
  bg: "#080600",
  bgGradient: "radial-gradient(ellipse at 30% 50%, #1a1200 0%, #080600 70%)",
  accent: "#C9A84C", accentSoft: "#FFE082", glow: "rgba(201,168,76,0.1)", overlay: "",
};

function LandingPage() {
  const [mood, setMood] = useState(null);
  const [authModal, setAuthModal] = useState(null);
  const [theme, setTheme] = useState(defaultTheme);
  const navigate = useNavigate();

  useEffect(() => {
    setTheme(mood && moodThemes[mood] ? moodThemes[mood] : defaultTheme);
  }, [mood]);

  // Guest → go straight to chat
  const handleGuest = () => navigate("/chat");

  return (
    <div className="app" style={{ background: theme.bgGradient, backgroundColor: theme.bg }}>
      {theme.overlay && <div className="theme-overlay" style={{ backgroundImage: theme.overlay }} />}
      <div className="glow-orb" style={{ background: theme.glow }} />

      <nav className="nav">
        <div className="nav-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 3C14 3 7 8 7 14C7 18.4 10.1 22 14 22C17.9 22 21 18.4 21 14C21 8 14 3 14 3Z" stroke={theme.accent} strokeWidth="1.5" fill="none"/>
            <path d="M14 22V25M10 25H18" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="3" fill={theme.accent} opacity="0.4"/>
          </svg>
          <span style={{ color: theme.accent }}>MindBridge+</span>
        </div>
        <div className="nav-actions">
          <button className="nav-btn-ghost" onClick={() => setAuthModal("signin")}>Sign In</button>
          <button className="nav-btn-primary" style={{ background: theme.accent, color: "#000" }} onClick={() => setAuthModal("signin")}>Get Access</button>
        </div>
      </nav>

      <HeroSection theme={theme} mood={mood} setMood={setMood} moodThemes={moodThemes} setAuthModal={setAuthModal} onGuest={handleGuest} />
      <AboutSection theme={theme} />

      {authModal && (
        <AuthModal type={authModal} theme={theme} onClose={() => setAuthModal(null)} switchTo={setAuthModal} onSuccess={() => navigate("/chat")} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
