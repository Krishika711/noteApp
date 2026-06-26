import "./MoodPicker.css";

const moods = [
  { key: "sunny", emoji: "☀️", label: "Sunny", desc: "Bright & optimistic" },
  { key: "cloudy", emoji: "☁️", label: "Cloudy", desc: "A little uncertain" },
  { key: "rainy", emoji: "🌧️", label: "Rainy", desc: "Quiet & reflective" },
  { key: "stormy", emoji: "⛈️", label: "Stormy", desc: "Overwhelmed" },
  { key: "foggy", emoji: "🌫️", label: "Foggy", desc: "Lost & unclear" },
];

export default function MoodPicker({ theme, mood, setMood }) {
  return (
    <div className="mood-picker">
      <p className="mood-question">What's the mood today?</p>
      <p className="mood-sub" style={{ color: theme.accent + "99" }}>
        Select how you're feeling right now
      </p>

      <div className="mood-grid">
        {moods.map((m) => (
          <button
            key={m.key}
            className={`mood-card ${mood === m.key ? "selected" : ""}`}
            style={{
              borderColor: mood === m.key ? theme.accent : theme.accent + "30",
              background: mood === m.key ? theme.accent + "20" : "rgba(255,255,255,0.03)",
              boxShadow: mood === m.key ? `0 0 20px ${theme.accent}40` : "none",
            }}
            onClick={() => setMood(mood === m.key ? null : m.key)}
          >
            <span className="mood-emoji">{m.emoji}</span>
            <span className="mood-label" style={{ color: mood === m.key ? theme.accent : "#ccc" }}>
              {m.label}
            </span>
            <span className="mood-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      {mood && (
        <p className="mood-feedback" style={{ color: theme.accent }}>
          Noted. We're tuning in. 
        </p>
      )}
    </div>
  );
}
