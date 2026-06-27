import { useState } from "react";
import "./MoodPicker.css";

const moods = [
  { key: "sunny",  emoji: "☀️",  label: "Sunny",  desc: "Bright & clear",      bg: "#1a0e00" },
  { key: "cloudy", emoji: "☁️",  label: "Cloudy", desc: "A bit uncertain",     bg: "#0d0d0d" },
  { key: "rainy",  emoji: "🌧️", label: "Rainy",  desc: "Quiet & low",         bg: "#02080f" },
  { key: "stormy", emoji: "⛈️", label: "Stormy", desc: "Overwhelmed",          bg: "#0a0318" },
  { key: "foggy",  emoji: "🌫️", label: "Foggy",  desc: "Lost & unclear",      bg: "#030a03" },
];

const accentMap = {
  sunny:  "#F5A623",
  cloudy: "#94A3B8",
  rainy:  "#38BDF8",
  stormy: "#A78BFA",
  foggy:  "#6EE7B7",
  default:"#C9A84C",
};

export default function MoodPicker({ theme, mood, setMood }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="mood-picker">
      <p className="mood-question">What's the mood today?</p>
      <p className="mood-sub" style={{ color: theme.accent + "88" }}>
        Pick what you're feeling — the page will respond
      </p>

      <div className="mood-grid">
        {moods.map((m) => {
          const isSelected = mood === m.key;
          const isHovered = hovered === m.key;
          const acc = accentMap[m.key];

          return (
            <button
              key={m.key}
              className={`mood-card ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
              style={{
                borderColor: isSelected ? acc : isHovered ? acc + "60" : "rgba(255,255,255,0.08)",
                background: isSelected
                  ? `radial-gradient(ellipse at center, ${acc}22 0%, ${acc}08 100%)`
                  : isHovered
                  ? `rgba(255,255,255,0.04)`
                  : "rgba(255,255,255,0.02)",
                boxShadow: isSelected
                  ? `0 0 24px ${acc}40, inset 0 0 20px ${acc}10`
                  : isHovered
                  ? `0 0 12px ${acc}20`
                  : "none",
                transform: isSelected ? "translateY(-4px) scale(1.03)" : isHovered ? "translateY(-2px)" : "none",
              }}
              onClick={() => setMood(mood === m.key ? null : m.key)}
              onMouseEnter={() => setHovered(m.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="mood-emoji-wrap" style={{
                background: isSelected ? acc + "20" : "transparent",
                border: `1px solid ${isSelected ? acc + "50" : "transparent"}`,
              }}>
                <span className="mood-emoji">{m.emoji}</span>
              </div>
              <span className="mood-label" style={{ color: isSelected ? acc : isHovered ? "#ddd" : "#888" }}>
                {m.label}
              </span>
              <span className="mood-desc" style={{ color: isSelected ? acc + "bb" : "#444" }}>{m.desc}</span>
              {isSelected && (
                <span className="mood-selected-dot" style={{ background: acc }} />
              )}
            </button>
          );
        })}
      </div>

      {mood && (
        <div className="mood-feedback" style={{ borderColor: theme.accent + "40", background: theme.accent + "0a" }}>
          <span className="mood-feedback-dot" style={{ background: theme.accent }} />
          <p style={{ color: theme.accent }}>
            {mood === "sunny" && "Good energy. Let's make it count."}
            {mood === "cloudy" && "Uncertainty is okay. You're still here."}
            {mood === "rainy" && "Rest is valid. Take it slow today."}
            {mood === "stormy" && "You're carrying a lot. We're listening."}
            {mood === "foggy" && "It's okay not to have clarity right now."}
          </p>
        </div>
      )}
    </div>
  );
}
