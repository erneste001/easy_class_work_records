import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home,
  BookOpen,
  Lightbulb,
  FileText,
  LineChart,
  Settings,
  X,
  LogOut,
  Menu,
  Gift,
  Backpack,
  Moon,
  CheckCircle2,
  Circle,
  FileEdit,
  User,
  Languages,
  Clock3,
  ArrowLeft,
  ArrowRight,
  Award,
  AlertTriangle,
  ShieldAlert,
  Timer,
} from "lucide-react";

/* ============================================================================
   COLORS — blue / green / orange, matching the teacher dashboard
   ============================================================================ */
const BLUE = "rgb(22,32,111)";
const BLUE_SOFT = "#E6ECFB";
const GREEN = "#178754";
const GREEN_SOFT = "#EAF6EF";
const ORANGE = "#F97316";
const ORANGE_SOFT = "#FFF1E6";
const RED = "#DC2626";
const RED_SOFT = "#FEECEC";

/* ============================================================================
   API
   ------------------------------------------------------------------------
   FIX (was the root cause of "The server sent back something unreadable" and
   of notes/quizzes never showing up): this used to default API_BASE to ""
   (same-origin/relative), while teacher.jsx / TeacherDashboard.jsx point at
   the backend explicitly (https://easy-class-work-records.onrender.com). If the React app is served
   from a different origin than the API (e.g. CRA dev server on :3000, API on
   :5000), every relative fetch here hit the FRONTEND's dev server instead of
   the backend, got back an HTML page instead of JSON, and response.json()
   threw — which is exactly the "unreadable" error message below.

   Now this matches TeacherDashboard.jsx's convention: same
   window.ECW_API_BASE override, but a real fallback instead of "".
   Before shipping to production, replace the fallback (and the one in
   TeacherDashboard.jsx) with your real API host, or better, set
   window.ECW_API_BASE from index.html / a build-time env var so there's a
   single source of truth for both dashboards.
   ============================================================================ */
const API_BASE = (typeof window !== "undefined" && window.ECW_API_BASE) || "https://easy-class-work-records.onrender.com";
const USER_SESSION_KEY = "ecw_user_session"; // same key teacher.jsx and login use

function getSession() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function apiFetch(path, options = {}) {
  const session = getSession();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server sent back something unreadable. Check the server logs.");
  }
  if (response.status === 401) {
    localStorage.removeItem(USER_SESSION_KEY);
    throw new Error(result.message || "Session expired. Please sign in again.");
  }
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Something went wrong.");
  }
  return result;
}

// Fire-and-forget variant for the /away penalty beacon — we still want the
// server call to actually complete even if the tab is being backgrounded
// again immediately, but we don't want a slow network to block the UI.
function apiFetchBeacon(path, body) {
  apiFetch(path, { method: "POST", body: JSON.stringify(body) }).catch(() => {});
}

function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// mm:ss for anything under an hour, h:mm:ss beyond that.
function fmtCountdown(ms) {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/* ============================================================================
   NAV / TEXT
   ============================================================================ */
const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "notes", label: "Notes", icon: BookOpen },
  { key: "quizzes", label: "Quizzes", icon: Lightbulb },
  { key: "results", label: "My Results", icon: FileText },
  { key: "progress", label: "Progress", icon: LineChart },
  { key: "settings", label: "Settings", icon: Settings },
];

