import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  Settings,
  Plus,
  Search,
  KeyRound,
  Mail,
  Ban,
  CheckCircle2,
  X,
  Copy,
  ChevronRight,
  BookOpen,
  CalendarRange,
  Trash2,
} from "lucide-react";

// ------------------------------------------------------------------
// Palette pulled directly from Home.jsx — no new colors introduced.
// Inline styles are used for exact hex/rgb values since this preview
// environment has no Tailwind JIT for arbitrary bracket classes.
// ------------------------------------------------------------------
const C = {
  green: "#178754",
  greenDark: "#136040",
  greenSoft: "#EAF6EF",
  navy: "rgb(22,32,111)",
  navySoft: "#E6F1FB",
  blue: "#1D6FE0",
  mint: "#6EE7A8",
};

const FONT = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
    .ecw-heading { font-family: 'Poppins', sans-serif; }
    .ecw-body { font-family: 'Inter', sans-serif; }
  `}</style>
);

function genCode(prefix) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}
function genTempPassword() {
  return Math.random().toString(36).slice(-8);
}

const SCHOOL = { name: "Green Hills Academy", code: "GHA-4821", year: "2026 - Term 2" };

const INITIAL_YEARS = [
  {
    id: "y1",
    label: "2025 - 2026",
    active: true,
    classes: [
      { id: "c1", name: "Senior 1 A", teacherId: "t1", studentCount: 34 },
      { id: "c2", name: "Senior 1 B", teacherId: "t2", studentCount: 31 },
      { id: "c3", name: "Senior 2 A", teacherId: null, studentCount: 29 },
    ],
  },
];

const INITIAL_TEACHERS = [
  { id: "t1", name: "Abayo Albertine", email: "albertine.a@ghacademy.rw", subject: "Geography", code: genCode("TCH"), status: "active" },
  { id: "t2", name: "Mukunzi Joseph", email: "joseph.m@ghacademy.rw", subject: "Mathematics", code: genCode("TCH"), status: "active" },
  { id: "t3", name: "Shyaka Jules", email: "jules.s@ghacademy.rw", subject: "Physics", code: genCode("TCH"), status: "suspended" },
];

const INITIAL_STUDENTS = [
  { id: "s1", name: "Keza Diane", email: "keza.d@student.gha.rw", className: "Senior 1 A", code: genCode("STU"), status: "active" },
  { id: "s2", name: "Iradukunda Eric", email: "eric.i@student.gha.rw", className: "Senior 1 A", code: genCode("STU"), status: "active" },
  { id: "s3", name: "Uwase Grace", email: "grace.u@student.gha.rw", className: "Senior 1 B", code: genCode("STU"), status: "active" },
];

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "teachers", label: "Teachers", icon: GraduationCap },
  { id: "students", label: "Students", icon: Users },
  { id: "classes", label: "Classes & years", icon: School },
  { id: "settings", label: "School settings", icon: Settings },
];

// ------------------------------------------------------------------
// Small shared UI pieces
// ------------------------------------------------------------------
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl ecw-body"
      style={{ background: C.navy }}
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.mint }} />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="flex items-center gap-3.5 bg-white rounded-xl border border-neutral-100 p-4 flex-1 min-w-[160px]">
      <span
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: tint === "navy" ? C.navySoft : C.greenSoft }}
      >
        <Icon className="w-5 h-5" style={{ color: tint === "navy" ? C.blue : C.green }} aria-hidden="true" />
      </span>
      <div>
        <p className="ecw-heading text-lg font-extrabold text-neutral-900 leading-none">{value}</p>
        <p className="ecw-body text-[11px] text-neutral-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const active = status === "active";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
      style={{
        background: active ? C.greenSoft : "#FEE2E2",
        color: active ? C.green : "#B91C1C",
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? C.green : "#B91C1C" }} />
      {active ? "Active" : "Suspended"}
    </span>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 py-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ecw-body bg-white w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center gap-3 px-5 pt-5 pb-3 border-b border-neutral-100">
          <div className="flex-1 min-w-0">
            {subtitle && <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: C.green }}>{subtitle}</p>}
            <h3 className="ecw-heading text-base font-extrabold text-neutral-900 mt-0.5">{title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-neutral-600 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none";

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export default function AdminPanel() {
  const [tab, setTab] = useState("overview");
  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [years, setYears] = useState(INITIAL_YEARS);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null); // { kind: 'teacher'|'student', id }

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const filteredTeachers = useMemo(
    () => teachers.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [teachers, search]
  );
  const filteredStudents = useMemo(
    () => students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [students, search]
  );

  const resetPassword = (kind, id) => {
    const temp = genTempPassword();
    if (kind === "teacher") setTeachers((list) => list.map((t) => (t.id === id ? { ...t, lastTempPassword: temp } : t)));
    else setStudents((list) => list.map((s) => (s.id === id ? { ...s, lastTempPassword: temp } : s)));
    notify(`Temporary password ${temp} generated — share it with the account owner.`);
  };

  const toggleStatus = (kind, id) => {
    const flip = (list) =>
      list.map((p) => (p.id === id ? { ...p, status: p.status === "active" ? "suspended" : "active" } : p));
    if (kind === "teacher") setTeachers(flip);
    else setStudents(flip);
    notify("Account status updated.");
  };

  const changeEmail = (kind, id, email) => {
    if (kind === "teacher") setTeachers((list) => list.map((t) => (t.id === id ? { ...t, email } : t)));
    else setStudents((list) => list.map((s) => (s.id === id ? { ...s, email } : s)));
    notify("Email address updated.");
    setEditAccount(null);
  };

  const addTeacher = (form) => {
    const t = { id: `t${Date.now()}`, code: genCode("TCH"), status: "active", ...form };
    setTeachers((list) => [t, ...list]);
    setAddTeacherOpen(false);
    notify(`Teacher added — code ${t.code} sent to ${t.email}.`);
  };

  const addStudent = (form) => {
    const s = { id: `s${Date.now()}`, code: genCode("STU"), status: "active", ...form };
    setStudents((list) => [s, ...list]);
    setAddStudentOpen(false);
    notify(`Student added — code ${s.code} sent to ${s.email}.`);
  };

  const addClass = (yearId, form) => {
    setYears((list) =>
      list.map((y) =>
        y.id === yearId
          ? { ...y, classes: [...y.classes, { id: `c${Date.now()}`, studentCount: 0, ...form }] }
          : y
      )
    );
    setAddClassOpen(false);
    notify(`Class "${form.name}" created.`);
  };

  const addYear = (label) => {
    setYears((list) => [...list.map((y) => ({ ...y, active: false })), { id: `y${Date.now()}`, label, active: true, classes: [] }]);
    setAddYearOpen(false);
    notify(`Academic year "${label}" created.`);
  };

  const totalClasses = years.reduce((sum, y) => sum + y.classes.length, 0);

  return (
    <div className="min-h-screen bg-neutral-50 ecw-body text-neutral-900">
      {FONT}
      <Toast message={toast} onClose={() => setToast("")} />

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 min-h-screen bg-white border-r border-neutral-100 px-4 py-6 sticky top-0">
          <div className="flex items-center gap-2.5 px-2 mb-8">
            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.greenSoft }}>
              <School className="w-5 h-5" style={{ color: C.green }} />
            </span>
            <div className="min-w-0">
              <p className="ecw-heading font-bold text-[13px] text-neutral-900 truncate">{SCHOOL.name}</p>
              <p className="text-[10px] text-neutral-400">{SCHOOL.code}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors text-left"
                  style={isActive ? { background: C.greenSoft, color: C.green } : { color: "#525252" }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-neutral-100 px-1">
            <p className="text-[10px] text-neutral-400">Signed in as</p>
            <p className="text-xs font-bold text-neutral-800 mt-0.5">School admin</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-5 sm:px-8 py-7">
          {/* Mobile tab bar */}
          <div className="flex md:hidden gap-1 overflow-x-auto pb-4 -mx-1 px-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg whitespace-nowrap shrink-0"
                  style={isActive ? { background: C.greenSoft, color: C.green } : { background: "#fff", color: "#737373", border: "1px solid #f0f0f0" }}
                >
                  <Icon className="w-3.5 h-3.5" /> {item.label}
                </button>
              );
            })}
          </div>

          {tab === "overview" && (
            <div>
              <h1 className="ecw-heading text-xl font-extrabold text-neutral-900 mb-1">Overview</h1>
              <p className="text-xs text-neutral-500 mb-6">{SCHOOL.year} · everything happening at {SCHOOL.name} right now.</p>

              <div className="flex flex-wrap gap-4 mb-8">
                <StatCard icon={GraduationCap} label="Teachers" value={teachers.length} tint="blue" />
                <StatCard icon={Users} label="Students" value={students.length} tint="navy" />
                <StatCard icon={BookOpen} label="Classes" value={totalClasses} tint="blue" />
                <StatCard icon={CalendarRange} label="Academic years" value={years.length} tint="navy" />
              </div>

              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <h2 className="ecw-heading font-bold text-sm text-neutral-900 mb-3">Suspended accounts need attention</h2>
                <div className="flex flex-col gap-2">
                  {[...teachers, ...students].filter((p) => p.status === "suspended").length === 0 && (
                    <p className="text-xs text-neutral-400">Nothing needs attention — every account is active.</p>
                  )}
                  {teachers.filter((t) => t.status === "suspended").map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs px-3 py-2.5 rounded-lg bg-neutral-50">
                      <span className="font-semibold text-neutral-700">{t.name} · Teacher</span>
                      <button onClick={() => toggleStatus("teacher", t.id)} className="font-bold" style={{ color: C.green }}>
                        Reactivate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(tab === "teachers" || tab === "students") && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h1 className="ecw-heading text-xl font-extrabold text-neutral-900 mb-1">
                    {tab === "teachers" ? "Teachers" : "Students"}
                  </h1>
                  <p className="text-xs text-neutral-500">
                    {tab === "teachers"
                      ? "Add teachers, reset their passwords, and manage access."
                      : "Add students, assign classes, and manage access."}
                  </p>
                </div>
                <button
                  onClick={() => (tab === "teachers" ? setAddTeacherOpen(true) : setAddStudentOpen(true))}
                  className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2.5 rounded-lg hover:opacity-90"
                  style={{ background: C.green }}
                >
                  <Plus className="w-4 h-4" /> Add {tab === "teachers" ? "teacher" : "student"}
                </button>
              </div>

              <div className="relative mb-4 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name"
                  className={`${inputCls} pl-8`}
                />
              </div>

              <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-neutral-50 text-left text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3 hidden md:table-cell">{tab === "teachers" ? "Subject" : "Class"}</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === "teachers" ? filteredTeachers : filteredStudents).map((p) => (
                      <tr key={p.id} className="border-t border-neutral-50">
                        <td className="px-4 py-3 font-semibold text-neutral-800">{p.name}</td>
                        <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{p.email}</td>
                        <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">
                          {tab === "teachers" ? p.subject : p.className}
                        </td>
                        <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              title="Reset password"
                              onClick={() => resetPassword(tab === "teachers" ? "teacher" : "student", p.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Change email"
                              onClick={() => setEditAccount({ kind: tab === "teachers" ? "teacher" : "student", id: p.id, email: p.email })}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title={p.status === "active" ? "Suspend" : "Reactivate"}
                              onClick={() => toggleStatus(tab === "teachers" ? "teacher" : "student", p.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
                            >
                              {p.status === "active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "classes" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h1 className="ecw-heading text-xl font-extrabold text-neutral-900 mb-1">Classes & academic years</h1>
                  <p className="text-xs text-neutral-500">Set up the years and classes teachers and students belong to.</p>
                </div>
                <button
                  onClick={() => setAddYearOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg border"
                  style={{ color: C.navy, borderColor: "rgba(22,32,111,0.2)" }}
                >
                  <Plus className="w-4 h-4" /> New academic year
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {years.map((year) => (
                  <div key={year.id} className="bg-white rounded-xl border border-neutral-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="ecw-heading font-bold text-sm text-neutral-900">{year.label}</h2>
                        {year.active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.greenSoft, color: C.green }}>
                            Current
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setAddClassOpen(year.id)}
                        className="flex items-center gap-1 text-[11px] font-bold"
                        style={{ color: C.green }}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add class
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {year.classes.length === 0 && <p className="text-xs text-neutral-400">No classes yet.</p>}
                      {year.classes.map((cls) => {
                        const teacher = teachers.find((t) => t.id === cls.teacherId);
                        return (
                          <div key={cls.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-neutral-50 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="font-semibold text-neutral-800 truncate">{cls.name}</span>
                              <span className="text-neutral-400">· {cls.studentCount} students</span>
                            </div>
                            <span className="font-medium text-neutral-500 shrink-0 ml-2">
                              {teacher ? teacher.name : "No teacher assigned"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div>
              <h1 className="ecw-heading text-xl font-extrabold text-neutral-900 mb-1">School settings</h1>
              <p className="text-xs text-neutral-500 mb-6">Your school's profile as students and teachers see it.</p>
              <div className="bg-white rounded-xl border border-neutral-100 p-5 max-w-md flex flex-col gap-4">
                <Field label="School name"><input readOnly defaultValue={SCHOOL.name} className={`${inputCls} bg-neutral-50`} /></Field>
                <Field label="School code">
                  <div className="flex items-center gap-2">
                    <input readOnly value={SCHOOL.code} className={`${inputCls} bg-neutral-50`} />
                    <button
                      onClick={() => notify("School code copied.")}
                      className="w-9 h-9 shrink-0 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Teachers and students select your school by this code when they register.</p>
                </Field>
                <Field label="Current academic year"><input readOnly value={SCHOOL.year} className={`${inputCls} bg-neutral-50`} /></Field>
              </div>
            </div>
          )}
        </main>
      </div>

      {addTeacherOpen && (
        <AddPersonModal
          role="teacher"
          onClose={() => setAddTeacherOpen(false)}
          onSubmit={addTeacher}
          extraField={{ key: "subject", label: "Subject taught", placeholder: "e.g. Mathematics" }}
        />
      )}
      {addStudentOpen && (
        <AddPersonModal
          role="student"
          onClose={() => setAddStudentOpen(false)}
          onSubmit={addStudent}
          extraField={{
            key: "className",
            label: "Class",
            select: years.flatMap((y) => y.classes.map((c) => c.name)),
          }}
        />
      )}
      {addClassOpen && (
        <AddClassModal
          teachers={teachers}
          onClose={() => setAddClassOpen(false)}
          onSubmit={(form) => addClass(addClassOpen, form)}
        />
      )}
      {addYearOpen && <AddYearModal onClose={() => setAddYearOpen(false)} onSubmit={addYear} />}
      {editAccount && (
        <Modal title="Change email address" subtitle="Account settings" onClose={() => setEditAccount(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              changeEmail(editAccount.kind, editAccount.id, editAccount.email);
            }}
            className="flex flex-col gap-3"
          >
            <Field label="New email address">
              <input
                type="email"
                required
                autoFocus
                value={editAccount.email}
                onChange={(e) => setEditAccount((cur) => ({ ...cur, email: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <button type="submit" className="w-full mt-1 py-2.5 text-white font-bold text-xs rounded-lg hover:opacity-90" style={{ background: C.green }}>
              Save email
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function AddPersonModal({ role, onClose, onSubmit, extraField }) {
  const [form, setForm] = useState({ name: "", email: "", [extraField.key]: "" });
  return (
    <Modal title={`Add a ${role}`} subtitle="New account" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="flex flex-col gap-3"
      >
        <Field label="Full name">
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className={inputCls} />
        </Field>
        <Field label="Email address">
          <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className={inputCls} />
        </Field>
        <Field label={extraField.label}>
          {extraField.select ? (
            <select
              required
              value={form[extraField.key]}
              onChange={(e) => setForm((f) => ({ ...f, [extraField.key]: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select a class</option>
              {extraField.select.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input required value={form[extraField.key]} onChange={(e) => setForm((f) => ({ ...f, [extraField.key]: e.target.value }))} placeholder={extraField.placeholder} className={inputCls} />
          )}
        </Field>
        <p className="text-[10px] text-neutral-400 -mt-1">
          A personal sign-in code is generated automatically and sent to this email.
        </p>
        <button type="submit" className="w-full mt-1 py-2.5 text-white font-bold text-xs rounded-lg hover:opacity-90" style={{ background: C.green }}>
          Create account
        </button>
      </form>
    </Modal>
  );
}

function AddClassModal({ teachers, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", teacherId: "" });
  return (
    <Modal title="Add a class" subtitle="Classes" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name: form.name, teacherId: form.teacherId || null });
        }}
        className="flex flex-col gap-3"
      >
        <Field label="Class name">
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Senior 3 C" className={inputCls} />
        </Field>
        <Field label="Class teacher (optional)">
          <select value={form.teacherId} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))} className={inputCls}>
            <option value="">Assign later</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <button type="submit" className="w-full mt-1 py-2.5 text-white font-bold text-xs rounded-lg hover:opacity-90" style={{ background: C.green }}>
          Create class
        </button>
      </form>
    </Modal>
  );
}

function AddYearModal({ onClose, onSubmit }) {
  const [label, setLabel] = useState("");
  return (
    <Modal title="New academic year" subtitle="Classes & years" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(label);
        }}
        className="flex flex-col gap-3"
      >
        <Field label="Year label">
          <input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. 2026 - 2027" className={inputCls} />
        </Field>
        <p className="text-[10px] text-neutral-400 -mt-1">This becomes the current year; classes can be added to it right after.</p>
        <button type="submit" className="w-full mt-1 py-2.5 text-white font-bold text-xs rounded-lg hover:opacity-90" style={{ background: C.green }}>
          Create year
        </button>
      </form>
    </Modal>
  );
}