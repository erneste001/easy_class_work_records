import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from './assets/logo.jpg';
import GoogleAuthButton from './GoogleAuthButton.jsx';
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  CalendarCheck,
  FileText,
  Wallet,
  ShieldCheck,
  School,
  LayoutDashboard,
  Smartphone,
  Landmark,
  UserCircle2,
  Building2,
  ScrollText,
  HeartHandshake,
  Star,
  Trophy,
  Handshake,
  Mail,
  Clock3,
} from "lucide-react";

// Backend that issues and checks the school-admin email confirmation code,
// and now also the teacher/student Google sign-up/sign-in routes.
const API_BASE = "http://localhost:5000";

// localStorage key the admin session token is kept under, so a page
// refresh on /dashboard/schoolAdmin doesn't lose the sign-in.
const ADMIN_SESSION_KEY = "ecw_admin_session";

// localStorage key the super-admin session token is kept under.
const SUPERADMIN_SESSION_KEY = "ecw_superadmin_session";

// localStorage key the teacher/student session token is kept under.
// TeacherDashboard.jsx reads this same key.
const USER_SESSION_KEY = "ecw_user_session";

// ------------------------------------------------------------------
// SUPER ADMIN — Google-gated sign-in.
//
// There is no email/password form for super admin anymore. Instead:
//   1. The person signs in with Google, same widget as student/teacher.
//   2. We check the Google account's email against this allowlist. Only an
//      exact match is allowed through — everyone else is rejected client-side
//      with no further requests made.
//   3. If it matches, we transparently call the existing backend endpoint
//      POST /api/auth/super-admin/login using the platform's known super
//      admin credentials (below) so the backend still issues a real session
//      token that /api/superadmin/* routes will accept. The person never
//      sees or types a password.
//
// NOTE: this keeps things working against the CURRENT backend (easy.js),
// which still expects an email+password pair on that route and only knows
// nothing about Google. The real fix is to update the backend to verify a
// Google ID token directly and drop the password check entirely — until
// that's done, BACKEND_SUPERADMIN_EMAIL / BACKEND_SUPERADMIN_PASSWORD below
// must always match SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD (or their
// defaults) on the server, or this silent login call will fail.
// ------------------------------------------------------------------
const AUTHORIZED_SUPERADMIN_EMAIL = "honorgenius001@gmail.com";
const BACKEND_SUPERADMIN_EMAIL = "admin@easyclass.rw";
const BACKEND_SUPERADMIN_PASSWORD = "EasyClass@2026";

// Steps shown while we "connect" — gives the loading circle a real internet-connection feel
const LOADING_STEPS = [
  'loading...',
  'Verifying connection...',
  'Preparing registration form...',
  'Almost there...',
];

// Placeholder school code shown in input hints before schools are picked.
const DEFAULT_SCHOOL_CODE = '1234';

// Icons cycled through in the featured partners ad carousel (replaces the old image slideshow).
const AD_CIRCLE_ICONS = [Star, Trophy, Handshake];

// Every subject a teacher can pick from when choosing what they teach —
// shared between the teacher's own "add class" step below AND the school
// admin's approval modal, so the two lists never drift apart. A teacher (or
// admin) can always add something custom too if it's missing here.
const SUBJECT_OPTIONS = [
  'Mathematics', 'English', 'Kinyarwanda', 'French', 'Physics', 'Chemistry',
  'Biology', 'Geography', 'History', 'Economics', 'Entrepreneurship',
  'Computer Science / ICT', 'General Studies',
  'Religion & Values Education', 'Physical Education', 'Fine Art',
  'Literature in English', 'Kiswahili',
];

// Every sign-in role the system supports, each with its own system icon (lucide-react,
// no image import needed) and its own rules: who can self-register, and how they
// authenticate.
//   - student / teacher -> Google sign-in only. We never collect or store a
//     password for these roles. Continuing with Google both PROVES the email
//     (that's the whole point — no typed code, no chance of a typo) and, for
//     registration, submits the person to POST /api/users/register-google,
//     which creates them "pending" until the school admin approves them.
//     For teachers specifically, sign-in doesn't stop there: see
//     handleLoginSubmit / startTeacherClassStep below — an approved teacher
//     also has to choose (or confirm) which classes and subjects they teach
//     before landing on the dashboard, unless the school admin already
//     picked some for them at approval time.
//   - schoolAdmin -> email + school code, then an emailed confirmation code.
//     The backend refuses to even send that code until a super admin has
//     approved the school (see home.js) — so nothing here can bypass that gate.
//   - superAdmin -> Google sign-in only, gated by AUTHORIZED_SUPERADMIN_EMAIL
//     above. No password field is shown anywhere in the app for this role.
const ROLE_CONFIG = {
  student: {
    label: 'Student',
    icon: BookOpen,
    canRegister: true,
    authField: 'google',
  },
  teacher: {
    label: 'Teacher',
    icon: GraduationCap,
    canRegister: true,
    authField: 'google',
  },
  schoolAdmin: {
    label: 'School admin',
    icon: Wallet,
    canRegister: false,
    // School admins don't get a password — they sign in with their work email
    // plus the code issued to their school, then confirm a one-time code
    // emailed to that same address before the session is created.
    authField: 'schoolCode',
  },
  superAdmin: {
    label: 'Super admin',
    icon: ShieldCheck,
    canRegister: false,
    authField: 'google',
  },
};

