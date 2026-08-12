import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import {
  ArrowLeft,
  LogIn,
  MapPin,
  Building2,
  Mail,
  Phone,
  Layers,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  School,
  Smartphone,
  Wallet,
  ClipboardCheck,
  BadgeCheck,
  Languages,
} from "lucide-react";

// The only image asset used anywhere in this form — the brand mark.
import logos from "./assets/logo.jpg";

/* ============================================================================
   CONFIG
   ============================================================================ */

const API_BASE = "http://localhost:5000";
const BRAND_NAME = "Easy Class Records System";
const DEFAULT_REGISTRATION_FEE = "5000";

/* ============================================================================
   CONSTANTS
   ============================================================================ */

const DISTRICTS_BY_PROVINCE = {
  "Kigali City": ["Nyarugenge", "Gasabo", "Kicukiro"],
  "Northern Province": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  "Southern Province": ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
  "Eastern Province": ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
  "Western Province": ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"],
};

const LEVEL_KEYS = ["nursery", "primary", "secondary", "university"];

// Payment brands are represented with icon + color tokens only — no logo images.
const PAYMENT_METHODS = [
  { key: "mtn", label: "MTN Mobile Money", icon: Smartphone, tint: "#FFCB05", ink: "#7A5E00" },
  { key: "airtel", label: "Airtel Money", icon: Smartphone, tint: "#ED1C24", ink: "#8C1015" },
  { key: "paypal", label: "PayPal", icon: Wallet, tint: "#0070BA", ink: "#0B4A78" },
];

const INITIAL_FORM = {
  registeringAs: "school",
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
  schoolName: "",
  schoolEmail: "",
  phone: "",
  levels: [],
  ownership: "",
  residence: "",
  payment: "",
};

/* ============================================================================
   HELPERS
   ============================================================================ */

