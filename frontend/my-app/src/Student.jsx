import { useState } from "react";
import "./Bounce.css";
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
} from "lucide-react";
// No image import for the avatar — it's rendered with a lucide icon instead,
// so a missing/misnamed asset file can never break the build again.

const navItems = [
  { label: "Home", icon: Home, active: true },
  { label: "Notes", icon: BookOpen, badge: 0 },
  { label: "Quizzes", icon: Lightbulb, badge: 0 },
  { label: "My Results", icon: FileText },
  { label: "Progress", icon: LineChart },
  { label: "Settings", icon: Settings },
];

const recentNotes = [
  {
    title: "Sample Note",
    author: "Your Teacher",
    date: "03 May 2026",
  },
];

const stats = [
  { label: "NOTES AVAILABLE", value: "1", icon: BookOpen },
  { label: "PENDING QUIZZES", value: "0", icon: Lightbulb },
  { label: "QUIZZES DONE", value: "0", icon: CheckCircle2 },
  { label: "AVERAGE SCORE", value: "—", icon: LineChart },
];

function AnimatedBrand({ text }) {
  let i = 0;
  return (
    <span className="rwanda-gradient-text ecw-heading">
      {text.split("").map((ch, idx) => {
        const isFirstOfWord = idx === 0 || text[idx - 1] === " ";
        const current = i++;
        return (
          <span
            key={idx}
            className={isFirstOfWord && ch !== " " ? "rw-first" : ""}
            style={{ "--i": current }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        );
      })}
    </span>
  );
}

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full z-40 bg-white border-r border-gray-100
        flex flex-col transform transition-transform duration-300 ease-in-out
        w-[80%] max-w-[18rem] p-[1.5em]
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-[1.5em]">
          <AnimatedBrand text="Easy ClassWork Record System" />
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 p-[0.25em]">
            <X className="w-[1.125rem] h-[1.125rem] text-black" />
          </button>
        </div>

        <div className="border border-gray-100 rounded-lg flex items-center gap-[0.75em] p-[1em] mb-[1.5em]">
          <div className="rounded-full bg-[rgb(22,32,111)] text-white flex items-center justify-center font-bold shrink-0 w-[2.5rem] h-[2.5rem] text-[1rem]">
            G
          </div>
          <div className="min-w-0">
            <p className="ecw-body font-semibold text-gray-900 truncate text-[0.8125rem]">
              Guest User
            </p>
            <p className="ecw-body text-[#178754] font-medium tracking-wide text-[0.6875rem]">
              GUEST
            </p>
          </div>
        </div>

        <nav className="flex flex-col flex-1 gap-[0.25em]">
          {navItems.map(({ label, icon: Icon, active, badge }) => (
            <button
              key={label}
              className={`ecw-body flex items-center justify-between rounded-md font-medium transition-colors py-[0.6em] px-[0.75em] text-[0.8125rem]
                ${active ? "bg-[rgb(22,32,111)] text-white" : "text-gray-600 hover:bg-[#EAF6EF] hover:text-[#178754]"}`}
            >
              <span className="flex items-center gap-[0.7em]">
                <Icon className={`w-[1.0625rem] h-[1.0625rem] shrink-0 ${active ? "text-white" : "text-black"}`} />
                {label}
              </span>
              {badge !== undefined && badge !== null && (
                <span className="bg-gray-900 text-white font-semibold rounded-md text-[0.6875rem] py-[0.15em] px-[0.5em]">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button className="ecw-body flex items-center text-[rgb(22,32,111)] hover:bg-blue-50 rounded-md font-medium gap-[0.7em] py-[0.6em] px-[0.75em] text-[0.8125rem] mt-[1em]">
          <LogOut className="w-[0.9375rem] h-[0.9375rem] text-black" />
          Sign Out
        </button>
      </aside>
    </>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 flex items-center gap-[0.7em] p-[0.7em]">
      <div className="rounded-md bg-[#EAF6EF] text-[#178754] flex items-center justify-center shrink-0 w-[2rem] h-[2rem]">
        <Icon className="w-[0.8125rem] h-[0.8125rem]" />
      </div>
      <div className="min-w-0">
        <p className="ecw-heading font-extrabold text-gray-900 leading-tight text-[1rem]">{value}</p>
        <p className="ecw-body font-semibold text-gray-400 tracking-wide truncate text-[0.5625rem]">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function EasyClassworkDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex text-gray-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .ecw-heading { font-family: 'Poppins', sans-serif; }
        .ecw-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between gap-[0.7em] py-[1em] px-[4%]">
          <div className="flex items-center min-w-0 gap-[0.7em]">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 p-[0.5em] -ml-[0.5em]">
              <Menu className="w-[1.125rem] h-[1.125rem] text-black" />
            </button>
            <h1 className="ecw-heading font-bold truncate text-[1rem]">
              Hello, <span className="text-[rgb(22,32,111)]">Guest</span> 👋
            </h1>
          </div>

          <div className="flex items-center shrink-0 gap-[0.5em]">
            <span className="ecw-body hidden sm:flex items-center text-[#178754] font-semibold rounded shadow-sm border border-gray-100 gap-[0.4em] text-[0.6875rem] py-[0.4em] px-[0.7em]">
              <Gift className="w-[0.75rem] h-[0.75rem]" />
              2023–2024
            </span>
            <span className="ecw-body hidden sm:flex items-center text-[#178754] font-semibold rounded shadow-sm border border-gray-100 gap-[0.4em] text-[0.6875rem] py-[0.4em] px-[0.7em]">
              <Backpack className="w-[0.75rem] h-[0.75rem]" />
              S5 HGL
            </span>
            <button className="rounded-full border border-gray-200 text-gray-500 hover:bg-blue-50 flex items-center justify-center w-[2rem] h-[2rem]">
              <Moon className="w-[0.9375rem] h-[0.9375rem] text-black" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-[4%] pb-[2em]">
          <div className="relative overflow-hidden rounded-lg bg-[rgb(22,32,111)] text-white flex items-center justify-between py-[1.15em] px-[5%] mb-[1.5em]">
            <div className="max-w-[36rem]">
              <h2 className="ecw-heading font-extrabold text-[1rem] mb-[0.25em]">
                Welcome, Guest!
              </h2>
              <p className="ecw-body text-white/80 text-[0.75rem] mb-[0.75em]">
                You have <span className="font-bold text-white">1</span> new note and{" "}
                <span className="font-bold text-white">0</span> pending quizzes this week.
              </p>
              <div className="flex flex-wrap gap-[0.5em]">
                <span className="ecw-body flex items-center border border-white/20 text-white font-medium rounded-md gap-[0.4em] text-[0.6875rem] py-[0.35em] px-[0.7em]">
                  <Backpack className="w-[0.75rem] h-[0.75rem]" />
                  S5 HGL
                </span>
                <span className="ecw-body flex items-center border border-white/20 text-white font-medium rounded-md gap-[0.4em] text-[0.6875rem] py-[0.35em] px-[0.7em]">
                  <Gift className="w-[0.75rem] h-[0.75rem]" />
                  2023–2024
                </span>
              </div>
            </div>

            {/* Profile avatar (lucide icon, no external image file needed) with status indicator */}
            <div className="relative flex shrink-0 items-center justify-center bg-white/10 border border-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 ml-4">
              <User className="w-[55%] h-[55%] text-white" aria-hidden="true" />
              <button
                title="Active"
                className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#178754] border-2 border-[rgb(22,32,111)] shadow-lg transition-all duration-200 active:scale-90"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[0.7em] mb-[1.5em] max-w-full">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.5em]">
            <div className="bg-white rounded-lg border border-gray-100 p-[1.15em]">
              <div className="flex items-center justify-between mb-[0.25em]">
                <h3 className="ecw-heading flex items-center font-bold text-gray-900 gap-[0.5em] text-[0.9375rem]">
                  <BookOpen className="w-[1rem] h-[1rem] text-black" />
                  Recent Notes
                </h3>
                <button className="ecw-body font-semibold border border-gray-200 rounded-lg hover:bg-[#EAF6EF] hover:text-[#178754] text-gray-700 text-[0.6875rem] py-[0.4em] px-[0.7em]">
                  View All
                </button>
              </div>
              <p className="ecw-body text-gray-400 text-[0.6875rem] mb-[1em]">From your teachers</p>

              <div className="flex flex-col gap-[0.7em]">
                {recentNotes.map((note) => (
                  <div key={note.title} className="flex items-start bg-gray-50 rounded-md gap-[0.7em] p-[0.8em]">
                    <div className="rounded-lg bg-[#EAF6EF] text-[#178754] flex items-center justify-center shrink-0 w-[2rem] h-[2rem]">
                      <FileEdit className="w-[0.8125rem] h-[0.8125rem]" />
                    </div>
                    <div className="min-w-0">
                      <p className="ecw-body font-semibold text-gray-900 truncate text-[0.8125rem]">
                        {note.title}
                      </p>
                      <p className="ecw-body flex items-center text-gray-400 gap-[0.25em] text-[0.6875rem] mt-[0.125em]">
                        <User className="w-[0.6875rem] h-[0.6875rem]" />
                        {note.author} · {note.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-[1.15em]">
              <div className="flex items-center justify-between mb-[0.25em]">
                <h3 className="ecw-heading flex items-center font-bold text-gray-900 gap-[0.5em] text-[0.9375rem]">
                  <Lightbulb className="w-[1rem] h-[1rem] text-black" />
                  Pending Quizzes
                </h3>
                <button className="ecw-body font-semibold border border-gray-200 rounded-lg hover:bg-[#EAF6EF] hover:text-[#178754] text-gray-700 text-[0.6875rem] py-[0.4em] px-[0.7em]">
                  View All
                </button>
              </div>
              <p className="ecw-body text-gray-400 text-[0.6875rem] mb-[1em]">Don't miss these</p>

              <div className="flex flex-col items-center justify-center text-center py-[2.25em]">
                <div className="rounded-full bg-[#EAF6EF] text-[#178754] flex items-center justify-center w-[3rem] h-[3rem] mb-[1em]">
                  <CheckCircle2 className="w-[1.375rem] h-[1.375rem]" />
                </div>
                <p className="ecw-heading font-bold text-gray-900 mb-[0.25em] text-[0.9375rem]">All done!</p>
                <p className="ecw-body text-gray-400 text-[0.8125rem]">
                  No pending quizzes right now.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}