const T_EN = {
  brand: "Easy ClassWork Record System",
  hello: "Hello",
  guest: "Student",
  guestRole: "STUDENT",
  notesAvailable: "NOTES AVAILABLE",
  pendingQuizzes: "PENDING QUIZZES",
  quizzesDone: "QUIZZES DONE",
  averageScore: "AVERAGE SCORE",
  welcome: "Welcome",
  welcomeSub1: "You have",
  welcomeSub2: "notes and",
  welcomeSub3: "quizzes waiting this week.",
  recentNotes: "Recent Notes",
  recentNotesSub: "From your teachers",
  pendingQuizzesTitle: "Quizzes",
  pendingQuizzesSub: "Don't miss these",
  allDone: "All caught up!",
  allDoneSub: "No quizzes waiting on you right now.",
  noNotes: "No notes yet",
  noNotesSub: "Notes and updates will appear here once your teachers publish them.",
  start: "Start",
  signOut: "Sign Out",
  langSwitch: "Kinyarwanda",
};
const T_RW = {
  brand: "Easy ClassWork Record System",
  hello: "Muraho",
  guest: "Umunyeshuri",
  guestRole: "UMUNYESHURI",
  notesAvailable: "INYANDIKO ZIHARI",
  pendingQuizzes: "IBIZAMINI BITEGEREJE",
  quizzesDone: "IBIZAMINI BYARANGIYE",
  averageScore: "AMANOTA MPUZANDENGO",
  welcome: "Murakaza neza",
  welcomeSub1: "Ufite",
  welcomeSub2: "inyandiko na",
  welcomeSub3: "ibizamini bitegereje muri iki cyumweru.",
  recentNotes: "Inyandiko za vuba",
  recentNotesSub: "Ziturutse ku barimu bawe",
  pendingQuizzesTitle: "Ibizamini",
  pendingQuizzesSub: "Ntuzabyibagirwe",
  allDone: "Byose byarangiye!",
  allDoneSub: "Nta kizamini gitegereje ubu.",
  noNotes: "Nta nyandiko irahari",
  noNotesSub: "Inyandiko zizagaragara hano abarimu bamaze kuzishyiraho.",
  start: "Tangira",
  signOut: "Sohoka",
  langSwitch: "English",
};

