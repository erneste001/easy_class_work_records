// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAs34Z8fjnNZpDQKZLWCN03_Ziso12x0dk",
  authDomain: "easy-class-records-syste-20a09.firebaseapp.com",
  projectId: "easy-class-records-syste-20a09",
  storageBucket: "easy-class-records-syste-20a09.firebasestorage.app",
  messagingSenderId: "89734776763",
  appId: "1:89734776763:web:fe89018840b7e39cd7269e",
  measurementId: "G-PVQCX75CJR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// FIX: auth + googleProvider were never created/exported, even though
// GoogleAuthButton.jsx does `import { auth, googleProvider } from "./firebase"`.
// Without these, every "Continue with Google" click would throw immediately.
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Always show the account chooser instead of silently reusing the last
// signed-in Google account — important since one browser may be used by
// several students/teachers on a shared school computer.
googleProvider.setCustomParameters({ prompt: "select_account" });

// FIX: getAnalytics() throws in environments where it isn't supported
// (SSR, some browsers with tracking blockers, etc.) and was crashing the
// whole module on import. isSupported() guards it and analytics becomes
// a no-op instead of taking the app down.
export let analytics = null;
isSupported()
  .then((supported) => {
    if (supported) analytics = getAnalytics(app);
  })
  .catch(() => {
    // analytics isn't critical to the app — fail silently
  });

export default app;