// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import '../styles/HomeScreen.css';

/**
 * מסך התחברות - עיצוב זהה לעמוד דיווח על נחיל דבורים
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e) => {
    e.preventDefault();
    alert("Demo mode: אין התחברות אמיתית");
  };

  return (
    <div className="home-page">
      <div className="report-page">
        <div className="report-card">
          <h2 className="form-title">התחברות</h2>

          <form onSubmit={submit} className="report-form">
            <input
              type="email"
              placeholder="אימייל *"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="סיסמה *"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="submit-button">
              התחבר
            </button>
          </form>
        </div>

        <footer className="footer">
          © 2025 מגן דבורים אדום. כל הזכויות שמורות.
        </footer>
      </div>
    </div>
  );
}