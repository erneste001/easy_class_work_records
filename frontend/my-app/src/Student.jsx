import { useState } from "react";
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
  FileEdit,
  User,
  Languages,
  Clock3,
  ArrowLeft,
  ArrowRight,
  Award,
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

/* ============================================================================
   MOCK DATA — what a teacher has published to this student's class. In
   production: GET /api/student/notes and GET /api/student/quizzes (see
   schema.sql — notes/quizzes filtered by the student's current class_id and
   status = 'published').
   ============================================================================ */
const SEED_NOTES = [
  {
    id: "note_seed_1",
    title: "Quadratic equations — part 2",
    subject: "Mathematics",
    author: "Mr. Habimana",
    date: "12 Aug 2026",
    content:
      "We continue from factoring into completing the square. Remember: for ax² + bx + c = 0, divide through by a first, then move c/a to the right-hand side before adding (b/2a)² to both sides. Practice questions 4–9 on page 62 before Thursday's class.",
  },
];

const SEED_QUIZZES = [
  {
    id: "quiz_seed_1",
    title: "Chapter 4 checkpoint",
    subject: "Mathematics",
    timeLimit: 10,
    questions: [
      {
        id: "q1",
        question: "What is the solution set of x² − 5x + 6 = 0?",
        options: [
          { id: "a", text: "x = 2, x = 3", correct: true },
          { id: "b", text: "x = 1, x = 6", correct: false },
          { id: "c", text: "x = -2, x = -3", correct: false },
          { id: "d", text: "No real solution", correct: false },
        ],
      },
      {
        id: "q2",
        question: "The discriminant of ax² + bx + c is:",
        options: [
          { id: "a", text: "b² − 4ac", correct: true },
          { id: "b", text: "b² + 4ac", correct: false },
          { id: "c", text: "4ac − b²", correct: false },
        ],
      },
    ],
  },
];

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "notes", label: "Notes", icon: BookOpen },
  { key: "quizzes", label: "Quizzes", icon: Lightbulb },
  { key: "results", label: "My Results", icon: FileText },
  { key: "progress", label: "Progress", icon: LineChart },
  { key: "settings", label: "Settings", icon: Settings },
];

/* ============================================================================
   TEXT — English / Kinyarwanda
   ============================================================================ */
const T_EN = {
  brand: "Easy ClassWork Record System",
  hello: "Hello",
  guest: "Guest",
  guestRole: "STUDENT",
  notesAvailable: "NOTES AVAILABLE",
  pendingQuizzes: "PENDING QUIZZES",
  quizzesDone: "QUIZZES DONE",
  averageScore: "AVERAGE SCORE",
  welcome: "Welcome",
  welcomeSub1: "You have",
  welcomeSub2: "new note and",
  welcomeSub3: "pending quizzes this week.",
  recentNotes: "Recent Notes",
  recentNotesSub: "From your teachers",
  viewAll: "View All",
  pendingQuizzesTitle: "Pending Quizzes",
  pendingQuizzesSub: "Don't miss these",
  allDone: "All done!",
  allDoneSub: "No pending quizzes right now.",
  noNotes: "No notes yet",
  noNotesSub: "Notes and updates will appear here once they are added.",
  start: "Start",
  signOut: "Sign Out",
  langSwitch: "Kinyarwanda",
};

const T_RW = {
  brand: "Easy ClassWork Record System",
  hello: "Muraho",
  guest: "Umushyitsi",
  guestRole: "UMUNYESHURI",
  notesAvailable: "INYANDIKO ZIHARI",
  pendingQuizzes: "IBIZAMINI BITEGEREJE",
  quizzesDone: "IBIZAMINI BYARANGIYE",
  averageScore: "AMANOTA MPUZANDENGO",
  welcome: "Murakaza neza",
  welcomeSub1: "Ufite",
  welcomeSub2: "inyandiko nshya n'ibizamini",
  welcomeSub3: "bitegereje muri iki cyumweru.",
  recentNotes: "Inyandiko za vuba",
  recentNotesSub: "Ziturutse ku barimu bawe",
  viewAll: "Reba byose",
  pendingQuizzesTitle: "Ibizamini bitegereje",
  pendingQuizzesSub: "Ntuzabyibagirwe",
  allDone: "Byose byarangiye!",
  allDoneSub: "Nta kizamini gitegereje ubu.",
  noNotes: "Nta nyandiko irahari",
  noNotesSub: "Inyandiko n'amakuru mashya bizagaragara hano nyuma yo kongerwaho.",
  start: "Tangira",
  signOut: "Sohoka",
  langSwitch: "English",
};

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
            {studentName ? studentName.charAt(0).toUpperCase() : "G"}
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
                onClick={() => {
                  setActive(key);
                  onClose();
                }}
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

        <button className="flex items-center text-red-600 hover:bg-red-50 rounded-md font-medium gap-2.5 py-2.5 px-3 text-[13px] mt-4">
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
            <p className="text-[11px] text-gray-400">{note.subject} · {note.author} · {note.date}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-5 py-5">
          <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{note.content}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   QUIZ TAKER — one question at a time, then a result screen
   ============================================================================ */