function buildDistrictTree(district) {
  const letters = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix} ${String.fromCharCode(65 + i)}`);
  const tree = {};
  letters(`${district} Sector`, 3).forEach((sector) => {
    tree[sector] = {};
    letters(`${sector} Cell`, 3).forEach((cell) => {
      tree[sector][cell] = letters(`${cell} Village`, 3);
    });
  });
  return tree;
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Rwandan mobile numbers: 10 digits total, starting with 07 (MTN/Airtel/Tigo ranges).
// Accepts an optional +250 prefix and strips spaces/dashes before validating.
function normalizeRwandaPhone(raw) {
  let v = (raw || "").replace(/[\s-]/g, "");
  if (v.startsWith("+250")) v = "0" + v.slice(4);
  else if (v.startsWith("250")) v = "0" + v.slice(3);
  return v;
}
const isValidRwandaPhone = (raw) => /^07[0-9]{8}$/.test(normalizeRwandaPhone(raw));

/* ============================================================================
   TEXT — English
   ============================================================================ */

const T_EN = {
  backHome: "Back to home",
  login: "Log in",
  langSwitch: "Kinyarwanda",
  locationVerified: "Location verified — Rwanda",
  asideEyebrow: "GETTING STARTED",
  asideTitle: "One record system, every institution.",
  asideDesc:
    "Easy Class Records connects schools and exam centers across Rwanda so results, enrollment, and payments live in one place.",
  step1: ["Confirm your location", "We verify you're registering from within Rwanda."],
  step2: ["Add institution details", "Name, contact, levels offered, ownership."],
  step3: ["Verify your email", "We send a code to your institution email to confirm it's really yours."],
  step4: ["Choose how you'll pay", "Airtel Money, MTN Mobile Money, or PayPal."],
  step1Short: "Location",
  step2Short: "Institution",
  step3Short: "Email",
  step4Short: "Payment",
  formEyebrow: "INSTITUTION REGISTRATION",
  formTitle: "Register your institution",
  formDesc: "Open to schools in Rwanda and to other organizations that wish to administer exams through this platform.",
  registeringAs: "Registering as",
  optionSchool: "A school",
  optionOther: "Another organization offering exams",
  locationSection: "Location within Rwanda",
  province: "Province",
  district: "District",
  sector: "Sector",
  cell: "Cell",
  village: "Village",
  institutionSection: "Institution details",
  namePh: "Institution name",
  emailPh: "Institution email",
  phonePh: "07XX XXX XXX",
  phoneInvalid: "Enter a valid Rwandan number — 10 digits, starting with 07",
  phoneValid: "Valid Rwandan number",
  levels: "School level(s) offered",
  nursery: "Nursery",
  primary: "Primary",
  secondary: "Secondary",
  university: "University",
  ownership: "Ownership",
  public: "Public",
  private: "Private",
  chooseOwnership: "Ownership type",
  residence: "Residence type",
  day: "Day",
  boarding: "Boarding",
  both: "Both",
  chooseResidence: "Residence type",

  emailChecking: "Checking that this domain can receive mail…",
  emailValidDomain: "Domain looks valid — we'll still confirm by email code",
  emailInvalidDomain: "This domain doesn't appear to accept email — check for typos",
  emailCheckFailed: "Couldn't verify this domain right now",

  verifySection: "Email verification",
  verifyHint:
    "Fill in the institution details above first. We'll email a one-time code to this address — only entering that exact code marks your email as verified.",
  sendCode: "Send verification code",
  sendingCode: "Sending code…",
  resendCode: "Resend code",
  verifiedBadge: "Email verified",
  emailChangedNotice: "You changed the email address — please verify it again.",
  verifyModalTitle: "Verify your email",
  verifyModalDesc: "We sent a 6-digit code to",
  otpLabel: "Verification code",
  otpPlaceholder: "6-digit code",
  verifyBtn: "Verify",
  verifying: "Verifying…",
  verifyFailed: "Verification failed. Please try again.",
  codeExpired: "Code expired or invalid. Please request a new one.",

  payment: "Payment method",
  paymentHint: "Verify your email first, then choose a payment method to pay the registration fee.",
  paymentLockedHint: "Verify your email above to unlock payment.",
  paid: "Paid",
  submit: "Submit registration",
  submitting: "Submitting…",
  already: "Already registered?",
  successTitle: "Registration submitted",
  successUnder: "has been registered under",
  successSentTo: "A confirmation will be sent to",
  yourSchoolCode: "Your school code",
  keepCodeSafe: "Keep this code safe — you'll need it to log in.",
  registerAnother: "Register another institution",
  validationError: "Please complete every field above, verify your email, then pay the registration fee.",
  fillFirstError: "Please fill in the institution and location details before verifying your email.",
  serverError: "Registration failed. Please try again.",
  networkError: "Could not reach the server. Please check your connection and try again.",
  modalTitle: "Registration fee",
  modalDesc: "Enter the phone number to charge for the registration fee.",
  phoneLabel: "Payer phone number *",
  amountLabel: "Amount (RWF) *",
  payBtn: "Send payment",
  processing: "Waiting for payment confirmation…",
  paymentDone: "Payment confirmed!",
  paymentFailed: "Payment failed. Please try again.",
  close: "Close",
  gateBadge: "LOCATION VERIFICATION",
  gateChecking: ["Checking your location…", "This only takes a moment."],
  gateReady: ["You're registering from Rwanda", "We detected your location as", "Please confirm this is correct to continue."],
  gateConfirm: "Confirm & continue",
  gateRecheck: "That's not right — check again",
  gateNotRwanda: [
    "Registration not available here",
    "We detected your location as",
    "This system is only available to institutions physically located in Rwanda.",
  ],
  gateCheckAgain: "Check again",
  gateError: ["Couldn't verify location", "Please check your connection and try again."],
  gateTryAgain: "Try again",
  outsideRwanda: "outside Rwanda",
};

/* ============================================================================
   TEXT — Kinyarwanda
   ============================================================================ */

const T_RW = {
  backHome: "Garuka ahabanza",
  login: "Injira",
  langSwitch: "English",
  locationVerified: "Aho uri byemejwe — u Rwanda",
  asideEyebrow: "TANGIRA HANO",
  asideTitle: "Sisitemu imwe y'inyandiko, kuri buri kigo.",
  asideDesc:
    "Easy Class Records ihuza amashuri n'ibigo by'ibizamini mu Rwanda hose kugira ngo ibisubizo, kwiyandikisha, n'kwishyura bibike ahantu hamwe.",
  step1: ["Emeza aho uri", "Turareba niba wiyandikisha uri mu Rwanda."],
  step2: ["Shyiramo amakuru y'ikigo", "Izina, aho bavugana, amashuri atangwa, nyir'ikigo."],
  step3: ["Emeza email yawe", "Turohereza kode kuri email y'ikigo kugira ngo twemeze ko ari iyawe."],
  step4: ["Hitamo uburyo uzishyura", "Airtel Money, MTN Mobile Money, cyangwa PayPal."],
  step1Short: "Aho uri",
  step2Short: "Ikigo",
  step3Short: "Email",
  step4Short: "Kwishyura",
  formEyebrow: "KWIYANDIKISHA KW'IKIGO",
  formTitle: "Andikisha ikigo cyawe",
  formDesc: "Birafunguriwe amashuri yo mu Rwanda n'indi miryango ishaka gutanga ibizamini binyuze kuri iyi sisitemu.",
  registeringAs: "Wiyandikisha nka",
  optionSchool: "Ishuri",
  optionOther: "Undi muryango utanga ibizamini",
  locationSection: "Aho uri mu Rwanda",
  province: "Intara",
  district: "Akarere",
  sector: "Umurenge",
  cell: "Akagari",
  village: "Umudugudu",
  institutionSection: "Amakuru y'ikigo",
  namePh: "Izina ry'ikigo",
  emailPh: "Email y'ikigo",
  phonePh: "07XX XXX XXX",
  phoneInvalid: "Andika nimero nyayo yo mu Rwanda — imibare 10, itangira na 07",
  phoneValid: "Nimero nyayo yo mu Rwanda",
  levels: "Amashuri atangwa",
  nursery: "Incuke",
  primary: "Abanza",
  secondary: "Ayisumbuye",
  university: "Kaminuza",
  ownership: "Nyir'ikigo",
  public: "Rusange (Leta)",
  private: "Byigenga",
  chooseOwnership: "Ubwoko bw'ikigo",
  residence: "Ubwoko bw'ubwicaro",
  day: "Amanywa",
  boarding: "Arara",
  both: "Byombi",
  chooseResidence: "Ubwoko bw'ubwicaro",

  emailChecking: "Turi kureba niba iyi domain ishobora kwakira imeyili…",
  emailValidDomain: "Domain isa n'inziza — tuzabikemeza na none binyuze kuri kode",
  emailInvalidDomain: "Iyi domain isa n'itakira imeyili — reba niba wanditse neza",
  emailCheckFailed: "Ntibyashobotse kwemeza iyi domain ubu",

  verifySection: "Kwemeza email",
  verifyHint:
    "Banza wuzuze amakuru y'ikigo hejuru. Tuzohereza kode kuri iyi email — ari uko wanditse neza kode nyayo, email yawe izemezwa.",
  sendCode: "Ohereza kode yo kwemeza",
  sendingCode: "Kohereza kode…",
  resendCode: "Ongera wohereze kode",
  verifiedBadge: "Email yemejwe",
  emailChangedNotice: "Wahinduye aderesi ya email — ongera uyemeze.",
  verifyModalTitle: "Emeza email yawe",
  verifyModalDesc: "Twohereje kode y'imibare 6 kuri",
  otpLabel: "Kode yo kwemeza",
  otpPlaceholder: "Kode y'imibare 6",
  verifyBtn: "Emeza",
  verifying: "Kwemeza…",
  verifyFailed: "Kwemeza byanze. Ongera ugerageze.",
  codeExpired: "Kode yarangiye igihe cyangwa si yo. Saba indi.",

  payment: "Uburyo bwo kwishyura",
  paymentHint: "Banza wemeze email yawe, hanyuma uhitemo uburyo bwo kwishyura amafaranga y'iyandikisha.",
  paymentLockedHint: "Emeza email yawe hejuru kugira ngo ushobore kwishyura.",
  paid: "Byishyuwe",
  submit: "Ohereza iyandikisha",
  submitting: "Kohereza…",
  already: "Wamaze kwiyandikisha?",
  successTitle: "Iyandikisha ryoherejwe",
  successUnder: "yandikishijwe munsi ya",
  successSentTo: "Iyemeza rizoherezwa kuri",
  yourSchoolCode: "Kode y'ishuri ryawe",
  keepCodeSafe: "Bika neza iyi kode — uzayikenera kugira ngo winjire.",
  registerAnother: "Andikisha ikindi kigo",
  validationError: "Uzuza buri gice hejuru, wemeze email yawe, hanyuma wishyure amafaranga y'iyandikisha.",
  fillFirstError: "Uzuza amakuru y'ikigo n'aho uri mbere yo kwemeza email yawe.",
  serverError: "Iyandikisha ryanze. Ongera ugerageze.",
  networkError: "Ntibyashobotse guhuza na seriveri. Reba interineti yawe hanyuma ugerageze.",
  modalTitle: "Amafaranga y'iyandikisha",
  modalDesc: "Andika nimero ya telefoni izakoreshwa mu kwishyura amafaranga y'iyandikisha.",
  phoneLabel: "Nimero ya telefoni y'uwishyura *",
  amountLabel: "Amafaranga (RWF) *",
  payBtn: "Ohereza ubwishyu",
  processing: "Gutegereza iyemeza ry'ubwishyu…",
  paymentDone: "Ubwishyu bwemejwe!",
  paymentFailed: "Ubwishyu bwanze. Ongera ugerageze.",
  close: "Funga",
  gateBadge: "KWEMEZA AHO URI",
  gateChecking: ["Turi kureba aho uri…", "Bizatwara akanya gato."],
  gateReady: ["Wiyandikisha uri mu Rwanda", "Twabonye ko uri i", "Emeza ko ibi ari byo kugira ngo ukomeze."],
  gateConfirm: "Emeza & ukomeze",
  gateRecheck: "Ibyo si byo — ongera urebe",
  gateNotRwanda: [
    "Kwiyandikisha ntibiboneka hano",
    "Twabonye ko uri i",
    "Iyi sisitemu iboneka gusa ku bigo biri mu Rwanda by'ukuri.",
  ],
  gateCheckAgain: "Ongera urebe",
  gateError: ["Ntibyashobotse kwemeza aho uri", "Reba interineti yawe hanyuma ugerageze."],
  gateTryAgain: "Ongera ugerageze",
  outsideRwanda: "hanze y'u Rwanda",
};

const TextCtx = createContext(T_EN);
const useT = () => useContext(TextCtx);

/* ============================================================================
   DESIGN TOKENS (kept consistent across every sub-component)
   ============================================================================ */

const INK = "rgb(11,22,111)";
const INK_DARK = "rgb(7,14,74)";
const EMERALD = "#1E9E5A";
const AMBER = "#C97C0E";
const PAPER = "#FFFFFF";
const LINE = "#E4E7F2";

/* ============================================================================
   ROOT COMPONENT
   ============================================================================ */

export default function RegistrationForm({ onBackHome, onLogin }) {
  const [status, setStatus] = useState("checking");
  const [place, setPlace] = useState("");
  const [lang, setLang] = useState("en");
  const t = lang === "rw" ? T_RW : T_EN;

  async function checkLocation() {
    setStatus("checking");
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error("lookup failed");
      const data = await res.json();
      setPlace([data.city, data.region, data.country_name].filter(Boolean).join(", "));
      setStatus(data.country_code === "RW" ? "ready" : "not-rwanda");
    } catch {
      setPlace("Rwanda");
      setStatus("ready");
    }
  }

  useEffect(() => {
    checkLocation();
  }, []);

  return (
    <TextCtx.Provider value={t}>
      <div className="min-h-screen" style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: PAPER }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" />
        <GlobalKeyframes />

        <TopBar onBackHome={onBackHome} onLogin={onLogin} showLogin={status === "confirmed"} lang={lang} setLang={setLang} />

        {status !== "confirmed" ? (
          <LocationGate status={status} place={place} onRecheck={checkLocation} onConfirm={() => setStatus("confirmed")} />
        ) : (
          <RegistrationFormBody onLogin={onLogin} />
        )}
      </div>
    </TextCtx.Provider>
  );
}

// A few small, purposeful keyframes shared by the progress rail and blobs.
function GlobalKeyframes() {
  return (
    <style>{`
      @keyframes stepIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes drift { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(10px,-14px) scale(1.05); } }
      @keyframes popIn { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
      @keyframes floatY { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
      @keyframes typeBlink { 0%, 45% { opacity: 1; } 50%, 100% { opacity: 0; } }
      @keyframes sunSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes rise { from { opacity: 0; transform: translateY(4px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
}

/* ============================================================================
   RWANDA FLAG (inline SVG — no external image needed)
   ============================================================================ */

function RwandaFlag({ size = 20, rounded = true, ring = false }) {
  const w = size;
  const h = Math.round(size * 0.7);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 30 21"
      className={rounded ? "rounded-[2px]" : ""}
      style={ring ? { boxShadow: "0 0 0 1px rgba(255,255,255,0.4)" } : undefined}
      aria-label="Rwanda flag"
      role="img"
    >
      <rect x="0" y="0" width="30" height="21" fill="#20603D" />
      <rect x="0" y="0" width="30" height="15.75" fill="#00A1DE" />
      <rect x="0" y="13.5" width="30" height="2.25" fill="#FAD201" />
      <g transform="translate(23,6)">
        <circle r="2.6" fill="#E5BE01" />
        {Array.from({ length: 24 }).map((_, i) => (
          <rect key={i} x="-0.18" y="-4.6" width="0.36" height="1.9" fill="#E5BE01" transform={`rotate(${i * 15})`} />
        ))}
      </g>
    </svg>
  );
}

/* ============================================================================
   STUDENT-ON-A-LAPTOP ILLUSTRATION (inline SVG, animated, no external images)
   ============================================================================ */

function StudentIllustration() {
  return (
    <svg viewBox="0 0 260 170" className="w-full h-auto" role="img" aria-label="Student profile on a laptop">
      {/* soft ground shadow */}
      <ellipse cx="130" cy="156" rx="86" ry="8" fill="rgba(0,0,0,0.18)" />

      {/* laptop base */}
      <g style={{ animation: "floatY 5s ease-in-out infinite" }}>
        <rect x="52" y="118" width="156" height="10" rx="4" fill="rgba(11,22,111,0.10)" />
        <path d="M64 118 L72 74 H188 L196 118 Z" fill="rgba(11,22,111,0.05)" stroke="rgba(11,22,111,0.25)" strokeWidth="1.5" />

        {/* laptop screen */}
        <rect x="78" y="30" width="104" height="70" rx="6" fill="rgb(7,14,74)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <rect x="84" y="36" width="92" height="58" rx="3" fill="#0E1B86" />

        {/* screen content: a little profile card */}
        <circle cx="106" cy="56" r="9" fill="#F6F7FB" />
        <path d="M94 78c2-8 8-12 12-12s10 4 12 12" fill="#F6F7FB" opacity="0.9" />
        <rect x="126" y="49" width="40" height="4" rx="2" fill="#1E9E5A" />
        <rect x="126" y="58" width="34" height="3.2" rx="1.6" fill="rgba(255,255,255,0.55)" />
        <rect x="126" y="65" width="28" height="3.2" rx="1.6" fill="rgba(255,255,255,0.35)" />
        <rect x="94" y="82" width="72" height="7" rx="3.5" fill="#1E9E5A" opacity="0.9">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
        </rect>

        {/* blinking cursor to suggest "typing / verifying" */}
        <rect x="150" y="83.5" width="2" height="4" fill="#F6F7FB" style={{ animation: "typeBlink 1.1s steps(1) infinite" }} />
      </g>

      {/* seated student silhouette */}
      <g style={{ animation: "floatY 5s ease-in-out infinite 0.3s" }}>
        <circle cx="130" cy="112" r="11" fill="#E5BE01" />
        <path d="M110 150c1-16 9-27 20-27s19 11 20 27z" fill="#E5BE01" />
      </g>

      {/* graduation cap, floating above */}
      <g style={{ animation: "floatY 4.2s ease-in-out infinite 0.6s" }}>
        <path d="M130 14 L166 26 L130 38 L94 26 Z" fill="#C97C0E" />
        <path d="M130 38 L130 50" stroke="#C97C0E" strokeWidth="2" />
        <circle cx="130" cy="52" r="3" fill="#C97C0E" />
        <path d="M110 30 v10c0 5 9 9 20 9s20-4 20-9V30" fill="none" stroke="#C97C0E" strokeWidth="2" opacity="0.55" />
      </g>

      {/* small floating "verified" badge */}
      <g style={{ animation: "rise 2.6s ease-in-out infinite" }} transform="translate(188,44)">
        <circle r="11" fill="#1E9E5A" />
        <path d="M-4.5 0.5 L-1.5 3.5 L5 -3.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* small floating chat/notification dot */}
      <g transform="translate(70,50)" style={{ animation: "rise 2.6s ease-in-out infinite 1s" }}>
        <circle r="7" fill="#F6F7FB" opacity="0.85" />
        <circle r="2.5" fill="rgb(11,22,111)" />
      </g>
    </svg>
  );
}

/* ============================================================================
   TOP BAR
   ============================================================================ */

function TopBar({ onBackHome, onLogin, showLogin, lang, setLang }) {
  const t = useT();
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={onBackHome}
        className="order-1 inline-flex items-center gap-1.5 border border-slate-200 bg-white text-[rgb(11,22,111)] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        <span className="hidden xs:inline">{t.backHome}</span>
      </button>

      <div className="order-3 sm:order-2 flex items-center gap-2.5">
        <img src={logos} alt={`${BRAND_NAME} logo`} className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200" />
        <span className="text-[13px] font-extrabold tracking-tight" style={{ color: INK, fontFamily: "'Poppins', sans-serif" }}>
          {BRAND_NAME}
        </span>
      </div>

      <div className="order-2 sm:order-3 flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setLang((l) => (l === "en" ? "rw" : "en"))}
          className="inline-flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
          style={{ color: INK }}
          aria-label="Switch language"
        >
          <RwandaFlag size={16} />
          <Languages size={13} strokeWidth={2.5} className="sm:hidden" />
          <span className="hidden sm:inline">{t.langSwitch}</span>
        </button>

        {showLogin && (
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center gap-1.5 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
            style={{ background: EMERALD }}
          >
            <LogIn size={14} strokeWidth={2.5} />
            {t.login}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   LOCATION GATE
   ============================================================================ */

function LocationGate({ status, place, onRecheck, onConfirm }) {
  const t = useT();
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm text-center bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/60 px-6 sm:px-7 py-8">
        <div className="relative w-12 h-12 mx-auto mb-4 flex items-center justify-center">
          {status === "checking" && (
            <span className="absolute inset-0 rounded-full border-2 border-slate-200" style={{ borderTopColor: EMERALD }}>
              <Loader2 size={0} />
            </span>
          )}
          {status === "checking" && <div className="absolute inset-0 rounded-full border-2 border-slate-200 border-t-transparent animate-spin" style={{ borderTopColor: EMERALD }} />}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: status === "not-rwanda" ? "#FEF2F2" : "#ECFDF5" }}
          >
            {status === "ready" && <CheckCircle2 size={18} color={EMERALD} strokeWidth={2.5} />}
            {status === "checking" && <MapPin size={16} color={EMERALD} strokeWidth={2.5} />}
            {status === "not-rwanda" && <AlertCircle size={18} color="#DC2626" strokeWidth={2.5} />}
            {status === "error" && <AlertCircle size={18} color="#DC2626" strokeWidth={2.5} />}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] tracking-widest font-bold mb-1.5" style={{ color: AMBER }}>
          <RwandaFlag size={14} />
          {t.gateBadge}
        </div>

        {status === "checking" && (
          <>
            <h1 className="text-lg font-bold mb-1.5" style={{ color: INK, fontFamily: "'Poppins', sans-serif" }}>{t.gateChecking[0]}</h1>
            <p className="text-xs text-slate-500">{t.gateChecking[1]}</p>
          </>
        )}

        {status === "ready" && (
          <>
            <h1 className="text-lg font-bold mb-1.5" style={{ color: INK, fontFamily: "'Poppins', sans-serif" }}>{t.gateReady[0]}</h1>
            <p className="text-xs text-slate-500 mb-5">
              {t.gateReady[1]} <span className="font-semibold" style={{ color: INK }}>{place}</span>. {t.gateReady[2]}
            </p>
            <button
              type="button"
              onClick={onConfirm}
              className="w-full rounded-lg text-white text-sm font-bold py-2.5 hover:opacity-95 transition-opacity shadow-sm"
              style={{ background: INK }}
            >
              {t.gateConfirm}
            </button>
            <button type="button" onClick={onRecheck} className="w-full mt-2 text-[11px] font-semibold py-1.5" style={{ color: INK }}>
              {t.gateRecheck}
            </button>
          </>
        )}

        {status === "not-rwanda" && (
          <>
            <h1 className="text-lg font-bold mb-1.5" style={{ color: INK, fontFamily: "'Poppins', sans-serif" }}>{t.gateNotRwanda[0]}</h1>
            <p className="text-xs text-slate-500 mb-5">
              {t.gateNotRwanda[1]} <span className="font-semibold" style={{ color: INK }}>{place || t.outsideRwanda}</span>. {t.gateNotRwanda[2]}
            </p>
            <button
              type="button"
              onClick={onRecheck}
              className="w-full rounded-lg border border-slate-200 text-sm font-semibold py-2.5 hover:bg-slate-50 transition-colors"
              style={{ color: INK }}
            >
              {t.gateCheckAgain}
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-lg font-bold mb-1.5" style={{ color: INK, fontFamily: "'Poppins', sans-serif" }}>{t.gateError[0]}</h1>
            <p className="text-xs text-slate-500 mb-5">{t.gateError[1]}</p>
            <button type="button" onClick={onRecheck} className="w-full rounded-lg text-white text-sm font-bold py-2.5 hover:opacity-95 transition-opacity" style={{ background: INK }}>
              {t.gateTryAgain}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   EMAIL DOMAIN CHECK — a preliminary heuristic only (MX lookup).
   This can never *prove* a mailbox exists; the OTP step below is the real,
   authoritative verification and is the only thing allowed to set `verified`.
   ============================================================================ */

function useEmailDomainCheck(email) {
  const [state, setState] = useState({ status: "idle" }); // idle | checking | valid | invalid | unknown

  useEffect(() => {
    if (!isValidEmail(email)) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "checking" });
    const domain = email.split("@")[1];
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
        const data = await res.json();
        const hasMx = Array.isArray(data.Answer) && data.Answer.length > 0;
        setState({ status: hasMx ? "valid" : "invalid" });
      } catch {
        setState({ status: "unknown" });
      }
    }, 650);
    return () => clearTimeout(handle);
  }, [email]);

  return state;
}

/* ============================================================================
   PROGRESS STEPS — shared between the desktop rail and the mobile bar
   ============================================================================ */

function useProgressSteps({ locationDone, institutionDone, verified, paymentConfirmed }) {
  const t = useT();
  return [
    { icon: MapPin, title: t.step1[0], short: t.step1Short, desc: t.step1[1], done: locationDone },
    { icon: Building2, title: t.step2[0], short: t.step2Short, desc: t.step2[1], done: institutionDone },
    { icon: Mail, title: t.step3[0], short: t.step3Short, desc: t.step3[1], done: verified },
    { icon: CreditCard, title: t.step4[0], short: t.step4Short, desc: t.step4[1], done: paymentConfirmed },
  ];
}

/* ============================================================================
   REGISTRATION FORM
   ============================================================================ */

function RegistrationFormBody({ onLogin }) {
  const t = useT();

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // `verified` only ever flips to true inside handleVerifyOtp, after the backend
  // confirms the OTP that was emailed to `verifiedEmail`. If the person edits the
  // email afterwards, verification no longer applies to the new address — see the
  // effect below. This is what stops a typo'd / nonexistent address from ever
  // showing as "verified".
  const [verified, setVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const [schoolId, setSchoolId] = useState(null);
  const [schoolCode, setSchoolCode] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payerPhone, setPayerPhone] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(DEFAULT_REGISTRATION_FEE);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [paymentError, setPaymentError] = useState("");
  const pollRef = useRef(null);

  const emailCheck = useEmailDomainCheck(form.schoolEmail);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function toggleLevel(key) {
    setForm((f) => ({
      ...f,
      levels: f.levels.includes(key) ? f.levels.filter((l) => l !== key) : [...f.levels, key],
    }));
  }

  // If the email address changes after being verified, the old verification no
  // longer means anything — drop it so the UI can never show "verified" next to
  // an address nobody actually confirmed.
  useEffect(() => {
    if (verified && form.schoolEmail !== verifiedEmail) {
      setVerified(false);
      setSchoolId(null);
      setSchoolCode(null);
    }
  }, [form.schoolEmail, verified, verifiedEmail]);

  const districtOptions = form.province ? DISTRICTS_BY_PROVINCE[form.province] : [];
  const districtTree = form.district ? buildDistrictTree(form.district) : {};
  const sectorOptions = Object.keys(districtTree);
  const cellOptions = form.sector ? Object.keys(districtTree[form.sector] || {}) : [];
  const villageOptions = form.sector && form.cell ? districtTree[form.sector][form.cell] || [] : [];

  const locationDone = !!(form.province && form.district && form.sector && form.cell && form.village);
  const phoneDone = isValidRwandaPhone(form.phone);
  const institutionDone = !!(
    form.schoolName.trim() &&
    isValidEmail(form.schoolEmail) &&
    phoneDone &&
    form.levels.length > 0 &&
    form.ownership &&
    form.residence
  );

  const isFormValidExceptPayment = locationDone && institutionDone && emailCheck.status !== "invalid";
  const paymentConfirmed = paymentStatus === "success";
  const isValid = isFormValidExceptPayment && verified && form.payment && paymentConfirmed;
  const showValidationError = submitted && !isValid;

  const steps = useProgressSteps({ locationDone, institutionDone, verified, paymentConfirmed });

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  async function handleSendCode() {
    setApiError("");
    setVerifyError("");

    if (!isFormValidExceptPayment) {
      setSubmitted(true);
      setApiError(t.fillFirstError);
      return;
    }

    setSendingCode(true);
    try {
      const response = await fetch(`${API_BASE}/api/schools/request-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registeringAs: form.registeringAs,
          province: form.province,
          district: form.district,
          sector: form.sector,
          cell: form.cell,
          village: form.village,
          schoolName: form.schoolName,
          schoolEmail: form.schoolEmail,
          phone: normalizeRwandaPhone(form.phone),
          levels: form.levels,
          ownership: form.ownership,
          residence: form.residence,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setOtpValue("");
        setVerifyModalOpen(true);
      } else {
        setApiError(result.message || t.serverError);
      }
    } catch (err) {
      console.error(err);
      setApiError(t.networkError);
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setVerifying(true);
    setVerifyError("");

    try {
      const response = await fetch(`${API_BASE}/api/schools/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.schoolEmail, otp: otpValue }),
      });
      const result = await response.json();

      // Only a genuine, positive confirmation from the backend — which only ever
      // happens if the code we emailed to this address was typed back correctly —
      // is allowed to flip `verified` to true. A wrong or nonexistent email never
      // receives the code, so it can never pass this check.
      if (response.ok && result.success) {
        setSchoolId(result.schoolId);
        setSchoolCode(result.schoolCode);
        setVerified(true);
        setVerifiedEmail(form.schoolEmail);
        setVerifyModalOpen(false);
      } else {
        setVerifyError(result.message || t.verifyFailed);
      }
    } catch (err) {
      console.error(err);
      setVerifyError(t.networkError);
    } finally {
      setVerifying(false);
    }
  }

  function handlePickPayment(methodKey) {
    if (!verified || !schoolId) return;
    set("payment", methodKey);
    setPayerPhone(form.phone);
    setPaymentStatus("idle");
    setPaymentError("");
    setPaymentModalOpen(true);
  }

  async function handleSendPayment(e) {
    e.preventDefault();
    if (!schoolId) return;

    setPaymentStatus("processing");
    setPaymentError("");

    try {
      const response = await fetch(`${API_BASE}/api/payments/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          provider: form.payment,
          payerPhone: normalizeRwandaPhone(payerPhone),
          amount: paymentAmount,
        }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        pollPaymentStatus(result.transactionId);
      } else {
        setPaymentStatus("failed");
        setPaymentError(result.message || t.paymentFailed);
      }
    } catch (err) {
      console.error(err);
      setPaymentStatus("failed");
      setPaymentError(t.networkError);
    }
  }

  function pollPaymentStatus(transactionRef) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payments/status/${transactionRef}`);
        const data = await res.json();
        if (data.status === "success") {
          clearInterval(pollRef.current);
          setPaymentStatus("success");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current);
          setPaymentStatus("failed");
          setPaymentError(t.paymentFailed);
        }
      } catch {
        // transient network hiccup while polling — keep trying
      }
    }, 3000);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    setSuccess(true);
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setSubmitted(false);
    setSuccess(false);
    setApiError("");
    setVerifyModalOpen(false);
    setSendingCode(false);
    setOtpValue("");
    setVerifying(false);
    setVerifyError("");
    setVerified(false);
    setVerifiedEmail("");
    setSchoolId(null);
    setSchoolCode(null);
    setPaymentStatus("idle");
    setPaymentError("");
    setPayerPhone("");
    setPaymentAmount(DEFAULT_REGISTRATION_FEE);
  }

  if (success) {
    return <SuccessScreen form={form} schoolCode={schoolCode} onRegisterAnother={resetForm} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
      <div className="flex items-center justify-center gap-2 text-[11px] font-semibold mb-4" style={{ color: EMERALD }}>
        <RwandaFlag size={16} />
        {t.locationVerified}
      </div>

      <MobileProgressBar steps={steps} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <ProgressRail steps={steps} />

        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 px-4 py-6 sm:px-8 sm:py-8">
          <div className="text-[10px] tracking-widest font-bold mb-1.5" style={{ color: AMBER }}>{t.formEyebrow}</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1.5" style={{ color: INK, fontFamily: "'Poppins', sans-serif" }}>{t.formTitle}</h1>
          <p className="text-xs text-slate-500 mb-6 max-w-md">{t.formDesc}</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <RegisteringAsField value={form.registeringAs} onChange={(v) => set("registeringAs", v)} />

            <LocationFields
              form={form}
              setForm={setForm}
              districtOptions={districtOptions}
              sectorOptions={sectorOptions}
              cellOptions={cellOptions}
              villageOptions={villageOptions}
            />

            <InstitutionFields form={form} set={set} toggleLevel={toggleLevel} emailCheck={emailCheck} phoneDone={phoneDone} />

            <VerifyEmailField
              verified={verified}
              sendingCode={sendingCode}
              onSendCode={handleSendCode}
              email={form.schoolEmail}
              emailChanged={verified === false && verifiedEmail && verifiedEmail !== form.schoolEmail}
            />

            <PaymentField
              selected={form.payment}
              confirmed={paymentConfirmed}
              verified={verified}
              onPick={handlePickPayment}
            />

            {showValidationError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <AlertCircle size={14} strokeWidth={2.5} /> {t.validationError}
              </p>
            )}
            {apiError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <AlertCircle size={14} strokeWidth={2.5} /> {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={!isValid}
              className="w-full rounded-lg text-white text-sm font-bold py-3 hover:opacity-95 transition-opacity disabled:opacity-35 disabled:cursor-not-allowed shadow-sm"
              style={{ background: INK }}
            >
              {t.submit}
            </button>

            <p className="text-center text-xs text-slate-500">
              {t.already}{" "}
              <a href="#" onClick={onLogin} className="font-bold no-underline" style={{ color: EMERALD }}>
                {t.login}
              </a>
            </p>
          </form>
        </div>
      </div>

      {verifyModalOpen && (
        <VerifyOtpModal
          email={form.schoolEmail}
          otpValue={otpValue}
          setOtpValue={setOtpValue}
          verifying={verifying}
          verifyError={verifyError}
          sendingCode={sendingCode}
          onSubmit={handleVerifyOtp}
          onResend={handleSendCode}
          onClose={() => setVerifyModalOpen(false)}
        />
      )}

      {paymentModalOpen && (
        <PaymentModal
          method={PAYMENT_METHODS.find((m) => m.key === form.payment)}
          payerPhone={payerPhone}
          setPayerPhone={setPayerPhone}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          paymentStatus={paymentStatus}
          paymentError={paymentError}
          onSend={handleSendPayment}
          onClose={() => setPaymentModalOpen(false)}
        />
      )}
    </div>
  );
}

