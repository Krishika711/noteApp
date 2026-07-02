import { useState } from "react";
import "./AuthModal.css";

export default function AuthModal({ type, theme, onClose, switchTo, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const isCreate = type === "create";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}
        style={{ borderColor: theme.accent + "40" }}>
        <button className="modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="modal-logo">
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <path d="M14 3C14 3 7 8 7 14C7 18.4 10.1 22 14 22C17.9 22 21 18.4 21 14C21 8 14 3 14 3Z" stroke={theme.accent} strokeWidth="1.5" fill="none"/>
            <path d="M14 22V25M10 25H18" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="3" fill={theme.accent} opacity="0.3"/>
          </svg>
        </div>

        <h2 className="modal-title">{isCreate ? "Create your account" : "Welcome back"}</h2>
        <p className="modal-sub">
          {isCreate ? "Start your early awareness journey." : "Sign in to MindBridge+"}
        </p>

        {/* Social sign-in */}
        <div className="social-group">
          <button className="social-btn google full">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button className="social-btn apple full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple ID
          </button>
        </div>

        <div className="modal-divider">
          <span>or continue with email</span>
        </div>

        <div className="modal-form">
          {isCreate && (
            <input
              className="modal-input"
              style={{ borderColor: theme.accent + "40" }}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            className="modal-input"
            style={{ borderColor: theme.accent + "40" }}
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="modal-input"
            style={{ borderColor: theme.accent + "40" }}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="modal-submit" onClick={onSuccess}
            style={{ background: theme.accent, color: "#0a0a0a" }}
          >
            {isCreate ? "Create Account" : "Sign In"}
          </button>
        </div>

        <p className="modal-switch">
          {isCreate ? "Already have an account? " : "New here? "}
          <button
            onClick={() => switchTo(isCreate ? "signin" : "create")}
            style={{ color: theme.accent }}
          >
            {isCreate ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>
    </div>
  );
}