function QuizTakerModal({ quiz, onClose, onComplete }) {
  const [step, setStep] = useState(0); // index into quiz.questions, or "result"
  const [answers, setAnswers] = useState({}); // questionId -> optionId
  const [submitted, setSubmitted] = useState(false);

  const question = quiz.questions[step];
  const isLast = step === quiz.questions.length - 1;

  function pick(optionId) {
    setAnswers((a) => ({ ...a, [question.id]: optionId }));
  }

  function next() {
    if (isLast) {
      const correct = quiz.questions.filter((q) => {
        const chosen = answers[q.id];
        const correctOpt = q.options.find((o) => o.correct);
        return chosen && correctOpt && chosen === correctOpt.id;
      }).length;
      const score = Math.round((correct / quiz.questions.length) * 100);
      setSubmitted(true);
      onComplete(score);
    } else {
      setStep((s) => s + 1);
    }
  }

  if (submitted) {
    const correct = quiz.questions.filter((q) => {
      const chosen = answers[q.id];
      const correctOpt = q.options.find((o) => o.correct);
      return chosen && correctOpt && chosen === correctOpt.id;
    }).length;
    const score = Math.round((correct / quiz.questions.length) * 100);
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6" role="dialog" aria-modal="true">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl px-6 py-8 text-center">
          <span className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: ORANGE_SOFT }}>
            <Award size={24} color={ORANGE} />
          </span>
          <h3 className="font-extrabold text-lg mb-1" style={{ fontFamily: "'Poppins', sans-serif", color: BLUE }}>{score}%</h3>
          <p className="text-xs text-gray-500 mb-5">You got {correct} of {quiz.questions.length} correct on "{quiz.title}".</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-white font-bold text-xs rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: BLUE }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: ORANGE_SOFT }}>
            <Lightbulb size={16} color={ORANGE} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-[15px] truncate" style={{ fontFamily: "'Poppins', sans-serif", color: BLUE }}>{quiz.title}</h3>
            <p className="text-[11px] text-gray-400">Question {step + 1} of {quiz.questions.length}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="px-5 py-5">
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / quiz.questions.length) * 100}%`, background: GREEN }}
            />
          </div>

          <p className="font-semibold text-[14px] text-gray-900 mb-4">{question.question}</p>

          <div className="flex flex-col gap-2 mb-6">
            {question.options.map((o) => {
              const selected = answers[question.id] === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pick(o.id)}
                  className="flex items-center gap-2.5 text-left rounded-lg border px-3.5 py-2.5 text-xs transition-colors"
                  style={{
                    borderColor: selected ? GREEN : "#E5E7EB",
                    background: selected ? GREEN_SOFT : "white",
                    color: selected ? GREEN : "#374151",
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: selected ? GREEN : "#CBD5E1" }}
                  >
                    {selected && <span className="w-2 h-2 rounded-full" style={{ background: GREEN }} />}
                  </span>
                  <span className="font-medium">{o.text}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              type="button"
              disabled={!answers[question.id]}
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-lg text-white font-bold text-xs px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: BLUE }}
            >
              {isLast ? "Submit" : "Next"} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   MAIN DASHBOARD
   ============================================================================ */
export default function Students() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [lang, setLang] = useState("en");
  const t = lang === "rw" ? T_RW : T_EN;

  // Student's name — in production this comes from the Google account handed
  // back at login (see Home.jsx's handleGoogleSignedIn / location.state.name).
  const [studentName] = useState("");

  const [notes] = useState(SEED_NOTES);
  const [quizzes, setQuizzes] = useState(SEED_QUIZZES.map((q) => ({ ...q, done: false, score: null })));

  const [openNote, setOpenNote] = useState(null);
  const [openQuiz, setOpenQuiz] = useState(null);

  const pendingQuizzes = quizzes.filter((q) => !q.done);
  const doneQuizzes = quizzes.filter((q) => q.done);
  const averageScore = doneQuizzes.length
    ? Math.round(doneQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / doneQuizzes.length) + "%"
    : "—";

  function completeQuiz(quizId, score) {
    setQuizzes((qs) => qs.map((q) => (q.id === quizId ? { ...q, done: true, score } : q)));
  }

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
      {openQuiz && (
        <QuizTakerModal
          quiz={openQuiz}
          onClose={() => setOpenQuiz(null)}
          onComplete={(score) => completeQuiz(openQuiz.id, score)}
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
            <span className="hidden sm:flex items-center font-semibold rounded shadow-sm border border-gray-100 gap-1.5 text-[11px] py-1.5 px-2.5" style={{ color: GREEN }}>
              <Gift className="w-3 h-3" />
              2025–2026
            </span>
            <button className="rounded-full border border-gray-200 text-gray-500 hover:bg-blue-50 flex items-center justify-center w-8 h-8">
              <Moon className="w-[0.9375rem] h-[0.9375rem]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-[4%] pb-8">
          <div className="relative overflow-hidden rounded-lg text-white flex items-center justify-between py-[1.15em] px-[5%] mb-6" style={{ background: BLUE }}>
            <div className="max-w-[36rem]">
              <h2 className="font-extrabold text-base mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {t.welcome}, {studentName || t.guest}!
              </h2>
              <p className="text-white/80 text-xs mb-3">
                {t.welcomeSub1} <span className="font-bold text-white">{notes.length}</span> {t.welcomeSub2}{" "}
                <span className="font-bold text-white">{pendingQuizzes.length}</span> {t.welcomeSub3}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center border border-white/20 text-white font-medium rounded-md gap-1.5 text-[11px] py-1.5 px-2.5">
                  <Backpack className="w-3 h-3" /> S5 MPC
                </span>
                <span className="flex items-center border border-white/20 text-white font-medium rounded-md gap-1.5 text-[11px] py-1.5 px-2.5">
                  <Gift className="w-3 h-3" /> 2025–2026
                </span>
              </div>
            </div>

            <div className="relative flex shrink-0 items-center justify-center bg-white/10 border border-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 ml-4">
              <User className="w-[55%] h-[55%] text-white" aria-hidden="true" />
              <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2" style={{ background: GREEN, borderColor: BLUE }} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 max-w-full">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="flex items-center font-bold text-gray-900 gap-2 text-[15px]">
                  <BookOpen className="w-4 h-4" style={{ color: BLUE }} />
                  {t.recentNotes}
                </h3>
                <button className="font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 text-[11px] py-1.5 px-2.5">
                  {t.viewAll}
                </button>
              </div>
              <p className="text-gray-400 text-[11px] mb-3.5">{t.recentNotesSub}</p>

              {notes.length === 0 ? (
                <EmptyState icon={BookOpen} title={t.noNotes} sub={t.noNotesSub} tint={BLUE_SOFT} ink={BLUE} />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {notes.map((note) => (
                    <button
                      key={note.title}
                      type="button"
                      onClick={() => setOpenNote(note)}
                      className="flex items-start bg-gray-50 hover:bg-gray-100 transition-colors rounded-md gap-2.5 p-3 text-left w-full"
                    >
                      <div className="rounded-lg flex items-center justify-center shrink-0 w-8 h-8" style={{ background: GREEN_SOFT }}>
                        <FileEdit size={13} color={GREEN} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-[13px]">{note.title}</p>
                        <p className="flex items-center text-gray-400 gap-1 text-[11px] mt-0.5">
                          <User className="w-2.5 h-2.5" />
                          {note.author} · {note.date}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="flex items-center font-bold text-gray-900 gap-2 text-[15px]">
                  <Lightbulb className="w-4 h-4" style={{ color: ORANGE }} />
                  {t.pendingQuizzesTitle}
                </h3>
                <button className="font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 text-[11px] py-1.5 px-2.5">
                  {t.viewAll}
                </button>
              </div>
              <p className="text-gray-400 text-[11px] mb-3.5">{t.pendingQuizzesSub}</p>

              {pendingQuizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-9">
                  <div className="rounded-full flex items-center justify-center w-12 h-12 mb-3" style={{ background: GREEN_SOFT }}>
                    <CheckCircle2 size={22} color={GREEN} />
                  </div>
                  <p className="font-bold text-gray-900 mb-1 text-[15px]">{t.allDone}</p>
                  <p className="text-gray-400 text-[13px]">{t.allDoneSub}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {pendingQuizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center gap-2.5 bg-gray-50 rounded-md p-3">
                      <div className="rounded-lg flex items-center justify-center shrink-0 w-8 h-8" style={{ background: ORANGE_SOFT }}>
                        <Clock3 size={13} color={ORANGE} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate text-[13px]">{quiz.title}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          {quiz.subject} · {quiz.questions.length} questions{quiz.timeLimit ? ` · ${quiz.timeLimit} min` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenQuiz(quiz)}
                        className="shrink-0 rounded-lg text-white font-bold text-[11px] px-3 py-2 hover:opacity-90 transition-opacity"
                        style={{ background: ORANGE }}
                      >
                        {t.start}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
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