/* ---------------------------- Mobile compact progress bar ---------------------------- */

function MobileProgressBar({ steps }) {
  const t = useT();
  const doneCount = steps.filter((s) => s.done).length;
  const pct = (doneCount / steps.length) * 100;

  return (
    <div className="lg:hidden mb-4 rounded-2xl p-4 relative overflow-hidden bg-white border border-slate-200 shadow-sm">
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-15 pointer-events-none" style={{ background: EMERALD, filter: "blur(30px)", animation: "drift 9s ease-in-out infinite" }} />

      <div className="relative flex items-center gap-3">
        <div className="w-16 h-16 shrink-0 rounded-xl p-1.5" style={{ background: "#F1F3FA" }}>
          <StudentIllustration />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest mb-1" style={{ color: AMBER }}>
            <RwandaFlag size={12} /> {t.asideEyebrow}
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: EMERALD }} />
          </div>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-4 gap-1.5">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors duration-300"
                style={{
                  background: s.done ? EMERALD : "#F1F3FA",
                  borderColor: s.done ? EMERALD : LINE,
                }}
              >
                {s.done ? <CheckCircle2 size={13} color="white" strokeWidth={2.75} /> : <Icon size={12} color={INK} strokeWidth={2.25} />}
              </span>
              <span className="text-[9px] font-semibold text-slate-600 text-center leading-tight">{s.short}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------- Progress rail (signature element) ---------------------------- */

