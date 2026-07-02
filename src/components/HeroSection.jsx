import { useState } from "react";
import MoodPicker from "./MoodPicker";
import "./HeroSection.css";

export default function HeroSection({ theme, mood, setMood, moodThemes, setAuthModal, onGuest }) {
  const [signInExpanded, setSignInExpanded] = useState(false);

  return (
    <section className="hero">
      {/* LEFT */}
      <div className="hero-left">
        <div className="status-badge">
          <span className="status-dot" style={{ background: theme.accent }} />
          SYSTEM ACTIVE — MONITORING NOW
        </div>

        <h1 className="hero-title">
          <span className="title-white">Know the Crisis</span>
          <span className="title-gold" style={{ color: theme.accent }}>Before It Knows You.</span>
        </h1>

        <div className="auth-actions">
          {/* Continue as Guest */}
          <button
            className="auth-btn guest"
            style={{ borderColor: theme.accent + "55", color: "#aaa" }}
            onClick={onGuest}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Continue as Guest
          </button>

          {/* Sign In (expandable) */}
          <div className="auth-btn-group">
            <button
              className={`auth-btn signin ${signInExpanded ? "active" : ""}`}
              style={{
                borderColor: theme.accent,
                color: theme.accent,
                background: signInExpanded ? theme.accent + "15" : "transparent",
              }}
              onClick={() => setSignInExpanded(!signInExpanded)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign In
              <svg className={`chevron ${signInExpanded ? "open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"/>
              </svg>
            </button>

            {signInExpanded && (
              <div className="signin-dropdown">
                <button className="social-btn google" onClick={() => setAuthModal("signin")}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <button className="social-btn apple" onClick={() => setAuthModal("signin")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Continue with Apple ID
                </button>
              </div>
            )}
          </div>

          {/* Create Account */}
          <button
            className="auth-btn create"
            style={{ background: theme.accent, color: "#0a0a0a" }}
            onClick={() => setAuthModal("create")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Create Account
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hero-right">
        <MoodPicker theme={theme} mood={mood} setMood={setMood} moodThemes={moodThemes} />
      </div>
    </section>
  );
}
