import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { AlertCircle } from "lucide-react";
import { auth, googleProvider } from "./firebase";

// Matches the interface RegistrationForm.jsx already expects:
//   <GoogleAuthButton onSignedIn={(account) => {}} label="..." />
//   account = { name, email, googleSub, idToken }
//
// googleSub = Firebase's stable per-user uid. idToken is included so the
// backend can verify the sign-in server-side instead of trusting whatever
// the client sends (see the SECURITY NOTE in home.js / index.js).
export default function GoogleAuthButton({ onSignedIn, label = "Continue with Google" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      onSignedIn({
        name: user.displayName || "",
        email: user.email,
        googleSub: user.uid,
        idToken,
      });
    } catch (err) {
      console.error("Google sign-in failed:", err);
      if (err.code === "auth/popup-closed-by-user") {
        // user just closed the popup — not a real error, stay quiet
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <span>Signing in…</span>
        ) : (
          <>
            <GoogleG />
            <span>{label}</span>
          </>
        )}
      </button>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-orange-600 mt-1.5">
          <AlertCircle size={13} strokeWidth={2.5} /> {error}
        </p>
      )}
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}