/* ============================================================================
   TOASTS
   ============================================================================ */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3200);
  }, []);
  return { toasts, push };
}
function ToastStack({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 18, right: 18, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
      {toasts.map((tst) => (
        <div key={tst.id} style={{ display: "flex", alignItems: "flex-start", gap: 9, background: tst.type === "error" ? RED : GREEN, color: "#fff", borderRadius: 9, padding: "11px 13px", boxShadow: "0 10px 26px rgba(18,20,28,0.18)", fontSize: 12.5, fontWeight: 600 }}>
          {tst.message}
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   SIDEBAR
   ============================================================================ */
function Sidebar({ open, onClose, active, setActive, t, studentName }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:static top-0 left-0 h-full z-40 bg-white border-r border-gray-100
        flex flex-col transform transition-transform duration-300 ease-in-out
        w-[80%] max-w-[18rem] p-6
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="font-extrabold text-[13px] leading-tight" style={{ color: BLUE, fontFamily: "'Poppins', sans-serif" }}>
            {t.brand}
          </span>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
            <X className="w-[1.125rem] h-[1.125rem]" />
          </button>
        </div>

        <div className="border border-gray-100 rounded-lg flex items-center gap-3 p-4 mb-6">
          <div className="rounded-full text-white flex items-center justify-center font-bold shrink-0 w-10 h-10 text-base" style={{ background: BLUE }}>
            {studentName ? studentName.charAt(0).toUpperCase() : "S"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate text-[13px]">{studentName || t.guest}</p>
            <p className="font-medium tracking-wide text-[11px]" style={{ color: GREEN }}>{t.guestRole}</p>
          </div>
        </div>

        <nav className="flex flex-col flex-1 gap-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => { setActive(key); onClose(); }}
                className="flex items-center justify-between rounded-md font-medium transition-colors py-2.5 px-3 text-[13px]"
                style={{ background: isActive ? BLUE : "transparent", color: isActive ? "white" : "#475569" }}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-[1.0625rem] h-[1.0625rem]" />
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => { localStorage.removeItem(USER_SESSION_KEY); window.location.href = "/"; }}
          className="flex items-center text-red-600 hover:bg-red-50 rounded-md font-medium gap-2.5 py-2.5 px-3 text-[13px] mt-4"
        >
          <LogOut className="w-[0.9375rem] h-[0.9375rem]" />
          {t.signOut}
        </button>
      </aside>
    </>
  );
}

function StatCard({ label, value, icon: Icon, tint, ink }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 flex items-center gap-2.5 p-3">
      <div className="rounded-md flex items-center justify-center shrink-0 w-8 h-8" style={{ background: tint, color: ink }}>
        <Icon className="w-[0.8125rem] h-[0.8125rem]" />
      </div>
      <div className="min-w-0">
        <p className="font-extrabold text-gray-900 leading-tight text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>{value}</p>
        <p className="font-semibold text-gray-400 tracking-wide truncate text-[9px]">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, tint, ink }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-9">
      <div className="rounded-full flex items-center justify-center w-12 h-12 mb-3" style={{ background: tint }}>
        <Icon size={20} color={ink} />
      </div>
      <p className="font-bold text-gray-900 mb-1 text-[13px]">{title}</p>
      <p className="text-gray-400 text-xs max-w-[220px]">{sub}</p>
    </div>
  );
}

/* ============================================================================
   NOTE VIEWER
   ============================================================================ */
function NoteViewerModal({ note, onClose }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: GREEN_SOFT }}>
            <FileEdit size={16} color={GREEN} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-[15px] truncate" style={{ fontFamily: "'Poppins', sans-serif", color: BLUE }}>{note.title}</h3>
            <p className="text-[11px] text-gray-400">{note.subject} · {note.authorName} · {fmtDateTime(note.updatedAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-5 py-5">
          <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{note.content}</p>
          {note.fileUrl && (
            <a href={note.fileUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: BLUE }}>
              <FileText size={13} /> {note.fileName || "Attached file"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   QUIZ STATUS helpers
   ============================================================================ */
const STATUS_META = {
  upcoming: { label: "Not started yet", tint: ORANGE_SOFT, ink: ORANGE },
  available: { label: "Available now", tint: GREEN_SOFT, ink: GREEN },
  in_progress: { label: "In progress", tint: ORANGE_SOFT, ink: ORANGE },
  expired: { label: "Missed", tint: RED_SOFT, ink: RED },
  closed: { label: "Closed", tint: "#F1F5F9", ink: "#64748B" },
  completed: { label: "Completed", tint: BLUE_SOFT, ink: BLUE },
};

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function QuizRow({ quiz, onStart, onViewResult }) {
  const now = useNow(1000);
  const meta = STATUS_META[quiz.status] || STATUS_META.closed;

  let subline = `${quiz.subject} · ${quiz.questionCount} question${quiz.questionCount === 1 ? "" : "s"}`;
  if (quiz.timeLimitMinutes) subline += ` · ${quiz.timeLimitMinutes} min`;

  let countdown = null;
  if (quiz.status === "upcoming" && quiz.startsAt) {
    countdown = `Starts in ${fmtCountdown(new Date(quiz.startsAt).getTime() - now)}`;
  } else if (quiz.status === "available" && quiz.endsAt) {
    countdown = `Closes in ${fmtCountdown(new Date(quiz.endsAt).getTime() - now)}`;
  } else if (quiz.status === "in_progress" && quiz.attempt?.deadlineAt) {
    countdown = `Time left: ${fmtCountdown(new Date(quiz.attempt.deadlineAt).getTime() - now)}`;
  }

  return (
    <div className="flex items-center gap-2.5 bg-gray-50 rounded-md p-3">
      <div className="rounded-lg flex items-center justify-center shrink-0 w-8 h-8" style={{ background: meta.tint }}>
        <Lightbulb size={13} color={meta.ink} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 truncate text-[13px]">{quiz.title}</p>
        <p className="text-gray-400 text-[11px] mt-0.5">{subline}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: meta.tint, color: meta.ink }}>{meta.label}</span>
          {countdown && <span className="text-[10px] font-semibold text-gray-400 inline-flex items-center gap-1"><Timer size={10} /> {countdown}</span>}
        </div>
        {quiz.status === "completed" && quiz.attempt && (
          <p className="text-[11px] mt-1 font-bold" style={{ color: GREEN }}>
            Score: {quiz.attempt.finalScore}/{quiz.questionCount} ({quiz.attempt.scorePercent}%)
            {quiz.attempt.penaltyMarks > 0 ? ` · ${quiz.attempt.penaltyMarks} mark(s) lost for leaving the tab` : ""}
          </p>
        )}
      </div>
      {(quiz.status === "available" || quiz.status === "in_progress") && (
        <button type="button" onClick={() => onStart(quiz)} className="shrink-0 rounded-lg text-white font-bold text-[11px] px-3 py-2 hover:opacity-90 transition-opacity" style={{ background: ORANGE }}>
          {quiz.status === "in_progress" ? "Resume" : "Start"}
        </button>
      )}
      {quiz.status === "completed" && (
        <button type="button" onClick={() => onViewResult(quiz)} className="shrink-0 rounded-lg font-bold text-[11px] px-3 py-2 border" style={{ borderColor: BLUE, color: BLUE }}>
          Review
        </button>
      )}
    </div>
  );
}

/* ============================================================================
   QUIZ TAKER — locked, timed, tab-away penalty, skipped-question check
   ============================================================================ */
function QuizTakerModal({ quizId, onClose, onFinished, toast }) {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> optionId
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [penaltyMarks, setPenaltyMarks] = useState(0);
  const now = useNow(1000);

  const hiddenSinceRef = useRef(null); // timestamp the tab was hidden, or null
  const attemptRef = useRef(null); // mirrors `attempt` for use inside event listeners

  // ---- load / start the attempt ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/student/quizzes/${quizId}/start`, { method: "POST" });
        if (cancelled) return;
        setQuiz(res.quiz);
        setAttempt(res.attempt);
        attemptRef.current = res.attempt;
        setPenaltyMarks(res.attempt.penaltyMarks || 0);
        const initialAnswers = {};
        for (const a of res.answers) initialAnswers[a.questionId] = a.optionId;
        setAnswers(initialAnswers);
      } catch (err) {
        toast(err.message, "error");
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // ---- lock the page: warn on close/reload, and track away-time whenever
  // the tab is hidden or loses focus, reporting the penalty on return ----
  useEffect(() => {
    function reportAway() {
      if (hiddenSinceRef.current == null || !attemptRef.current || result) return;
      const seconds = Math.floor((Date.now() - hiddenSinceRef.current) / 1000);
      hiddenSinceRef.current = null;
      if (seconds <= 0) return;
      apiFetch(`/api/student/quizzes/${quizId}/away`, { method: "POST", body: JSON.stringify({ seconds }) })
        .then((res) => {
          setPenaltyMarks(res.penaltyMarks);
          toast(res.message, "error");
        })
        .catch(() => {});
    }
    function onVisibility() {
      if (document.hidden) hiddenSinceRef.current = Date.now();
      else reportAway();
    }
    function onBlur() {
      if (hiddenSinceRef.current == null) hiddenSinceRef.current = Date.now();
    }
    function onFocus() {
      reportAway();
    }
    function onBeforeUnload(e) {
      if (result) return; // already submitted — safe to leave
      e.preventDefault();
      e.returnValue = "";
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, result]);

  const deadlineMs = attempt?.deadlineAt ? new Date(attempt.deadlineAt).getTime() : null;
  const remainingMs = deadlineMs ? deadlineMs - now : null;

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/student/quizzes/${quizId}/submit`, { method: "POST" });
      setResult(res.result);
      onFinished();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
      setConfirmingSubmit(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Auto-submit the instant the deadline is reached.
  useEffect(() => {
    if (!loading && !result && remainingMs !== null && remainingMs <= 0) {
      submit();
    }
  }, [remainingMs, loading, result, submit]);

  // Autosave is already per-answer (see `pick` below, fired on every option
  // click) rather than on an interval — that way a refresh mid-quiz never
  // loses more than the click the student is actively making.
  async function pick(questionId, optionId) {
    setAnswers((a) => ({ ...a, [questionId]: optionId }));
    try {
      await apiFetch(`/api/student/quizzes/${quizId}/answer`, { method: "POST", body: JSON.stringify({ questionId, optionId }) });
    } catch (err) {
      toast(err.message, "error");
    }
  }

  function handleSubmitClick() {
    const skipped = quiz.questions.filter((q) => !answers[q.id]);
    if (skipped.length > 0) setConfirmingSubmit(true);
    else submit();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl px-8 py-6 text-sm font-semibold text-gray-600">Loading quiz…</div>
      </div>
    );
  }
  if (!quiz) return null;

  // ---- result screen ----
  if (result) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl px-6 py-8 text-center">
          <span className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: ORANGE_SOFT }}>
            <Award size={24} color={ORANGE} />
          </span>
          <h3 className="font-extrabold text-lg mb-1" style={{ fontFamily: "'Poppins', sans-serif", color: BLUE }}>{result.scorePercent}%</h3>
          <p className="text-xs text-gray-500 mb-1">
            {result.rawScore} of {result.totalQuestions} correct on "{quiz.title}".
          </p>
          {result.penaltyMarks > 0 && (
            <p className="text-xs font-semibold mb-4" style={{ color: RED }}>
              −{result.penaltyMarks} mark{result.penaltyMarks === 1 ? "" : "s"} for leaving the quiz tab · final score {result.finalScore}/{result.totalQuestions}
            </p>
          )}
          <button type="button" onClick={onClose} className="w-full py-2.5 text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity mt-3" style={{ background: BLUE }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const answeredCount = quiz.questions.filter((q) => answers[q.id]).length;
  const skippedQuestions = quiz.questions.filter((q) => !answers[q.id]);
  const timeRunningLow = remainingMs !== null && remainingMs < 60000;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-3 py-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ORANGE_SOFT }}>
            <Lightbulb size={16} color={ORANGE} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-[15px] truncate" style={{ fontFamily: "'Poppins', sans-serif", color: BLUE }}>{quiz.title}</h3>
            <p className="text-[11px] text-gray-400">{answeredCount}/{quiz.questions.length} answered</p>
          </div>
          {remainingMs !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-extrabold shrink-0" style={{ background: timeRunningLow ? RED_SOFT : GREEN_SOFT, color: timeRunningLow ? RED : GREEN }}>
              <Timer size={13} /> {fmtCountdown(remainingMs)}
            </span>
          )}
        </div>

        {penaltyMarks > 0 && (
          <div className="flex items-center gap-2 px-5 py-2 text-[11.5px] font-semibold" style={{ background: RED_SOFT, color: RED }}>
            <ShieldAlert size={14} /> You've lost {penaltyMarks} mark{penaltyMarks === 1 ? "" : "s"} so far for leaving this tab. Stay on this page until you submit.
          </div>
        )}

        {/* question palette */}
        <div className="flex flex-wrap gap-1.5 px-5 pt-3">
          {quiz.questions.map((q, i) => {
            const isAnswered = Boolean(answers[q.id]);
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className="w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center border-2 transition-colors"
                style={{
                  borderColor: isCurrent ? BLUE : "transparent",
                  background: isAnswered ? GREEN_SOFT : "#F1F5F9",
                  color: isAnswered ? GREEN : "#64748B",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* current question */}
        <div className="px-5 py-5 overflow-y-auto flex-1">
          <p className="font-semibold text-[14px] text-gray-900 mb-4">Q{currentIndex + 1}. {question.question}</p>
          <div className="flex flex-col gap-2">
            {question.options.map((o) => {
              const selected = answers[question.id] === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pick(question.id, o.id)}
                  className="flex items-center gap-2.5 text-left rounded-lg border px-3.5 py-2.5 text-xs transition-colors"
                  style={{ borderColor: selected ? GREEN : "#E5E7EB", background: selected ? GREEN_SOFT : "white", color: selected ? GREEN : "#374151" }}
                >
                  <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: selected ? GREEN : "#CBD5E1" }}>
                    {selected && <span className="w-2 h-2 rounded-full" style={{ background: GREEN }} />}
                  </span>
                  <span className="font-medium">{o.optionText}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* footer nav */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {currentIndex < quiz.questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
              className="inline-flex items-center gap-1.5 rounded-lg text-white font-bold text-xs px-4 py-2.5 hover:opacity-90 transition-opacity"
              style={{ background: BLUE }}
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitClick}
              className="inline-flex items-center gap-1.5 rounded-lg text-white font-bold text-xs px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: GREEN }}
            >
              {submitting ? "Submitting…" : "Submit quiz"}
            </button>
          )}
        </div>
      </div>

      {/* skipped-question confirmation */}
      {confirmingSubmit && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl px-6 py-6 text-center">
            <span className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: ORANGE_SOFT }}>
              <AlertTriangle size={20} color={ORANGE} />
            </span>
            <h3 className="font-extrabold text-[15px] mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {skippedQuestions.length} question{skippedQuestions.length === 1 ? "" : "s"} unanswered
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Question{skippedQuestions.length === 1 ? "" : "s"} {quiz.questions.map((q, i) => (answers[q.id] ? null : i + 1)).filter(Boolean).join(", ")} will be marked skipped if you submit now.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const firstSkippedIndex = quiz.questions.findIndex((q) => !answers[q.id]);
                  setCurrentIndex(firstSkippedIndex);
                  setConfirmingSubmit(false);
                }}
                className="w-full py-2.5 font-bold text-xs rounded-lg border"
                style={{ borderColor: BLUE, color: BLUE }}
              >
                Go back and answer
              </button>
              <button type="button" disabled={submitting} onClick={submit} className="w-full py-2.5 text-white font-bold text-xs rounded-lg disabled:opacity-50" style={{ background: RED }}>
                {submitting ? "Submitting…" : "Submit anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   MAIN DASHBOARD
   ============================================================================ */
export default function Students() {
  const { toasts, push: toast } = useToasts();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [lang, setLang] = useState("en");
  const t = lang === "rw" ? T_RW : T_EN;

  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  const [openNote, setOpenNote] = useState(null);
  const [takingQuizId, setTakingQuizId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const me = await apiFetch("/api/student/me");
      setStudentName(me.student.full_name || me.student.fullName || "");
    } catch (err) {
      toast(err.message, "error");
    }
    try {
      const n = await apiFetch("/api/student/notes");
      setNotes(n.notes);
    } catch (err) {
      toast(err.message, "error");
    }
    try {
      const q = await apiFetch("/api/student/quizzes");
      setQuizzes(q.quizzes);
    } catch (err) {
      toast(err.message, "error");
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const pendingQuizzes = quizzes.filter((q) => q.status === "available" || q.status === "in_progress" || q.status === "upcoming");
  const doneQuizzes = quizzes.filter((q) => q.status === "completed");
  const averageScore = doneQuizzes.length
    ? Math.round(doneQuizzes.reduce((sum, q) => sum + (q.attempt?.scorePercent || 0), 0) / doneQuizzes.length) + "%"
    : "—";

  const stats = [
    { label: t.notesAvailable, value: notes.length, icon: BookOpen, tint: BLUE_SOFT, ink: BLUE },
    { label: t.pendingQuizzes, value: pendingQuizzes.length, icon: Lightbulb, tint: ORANGE_SOFT, ink: ORANGE },
    { label: t.quizzesDone, value: doneQuizzes.length, icon: CheckCircle2, tint: GREEN_SOFT, ink: GREEN },
    { label: t.averageScore, value: averageScore, icon: LineChart, tint: BLUE_SOFT, ink: BLUE },
  ];

  return (
    <div className="min-h-screen bg-white flex text-gray-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}</style>

      {openNote && <NoteViewerModal note={openNote} onClose={() => setOpenNote(null)} />}
      {takingQuizId && (
        <QuizTakerModal
          quizId={takingQuizId}
          toast={toast}
          onClose={() => { setTakingQuizId(null); loadAll(); }}
          onFinished={() => { loadAll(); }}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} active={active} setActive={setActive} t={t} studentName={studentName} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between gap-2.5 py-4 px-[4%]">
          <div className="flex items-center min-w-0 gap-2.5">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 p-2 -ml-2">
              <Menu className="w-[1.125rem] h-[1.125rem]" />
            </button>
            <h1 className="font-bold truncate text-base" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {t.hello}, <span style={{ color: BLUE }}>{studentName || t.guest}</span> 👋
            </h1>
          </div>
          <div className="flex items-center shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setLang((l) => (l === "en" ? "rw" : "en"))}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold hover:bg-gray-50 transition-colors"
              style={{ color: BLUE }}
            >
              <Languages size={13} /> {t.langSwitch}
            </button>
            <button className="rounded-full border border-gray-200 text-gray-500 hover:bg-blue-50 flex items-center justify-center w-8 h-8">
              <Moon className="w-[0.9375rem] h-[0.9375rem]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-[4%] pb-8">
          <div className="relative overflow-hidden rounded-lg text-white flex items-center justify-between py-[1.15em] px-[5%] mb-6" style={{ background: BLUE }}>
            <div className="max-w-[36rem]">
              <h2 className="font-extrabold text-base mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{t.welcome}, {studentName || t.guest}!</h2>
              <p className="text-white/80 text-xs mb-3">
                {t.welcomeSub1} <span className="font-bold text-white">{notes.length}</span> {t.welcomeSub2}{" "}
                <span className="font-bold text-white">{pendingQuizzes.length}</span> {t.welcomeSub3}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center border border-white/20 text-white font-medium rounded-md gap-1.5 text-[11px] py-1.5 px-2.5"><Backpack className="w-3 h-3" /> My class</span>
                <span className="flex items-center border border-white/20 text-white font-medium rounded-md gap-1.5 text-[11px] py-1.5 px-2.5"><Gift className="w-3 h-3" /> 2025–2026</span>
              </div>
            </div>
            <div className="relative flex shrink-0 items-center justify-center bg-white/10 border border-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 ml-4">
              <User className="w-[55%] h-[55%] text-white" aria-hidden="true" />
              <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2" style={{ background: GREEN, borderColor: BLUE }} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 max-w-full">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <h3 className="flex items-center font-bold text-gray-900 gap-2 text-[15px] mb-0.5">
                <BookOpen className="w-4 h-4" style={{ color: BLUE }} /> {t.recentNotes}
              </h3>
              <p className="text-gray-400 text-[11px] mb-3.5">{t.recentNotesSub}</p>

              {loading ? (
                <p className="text-xs text-gray-400 py-6 text-center">Loading…</p>
              ) : notes.length === 0 ? (
                <EmptyState icon={BookOpen} title={t.noNotes} sub={t.noNotesSub} tint={BLUE_SOFT} ink={BLUE} />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {notes.slice(0, 6).map((note) => (
                    <button key={note.id} type="button" onClick={() => setOpenNote(note)} className="flex items-start bg-gray-50 hover:bg-gray-100 transition-colors rounded-md gap-2.5 p-3 text-left w-full">
                      <div className="rounded-lg flex items-center justify-center shrink-0 w-8 h-8" style={{ background: GREEN_SOFT }}>
                        <FileEdit size={13} color={GREEN} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-[13px]">{note.title}</p>
                        <p className="flex items-center text-gray-400 gap-1 text-[11px] mt-0.5"><User className="w-2.5 h-2.5" /> {note.authorName} · {fmtDateTime(note.updatedAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <h3 className="flex items-center font-bold text-gray-900 gap-2 text-[15px] mb-0.5">
                <Lightbulb className="w-4 h-4" style={{ color: ORANGE }} /> {t.pendingQuizzesTitle}
              </h3>
              <p className="text-gray-400 text-[11px] mb-3.5">{t.pendingQuizzesSub}</p>

              {loading ? (
                <p className="text-xs text-gray-400 py-6 text-center">Loading…</p>
              ) : quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-9">
                  <div className="rounded-full flex items-center justify-center w-12 h-12 mb-3" style={{ background: GREEN_SOFT }}>
                    <CheckCircle2 size={22} color={GREEN} />
                  </div>
                  <p className="font-bold text-gray-900 mb-1 text-[15px]">{t.allDone}</p>
                  <p className="text-gray-400 text-[13px]">{t.allDoneSub}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {quizzes.map((quiz) => (
                    <QuizRow key={quiz.id} quiz={quiz} onStart={(q) => setTakingQuizId(q.id)} onViewResult={(q) => setTakingQuizId(q.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}
