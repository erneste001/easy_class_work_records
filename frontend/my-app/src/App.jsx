import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Welcoming from "./Home";
import Teacher from "./Teacher";
import Students from "./Student";
import RegistrationForm from "./A";
// FIX: imported as lowercase `school` before, and used as `element={school}`
// (the raw component function, not JSX) — that renders nothing / throws.
// Renamed to a proper component name and used as `<SchoolAdmin />` below.
import SchoolAdmin from "./School_Admin";
import SuperAdmin from "./SuperAdmin";

// RegistrationForm (A.jsx) is presentation-only — it takes onBackHome/onLogin
// callbacks instead of talking to react-router itself, so this tiny wrapper
// is what actually wires it into navigation.
function RegisterRoute() {
  const navigate = useNavigate();
  return (
    <RegistrationForm
      onBackHome={() => navigate("/home")}
      onLogin={(e) => {
        e.preventDefault();
        navigate("/home#register");
      }}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcoming />} />
        <Route path="/home" element={<Welcoming />} />

        {/* These are the paths Home.jsx's handleNavigate(`/dashboard/${role}`)
            actually sends people to after sign-in — role is one of
            'student' | 'teacher' | 'schoolAdmin' | 'superAdmin'.
            FIX: /dashboard/schoolAdmin and /dashboard/superAdmin didn't
            exist before, so admin and super-admin logins fell through to
            the catch-all route instead of reaching their dashboard. */}
        <Route path="/dashboard/student" element={<Students />} />
        <Route path="/dashboard/teacher" element={<Teacher />} />
        <Route path="/dashboard/schoolAdmin" element={<SchoolAdmin />} />
        <Route path="/dashboard/superAdmin" element={<SuperAdmin />} />

        {/* Kept as convenience aliases so direct links still work. */}
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/students" element={<Students />} />
        <Route path="/school" element={<SchoolAdmin />} />

        <Route path="/register" element={<RegisterRoute />} />
        <Route path="*" element={<Welcoming />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;