function ProgressRail({ steps }) {
  const t = useT();
  const completedCount = steps.filter((s) => s.done).length;
  const fillPct = (completedCount / steps.length) * 100;

  return (
    <aside className="hidden lg:block">
      <div
        className="sticky top-6 rounded-2xl p-6 overflow-hidden relative"
        style={{ background: `linear-gradient(165deg, ${INK} 0%, ${INK_DARK} 100%)` }}
      >
        {/* ambient drifting shapes — quiet, not decorative noise */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
          style={{ background: EMERALD, filter: "blur(40px)", animation: "drift 9s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-0 -left-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
          style={{ background: AMBER, filter: "blur(36px)", animation: "drift 11s ease-in-out infinite reverse" }}
        />

        <div className="relative">
          <div className="flex items-center gap-1.5 text-[10px] tracking-widest font-bold mb-2" style={{ color: "#E8A72E" }}>
            <RwandaFlag size={14} />
            {t.asideEyebrow}
          </div>
          <h2 className="text-base font-bold mb-2 leading-snug text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.asideTitle}</h2>
          <p className="text-xs text-white/70 mb-4 leading-relaxed">{t.asideDesc}</p>

          {/* signature illustration: student profile on a laptop */}
          <div className="mb-5 -mx-1">
            <StudentIllustration />
          </div>

          <div className="relative">
            {/* base track + animated fill */}
            <div className="absolute left-[13px] top-2 bottom-2 w-px bg-white/15" />
            <div
              className="absolute left-[13px] top-2 w-px transition-all duration-700 ease-out"
              style={{ height: `calc(${fillPct}% - 8px)`, background: EMERALD }}
            />

            <ul className="space-y-5 relative">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3"
                    style={{ animation: `stepIn 0.45s ease-out ${i * 0.08}s both` }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-300"
                      style={{
                        background: s.done ? EMERALD : "rgba(255,255,255,0.08)",
                        borderColor: s.done ? EMERALD : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {s.done ? (
                        <CheckCircle2 size={14} color="white" strokeWidth={2.75} style={{ animation: "popIn 0.3s ease-out" }} />
                      ) : (
                        <Icon size={13} color="rgba(255,255,255,0.85)" strokeWidth={2.25} />
                      )}
                    </span>
                    <div className="pt-0.5">
                      <div className="text-xs font-semibold text-white">{s.title}</div>
                      <div className="text-[11px] text-white/60 mt-0.5">{s.desc}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------- Form field components ---------------------------- */

const inputBase =
  "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-[rgb(11,22,111)] bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-shadow disabled:bg-slate-50 disabled:cursor-not-allowed";

function focusRing(e, on) {
  e.currentTarget.style.borderColor = on ? EMERALD : LINE;
  e.currentTarget.style.boxShadow = on ? `0 0 0 3px rgba(30,158,90,0.14)` : "none";
}

const selClass = inputBase;

function RegisteringAsField({ value, onChange }) {
  const t = useT();
  return (
    <select
      className={selClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => focusRing(e, true)}
      onBlur={(e) => focusRing(e, false)}
    >
      <option value="school">{t.optionSchool}</option>
      <option value="other">{t.optionOther}</option>
    </select>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon size={13} strokeWidth={2.5} color={INK} />
      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: INK }}>{children}</div>
    </div>
  );
}

function LocationFields({ form, setForm, districtOptions, sectorOptions, cellOptions, villageOptions }) {
  const t = useT();
  return (
    <div>
      <SectionLabel icon={MapPin}>{t.locationSection}</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <select
          className={selClass}
          value={form.province}
          onFocus={(e) => focusRing(e, true)}
          onBlur={(e) => focusRing(e, false)}
          onChange={(e) => setForm((f) => ({ ...f, province: e.target.value, district: "", sector: "", cell: "", village: "" }))}
        >
          <option value="">{t.province}</option>
          {Object.keys(DISTRICTS_BY_PROVINCE).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className={selClass}
          value={form.district}
          disabled={!form.province}
          onFocus={(e) => focusRing(e, true)}
          onBlur={(e) => focusRing(e, false)}
          onChange={(e) => setForm((f) => ({ ...f, district: e.target.value, sector: "", cell: "", village: "" }))}
        >
          <option value="">{t.district}</option>
          {districtOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          className={selClass}
          value={form.sector}
          disabled={!form.district}
          onFocus={(e) => focusRing(e, true)}
          onBlur={(e) => focusRing(e, false)}
          onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value, cell: "", village: "" }))}
        >
          <option value="">{t.sector}</option>
          {sectorOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className={selClass}
          value={form.cell}
          disabled={!form.sector}
          onFocus={(e) => focusRing(e, true)}
          onBlur={(e) => focusRing(e, false)}
          onChange={(e) => setForm((f) => ({ ...f, cell: e.target.value, village: "" }))}
        >
          <option value="">{t.cell}</option>
          {cellOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className={`${selClass} sm:col-span-2`}
          value={form.village}
          disabled={!form.cell}
          onFocus={(e) => focusRing(e, true)}
          onBlur={(e) => focusRing(e, false)}
          onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
        >
          <option value="">{t.village}</option>
          {villageOptions.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function EmailDomainStatus({ emailCheck }) {
  const t = useT();
  if (emailCheck.status === "idle") return null;

  const map = {
    checking: { icon: Loader2, text: t.emailChecking, color: "#64748B", spin: true },
    valid: { icon: BadgeCheck, text: t.emailValidDomain, color: EMERALD, spin: false },
    invalid: { icon: AlertCircle, text: t.emailInvalidDomain, color: "#DC2626", spin: false },
    unknown: { icon: AlertCircle, text: t.emailCheckFailed, color: "#94A3B8", spin: false },
  };
  const cfg = map[emailCheck.status];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium" style={{ color: cfg.color }}>
      <Icon size={12} strokeWidth={2.5} className={cfg.spin ? "animate-spin" : ""} />
      {cfg.text}
    </div>
  );
}

function PhoneStatus({ phone, phoneDone }) {
  const t = useT();
  if (!phone) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium" style={{ color: phoneDone ? EMERALD : "#DC2626" }}>
      {phoneDone ? <BadgeCheck size={12} strokeWidth={2.5} /> : <AlertCircle size={12} strokeWidth={2.5} />}
      {phoneDone ? t.phoneValid : t.phoneInvalid}
    </div>
  );
}

function InstitutionFields({ form, set, toggleLevel, emailCheck, phoneDone }) {
  const t = useT();
  return (
    <div>
      <SectionLabel icon={Building2}>{t.institutionSection}</SectionLabel>
      <div className="space-y-2.5">
        <div className="relative">
          <School size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2} />
          <input
            className={`${selClass} pl-9`}
            type="text"
            value={form.schoolName}
            onFocus={(e) => focusRing(e, true)}
            onBlur={(e) => focusRing(e, false)}
            onChange={(e) => set("schoolName", e.target.value)}
            placeholder={t.namePh}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2} />
              <input
                className={`${selClass} pl-9`}
                type="email"
                value={form.schoolEmail}
                onFocus={(e) => focusRing(e, true)}
                onBlur={(e) => focusRing(e, false)}
                onChange={(e) => set("schoolEmail", e.target.value)}
                placeholder={t.emailPh}
              />
            </div>
            <EmailDomainStatus emailCheck={emailCheck} />
          </div>

          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <RwandaFlag size={14} />
              </span>
              <input
                className={`${selClass} pl-10`}
                type="tel"
                inputMode="numeric"
                value={form.phone}
                maxLength={13}
                onFocus={(e) => focusRing(e, true)}
                onBlur={(e) => focusRing(e, false)}
                onChange={(e) => set("phone", e.target.value.replace(/[^\d+\s-]/g, ""))}
                placeholder={t.phonePh}
              />
            </div>
            <PhoneStatus phone={form.phone} phoneDone={phoneDone} />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Layers size={12} strokeWidth={2.5} color={INK} />
            <div className="text-[11px] font-semibold" style={{ color: INK }}>{t.levels}</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {LEVEL_KEYS.map((key) => {
              const checked = form.levels.includes(key);
              return (
                <label
                  key={key}
                  className="flex items-center gap-2 text-xs rounded-lg px-2.5 py-2 cursor-pointer border transition-colors"
                  style={{
                    color: INK,
                    borderColor: checked ? EMERALD : LINE,
                    background: checked ? "#ECFDF5" : "white",
                  }}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleLevel(key)} className="sr-only" />
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors"
                    style={{ borderColor: checked ? EMERALD : "#CBD5E1", background: checked ? EMERALD : "white" }}
                  >
                    {checked && <CheckCircle2 size={11} color="white" strokeWidth={3} />}
                  </span>
                  {t[key]}
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <select
            className={selClass}
            value={form.ownership}
            onFocus={(e) => focusRing(e, true)}
            onBlur={(e) => focusRing(e, false)}
            onChange={(e) => set("ownership", e.target.value)}
          >
            <option value="">{t.chooseOwnership}</option>
            <option value="public">{t.public}</option>
            <option value="private">{t.private}</option>
          </select>
          <select
            className={selClass}
            value={form.residence}
            onFocus={(e) => focusRing(e, true)}
            onBlur={(e) => focusRing(e, false)}
            onChange={(e) => set("residence", e.target.value)}
          >
            <option value="">{t.chooseResidence}</option>
            <option value="day">{t.day}</option>
            <option value="boarding">{t.boarding}</option>
            <option value="both">{t.both}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function VerifyEmailField({ verified, sendingCode, onSendCode, email, emailChanged }) {
  const t = useT();
  return (
    <div>
      <SectionLabel icon={ShieldCheck}>{t.verifySection}</SectionLabel>
      <p className="text-[11px] text-slate-400 mb-2.5 -mt-1">{t.verifyHint}</p>

      {emailChanged && (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 mb-2.5">
          <AlertCircle size={12} strokeWidth={2.5} /> {t.emailChangedNotice}
        </p>
      )}

      {verified ? (
        <div className="flex items-center gap-2 rounded-lg border px-3.5 py-2.5" style={{ borderColor: EMERALD, background: "#ECFDF5" }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: EMERALD }}>
            <CheckCircle2 size={12} color="white" strokeWidth={3} />
          </span>
          <span className="text-xs font-semibold break-all" style={{ color: INK }}>
            {t.verifiedBadge} — {email}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSendCode}
          disabled={sendingCode}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border font-bold px-4 py-2.5 text-xs hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-wait transition-colors"
          style={{ borderColor: EMERALD, color: EMERALD }}
        >
          {sendingCode ? <Loader2 size={13} className="animate-spin" /> : <ClipboardCheck size={13} strokeWidth={2.5} />}
          {sendingCode ? t.sendingCode : t.sendCode}
        </button>
      )}
    </div>
  );
}

function VerifyOtpModal({ email, otpValue, setOtpValue, verifying, verifyError, sendingCode, onSubmit, onResend, onClose }) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl max-w-xs w-full p-5 space-y-3 shadow-2xl" style={{ animation: "popIn 0.2s ease-out" }}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <p className="font-bold text-xs flex items-center gap-1.5" style={{ color: INK }}>
            <Mail size={14} strokeWidth={2.5} /> {t.verifyModalTitle}
          </p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label={t.close}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <p className="text-slate-500 text-[11px] break-all">
            {t.verifyModalDesc} <span className="font-semibold" style={{ color: INK }}>{email}</span>.
          </p>
          <div>
            <label className="text-[11px] font-semibold text-slate-600 mb-1 block">{t.otpLabel}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              placeholder={t.otpPlaceholder}
              onFocus={(e) => focusRing(e, true)}
              onBlur={(e) => focusRing(e, false)}
              className={`${selClass} text-center tracking-[0.4em] font-bold`}
            />
          </div>

          {verifyError && (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
              <AlertCircle size={12} strokeWidth={2.5} /> {verifyError}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying || otpValue.length !== 6}
            className="w-full py-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: EMERALD }}
          >
            {verifying ? t.verifying : t.verifyBtn}
          </button>

          <button
            type="button"
            onClick={onResend}
            disabled={sendingCode}
            className="w-full text-[11px] font-semibold py-1 disabled:opacity-50"
            style={{ color: INK }}
          >
            {sendingCode ? t.sendingCode : t.resendCode}
          </button>
        </form>
      </div>
    </div>
  );
}

function PaymentField({ selected, confirmed, verified, onPick }) {
  const t = useT();
  return (
    <div>
      <SectionLabel icon={CreditCard}>{t.payment}</SectionLabel>
      <p className="text-[11px] text-slate-400 mb-2.5 -mt-1">{verified ? t.paymentHint : t.paymentLockedHint}</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {PAYMENT_METHODS.map((m) => {
          const isSelected = selected === m.key;
          const Icon = m.icon;
          return (
            <button
              type="button"
              key={m.key}
              onClick={() => onPick(m.key)}
              disabled={!verified}
              className="flex flex-col items-center justify-center gap-1.5 p-2 sm:p-3 rounded-lg border text-center transition-all disabled:opacity-45 disabled:cursor-not-allowed"
              style={{
                borderColor: isSelected ? EMERALD : LINE,
                background: isSelected ? "#ECFDF5" : "white",
              }}
            >
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ background: `${m.tint}22` }}>
                <Icon size={14} className="sm:hidden" color={m.ink} strokeWidth={2.25} />
                <Icon size={16} className="hidden sm:block" color={m.ink} strokeWidth={2.25} />
              </span>
              <span className="font-semibold w-full leading-tight text-[9px] sm:text-[11px]" style={{ color: INK }}>{m.label}</span>
              {isSelected && confirmed && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-bold bg-white border rounded-full px-1.5 py-0.5 shrink-0"
                  style={{ borderColor: EMERALD, color: EMERALD }}
                >
                  <CheckCircle2 size={9} strokeWidth={3} /> {t.paid}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PaymentModal({ method, payerPhone, setPayerPhone, paymentAmount, setPaymentAmount, paymentStatus, paymentError, onSend, onClose }) {
  const t = useT();
  const MethodIcon = method?.icon;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl max-w-xs w-full p-5 space-y-3 shadow-2xl" style={{ animation: "popIn 0.2s ease-out" }}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {method && (
              <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${method.tint}22` }}>
                <MethodIcon size={13} color={method.ink} strokeWidth={2.25} />
              </span>
            )}
            <p className="font-bold text-xs" style={{ color: INK }}>{t.modalTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label={t.close}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {paymentStatus === "idle" && (
          <form onSubmit={onSend} className="space-y-3 text-xs">
            <p className="text-slate-500 text-[11px]">{t.modalDesc}</p>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">{t.phoneLabel}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2"><RwandaFlag size={14} /></span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={13}
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value.replace(/[^\d+\s-]/g, ""))}
                  placeholder="078XXXXXXX"
                  onFocus={(e) => focusRing(e, true)}
                  onBlur={(e) => focusRing(e, false)}
                  className={`${selClass} pl-9`}
                />
              </div>
              <PhoneStatus phone={payerPhone} phoneDone={isValidRwandaPhone(payerPhone)} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">{t.amountLabel}</label>
              <input
                type="number"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                onFocus={(e) => focusRing(e, true)}
                onBlur={(e) => focusRing(e, false)}
                className={selClass}
              />
            </div>
            <button
              type="submit"
              disabled={!isValidRwandaPhone(payerPhone)}
              className="w-full py-2.5 text-white font-bold text-[11px] rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: EMERALD }}
            >
              {t.payBtn}
            </button>
          </form>
        )}

        {paymentStatus === "processing" && (
          <div className="text-center py-6 space-y-3">
            <Loader2 size={26} className="animate-spin mx-auto" color={EMERALD} strokeWidth={2.25} />
            <p className="text-[11px] font-bold text-slate-600">{t.processing}</p>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="text-center py-3 space-y-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto" style={{ background: "#ECFDF5" }}>
              <CheckCircle2 size={20} color={EMERALD} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold" style={{ color: INK }}>{t.paymentDone}</p>
            <button type="button" onClick={onClose} className="w-full py-2 text-white font-bold text-[11px] rounded-lg hover:opacity-90 transition-opacity" style={{ background: INK }}>
              {t.close}
            </button>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="text-center py-3 space-y-3">
            <AlertCircle size={20} color="#DC2626" strokeWidth={2.5} className="mx-auto" />
            <p className="text-[11px] font-semibold text-red-600">{paymentError || t.paymentFailed}</p>
            <button type="button" onClick={onClose} className="w-full py-2 border border-slate-200 font-bold text-[11px] rounded-lg hover:bg-slate-50 transition-colors" style={{ color: INK }}>
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessScreen({ form, schoolCode, onRegisterAnother }) {
  const t = useT();
  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center bg-white border border-slate-200 rounded-2xl shadow-lg px-6 sm:px-7 py-9" style={{ animation: "popIn 0.25s ease-out" }}>
        <div className="w-11 h-11 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: EMERALD }}>
          <CheckCircle2 size={22} color="white" strokeWidth={2.5} />
        </div>
        <h1 className="text-lg font-bold mb-1.5" style={{ color: INK, fontFamily: "'Poppins', sans-serif" }}>{t.successTitle}</h1>
        <p className="text-xs text-slate-500 mb-5">
          {form.schoolName} {t.successUnder} {form.village}, {form.cell}, {form.sector}, {form.district}. {t.successSentTo} {form.schoolEmail}.
        </p>

        {schoolCode && (
          <div className="mb-5 rounded-xl border px-4 py-4" style={{ borderColor: EMERALD, background: "#ECFDF5" }}>
            <div className="text-[11px] font-semibold text-slate-500 mb-1">{t.yourSchoolCode}</div>
            <div className="text-xl font-extrabold tracking-wider" style={{ color: INK }}>{schoolCode}</div>
            <div className="text-[11px] text-slate-500 mt-1">{t.keepCodeSafe}</div>
          </div>
        )}

        <button
          type="button"
          className="w-full rounded-lg text-white text-sm font-semibold py-2.5 hover:opacity-95 transition-opacity"
          style={{ background: INK }}
          onClick={onRegisterAnother}
        >
          {t.registerAnother}
        </button>
      </div>
    </div>
  );
}