// Dropdown for picking a school. Renders as a checkbox list (single-select) with a "Verified" badge.
// `schools` comes from GET /api/schools/public — only schools a super admin has
// already approved ever show up here, so the "Verified" badge is always true.
function SchoolDropdown({ value, onChange, error, schools, loading }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selected = schools.find((s) => s.id === value);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between text-xs px-3 py-2.5 rounded-lg border bg-white text-left focus:outline-none ${error ? 'border-red-400' : 'border-neutral-200 focus:border-green-400'}`}
      >
        <span className={selected ? 'text-neutral-800' : 'text-neutral-400'}>
          {loading ? 'Loading schools…' : selected ? selected.name : 'Select your school'}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {schools.length === 0 && !loading && (
            <p className="px-3 py-3 text-[11px] text-neutral-400">
              No verified schools yet. Ask your school to register, then wait for it to be approved.
            </p>
          )}
          {schools.map((school) => {
            const checked = value === school.id;
            return (
              <label
                key={school.id}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-neutral-50 cursor-pointer border-b border-neutral-50 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    onChange(school.id);
                    setOpen(false);
                  }}
                  className="w-3.5 h-3.5 accent-[#178754] shrink-0"
                />
                <span className="flex-1 text-neutral-700">{school.name}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#178754] shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verified
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Shown once a Google account is attached to the registration/login form, so the
// person always sees which account they're continuing with and can switch accounts.
function GoogleAccountChip({ account, onSwitch }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-[#178754]/25 bg-[#EAF6EF] px-3 py-2.5">
      <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 ring-1 ring-[#178754]/20">
        <Mail size={14} className="text-[#178754]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-neutral-800 truncate">{account.name}</p>
        <p className="text-[10px] text-neutral-500 truncate">{account.email}</p>
      </div>
      <button type="button" onClick={onSwitch} className="text-[10px] font-bold text-[#178754] hover:underline shrink-0">
        Switch
      </button>
    </div>
  );
}

// Shared modal for login + registration, used by the student, teacher, school-admin and
// super-admin flows. Always centered, with its own system icon in the header so it's
// obvious at a glance which role you're signing in as.
function AuthModal({
  role,
  mode,
  onClose,
  onSwitchMode,
  registerForm,
  setRegisterForm,
  loginForm,
  setLoginForm,
  formError,
  authSubmitting,
  onSubmitRegister,
  onSubmitLogin,
  googleAccount,
  onGoogleSignedIn,
  onGoogleSwitch,
  schools,
  schoolsLoading,
}) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const RoleIcon = config.icon;
  const roleLabel = config.label;
  const canRegister = config.canRegister;
  const usesGoogle = config.authField === 'google';

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ecw-body bg-white w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center gap-3 px-5 sm:px-6 pt-5 pb-3 border-b border-neutral-100">
          <span className="w-11 h-11 shrink-0 rounded-full bg-[#EAF6EF] flex items-center justify-center overflow-hidden ring-1 ring-[#178754]/20">
            <RoleIcon className="w-5 h-5 text-[#178754]" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-green-700">{roleLabel} account</p>
            <h3 className="ecw-heading text-base font-extrabold text-neutral-900 mt-0.5 truncate">
              {mode === 'login' ? `Sign in as ${roleLabel.toLowerCase()}` : `Create your ${roleLabel.toLowerCase()} account`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {formError && (
            <div className="mb-4 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {formError}
            </div>
          )}

          {mode === 'login' ? (
            usesGoogle ? (
              // Student / teacher / super admin login: Google is the only credential.
              //   - student login: onSubmitLogin calls POST /api/users/login-google.
              //   - teacher login: onSubmitLogin calls the same endpoint, then — if it
              //     succeeds — the parent component takes over and walks the teacher
              //     through choosing/confirming their classes and subjects before it
              //     navigates anywhere (see startTeacherClassStep).
              //   - superAdmin: onSubmitLogin checks the Google email against the
              //     allowlist client-side, then transparently obtains a backend
              //     session token — see handleLoginSubmit.
              <form onSubmit={onSubmitLogin} className="flex flex-col gap-3">
                <p className="text-[11px] text-neutral-500 -mt-1">
                  {role === 'superAdmin'
                    ? 'Sign in with the Google account authorized for platform administration.'
                    : 'Sign in with the Google account you registered with. We only ever use it to confirm your email — no password to remember.'}
                </p>

                {googleAccount ? (
                  <GoogleAccountChip account={googleAccount} onSwitch={onGoogleSwitch} />
                ) : (
                  <GoogleAuthButton onSignedIn={onGoogleSignedIn} />
                )}

                <button
                  type="submit"
                  disabled={!googleAccount || authSubmitting}
                  className="w-full mt-1 py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authSubmitting ? 'Signing in…' : 'Continue to dashboard'}
                </button>

                {canRegister && (
                  <p className="text-center text-[11px] text-neutral-500 mt-1">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => onSwitchMode('register')} className="font-bold text-[#178754] hover:underline">
                      Register as {roleLabel.toLowerCase()}
                    </button>
                  </p>
                )}
              </form>
            ) : (
              // Only school admin reaches this branch now — email + school code,
              // then a confirmation code is emailed (handled outside this modal).
              <form onSubmit={onSubmitLogin} className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Email address</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-600 mb-1 block">School code</label>
                  <input
                    type="text"
                    required
                    value={loginForm.schoolCode}
                    onChange={(e) => setLoginForm((f) => ({ ...f, schoolCode: e.target.value }))}
                    placeholder={`Code issued to your school (e.g. ${DEFAULT_SCHOOL_CODE})`}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    No password needed. After you continue, we'll email a confirmation code to this
                    address — you'll enter it next to finish signing in. Your school also needs to
                    have been approved by our team first.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full mt-2 py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)] disabled:opacity-70 disabled:cursor-wait"
                >
                  {authSubmitting ? 'Sending confirmation code…' : 'Continue'}
                </button>

                {canRegister && (
                  <p className="text-center text-[11px] text-neutral-500 mt-1">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => onSwitchMode('register')} className="font-bold text-[#178754] hover:underline">
                      Register as {roleLabel.toLowerCase()}
                    </button>
                  </p>
                )}
              </form>
            )
          ) : usesGoogle ? (
            // Student / teacher registration: Google first — that's the ONLY
            // place the email comes from, nobody types one in — then the
            // school + school code, then submit. onSubmitRegister posts to
            // POST /api/users/register-google, which creates the account as
            // "pending" until the school admin approves it. For teachers,
            // approval may or may not attach classes/subjects (the admin
            // decides) — anything still missing gets picked by the teacher
            // themself the first time they sign back in (see below).
            <form onSubmit={onSubmitRegister} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Your Google account</label>
                {googleAccount ? (
                  <GoogleAccountChip account={googleAccount} onSwitch={onGoogleSwitch} />
                ) : (
                  <GoogleAuthButton onSignedIn={onGoogleSignedIn} label="Sign up with Google" />
                )}
                <p className="text-[10px] text-neutral-400 mt-1">
                  We only take your name and email from Google — nothing else, and no password is stored.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Full name</label>
                <input
                  type="text"
                  required
                  disabled={!googleAccount}
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Full name"
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">School</label>
                <SchoolDropdown
                  value={registerForm.school}
                  onChange={(school) => setRegisterForm((f) => ({ ...f, school }))}
                  schools={schools}
                  loading={schoolsLoading}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">School code</label>
                <input
                  type="text"
                  required
                  disabled={!googleAccount}
                  value={registerForm.schoolCode}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, schoolCode: e.target.value }))}
                  placeholder={`Given by your school (e.g. ${DEFAULT_SCHOOL_CODE})`}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={!googleAccount || authSubmitting}
                className="w-full mt-2 py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[#178754] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authSubmitting ? 'Submitting…' : 'Submit for school approval'}
              </button>

              <p className="text-center text-[11px] text-neutral-500 mt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => onSwitchMode('login')} className="font-bold text-[rgb(22,32,111)] hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={onSubmitRegister} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Full name</label>
                <input
                  type="text"
                  required
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Full name"
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Email address</label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">School</label>
                <SchoolDropdown
                  value={registerForm.school}
                  onChange={(school) => setRegisterForm((f) => ({ ...f, school }))}
                  schools={schools}
                  loading={schoolsLoading}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">School code</label>
                <input
                  type="text"
                  required
                  value={registerForm.schoolCode}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, schoolCode: e.target.value }))}
                  placeholder={`Given by your school (e.g. ${DEFAULT_SCHOOL_CODE})`}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Confirm password</label>
                <input
                  type="password"
                  required
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
                />
              </div>

              <button type="submit" className="w-full mt-2 py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[#178754]">
                Create account
              </button>

              <p className="text-center text-[11px] text-neutral-500 mt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => onSwitchMode('login')} className="font-bold text-[rgb(22,32,111)] hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Shown right after a student/teacher submits registration — their account is
// created but sits "pending" until the school admin approves it.
function PendingApprovalModal({ roleLabel, schoolName, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ecw-body bg-white w-full max-w-sm rounded-2xl shadow-2xl px-6 py-7 text-center">
        <span className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-amber-200">
          <Clock3 className="w-5 h-5 text-amber-600" />
        </span>
        <h3 className="ecw-heading text-base font-extrabold text-neutral-900 mb-1.5">Registration submitted</h3>
        <p className="text-xs text-neutral-500 leading-relaxed mb-5">
          Your {roleLabel.toLowerCase()} account is waiting for approval from {schoolName || 'your school'}'s
          admin. You'll be able to sign in with the same Google account as soon as it's approved.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity bg-[rgb(22,32,111)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

// Second-factor modal for school admins: shown after email + school code are accepted.
// The session is only ever created once this backend call comes back positive — that's
// the only thing allowed to complete the sign-in, exactly like the registration flow's
// email verification.
function AdminOtpModal({ email, otpValue, setOtpValue, verifying, sending, error, onSubmit, onResend, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ecw-body bg-white w-full max-w-sm rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 px-5 sm:px-6 pt-5 pb-3 border-b border-neutral-100">
          <span className="w-11 h-11 shrink-0 rounded-full bg-[#EAF6EF] flex items-center justify-center ring-1 ring-[#178754]/20">
            <ShieldCheck className="w-5 h-5 text-[#178754]" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-green-700">School admin login</p>
            <h3 className="ecw-heading text-base font-extrabold text-neutral-900 mt-0.5">Enter confirmation code</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5">
          <p className="text-xs text-neutral-500 mb-4">
            We sent a 6-digit code to <span className="font-semibold text-neutral-800 break-all">{email}</span>.
            Enter it below to finish signing in.
          </p>

          {error && (
            <div className="mb-4 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Confirmation code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className="w-full text-center tracking-[0.4em] font-bold text-sm px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
              />
            </div>

            <button
              type="submit"
              disabled={verifying || otpValue.length !== 6}
              className="w-full mt-2 py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[#178754] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying…' : 'Verify & sign in'}
            </button>

            <button
              type="button"
              onClick={onResend}
              disabled={sending}
              className="w-full text-[11px] font-semibold text-[rgb(22,32,111)] py-1 disabled:opacity-50"
            >
              {sending ? 'Resending…' : 'Resend code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Teacher classes/subjects step — shown right after a teacher's Google
// sign-in succeeds, BEFORE anything navigates to the dashboard. Teachers
// now pick MULTIPLE classes and MULTIPLE subjects at once via checkboxes
// (including "select all"), instead of one class/subject/period at a time:
//   - mode 'pick': the teacher already has one or more assignments — list
//     the classes they're already linked to so they can jump straight in,
//     or add more.
//   - mode 'add': the teacher has none yet (or chose to add more) — tick
//     any number of classes from their own school (GET /api/teacher/classes)
//     and any number of subjects, which POSTs every class × subject
//     combination in one call to /api/teacher/assignments.
// ------------------------------------------------------------------
function TeacherClassStepModal({
  step, setStep, onPickExisting, onSwitchToAdd, onBackToPick, onSubmitAdd, onClose,
  onToggleClass, onToggleAllClasses, onToggleSubject, onToggleAllSubjects, onAddCustomSubject,
}) {
  const { mode, assignments, classes, classesLoading, form, submitting, error } = step;
  const allSubjectChoices = [...new Set([...SUBJECT_OPTIONS, ...form.subjects])];
  const allClassesSelected = classes.length > 0 && classes.every((c) => form.classIds.has(c.id));
  const allSubjectsSelected = allSubjectChoices.length > 0 && allSubjectChoices.every((s) => form.subjects.has(s));
  const comboCount = form.classIds.size * form.subjects.size;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ecw-body bg-white w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center gap-3 px-5 sm:px-6 pt-5 pb-3 border-b border-neutral-100">
          <span className="w-11 h-11 shrink-0 rounded-full bg-[#EAF6EF] flex items-center justify-center ring-1 ring-[#178754]/20">
            <GraduationCap className="w-5 h-5 text-[#178754]" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-green-700">Teacher sign-in</p>
            <h3 className="ecw-heading text-base font-extrabold text-neutral-900 mt-0.5 truncate">
              {mode === 'pick' ? 'Your classes' : 'Which classes & subjects?'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {error && (
            <div className="mb-4 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              {error}
            </div>
          )}

          {mode === 'pick' ? (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] text-neutral-500 -mt-1">
                These are the classes and subjects your school has you down for. Continue to your
                dashboard, or add more if something's missing.
              </p>
              <div className="flex flex-col gap-2">
                {assignments.map((a) => (
                  <div key={a.id} className="w-full flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3.5 py-2.5">
                    <span>
                      <span className="block text-xs font-bold text-neutral-800">{a.className}</span>
                      <span className="block text-[11px] text-neutral-500">{a.subject}</span>
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onPickExisting(assignments)}
                className="w-full mt-1 py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)]"
              >
                Continue to dashboard
              </button>
              <button type="button" onClick={onSwitchToAdd} className="text-center text-[11px] font-bold text-[#178754] hover:underline mt-1">
                + Add another class or subject
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[11px] text-neutral-500 -mt-1">
                Tick every class you teach, and every subject you teach — we'll link you to each
                class/subject pair. You can always add more later at sign-in.
              </p>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-neutral-600">Classes you teach</label>
                  <button type="button" onClick={onToggleAllClasses} className="text-[10px] font-bold text-[#178754] hover:underline">
                    {allClassesSelected ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto border border-neutral-200 rounded-lg p-2.5 flex flex-col gap-1.5">
                  {classesLoading ? (
                    <p className="text-[11px] text-neutral-400 px-1 py-1">Loading classes…</p>
                  ) : classes.length === 0 ? (
                    <p className="text-[11px] text-neutral-400 px-1 py-1">Your school hasn't added any classes yet.</p>
                  ) : classes.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.classIds.has(c.id)}
                        onChange={() => onToggleClass(c.id)}
                        className="w-3.5 h-3.5 accent-[#178754] shrink-0"
                      />
                      {c.display_name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-neutral-600">Subjects you teach</label>
                  <button type="button" onClick={onToggleAllSubjects} className="text-[10px] font-bold text-[#178754] hover:underline">
                    {allSubjectsSelected ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto border border-neutral-200 rounded-lg p-2.5 flex flex-col gap-1.5">
                  {allSubjectChoices.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.subjects.has(s)}
                        onChange={() => onToggleSubject(s)}
                        className="w-3.5 h-3.5 accent-[#178754] shrink-0"
                      />
                      {s}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    value={form.customSubject}
                    onChange={(e) => setStep((s) => (s ? { ...s, form: { ...s.form, customSubject: e.target.value } } : s))}
                    placeholder="Other subject not listed"
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddCustomSubject(); } }}
                  />
                  <button type="button" onClick={onAddCustomSubject} className="text-[11px] font-bold text-[#178754] hover:underline shrink-0">
                    Add
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={submitting || form.classIds.size === 0 || form.subjects.size === 0}
                onClick={onSubmitAdd}
                className="w-full mt-1 py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[#178754] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? 'Saving…'
                  : comboCount > 0
                    ? `Save ${comboCount} assignment${comboCount === 1 ? '' : 's'} & continue`
                    : 'Pick at least one class and subject'}
              </button>

              {assignments.length > 0 && (
                <button type="button" onClick={onBackToPick} className="text-center text-[11px] font-bold text-[rgb(22,32,111)] hover:underline">
                  Back to my classes
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EasyClassWork() {
  const navigate = useNavigate();

  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [adCarouselIndex, setAdCarouselIndex] = useState(0);

  // Real, super-admin-approved schools, fetched once on mount. Used by the
  // SchoolDropdown inside student/teacher registration.
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/schools/public`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success) setSchools(data.schools);
      })
      .catch(() => {
        // Backend not reachable — leave the list empty rather than pretending
        // schools exist; SchoolDropdown shows a clear "no verified schools" message.
      })
      .finally(() => {
        if (!cancelled) setSchoolsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Login / registration modal state.
  // authView is null when closed, otherwise { role: 'student' | 'teacher' | 'schoolAdmin' | 'superAdmin', mode: 'login' | 'register' }
  const [authView, setAuthView] = useState(null);
  const [formError, setFormError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', schoolCode: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    school: '',
    schoolCode: '',
    password: '',
    confirmPassword: '',
  });

  // The Google account attached to the current login/register attempt (student,
  // teacher & super admin roles). Reset every time the modal is opened or the
  // mode switches, so a stale account from a previous attempt is never reused.
  const [googleAccount, setGoogleAccount] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null); // { roleLabel, schoolName } | null

  // School-admin second factor: a confirmation code emailed after email + school code
  // are accepted. `pendingAdminAuth` holds the address the code was sent to so the OTP
  // modal — and the verify/resend calls — always target the right address.
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingAdminAuth, setPendingAdminAuth] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Teacher classes/subjects step — opened right after a teacher's Google
  // login succeeds. Shape:
  //   {
  //     token, user,               // from login-google's response
  //     mode: 'pick' | 'add',
  //     assignments,                // existing assignments returned at login
  //     classes, classesLoading,    // this school's classes, for 'add' mode
  //     form: { classIds: Set, subjects: Set, customSubject },
  //     submitting, error,
  //   }
  const [teacherStep, setTeacherStep] = useState(null);

  // Any overlay (the connecting popup, the sign-in/register modal, the pending-approval
  // notice, the admin confirmation-code modal, or the teacher class-picker) blurs the
  // page behind it.
  const isOverlayActive = isRegisterLoading || Boolean(authView) || otpModalOpen || Boolean(pendingApproval) || Boolean(teacherStep);

  // Cycle through the connection-style messages while loading is active
  useEffect(() => {
    if (!isRegisterLoading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev + 1 >= LOADING_STEPS.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 420);
    return () => clearInterval(interval);
  }, [isRegisterLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAdCarouselIndex((prev) => (prev + 1) % AD_CIRCLE_ICONS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // `state` (optional) is handed straight to react-router's navigate so a
  // destination page — like School_Admin.jsx, SuperAdmin.jsx or the teacher
  // dashboard — can read it via useLocation().state without waiting on a
  // network round trip.
  const handleNavigate = (path, state) => {
    // show loading popup for a short time, then navigate
    setIsRegisterLoading(true);
    setTimeout(() => {
      navigate(path, state ? { state } : undefined);
    }, 1800); // 1.8 seconds loading popup
  };

  // Opens the login/register modal for a given role, resetting any old form data.
  const openAuth = (role, mode) => {
    setFormError('');
    setAuthSubmitting(false);
    setGoogleAccount(null);
    setLoginForm({ email: '', schoolCode: '' });
    setRegisterForm({ fullName: '', email: '', school: '', schoolCode: '', password: '', confirmPassword: '' });
    setAuthView({ role, mode });
  };

  const closeAuth = () => {
    setAuthView(null);
    setFormError('');
    setGoogleAccount(null);
  };

  const switchAuthMode = (mode) => {
    setFormError('');
    setGoogleAccount(null);
    setAuthView((prev) => (prev ? { ...prev, mode } : prev));
  };

  // Fired once GoogleAuthButton resolves. Prefills the full name from the Google
  // account (still editable) so the person isn't retyping something Google already
  // told us. This does NOT hit the backend by itself — submitting the form does,
  // once the rest of the fields (school + school code) are filled in.
  const handleGoogleSignedIn = (account) => {
    setFormError('');
    setGoogleAccount(account);
    setRegisterForm((f) => ({ ...f, fullName: f.fullName || account.name, email: account.email }));
  };

  const handleGoogleSwitch = () => {
    setGoogleAccount(null);
  };

  const closeOtpModal = () => {
    setOtpModalOpen(false);
    setPendingAdminAuth(null);
    setOtpValue('');
    setOtpError('');
  };

  // ------------------------------------------------------------------
  // Teacher classes/subjects step — helpers
  // ------------------------------------------------------------------

  // Loads the classes this teacher's school has created, for the "add
  // classes" form. Called lazily (only when the teacher actually needs to
  // pick some), never before.
  const loadTeacherClasses = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/api/teacher/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setTeacherStep((s) => (s ? { ...s, classes: result.classes, classesLoading: false } : s));
      } else {
        setTeacherStep((s) => (s ? { ...s, classesLoading: false, error: result.message || 'Could not load classes.' } : s));
      }
    } catch (err) {
      console.error(err);
      setTeacherStep((s) => (s ? { ...s, classesLoading: false, error: 'Could not reach the server. Please check your connection and try again.' } : s));
    }
  };

  const blankAddForm = () => ({ classIds: new Set(), subjects: new Set(), customSubject: '' });

  // Decides what the teacher sees right after a successful Google login:
  // the picker/summary if they already have at least one assignment (from
  // either the admin or a previous sign-in), or the "add some" form if they
  // have none yet.
  const startTeacherClassStep = (token, user, assignments) => {
    if (assignments.length === 0) {
      setTeacherStep({
        token, user, mode: 'add', assignments,
        classes: [], classesLoading: true,
        form: blankAddForm(),
        submitting: false, error: '',
      });
      loadTeacherClasses(token);
    } else {
      setTeacherStep({
        token, user, mode: 'pick', assignments,
        classes: [], classesLoading: false,
        form: blankAddForm(),
        submitting: false, error: '',
      });
    }
  };

  // Finishes the teacher sign-in with whatever assignments they currently
  // have, then navigates to the dashboard exactly like every other role.
  const completeTeacherLogin = (token, user, assignments) => {
    setTeacherStep(null);
    handleNavigate('/dashboard/teacher', {
      token,
      email: user.email,
      name: user.fullName,
      assignments: assignments.map((a) => ({
        id: a.id,
        classId: a.classCombinationId,
        className: a.className,
        subject: a.subject,
      })),
    });
  };

  const handlePickExisting = (assignments) => {
    if (!teacherStep) return;
    completeTeacherLogin(teacherStep.token, teacherStep.user, assignments);
  };

  const handleSwitchTeacherStepToAdd = () => {
    setTeacherStep((s) => (s ? { ...s, mode: 'add', error: '', form: blankAddForm() } : s));
    if (teacherStep && teacherStep.classes.length === 0) loadTeacherClasses(teacherStep.token);
  };

  const handleBackToPickAssignment = () => {
    setTeacherStep((s) => (s ? { ...s, mode: 'pick', error: '' } : s));
  };

  const handleToggleClass = (classId) => {
    setTeacherStep((s) => {
      if (!s) return s;
      const next = new Set(s.form.classIds);
      next.has(classId) ? next.delete(classId) : next.add(classId);
      return { ...s, form: { ...s.form, classIds: next } };
    });
  };

  const handleToggleAllClasses = () => {
    setTeacherStep((s) => {
      if (!s) return s;
      const allSelected = s.classes.length > 0 && s.classes.every((c) => s.form.classIds.has(c.id));
      const next = allSelected ? new Set() : new Set(s.classes.map((c) => c.id));
      return { ...s, form: { ...s.form, classIds: next } };
    });
  };

  const handleToggleSubject = (subject) => {
    setTeacherStep((s) => {
      if (!s) return s;
      const next = new Set(s.form.subjects);
      next.has(subject) ? next.delete(subject) : next.add(subject);
      return { ...s, form: { ...s.form, subjects: next } };
    });
  };

  const handleToggleAllSubjects = () => {
    setTeacherStep((s) => {
      if (!s) return s;
      const allChoices = [...new Set([...SUBJECT_OPTIONS, ...s.form.subjects])];
      const allSelected = allChoices.length > 0 && allChoices.every((sub) => s.form.subjects.has(sub));
      const next = allSelected ? new Set() : new Set(allChoices);
      return { ...s, form: { ...s.form, subjects: next } };
    });
  };

  const handleAddCustomSubject = () => {
    setTeacherStep((s) => {
      if (!s) return s;
      const label = s.form.customSubject.trim();
      if (!label) return s;
      const next = new Set(s.form.subjects);
      next.add(label);
      return { ...s, form: { ...s.form, subjects: next, customSubject: '' } };
    });
  };

  const handleSubmitNewAssignment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!teacherStep) return;
    const { classIds, subjects } = teacherStep.form;
    if (classIds.size === 0 || subjects.size === 0) {
      setTeacherStep((s) => (s ? { ...s, error: 'Pick at least one class and one subject.' } : s));
      return;
    }
    const assignments = [...classIds].flatMap((classCombinationId) =>
      [...subjects].map((subject) => ({ classCombinationId, subject }))
    );

    setTeacherStep((s) => (s ? { ...s, submitting: true, error: '' } : s));
    try {
      const response = await fetch(`${API_BASE}/api/teacher/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${teacherStep.token}` },
        body: JSON.stringify({ assignments }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        completeTeacherLogin(teacherStep.token, teacherStep.user, result.assignments);
      } else {
        setTeacherStep((s) => (s ? { ...s, submitting: false, error: result.message || 'Could not save that.' } : s));
      }
    } catch (err) {
      console.error(err);
      setTeacherStep((s) => (s ? { ...s, submitting: false, error: 'Could not reach the server. Please check your connection and try again.' } : s));
    }
  };

  // Closing the picker mid-flow means the teacher backed out of signing in —
  // drop the half-finished session rather than leaving a token with no
  // chosen class sitting in localStorage.
  const closeTeacherStep = () => {
    setTeacherStep(null);
    localStorage.removeItem(USER_SESSION_KEY);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const role = authView?.role;
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

    if (config.authField === 'google') {
      if (!googleAccount) {
        setFormError('Continue with Google first.');
        return;
      }

      // ------------------------------------------------------------
      // SUPER ADMIN: gated entirely by AUTHORIZED_SUPERADMIN_EMAIL. No
      // password is ever shown or typed. Once the Google email matches,
      // we transparently obtain a real backend session token so the
      // dashboard's /api/superadmin/* calls keep working.
      // ------------------------------------------------------------
      if (role === 'superAdmin') {
        setAuthSubmitting(true);
        try {
          if (googleAccount.email.toLowerCase() !== AUTHORIZED_SUPERADMIN_EMAIL.toLowerCase()) {
            setFormError('This Google account is not authorized for super admin access.');
            return;
          }
          const response = await fetch(`${API_BASE}/api/auth/super-admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: BACKEND_SUPERADMIN_EMAIL, password: BACKEND_SUPERADMIN_PASSWORD }),
          });
          const result = await response.json();
          if (response.ok && result.success) {
            localStorage.setItem(SUPERADMIN_SESSION_KEY, JSON.stringify({ token: result.token, email: googleAccount.email }));
            setAuthView(null);
            handleNavigate('/dashboard/superAdmin', { token: result.token, email: googleAccount.email });
          } else {
            setFormError('Your Google account is authorized, but the server rejected the sign-in. Please contact the platform owner.');
          }
        } catch (err) {
          console.error(err);
          setFormError('Could not reach the server. Please check your connection and try again.');
        } finally {
          setAuthSubmitting(false);
        }
        return;
      }

      // POST /api/users/login-google matches by google_sub + role, and only
      // succeeds if the account exists AND has been approved by the school
      // admin. Anything else comes back as an error we show inline. For a
      // teacher, a successful response also carries `assignments` — every
      // class/subject pair they've already been given (by the admin at
      // approval time, or by picking it themself before) — which decides
      // what startTeacherClassStep shows next.
      setAuthSubmitting(true);
      try {
        const response = await fetch(`${API_BASE}/api/users/login-google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, email: googleAccount.email, googleSub: googleAccount.googleSub }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify({ token: result.token, user: result.user }));
          setAuthView(null);
          if (role === 'teacher') {
            startTeacherClassStep(result.token, result.user, result.assignments || []);
          } else {
            handleNavigate(`/dashboard/${role}`, { token: result.token, email: googleAccount.email, name: googleAccount.name });
          }
        } else {
          setFormError(result.message || 'Could not sign you in.');
        }
      } catch (err) {
        console.error(err);
        setFormError('Could not reach the server. Please check your connection and try again.');
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }

    if (config.authField === 'schoolCode') {
      if (!loginForm.email || !loginForm.schoolCode) {
        setFormError('Please enter your email and school code.');
        return;
      }

      // School admins never get signed in directly here — the email + code only
      // earns them a confirmation code sent to that email address, AND ONLY IF
      // the school has already been approved by a super admin (home.js checks
      // schools.status before it will even generate a code). Only entering
      // that exact code (verified against the backend, below) actually signs
      // them in, so a wrong/made-up/unapproved school can never reach the dashboard.
      setAuthSubmitting(true);
      try {
        const response = await fetch(`${API_BASE}/api/auth/school-admin/request-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginForm.email, schoolCode: loginForm.schoolCode }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setPendingAdminAuth({ email: loginForm.email, schoolCode: loginForm.schoolCode });
          setOtpValue('');
          setOtpError('');
          setAuthView(null);
          setOtpModalOpen(true);
        } else {
          setFormError(result.message || 'Could not send a confirmation code. Please check your email and school code.');
        }
      } catch (err) {
        console.error(err);
        setFormError('Could not reach the server. Please check your connection and try again.');
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }
  };

  const handleVerifyAdminOtp = async (e) => {
    e.preventDefault();
    if (!pendingAdminAuth) return;
    setOtpVerifying(true);
    setOtpError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/school-admin/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingAdminAuth.email, code: otpValue }),
      });
      const result = await response.json();

      // Same principle as registration: only a genuine positive response from the
      // backend — which only happens if the code we emailed was typed back correctly —
      // is allowed to open the dashboard. On success home.js also hands back a
      // session token and the school's details, which we hand off to School_Admin.jsx.
      if (response.ok && result.success) {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token: result.token, school: result.school }));
        setOtpModalOpen(false);
        setPendingAdminAuth(null);
        handleNavigate('/dashboard/schoolAdmin', { token: result.token, school: result.school });
      } else {
        setOtpError(result.message || 'That code is not correct. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendAdminOtp = async () => {
    if (!pendingAdminAuth) return;
    setOtpSending(true);
    setOtpError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/school-admin/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingAdminAuth),
      });
      const result = await response.json();
      if (!(response.ok && result.success)) {
        setOtpError(result.message || 'Could not resend the code. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const role = authView?.role;
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

    if (config.authField === 'google') {
      if (!googleAccount) {
        setFormError('Continue with Google first.');
        return;
      }
      const { fullName, school, schoolCode } = registerForm;
      if (!fullName || !school || !schoolCode) {
        setFormError('Please fill in every field.');
        return;
      }
      // POST /api/users/register-google creates a `users` row with
      // status = 'pending_approval'. The school admin then approves it from
      // their dashboard (School_Admin.jsx) before this person can sign in.
      // For teachers, the admin may attach classes/subjects at approval
      // time, or approve with none — anything still missing gets picked by
      // the teacher themself at their first sign-in (see startTeacherClassStep above).
      setAuthSubmitting(true);
      try {
        const response = await fetch(`${API_BASE}/api/users/register-google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            fullName,
            email: googleAccount.email,
            googleSub: googleAccount.googleSub,
            schoolId: school,
            schoolCode,
          }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          const schoolName = schools.find((s) => s.id === school)?.name;
          setAuthView(null);
          setPendingApproval({ roleLabel: ROLE_CONFIG[role].label, schoolName });
        } else {
          setFormError(result.message || 'Could not submit your registration.');
        }
      } catch (err) {
        console.error(err);
        setFormError('Could not reach the server. Please check your connection and try again.');
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }

    const { fullName, email, school, schoolCode, password, confirmPassword } = registerForm;
    if (!fullName || !email || !school || !schoolCode || !password || !confirmPassword) {
      setFormError('Please fill in every field.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }
    setAuthView(null);
    handleNavigate(`/dashboard/${role}`);
  };

  const ActiveAdIcon = AD_CIRCLE_ICONS[adCarouselIndex % AD_CIRCLE_ICONS.length];

  return (
    <>
      {/* Loading popup lives OUTSIDE the blurred wrapper below.
          (filter: blur() on a parent also blurs its fixed-position children,
          which is why the circle wasn't visible before — it was being blurred too.) */}
      {isRegisterLoading && (
        <div className="ecw-magic-overlay" role="status" aria-live="polite">
          <div className="ecw-magic-card">
            <div className="ecw-spinner-circle">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke="#6EE7A8" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray="163.4"
                  strokeDashoffset="110"
                  className="ecw-spin-ring"
                />
              </svg>
            </div>
            <div className="ecw-magic-title">Setting things up</div>
            <div className="ecw-magic-sub">{LOADING_STEPS[loadingStep]}</div>
            <div className="ecw-progress-track">
              <div
                className="ecw-progress-fill"
                style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sign-in / register popup: also lives outside the blurred wrapper so it stays sharp
          and perfectly centered while everything behind it goes soft. */}
      {authView && (
        <AuthModal
          role={authView.role}
          mode={authView.mode}
          onClose={closeAuth}
          onSwitchMode={switchAuthMode}
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          formError={formError}
          authSubmitting={authSubmitting}
          onSubmitRegister={handleRegisterSubmit}
          onSubmitLogin={handleLoginSubmit}
          googleAccount={googleAccount}
          onGoogleSignedIn={handleGoogleSignedIn}
          onGoogleSwitch={handleGoogleSwitch}
          schools={schools}
          schoolsLoading={schoolsLoading}
        />
      )}

      {/* Pending-approval notice shown right after a student/teacher submits registration. */}
      {pendingApproval && (
        <PendingApprovalModal
          roleLabel={pendingApproval.roleLabel}
          schoolName={pendingApproval.schoolName}
          onClose={() => setPendingApproval(null)}
        />
      )}

      {/* School-admin confirmation-code popup — shown after email + school code are
          accepted, before any dashboard session is created. */}
      {otpModalOpen && pendingAdminAuth && (
        <AdminOtpModal
          email={pendingAdminAuth.email}
          otpValue={otpValue}
          setOtpValue={setOtpValue}
          verifying={otpVerifying}
          sending={otpSending}
          error={otpError}
          onSubmit={handleVerifyAdminOtp}
          onResend={handleResendAdminOtp}
          onClose={closeOtpModal}
        />
      )}

      {/* Teacher classes/subjects picker — shown right after a teacher's
          Google login succeeds, before anything navigates to the dashboard. */}
      {teacherStep && (
        <TeacherClassStepModal
          step={teacherStep}
          setStep={setTeacherStep}
          onPickExisting={handlePickExisting}
          onSwitchToAdd={handleSwitchTeacherStepToAdd}
          onBackToPick={handleBackToPickAssignment}
          onSubmitAdd={handleSubmitNewAssignment}
          onClose={closeTeacherStep}
          onToggleClass={handleToggleClass}
          onToggleAllClasses={handleToggleAllClasses}
          onToggleSubject={handleToggleSubject}
          onToggleAllSubjects={handleToggleAllSubjects}
          onAddCustomSubject={handleAddCustomSubject}
        />
      )}
    <div className={`min-h-screen bg-white text-neutral-900 font-sans antialiased ${isOverlayActive ? 'ecw-blur-active' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .ecw-heading { font-family: 'Poppins', sans-serif; }
        .ecw-body { font-family: 'Inter', sans-serif; }

        .rwanda-gradient-text {
          text-align: center;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 17px;
          letter-spacing: -0.01em;
          margin: 1rem 0;
          line-height: 1.2;
        }
        .rwanda-gradient-text span {
          display: inline-block;
          color: #ffffff;
          font-weight: 500;
          will-change: transform;
          animation: professionalWave 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: calc(0.04s * var(--i));
        }
        .rwanda-gradient-text span.lead {
          color: #6EE7A8;
          font-weight: 800;
        }
        @keyframes professionalWave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes ecw-walk {
          0%   { transform: translateX(-6%); }
          50%  { transform: translateX(96%); }
          51%  { transform: translateX(96%) scaleX(-1); }
          99%  { transform: translateX(-6%) scaleX(-1); }
          100% { transform: translateX(-6%) scaleX(1); }
        }

        .ecw-walker { animation: ecw-walk 9s ease-in-out infinite; }
        .ecw-walker2 { animation: ecw-walk 9s ease-in-out infinite; animation-delay: 1.2s; }
        .ecw-walker3 { animation: ecw-walk 9s ease-in-out infinite; animation-delay: 2.4s; }

        @keyframes ecw-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .ecw-float { animation: ecw-float 4s ease-in-out infinite; }
        .ecw-float-slow { animation: ecw-float 6s ease-in-out infinite; }
        @keyframes icon-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .icon-spin { animation: icon-spin 3s linear infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }

        .ecw-blur-active { filter: blur(6px) saturate(0.9) brightness(0.9); transform-origin:center; }
        .ecw-magic-overlay {
          position: fixed;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(6,10,30,0.65);
          z-index:9999;
        }
        .ecw-magic-card {
          width:300px;
          max-width:88%;
          background: rgb(22,32,111);
          border:1px solid rgba(255,255,255,0.1);
          padding:34px 28px;
          border-radius:18px;
          display:flex;
          flex-direction:column;
          gap:10px;
          align-items:center;
          box-shadow:0 20px 60px rgba(2,6,23,0.55);
        }
        .ecw-magic-title { color:#fff; font-weight:700; font-size:15px; letter-spacing:0.2px; margin-top:4px; }
        .ecw-magic-sub { color:rgba(230,253,240,0.85); font-size:12.5px; opacity:0.95; min-height:16px; text-align:center; }

        .ecw-spinner-circle { display:flex; align-items:center; justify-content:center; }
        .ecw-spin-ring { animation: ecw-spin-ring-rotate 1s linear infinite; transform-origin: 32px 32px; }
        @keyframes ecw-spin-ring-rotate { to { transform: rotate(360deg); } }

        .ecw-progress-track {
          width: 100%;
          height: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          overflow: hidden;
          margin-top: 6px;
        }
        .ecw-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #34d399, #6EE7A8);
          transition: width 0.4s ease;
        }

        .ecw-ad-panel {
          position: absolute;
          top: -10%;
          left: 50%;
          transform: translateX(-50%);
          height: min(100%, 13rem);
          width: min(100%, 13rem);
          padding: 1.5rem 1.2rem;
          background: transparent;
          border: 1px solid rgba(23,119,84,0.14);
          border-radius: 50%;
          box-shadow: 0 18px 40px rgba(23,119,84,0.14);
          backdrop-filter: blur(12px);
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: width 0.2s ease, height 0.2s ease, padding 0.2s ease;
        }
        @media (max-width: 1024px) {
          .ecw-ad-panel {
            top: 0.85rem;
            width: min(100%, 10rem);
            height: min(100%, 10rem);
            padding: 1rem 0.85rem;
          }
          .ecw-ad-circle {
            width: 7.5rem;
            height: 7.5rem;
          }
        }
        @media (max-width: 768px) {
          .ecw-ad-panel {
            top: 0.6rem;
            width: min(100%, 7.5rem);
            height: min(100%, 7.5rem);
            padding: 0.6rem 0.5rem;
            border-width: 1px;
          }
          .ecw-ad-circle {
            width: 5.5rem;
            height: 5.5rem;
            border-width: 2px;
          }
          .ecw-ad-panel-title {
            font-size: 0.55rem;
            margin-bottom: 0.5rem;
          }
        }
        @media (max-width: 480px) {
          .ecw-ad-panel {
            top: 0.4rem;
            width: min(100%, 5.75rem);
            height: min(100%, 5.75rem);
            padding: 0.4rem;
          }
          .ecw-ad-circle {
            width: 4.25rem;
            height: 4.25rem;
            border-width: 2px;
          }
        }
        .ecw-ad-panel-title {
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #166c31;
          font-weight: 800;
          margin-bottom: 0.5rem;
          display: none;
        }
        .ecw-ad-circles {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0;
          position: relative;
          width: 100%;
          height: 100%;
        }
        .ecw-ad-circle {
          width: 10rem;
          height: 10rem;
          border-radius: 50%;
          border: 3px solid #178754;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(228,252,239,0.85) 55%, rgba(255,255,255,0.65));
          box-shadow: 0 14px 36px rgba(23,119,84,0.16);
          animation: ecw-ad-pop 4s ease-in-out infinite;
          position: relative;
          transition: width 0.2s ease, height 0.2s ease;
        }
        .ecw-ad-button {
          text-decoration: none;
          position: static;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          background: #178754;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(23,119,84,0.3);
          margin-top: 0.75rem;
          width: 2.5rem;
          height: 2.5rem;
        }
        .ecw-ad-button:hover {
          background: #136040;
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(23,119,84,0.4);
        }
        @media (max-width: 768px) {
          .ecw-ad-button {
            width: 1.9rem;
            height: 1.9rem;
            margin-top: 0.4rem;
          }
          .ecw-ad-button svg {
            width: 12px;
            height: 12px;
          }
        }
        @media (max-width: 480px) {
          .ecw-ad-button {
            width: 1.6rem;
            height: 1.6rem;
            margin-top: 0.3rem;
          }
          .ecw-ad-button svg {
            width: 10px;
            height: 10px;
          }
        }
        @keyframes ecw-ad-pop {
          0%, 100% { transform: translateY(0) scale(1); }
          20% { transform: translateY(-12px) scale(1.05); }
          40% { transform: translateY(-6px) scale(0.98); }
          60% { transform: translateY(-10px) scale(1.02); }
          80% { transform: translateY(-4px) scale(0.99); }
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-2.5 shrink-0">
            <span className="w-12 h-12 rounded-full bg-[#EAF6EF] flex items-center justify-center ring-1 ring-[#178754]/20 shrink-0">
              <img src={logo} className="w-6 h-6 text-[#178754]" aria-hidden="true" />
            </span>
            <span className="ecw-heading font-bold text-[15px] text-neutral-900 leading-none">
              Easy Class Records System
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-semibold text-neutral-600 ecw-body">
            <a href="#home" className="relative py-1 hover:text-[#178754] transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#178754] after:transition-all hover:after:w-full">Home</a>
            <a href="#services" className="relative py-1 hover:text-[#178754] transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#178754] after:transition-all hover:after:w-full">Our services</a>
            <a href="#how-it-works" className="relative py-1 hover:text-[#178754] transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#178754] after:transition-all hover:after:w-full">How to get started</a>
            <a href="#register" className="relative py-1 hover:text-[#178754] transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#178754] after:transition-all hover:after:w-full">Register</a>
            <a href="#dashboard" className="relative py-1 hover:text-[#178754] transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#178754] after:transition-all hover:after:w-full">Dashboard</a>
            <a href="#team" className="relative py-1 hover:text-[#178754] transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#178754] after:transition-all hover:after:w-full">Our team</a>
            <a href="#contact" className="relative py-1 hover:text-[#178754] transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#178754] after:transition-all hover:after:w-full">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNavigate('/register')}
              disabled={isRegisterLoading}
              className="hidden sm:inline-flex items-center justify-center gap-2 text-[13px] font-bold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)] disabled:opacity-90 disabled:cursor-not-allowed"
            >
              {isRegisterLoading ? (
                <>
                  <svg className="w-4 h-4 icon-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                'Get started'
              )}
            </button>

            <input type="checkbox" id="nav-toggle" className="peer hidden" />
            <label htmlFor="nav-toggle" className="lg:hidden flex flex-col justify-center items-center gap-1.5 w-9 h-9 rounded-lg border border-neutral-200 cursor-pointer">
              <span className="block w-4 h-0.5 bg-neutral-700"></span>
              <span className="block w-4 h-0.5 bg-neutral-700"></span>
              <span className="block w-4 h-0.5 bg-neutral-700"></span>
            </label>

            <div className="hidden peer-checked:flex lg:hidden flex-col absolute top-20 right-5 w-56 bg-white/95 shadow-xl rounded-2xl ring-1 ring-black/5 px-4 py-4 gap-2 text-[13px] font-semibold text-neutral-700 ecw-body">
              <a href="#home" className="py-2 flex items-center gap-2 rounded-xl hover:text-[#178754] hover:bg-neutral-100 transition-colors">
                <span className="w-5 h-5 inline-flex items-center justify-center text-[#178754]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 10L12 3l9 7v11a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Home
              </a>
              <a href="#services" className="py-2 flex items-center gap-2 rounded-xl hover:text-[#178754] hover:bg-neutral-100 transition-colors">
                <span className="w-5 h-5 inline-flex items-center justify-center text-[#178754]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                Our services
              </a>
              <a href="#how-it-works" className="py-2 flex items-center gap-2 rounded-xl hover:text-[#178754] hover:bg-neutral-100 transition-colors">
                <span className="w-5 h-5 inline-flex items-center justify-center text-[#178754]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4v12M8 8l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                How to get started
              </a>
              <button
                type="button"
                onClick={() => handleNavigate('/register')}
                disabled={isRegisterLoading}
                className="py-2 text-left w-full flex items-center gap-2 rounded-xl hover:text-[#178754] hover:bg-neutral-100 transition-colors disabled:opacity-70"
              >
                <span className="w-5 h-5 inline-flex items-center justify-center text-[#178754]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                {isRegisterLoading ? (
                  <>
                    <svg className="w-4 h-4 icon-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  'Register'
                )}
              </button>
              <a href="#dashboard" className="py-2 flex items-center gap-2 rounded-xl hover:text-[#178754] hover:bg-neutral-100 transition-colors">
                <span className="w-5 h-5 inline-flex items-center justify-center text-[#178754]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 18V10M10 18V7M15 18V13M20 18V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
                Dashboard
              </a>
              <a href="#team" className="py-2 flex items-center gap-2 rounded-xl hover:text-[#178754] hover:bg-neutral-100 transition-colors">
                <span className="w-5 h-5 inline-flex items-center justify-center text-[#178754]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Our team
              </a>
              <a href="#contact" className="py-2 flex items-center gap-2 rounded-xl hover:text-[#178754] hover:bg-neutral-100 transition-colors">
                <span className="w-5 h-5 inline-flex items-center justify-center text-[#178754]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v12H5.5L4 17.5V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Contact
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-14 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex flex-col items-start text-left w-full lg:w-1/2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-[#178754] to-[#0d5c3a] px-4 py-2 rounded mb-4 shadow-sm hover:shadow-md transition-shadow">
              No more spending lot of time
            </span>
            <h1 className="ecw-heading text-2xl sm:text-3xl font-extrabold leading-tight text-neutral-900 mb-3">
              Easy way to manage students in the classroom
            </h1>
            <p className="ecw-body text-sm text-neutral-600 leading-relaxed max-w-md">
              Easy ClassWork Records gives every school a single system for teachers, students
              and administrators, built for the curriculum and designed for Rwanda.
            </p>
            <div className="flex flex-wrap gap-3 pt-6">
              <button
                type="button"
                onClick={() => handleNavigate('/register')}
                disabled={isRegisterLoading}
                className="inline-flex items-center justify-center gap-2 text-[13px] font-bold text-white px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90 bg-[#178754] disabled:opacity-90 disabled:cursor-not-allowed"
              >
                {isRegisterLoading ? (
                  <>
                    <svg className="w-4 h-4 icon-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  'Register your school'
                )}
              </button>
              <a href="#services" className="text-[13px] font-bold text-[rgb(22,32,111)] border border-[rgb(22,32,111)]/20 hover:bg-[rgb(22,32,111)]/5 px-5 py-2.5 rounded-lg transition-colors">
                See what it does
              </a>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="relative bg-gradient-to-b from-[rgb(11,22,111)] to-[#EAF6EF] rounded-2xl p-6 overflow-hidden">
              <span className="absolute top-5 right-8 text-[#6EE7A8] animate-[ecw-float_6s_ease-in-out_infinite]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 15c3-4 6 4 9 0s6 4 7-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>
              <span className="absolute top-14 left-10 text-[#93C5FD] animate-[ecw-float_4s_ease-in-out_infinite]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 15c3-4 6 4 9 0s6 4 7-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </span>

              <div className="ecw-ad-panel relative">
                <div className="ecw-ad-circles">
                  <div className="ecw-ad-circle">
                    <ActiveAdIcon className="w-10 h-10 text-[#178754]" aria-hidden="true" />
                  </div>
                </div>
                <a href="#services" className="ecw-ad-button absolute right-0 bottom-6 translate-x-1/2 shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>

              <svg viewBox="0 0 480 220" className="w-full h-auto">
                <g>
                  <rect x="18" y="120" width="70" height="55" rx="3" fill="#DBEAFE" />
                  <polygon points="15,120 53,95 91,120" fill="rgb(22,32,111)" />
                  <rect x="45" y="145" width="16" height="30" fill="rgb(22,32,111)" />
                  <rect x="26" y="132" width="12" height="12" fill="#93C5FD" />
                  <rect x="68" y="132" width="12" height="12" fill="#93C5FD" />
                </g>
                <g>
                  <line x1="53" y1="95" x2="53" y2="60" stroke="#C7D2FE" strokeWidth="2" />
                  <g className="ecw-float">
                    <rect x="53" y="60" width="34" height="8" fill="#20A5DE" />
                    <rect x="53" y="68" width="34" height="8" fill="#FAD201" />
                    <rect x="53" y="76" width="34" height="6" fill="#178754" />
                    <circle cx="76" cy="66" r="3.2" fill="#E5BE01" />
                  </g>
                </g>

                <path d="M95 175 Q 240 110 385 175" stroke="#178754" strokeWidth="6" fill="none" strokeLinecap="round" />
                <path d="M95 175 Q 240 130 385 175" stroke="#A7F3D0" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.6" />

                <g>
                  <rect x="392" y="140" width="66" height="42" rx="4" fill="#178754" />
                  <rect x="398" y="146" width="54" height="30" rx="2" fill="#ECFDF5" />
                  <rect x="386" y="182" width="78" height="7" rx="2" fill="#0F6B41" />
                </g>

                <g className="ecw-walker">
                  <circle cx="0" cy="150" r="7" fill="rgb(22,32,111)" />
                  <rect x="-4" y="157" width="8" height="14" rx="3" fill="rgb(22,32,111)" />
                </g>
                <g className="ecw-walker2">
                  <circle cx="0" cy="150" r="6" fill="#178754" />
                  <rect x="-3.5" y="156" width="7" height="12" rx="3" fill="#178754" />
                </g>
                <g className="ecw-walker3">
                  <circle cx="0" cy="150" r="6.5" fill="#FAD201" />
                  <rect x="-4" y="156.5" width="8" height="13" rx="3" fill="#FAD201" />
                </g>
              </svg>
              <p className="text-center text-[0.9rem] text-[#178737]  ecw-body -mt-1">
                Teacher no longer takes time to pass through papers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR SERVICES */}
      <section id="services" className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">Our services</span>
            <h2 className="ecw-heading text-2xl font-extrabold text-neutral-900 mt-2">
              Everything a school needs to run its academic year
            </h2>
          </div>

          <div className="flex flex-wrap gap-5">
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 hover:border-green-200 transition-colors w-full sm:w-[47%] lg:w-[31%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#E6F1FB]">
                <BookOpen className="w-5 h-5 text-[#1D6FE0] icon-spin" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Class notes</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed">Teachers publish notes by subject and class, students open them anytime.</p>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 hover:border-green-200 transition-colors w-full sm:w-[47%] lg:w-[31%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#EAF6EF]">
                <ClipboardCheck className="w-5 h-5 text-[#178754] icon-spin" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Quizzes</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed">Auto-graded assessments aligned with the competence-based curriculum.</p>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 hover:border-green-200 transition-colors w-full sm:w-[47%] lg:w-[31%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#E6F1FB]">
                <GraduationCap className="w-5 h-5 text-[#1D6FE0] icon-spin" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Gradebook</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed">Record marks once, and let report cards build themselves.</p>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 hover:border-green-200 transition-colors w-full sm:w-[47%] lg:w-[31%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#EAF6EF]">
                <CalendarCheck className="w-5 h-5 text-[#178754] icon-spin" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Attendance</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed">Mark attendance from a phone or a laptop in under a minute.</p>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 hover:border-green-200 transition-colors w-full sm:w-[47%] lg:w-[31%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#E6F1FB]">
                <FileText className="w-5 h-5 text-[#1D6FE0] icon-spin" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Term reports</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed">Generate report cards for a class, or the whole school, in one click.</p>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 hover:border-green-200 transition-colors w-full sm:w-[47%] lg:w-[31%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#EAF6EF]">
                <Wallet className="w-5 h-5 text-[#178754] icon-spin" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Fees and payments</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed">Accept MTN Mobile Money, Airtel Money and bank transfers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO GET STARTED */}
      <section id="how-it-works" className="py-14  border-y border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">How to get started</span>
            <h2 className="ecw-heading text-2xl font-extrabold text-neutral-900 mt-2">
              Six steps, and your school is online
            </h2>
          </div>

          <div className="relative">
            <div className="hidden sm:block absolute left-8 top-6 bottom-6 w-0.5 bg-[#178754] opacity-80 rounded" />

            <div className="flex flex-col gap-6">
              {[
                {i:1, title:'Register your school', text:'Verify your email with Google, submit your school details, and pay the term fee by MTN, Airtel or bank.'},
                {i:2, title:'Wait for approval', text:'Our team confirms your school is real before its admin account is switched on.'},
                {i:3, title:'Get your school code', text:'Once approved, your school can sign in as admin and share its code with staff and students.'},
                {i:4, title:'Add staff and students', text:'Teachers and students sign up with Google using your school code, and the admin approves each one — optionally attaching classes and subjects right away, or leaving teachers to pick their own at first sign-in.'},
                {i:5, title:'Publish notes and quizzes', text:'Teachers start uploading materials the same day.'},
                {i:6, title:'Track progress', text:'Watch attendance, grades and quiz results as the term goes on.'},
              ].map(step => (
                <div key={step.i} className="relative flex flex-col sm:block sm:pl-14">
                  <div className="flex items-center gap-3 sm:hidden">
                    <div className="w-9 h-9 rounded-full bg-white border-2 border-[#178754] flex items-center justify-center text-sm font-bold text-[rgb(22,32,111)] shadow">{step.i}</div>
                    <div>
                      <h3 className="ecw-heading font-bold text-sm text-neutral-900">{step.title}</h3>
                      <p className="ecw-body text-xs text-neutral-600 mt-1">{step.text}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block absolute left-0 sm:left-6 top-0">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-[#178754] flex items-center justify-center text-sm font-bold text-[rgb(22,32,111)] shadow">{step.i}</div>
                  </div>
                  <div className="ml-0 sm:ml-12 bg-white p-4 sm:p-0 rounded-md hidden sm:block">
                    <h3 className="ecw-heading font-bold text-sm text-neutral-900">{step.title}</h3>
                    <p className="ecw-body text-xs text-neutral-600 mt-1">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* REGISTER / DASHBOARDS */}
      <section id="register" className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">Register</span>
            <h2 className="ecw-heading text-2xl font-extrabold text-neutral-900 mt-2">Choose your dashboard</h2>
            <p className="ecw-body text-xs text-neutral-600 mt-2">
              Students and teachers verify their email and sign in with Google — teachers also pick every
              class and subject they teach (or confirm what their admin already set up) at sign-in. School
              admins sign in with their school email and code — once their school has been approved.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 mb-8">
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 w-full sm:w-[47%] lg:w-[23%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#EAF6EF]">
                <ROLE_CONFIG.student.icon className="w-5 h-5 text-[#178754]" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Student dashboard</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed mb-4">Read class notes, take quizzes and check your report card, signed in with Google.</p>
              <button
                type="button"
                onClick={() => openAuth('student', 'login')}
                className="w-full py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)] mt-auto"
              >
                Sign in as student
              </button>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 w-full sm:w-[47%] lg:w-[23%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#E6F1FB]">
                <ROLE_CONFIG.teacher.icon className="w-5 h-5 text-[#1D6FE0]" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Teacher dashboard</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed mb-4">Upload lesson materials, grade work and record attendance — choose every class and subject you teach when you sign in with Google.</p>
              <button
                type="button"
                onClick={() => openAuth('teacher', 'login')}
                className="w-full py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)] mt-auto"
              >
                Sign in as teacher
              </button>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 w-full sm:w-[47%] lg:w-[23%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#EAF6EF]">
                <ROLE_CONFIG.schoolAdmin.icon className="w-5 h-5 text-[#178754]" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">School admin</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed mb-4">Manage staff accounts, student codes and fees for your own school — sign in with email and school code.</p>
              <button
                type="button"
                onClick={() => openAuth('schoolAdmin', 'login')}
                className="w-full py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)] mt-auto"
              >
                Sign in as school admin
              </button>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 w-full sm:w-[47%] lg:w-[23%]">
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center mb-3 bg-[#E6F1FB]">
                <ROLE_CONFIG.superAdmin.icon className="w-5 h-5 text-[#1D6FE0]" aria-hidden="true" />
              </span>
              <h3 className="ecw-heading font-bold text-sm text-neutral-900 mb-1">Super admin</h3>
              <p className="ecw-body text-xs text-neutral-600 leading-relaxed mb-4">Review and approve new schools, and oversee every school on the platform — sign in with the authorized Google account.</p>
              <button
                type="button"
                onClick={() => openAuth('superAdmin', 'login')}
                className="w-full py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)] mt-auto"
              >
                Sign in as super admin
              </button>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">School registration</span>
                <p className="ecw-heading text-xl font-extrabold text-neutral-900 mt-1">150,000 RWF <span className="ecw-body text-xs font-medium text-neutral-500">/ term</span></p>
                <p className="ecw-body text-xs text-neutral-600 mt-1">Includes notes, quiz, report cards and a school code to add your staff and students, once approved.</p>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('/register')}
                disabled={isRegisterLoading}
                className="whitespace-nowrap inline-flex items-center justify-center gap-2 py-2.5 px-5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[#178754] disabled:opacity-90 disabled:cursor-not-allowed"
              >
                {isRegisterLoading ? (
                  <>
                    <svg className="w-4 h-4 icon-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  'Register my school'
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-200 items-center">
              <span className="text-[11px] font-bold text-neutral-500">Pay with</span>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center justify-center min-w-[130px] sm:min-w-[160px] gap-2 text-[11px] sm:text-[12px] font-bold px-4 py-2 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
                  <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  MTN Money
                </span>
                <span className="flex items-center justify-center min-w-[130px] sm:min-w-[160px] gap-2 text-[11px] sm:text-[12px] font-bold px-4 py-2 rounded-md bg-red-50 text-red-700 border border-red-200">
                  <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  Airtel Money
                </span>
                <span className="flex items-center justify-center min-w-[130px] sm:min-w-[160px] gap-2 text-[11px] sm:text-[12px] font-bold px-4 py-2 rounded-md bg-blue-50 border border-blue-200 text-[rgb(22,32,111)]">
                  <Landmark className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  Bank transfer
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section id="dashboard" className="py-14 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">Live dashboard</span>
            <h2 className="ecw-heading text-2xl font-extrabold text-neutral-900 mt-2">
              See the school's whole term at a glance
            </h2>
          </div>

          <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
            <div className="bg-neutral-50 px-4 py-2.5 flex items-center gap-1.5 border-b border-neutral-200">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300"></span>
              <span className="ecw-body text-[11px] text-neutral-400 ml-3">app.easyclasswork.rw/dashboard</span>
            </div>
            <div className="w-full aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-[#EAF6EF] to-white">
              <LayoutDashboard className="w-16 h-16 text-[#178754]" aria-hidden="true" />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 mt-8">
            <div className="flex flex-col items-center text-center flex-1 min-w-[120px]">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="30" fill="none" stroke="#E5F0FF" strokeWidth="7" />
                <circle cx="38" cy="38" r="30" fill="none" stroke="rgb(22,32,111)" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray="188.5" strokeDashoffset="54.7" transform="rotate(-90 38 38)" />
              </svg>
              <p className="ecw-heading text-sm font-extrabold text-neutral-900 mt-2">142+</p>
              <p className="ecw-body text-[11px] text-neutral-500">Partner schools</p>
            </div>
            <div className="flex flex-col items-center text-center flex-1 min-w-[120px]">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="30" fill="none" stroke="#E5F0FF" strokeWidth="7" />
                <circle cx="38" cy="38" r="30" fill="none" stroke="#178754" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray="188.5" strokeDashoffset="28.3" transform="rotate(-90 38 38)" />
              </svg>
              <p className="ecw-heading text-sm font-extrabold text-neutral-900 mt-2">48,500+</p>
              <p className="ecw-body text-[11px] text-neutral-500">Active students</p>
            </div>
            <div className="flex flex-col items-center text-center flex-1 min-w-[120px]">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="30" fill="none" stroke="#E5F0FF" strokeWidth="7" />
                <circle cx="38" cy="38" r="30" fill="none" stroke="rgb(22,32,111)" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray="188.5" strokeDashoffset="3.8" transform="rotate(-90 38 38)" />
              </svg>
              <p className="ecw-heading text-sm font-extrabold text-neutral-900 mt-2">98%</p>
              <p className="ecw-body text-[11px] text-neutral-500">Teacher approval</p>
            </div>
            <div className="flex flex-col items-center text-center flex-1 min-w-[120px]">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="30" fill="none" stroke="#E5F0FF" strokeWidth="7" />
                <circle cx="38" cy="38" r="30" fill="none" stroke="#178754" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray="188.5" strokeDashoffset="1.9" transform="rotate(-90 38 38)" />
              </svg>
              <p className="ecw-heading text-sm font-extrabold text-neutral-900 mt-2">99.9%</p>
              <p className="ecw-body text-[11px] text-neutral-500">System uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR TEAM */}
      <section id="team" className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">Our team</span>
            <h2 className="ecw-heading text-2xl font-extrabold text-neutral-900 mt-2">
              The people who built Easy ClassWork Records
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex flex-col items-center text-center bg-neutral-50 rounded-2xl border border-neutral-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full sm:w-[45%] lg:w-[22%]">
              <span className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-100 shadow-sm">
                <UserCircle2 className="w-14 h-14 text-[#178754]" aria-hidden="true" />
              </span>
              <p className="ecw-heading font-bold text-sm text-neutral-900">Erneste Itangishaka</p>
              <p className="ecw-body text-xs mt-0.5 text-[#178754]">Founder and lead engineer</p>
            </div>
            <div className="flex flex-col items-center text-center bg-neutral-50 rounded-2xl border border-neutral-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full sm:w-[45%] lg:w-[22%]">
              <span className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-100 shadow-sm">
                <UserCircle2 className="w-14 h-14 text-[rgb(22,32,111)]" aria-hidden="true" />
              </span>
              <p className="ecw-heading font-bold text-sm text-neutral-900">Aline Umurerwa</p>
              <p className="ecw-body text-xs mt-0.5 text-[rgb(22,32,111)]">Product designer</p>
            </div>
            <div className="flex flex-col items-center text-center bg-neutral-50 rounded-2xl border border-neutral-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full sm:w-[45%] lg:w-[22%]">
              <span className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-100 shadow-sm">
                <UserCircle2 className="w-14 h-14 text-[#178754]" aria-hidden="true" />
              </span>
              <p className="ecw-heading font-bold text-sm text-neutral-900">Mukunzi Joseph</p>
              <p className="ecw-body text-xs mt-0.5 text-[#178754]">Backend Developer</p>
            </div>
            <div className="flex flex-col items-center text-center bg-neutral-50 rounded-2xl border border-neutral-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full sm:w-[45%] lg:w-[22%]">
              <span className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-100 shadow-sm">
                <UserCircle2 className="w-14 h-14 text-[rgb(22,32,111)]" aria-hidden="true" />
              </span>
              <p className="ecw-heading font-bold text-sm text-neutral-900">Ngendahimana Joseph</p>
              <p className="ecw-body text-xs mt-0.5 text-[rgb(22,32,111)]">Curriculum lead</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-14 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">In their words</span>
            <h2 className="ecw-heading text-2xl font-extrabold text-neutral-900 mt-2">Teachers who use it every day</h2>
          </div>

          <div className="flex flex-wrap gap-5">
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 w-full md:w-[31%]">
              <UserCircle2 className="w-12 h-12 text-[#178754] mb-3" aria-hidden="true" />
              <p className="ecw-body text-xs text-neutral-700 leading-relaxed mb-4">"I used to spend a whole weekend marking. Now the quizzes grade themselves and I mark the harder work by hand."</p>
              <p className="ecw-heading text-xs font-bold text-neutral-900">Abayo Albertine</p>
              <p className="ecw-body text-[11px] text-neutral-500">Geo Teacher,LFHS</p>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 w-full md:w-[31%]">
              <UserCircle2 className="w-12 h-12 text-[rgb(22,32,111)] mb-3" aria-hidden="true" />
              <p className="ecw-body text-xs text-neutral-700 leading-relaxed mb-4">"Report cards that took two weeks at the end of term now take an afternoon."</p>
              <p className="ecw-heading text-xs font-bold text-neutral-900">Dushime Benjmain</p>
              <p className="ecw-body text-[11px] text-neutral-500">Head teacher, Gs Nyamirambo</p>
            </div>
            <div className="flex flex-col bg-white rounded-xl p-5 border border-neutral-100 w-full md:w-[31%]">
              <UserCircle2 className="w-12 h-12 text-[#178754] mb-3" aria-hidden="true" />
              <p className="ecw-body text-xs text-neutral-700 leading-relaxed mb-4">"My students open the notes from their phones on the bus home, and that changed how much they read."</p>
              <p className="ecw-heading text-xs font-bold text-neutral-900">Shyaka JUles</p>
              <p className="ecw-body text-[11px] text-neutral-500">Math Teacher,Gs Rubona</p>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section id="partners" className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-400 text-center mb-8">Our partners</p>
          <div className="flex flex-wrap gap-5">
            <div className="flex items-center gap-3 bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex-1 min-w-[220px]">
              <span className="w-11 h-11 rounded-full bg-[#EAF6EF] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#178754]" aria-hidden="true" />
              </span>
              <div>
                <p className="ecw-heading font-bold text-xs text-neutral-900">MINEDUC</p>
                <p className="ecw-body text-[10px] text-neutral-500">Ministry of Education</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex-1 min-w-[220px]">
              <span className="w-11 h-11 rounded-full bg-[#E6F1FB] flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 text-[#1D6FE0]" aria-hidden="true" />
              </span>
              <div>
                <p className="ecw-heading font-bold text-xs text-neutral-900">REB</p>
                <p className="ecw-body text-[10px] text-neutral-500">Basic Education Board</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex-1 min-w-[220px]">
              <span className="w-11 h-11 rounded-full bg-[#EAF6EF] flex items-center justify-center shrink-0">
                <ScrollText className="w-5 h-5 text-[#178754]" aria-hidden="true" />
              </span>
              <div>
                <p className="ecw-heading font-bold text-xs text-neutral-900">NESA</p>
                <p className="ecw-body text-[10px] text-neutral-500">National Examination</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-neutral-50 rounded-xl p-4 border border-neutral-100 flex-1 min-w-[220px]">
              <span className="w-11 h-11 rounded-full bg-[#E6F1FB] flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5 text-[#1D6FE0]" aria-hidden="true" />
              </span>
              <div>
                <p className="ecw-heading font-bold text-xs text-neutral-900">ASYV</p>
                <p className="ecw-body text-[10px] text-neutral-500">System supporter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-14 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-wrap gap-10 items-center">
          <div className="flex-1 min-w-[260px]">
            <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">Contact</span>
            <h2 className="ecw-heading text-2xl font-extrabold text-neutral-900 mt-2 mb-3">Talk to us before you sign up</h2>
            <p className="ecw-body text-xs text-neutral-600 leading-relaxed mb-5">
              Have questions about pricing, your school code, or how the switch works
              partway through a term? Reach the helpline and someone will walk you through it.
            </p>
            <div className="flex flex-col gap-2 text-xs ecw-body text-neutral-700">
              <p>support@classwork.rw</p>
              <p>+250 788 000 000</p>
              <p>Kigali, Rwanda</p>
            </div>
          </div>
          <div className="flex-1 min-w-[260px] bg-white rounded-xl p-6 border border-neutral-100">
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Full name" className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400" />
              <input type="text" placeholder="School name" className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400" />
              <textarea placeholder="How can we help?" rows="3" className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-green-400"></textarea>
              <button type="button" className="w-full py-2.5 text-white font-bold text-xs rounded-lg transition-opacity hover:opacity-90 bg-[rgb(22,32,111)]">
                Send message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-white pt-12 bg-[rgb(22,32,111)]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-10 flex flex-wrap gap-8">
          <div className="flex flex-col gap-3 flex-1 min-w-[220px]">
            <div className="flex items-center gap-2.5">
              <span className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <School className="w-6 h-6 text-white" aria-hidden="true" />
              </span>
              <span className="ecw-heading font-bold text-sm">Easy ClassWork Records</span>
            </div>
            <p className="ecw-body text-[11px] text-white/70 leading-relaxed">
              Academic records and classroom tools built for primary and secondary schools across Rwanda.
            </p>
            </div>


          <div className="flex-1 min-w-[160px]">
            <h4 className="ecw-heading font-bold text-xs uppercase tracking-wider mb-3">System</h4>
            <ul className="flex flex-col gap-2 text-[11px] ecw-body text-white/70">
              <li><a href="#services" className="hover:text-green-300 transition-colors">Our services</a></li>
              <li><a href="#register" className="hover:text-green-300 transition-colors">School registration</a></li>
              <li><a href="#dashboard" className="hover:text-green-300 transition-colors">Live dashboard</a></li>
              <li><a href="#team" className="hover:text-green-300 transition-colors">Our team</a></li>
            </ul>
          </div>

          <div className="flex-1 min-w-[160px]">
            <h4 className="ecw-heading font-bold text-xs uppercase tracking-wider mb-3">Helpline</h4>
            <ul className="flex flex-col gap-2 text-[11px] ecw-body text-white/70">
              <li>support@classwork.rw</li>
              <li>+250 788 000 000</li>
              <li>Kigali, Rwanda</li>
            </ul>
          </div>

       </div>

        <div className="border-t border-white/10 py-4 px-5 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] ecw-body text-white/60">
            <p>© 2026 Easy ClassWork Records. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#home" className="hover:text-white transition-colors">Privacy policy</a>
              <a href="#home" className="hover:text-white transition-colors">Terms of service</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}