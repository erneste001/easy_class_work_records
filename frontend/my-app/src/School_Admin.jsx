import { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, Bell, Filter, Users, UserCog, LogOut, Settings, LayoutGrid,
  ClipboardCheck, Megaphone, Plus, Pencil, Trash2, X, ChevronDown, Menu,
  Search, Ban, CheckCircle2, Circle, Save, Send, School, BookOpen,
  Mail, ShieldCheck, Clock, ArrowLeft, AlertCircle
} from 'lucide-react';

/* ---------------------------------- THEME ---------------------------------- */
/* Four-color system used everywhere: green (success/primary), blue (ink/headings),
   orange (attention/danger), white (surface). Keep these as the only accents. */

const t = {
  bg: '#FFFFFF', panel: '#F7F8FA', border: '#E7E9EF',
  text: '#13151C', subtext: '#6B7280', faint: '#A1A7B3',
  green: '#0E9F6E', greenSoft: '#E7F8F1',
  blue: '#2A5CDB', blueSoft: '#EAF0FE',
  orange: '#EA5B0C', orangeSoft: '#FFEEE3',
  shimmer1: '#EEF0F4', shimmer2: '#F9FAFC',
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };

const SEED_CLASSES = [
  { id: uid(), name: 'S5 HGL', teacherId: null, subjects: ['History', 'Geography'], studentCount: 34 },
  { id: uid(), name: 'S5 MEG A', teacherId: null, subjects: ['Math', 'Economics'], studentCount: 29 },
];
const SEED_SUBJECTS = ['Mathematics', 'History', 'Geography', 'Economics', 'Biology', 'English'];

/* -------------------------------- PRIMITIVES -------------------------------- */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      html { -webkit-text-size-adjust: 100%; }
      .sa-root { font-family: 'Inter', system-ui, sans-serif; background:#fff; }
      .sa-heading { font-family: 'Poppins', system-ui, sans-serif; }
      @keyframes saShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      .sa-skel { background-image: linear-gradient(90deg, var(--s1) 0px, var(--s2) 40px, var(--s1) 80px); background-size: 600px 100%; animation: saShimmer 1.4s infinite linear; }
      @keyframes saFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .sa-fade { animation: saFade .26s ease both; }
      .sa-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .sa-scroll::-webkit-scrollbar-thumb { background: #E7E9EF; border-radius: 8px; }
      .sa-btn { transition: transform .1s ease, background .15s ease, opacity .15s ease, border-color .15s ease; touch-action: manipulation; }
      .sa-btn:active { transform: scale(0.97); }
      .sa-row:hover { background: #F7F8FA; }
      input:focus, textarea:focus, select:focus { outline: 2px solid #2A5CDB55; outline-offset: 1px; }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: .001ms !important; transition-duration: .001ms !important; }
      }
      @media (max-width: 860px) {
        .sa-hamburger { display: flex !important; }
        .sa-desktop-filters { display: none !important; }
        .sa-sidebar-wrap { display: none !important; }
        .sa-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      }
      @media (max-width: 480px) {
        .sa-page-pad { padding: 16px !important; }
        .sa-heading { font-size: 15px; }
      }
    `}</style>
  );
}

function Skeleton({ w = '100%', h = 14, r = 6 }) {
  return <div className="sa-skel" style={{ width: w, height: h, borderRadius: r, '--s1': t.shimmer1, '--s2': t.shimmer2 }} />;
}
function Badge({ children, bg, color }) {
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{children}</span>;
}
function StatusBadge({ status }) {
  const map = {
    active: { bg: t.greenSoft, color: t.green, label: 'Active' },
    suspended: { bg: t.orangeSoft, color: t.orange, label: 'Suspended' },
    pending: { bg: t.blueSoft, color: t.blue, label: 'Pending' },
  };
  const c = map[status] || map.active;
  return <Badge bg={c.bg} color={c.color}>{c.label}</Badge>;
}
function IconBtn({ icon: Icon, onClick, tone = 'default', title, size = 30 }) {
  const tones = { default: { bg: t.panel, color: t.subtext }, orange: { bg: t.orangeSoft, color: t.orange }, blue: { bg: t.blueSoft, color: t.blue }, green: { bg: t.greenSoft, color: t.green } };
  const c = tones[tone];
  // Minimum 30px hit target already; bump padding-equivalent via size for mobile taps.
  return <button type="button" title={title} onClick={onClick} className="sa-btn" style={{ width: size, height: size, borderRadius: 8, border: 'none', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Icon size={size * 0.46} /></button>;
}
function Button({ children, onClick, icon: Icon, variant = 'solid', disabled, style }) {
  const styles = {
    solid: { background: t.green, color: '#fff', border: 'none' },
    blue: { background: t.blue, color: '#fff', border: 'none' },
    soft: { background: t.orangeSoft, color: t.orange, border: 'none' },
    outline: { background: '#fff', color: t.text, border: `1px solid ${t.border}` },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="sa-btn"
      style={{ ...styles[variant], padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', minHeight: 36, ...style }}>
      {Icon && <Icon size={14} />}{children}
    </button>
  );
}
function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={{ fontSize: 11, fontWeight: 700, color: t.subtext }}>{label}</label>{children}</div>;
}
function Input(props) {
  return <input {...props} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 13, color: t.text, background: t.panel, outline: 'none', width: '100%', ...(props.style || {}) }} />;
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 13, color: t.text, background: t.panel, outline: 'none', width: '100%' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Dropdown({ value, options, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); } document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc); }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="sa-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 11px', fontSize: 12.5, fontWeight: 600, color: t.text, cursor: 'pointer' }}>
        {Icon && <Icon size={14} color={t.subtext} />}<span>{value}</span><ChevronDown size={13} color={t.subtext} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div className="sa-fade" style={{ position: 'absolute', top: '110%', left: 0, background: '#fff', border: `1px solid ${t.border}`, borderRadius: 8, boxShadow: '0 10px 24px rgba(18,20,28,0.12)', minWidth: 170, zIndex: 40, overflow: 'hidden' }}>
          {options.map(opt => <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} style={{ padding: '9px 13px', fontSize: 12.5, cursor: 'pointer', color: opt === value ? t.blue : t.text, fontWeight: opt === value ? 700 : 500, background: opt === value ? t.blueSoft : 'transparent' }}>{opt}</div>)}
        </div>
      )}
    </div>
  );
}
function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="sa-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 20px', textAlign: 'center', gap: 5 }}>
      <div style={{ width: 50, height: 50, borderRadius: 10, background: t.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}><Icon size={22} color={t.green} /></div>
      <h3 className="sa-heading" style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: t.text }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 12.5, color: t.subtext, maxWidth: 300, lineHeight: 1.5 }}>{text}</p>
      {action}
    </div>
  );
}
function Modal({ children, onClose, width = 440 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="sa-fade sa-scroll" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, width, maxWidth: '100%', maxHeight: '86vh', overflowY: 'auto', border: `1px solid ${t.border}` }}>{children}</div>
    </div>
  );
}
function ConfirmModal({ title, text, confirmLabel, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} width={360}>
      <div style={{ padding: 22 }}>
        <h3 className="sa-heading" style={{ margin: '0 0 8px', fontSize: 15, color: t.text }}>{title}</h3>
        <p style={{ margin: '0 0 18px', fontSize: 12.5, color: t.subtext, lineHeight: 1.5 }}>{text}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="soft" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
function StatMini({ icon: Icon, value, label, tone = 'green' }) {
  const map = { green: { bg: t.greenSoft, fg: t.green }, blue: { bg: t.blueSoft, fg: t.blue }, orange: { bg: t.orangeSoft, fg: t.orange } };
  const c = map[tone];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 13px', flex: '1 1 148px' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={14} color={c.fg} /></div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span className="sa-heading" style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{value}</span>
        <span style={{ fontSize: 11, color: t.subtext, fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );
}
function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.panel, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 11px', flex: '1 1 200px', maxWidth: 320 }}>
      <Search size={14} color={t.subtext} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, color: t.text, width: '100%' }} />
    </div>
  );
}
function Table({ columns, rows, renderRow, empty }) {
  if (rows.length === 0) return empty;
  return (
    <div className="sa-table-wrap" style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr style={{ background: t.panel }}>
            {columns.map(c => <th key={c} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 10.5, fontWeight: 700, color: t.subtext, letterSpacing: 0.4, textTransform: 'uppercase', borderBottom: `1px solid ${t.border}` }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}
const Td = ({ children, style }) => <td style={{ padding: '11px 14px', fontSize: 12.5, color: t.text, borderBottom: `1px solid ${t.border}`, verticalAlign: 'middle', ...style }}>{children}</td>;

/* ---------------------------------- SIDEBAR / HEADER ---------------------------------- */

function NavItem({ icon: Icon, label, count, active, onClick }) {
  return (
    <li onClick={onClick} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, cursor: 'pointer', background: active ? t.greenSoft : 'transparent', color: active ? t.green : t.text }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.panel; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <Icon size={15} /><span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{label}</span>
      {count !== undefined && <span style={{ background: active ? '#fff' : t.blueSoft, color: active ? t.green : t.blue, borderRadius: 6, padding: '2px 7px', fontSize: 10.5, fontWeight: 700 }}>{count}</span>}
    </li>
  );
}
function Sidebar({ section, go, counts, sidebarOpen, setSidebarOpen }) {
  const items = [
    { key: 'overview', icon: LayoutGrid, label: 'Overview' },
    { key: 'teachers', icon: UserCog, label: 'Teachers', count: counts.teachers },
    { key: 'students', icon: Users, label: 'Students', count: counts.students },
    { key: 'classes', icon: School, label: 'Classes', count: counts.classes },
    { key: 'subjects', icon: BookOpen, label: 'Subjects', count: counts.subjects },
    { key: 'approvals', icon: ClipboardCheck, label: 'Approvals', count: counts.approvals },
    { key: 'announcements', icon: Megaphone, label: 'Announcements' },
  ];
  return (
    <div style={{ width: 236, background: '#fff', borderRight: `1px solid ${t.border}`, padding: '20px 16px', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, position: sidebarOpen ? 'fixed' : undefined, left: 0, top: 0, zIndex: 70 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: t.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap size={15} color="#fff" /></div>
          <div><span className="sa-heading" style={{ fontSize: 14, fontWeight: 700, color: t.text, display: 'block' }}>Easy Class</span><span style={{ fontSize: 10, color: t.subtext }}>School admin</span></div>
        </div>
        {sidebarOpen && <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.subtext, display: 'flex' }}><X size={18} /></button>}
      </div>
      <div style={{ background: t.panel, borderRadius: 9, padding: 12, display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.blue}` }}><ShieldCheck size={15} color={t.blue} /></div>
        <div style={{ minWidth: 0 }}>
          <p className="sa-heading" style={{ margin: 0, fontSize: 12, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Green Hills Academy</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: t.blue, fontWeight: 600 }}>● School administrator</p>
        </div>
      </div>
      <ul className="sa-scroll" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
        {items.map(it => <NavItem key={it.key} icon={it.icon} label={it.label} count={it.count} active={section === it.key} onClick={() => { go(it.key); setSidebarOpen(false); }} />)}
        <div style={{ height: 1, background: t.border, margin: '7px 3px' }} />
        <NavItem icon={Settings} label="School settings" active={section === 'settings'} onClick={() => { go('settings'); setSidebarOpen(false); }} />
      </ul>
      <button className="sa-btn" style={{ display: 'grid', gridTemplateColumns: '20px 1fr', alignItems: 'center', gap: 10, marginTop: 8, padding: '9px 11px', borderRadius: 8, background: t.orangeSoft, color: t.orange, border: 'none', cursor: 'pointer' }}><LogOut size={15} /><span style={{ fontSize: 12.5, fontWeight: 700, textAlign: 'left' }}>Sign Out</span></button>
    </div>
  );
}
function Header({ onNew, newLabel, setSidebarOpen, title }) {
  return (
    <div style={{ minHeight: 60, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', gap: 12, background: '#fff', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button onClick={() => setSidebarOpen(true)} className="sa-hamburger" style={{ background: t.panel, border: 'none', borderRadius: 8, width: 34, height: 34, display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.text }}><Menu size={17} /></button>
        <h2 className="sa-heading" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: t.text }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onNew && <Button icon={Plus} onClick={onNew}>{newLabel}</Button>}
        <div style={{ position: 'relative' }}><IconBtn icon={Bell} title="Notifications" /><span style={{ position: 'absolute', top: -3, right: -3, background: t.orange, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 5, width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span></div>
      </div>
    </div>
  );
}
function PageHead({ eyebrow, text }) {
  return <div><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: t.green }}>{eyebrow}</p><p style={{ margin: '3px 0 0', fontSize: 13, color: t.subtext }}>{text}</p></div>;
}

/* ---------------------------------- OVERVIEW ---------------------------------- */

function Overview({ counts, approvals, go }) {
  return (
    <div className="sa-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead eyebrow="OVERVIEW" text="A snapshot of your school right now" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <StatMini icon={UserCog} value={counts.teachers} label="Teachers" tone="green" />
        <StatMini icon={Users} value={counts.students} label="Students" tone="blue" />
        <StatMini icon={School} value={counts.classes} label="Classes" tone="orange" />
        <StatMini icon={BookOpen} value={counts.subjects} label="Subjects" tone="green" />
        <StatMini icon={ClipboardCheck} value={counts.approvals} label="Pending approvals" tone="orange" />
      </div>
      {approvals.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p className="sa-heading" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.text }}>Needs your review</p>
            <button onClick={() => go('approvals')} className="sa-btn" style={{ background: 'none', border: 'none', color: t.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvals.slice(0, 3).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.panel, borderRadius: 8, padding: '9px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Badge bg={t.blueSoft} color={t.blue}>{a.type}</Badge>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: t.text }}>{a.name}</span>
                </div>
                <span style={{ fontSize: 11, color: t.subtext }}>{fmtDate(a.requestedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- TEACHERS ---------------------------------- */
/* NOTE: teachers/students are created only via the Approvals flow (Google
   sign-up requests) or by an admin picking an existing pending user. This
   modal edits assignment details — it never collects or edits an email,
   since email always comes from Google and must stay authoritative. */

function TeacherFormModal({ initial, classes, subjects, onCancel, onSave }) {
  const [name, setName] = useState(initial.name);
  const [subject, setSubject] = useState(initial.subject || subjects[0] || '');
  const [assignedClasses, setAssignedClasses] = useState(initial.assignedClasses || []);
  const toggle = (c) => setAssignedClasses(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);
  return (
    <Modal onClose={onCancel}>
      <div style={{ padding: 22 }}>
        <h3 className="sa-heading" style={{ margin: '0 0 4px', fontSize: 15.5, color: t.text }}>{initial.id ? 'Edit teacher' : 'Add teacher'}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 11.5, color: t.subtext }}>Email is set by the teacher's Google sign-in and can't be changed here.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Full name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mr. Jean Bosco" /></Field>
          {initial.email && (
            <Field label="Email (from Google)"><Input value={initial.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} /></Field>
          )}
          <Field label="Main subject"><Select value={subject} onChange={setSubject} options={subjects} /></Field>
          <Field label="Assigned classes">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {classes.map(c => {
                const active = assignedClasses.includes(c.name);
                return <button key={c.id} type="button" onClick={() => toggle(c.name)} className="sa-btn" style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${active ? t.green : t.border}`, background: active ? t.greenSoft : '#fff', color: active ? t.green : t.text, borderRadius: 8, padding: '7px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{active ? <CheckCircle2 size={13} /> : <Circle size={13} color={t.faint} />} {c.name}</button>;
              })}
            </div>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button icon={Save} disabled={!name} onClick={() => onSave({ ...initial, name, subject, assignedClasses, status: initial.status || 'active' })}>{initial.id ? 'Save changes' : 'Add teacher'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function TeachersPage({ teachers, classes, subjects, loading, onEdit, onToggleStatus, onDelete }) {
  const [q, setQ] = useState('');
  const filtered = teachers.filter(tc => tc.name.toLowerCase().includes(q.toLowerCase()) || tc.email.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="sa-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHead eyebrow="TEACHERS" text="Teachers sign up with Google from the login page — approve requests, then manage classes here" />
      <SearchBox value={q} onChange={setQ} placeholder="Search teachers…" />
      {loading ? <Skeleton h={200} r={10} /> : (
        <Table columns={['Name', 'Email', 'Subject', 'Classes', 'Status', 'Actions']} rows={filtered}
          empty={<EmptyState icon={UserCog} title={teachers.length === 0 ? 'No teachers yet' : 'No matches'} text={teachers.length === 0 ? 'Teachers will appear here once they sign up with Google and you approve their request.' : 'Try a different search term.'} />}
          renderRow={(tc) => (
            <tr key={tc.id} className="sa-row">
              <Td style={{ fontWeight: 600 }}>{tc.name}</Td>
              <Td style={{ color: t.subtext }}>{tc.email}</Td>
              <Td>{tc.subject}</Td>
              <Td>{tc.assignedClasses.length ? tc.assignedClasses.join(', ') : <span style={{ color: t.faint }}>None</span>}</Td>
              <Td><StatusBadge status={tc.status} /></Td>
              <Td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <IconBtn size={26} icon={Pencil} tone="blue" onClick={() => onEdit(tc)} title="Edit" />
                  <IconBtn size={26} icon={tc.status === 'active' ? Ban : CheckCircle2} tone="orange" onClick={() => onToggleStatus(tc)} title={tc.status === 'active' ? 'Suspend' : 'Reactivate'} />
                  <IconBtn size={26} icon={Trash2} tone="orange" onClick={() => onDelete(tc)} title="Remove" />
                </div>
              </Td>
            </tr>
          )} />
      )}
    </div>
  );
}

/* ---------------------------------- STUDENTS ---------------------------------- */

function StudentFormModal({ initial, classes, onCancel, onSave }) {
  const [name, setName] = useState(initial.name);
  const [guardianEmail, setGuardianEmail] = useState(initial.guardianEmail);
  const [className, setClassName] = useState(initial.className || classes[0]?.name || '');
  return (
    <Modal onClose={onCancel}>
      <div style={{ padding: 22 }}>
        <h3 className="sa-heading" style={{ margin: '0 0 4px', fontSize: 15.5, color: t.text }}>{initial.id ? 'Edit student' : 'Add student'}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 11.5, color: t.subtext }}>The student's own email is set by their Google sign-in and can't be changed here. A guardian email is optional contact info you can enter yourself.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Full name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aline Umutoni" /></Field>
          {initial.email && (
            <Field label="Student email (from Google)"><Input value={initial.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} /></Field>
          )}
          <Field label="Guardian email (optional)"><Input type="email" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} placeholder="guardian@email.com" /></Field>
          <Field label="Class">{classes.length ? <Select value={className} onChange={setClassName} options={classes.map(c => c.name)} /> : <p style={{ fontSize: 12, color: t.subtext, margin: 0 }}>Create a class first.</p>}</Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button icon={Save} disabled={!name || !className} onClick={() => onSave({ ...initial, name, guardianEmail, className, status: initial.status || 'active' })}>{initial.id ? 'Save changes' : 'Add student'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function StudentsPage({ students, classes, loading, onEdit, onToggleStatus, onDelete }) {
  const [q, setQ] = useState('');
  const [classFilter, setClassFilter] = useState('All classes');
  const filtered = students.filter(s => (classFilter === 'All classes' || s.className === classFilter) && s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="sa-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHead eyebrow="STUDENTS" text="Students sign up with Google from the login page — approve requests, then manage placement here" />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search students…" />
        <Dropdown value={classFilter} options={['All classes', ...classes.map(c => c.name)]} onChange={setClassFilter} icon={Filter} />
      </div>
      {loading ? <Skeleton h={200} r={10} /> : (
        <Table columns={['Name', 'Email', 'Class', 'Guardian', 'Status', 'Actions']} rows={filtered}
          empty={<EmptyState icon={Users} title={students.length === 0 ? 'No students yet' : 'No matches'} text={students.length === 0 ? 'Students will appear here once they sign up with Google and you approve their request.' : 'Try a different filter or search term.'} />}
          renderRow={(s) => (
            <tr key={s.id} className="sa-row">
              <Td style={{ fontWeight: 600 }}>{s.name}</Td>
              <Td style={{ color: t.subtext }}>{s.email}</Td>
              <Td><Badge bg={t.blueSoft} color={t.blue}>{s.className}</Badge></Td>
              <Td style={{ color: t.subtext }}>{s.guardianEmail || '—'}</Td>
              <Td><StatusBadge status={s.status} /></Td>
              <Td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <IconBtn size={26} icon={Pencil} tone="blue" onClick={() => onEdit(s)} title="Edit" />
                  <IconBtn size={26} icon={s.status === 'active' ? Ban : CheckCircle2} tone="orange" onClick={() => onToggleStatus(s)} title={s.status === 'active' ? 'Suspend' : 'Reactivate'} />
                  <IconBtn size={26} icon={Trash2} tone="orange" onClick={() => onDelete(s)} title="Remove" />
                </div>
              </Td>
            </tr>
          )} />
      )}
    </div>
  );
}

/* ---------------------------------- CLASSES ---------------------------------- */

function ClassFormModal({ initial, teachers, subjects, onCancel, onSave }) {
  const [name, setName] = useState(initial.name);
  const [teacherId, setTeacherId] = useState(initial.teacherId || '');
  const [selSubjects, setSelSubjects] = useState(initial.subjects || []);
  const toggle = (s) => setSelSubjects(x => x.includes(s) ? x.filter(y => y !== s) : [...x, s]);
  const teacherOptions = ['Unassigned', ...teachers.map(tc => tc.name)];
  const currentTeacherName = teachers.find(tc => tc.id === teacherId)?.name || 'Unassigned';
  return (
    <Modal onClose={onCancel}>
      <div style={{ padding: 22 }}>
        <h3 className="sa-heading" style={{ margin: '0 0 16px', fontSize: 15.5, color: t.text }}>{initial.id ? 'Edit class' : 'Create class'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Class name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. S4 MEG B" /></Field>
          <Field label="Class teacher">
            <Select value={currentTeacherName} onChange={(v) => setTeacherId(v === 'Unassigned' ? '' : teachers.find(tc => tc.name === v)?.id)} options={teacherOptions} />
          </Field>
          <Field label="Subjects taught">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {subjects.map(s => { const active = selSubjects.includes(s); return <button key={s} type="button" onClick={() => toggle(s)} className="sa-btn" style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${active ? t.green : t.border}`, background: active ? t.greenSoft : '#fff', color: active ? t.green : t.text, borderRadius: 8, padding: '7px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{active ? <CheckCircle2 size={13} /> : <Circle size={13} color={t.faint} />} {s}</button>; })}
            </div>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button icon={Save} disabled={!name} onClick={() => onSave({ ...initial, name, teacherId: teacherId || null, subjects: selSubjects, studentCount: initial.studentCount || 0 })}>{initial.id ? 'Save changes' : 'Create class'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ClassesPage({ classes, teachers, subjects, loading, onAdd, onEdit, onDelete }) {
  return (
    <div className="sa-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <PageHead eyebrow="CLASSES" text="Create classes and assign a teacher to each" />
        <Button icon={Plus} onClick={onAdd}>Create class</Button>
      </div>
      {loading ? <Skeleton h={200} r={10} /> : classes.length === 0 ? (
        <EmptyState icon={School} title="No classes yet" text="Create your first class to start assigning teachers and students." action={<div style={{ marginTop: 10 }}><Button icon={Plus} onClick={onAdd}>Create class</Button></div>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 14 }}>
          {classes.map(c => {
            const teacher = teachers.find(tc => tc.id === c.teacherId);
            return (
              <div key={c.id} style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <h4 className="sa-heading" style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: t.text }}>{c.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: t.subtext }}><Users size={12} /> {c.studentCount} students</div>
                <div style={{ fontSize: 12, color: t.text }}>{teacher ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><UserCog size={13} color={t.blue} /> {teacher.name}</span> : <span style={{ color: t.faint }}>No teacher assigned</span>}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{c.subjects.length ? c.subjects.map(s => <Badge key={s} bg={t.blueSoft} color={t.blue}>{s}</Badge>) : <span style={{ color: t.faint, fontSize: 11.5 }}>No subjects set</span>}</div>
                <div style={{ display: 'flex', gap: 7, marginTop: 3 }}>
                  <IconBtn size={28} icon={Pencil} tone="blue" onClick={() => onEdit(c)} title="Edit" />
                  <IconBtn size={28} icon={Trash2} tone="orange" onClick={() => onDelete(c)} title="Delete" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- SUBJECTS ---------------------------------- */

function SubjectsPage({ subjects, loading, onAdd, onDelete }) {
  const [input, setInput] = useState('');
  return (
    <div className="sa-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHead eyebrow="SUBJECTS" text="Keep one master list of subjects taught at your school" />
      <div style={{ display: 'flex', gap: 8, maxWidth: 420 }}>
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. Physics" onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onAdd(input.trim()); setInput(''); } }} />
        <Button icon={Plus} onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }}>Add</Button>
      </div>
      {loading ? <Skeleton h={100} r={10} /> : subjects.length === 0 ? <EmptyState icon={BookOpen} title="No subjects yet" text="Add subjects so you can assign them to teachers and classes." /> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {subjects.map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 8px 8px 13px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: t.text }}>{s}</span>
              <IconBtn size={22} icon={X} tone="orange" onClick={() => onDelete(s)} title="Remove" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- APPROVALS ---------------------------------- */
/* This is now the ONLY place teacher/student records are created — each
   entry originates from a Google sign-in (see StudentTeacherRegistration.jsx),
   so `a.email` here is always the Google-verified address, never typed. */

function ApprovalsPage({ approvals, loading, onApprove, onReject }) {
  return (
    <div className="sa-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHead eyebrow="APPROVALS" text="Review Google sign-up requests before they get access" />
      {loading ? <Skeleton h={160} r={10} /> : approvals.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="All caught up" text="New teacher or student sign-up requests will show up here for your review." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {approvals.map(a => (
            <div key={a.id} style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: t.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={16} color={t.blue} /></div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.text }}>{a.name} <Badge bg={t.orangeSoft} color={t.orange}>{a.type}</Badge></p>
                  <p style={{ margin: '3px 0 0', fontSize: 11.5, color: t.subtext, display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={11} /> Requested {fmtDate(a.requestedAt)} · {a.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <Button variant="outline" icon={X} onClick={() => onReject(a)}>Reject</Button>
                <Button icon={CheckCircle2} onClick={() => onApprove(a)}>Approve</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- ANNOUNCEMENTS ---------------------------------- */

function AnnouncementComposer({ classes, onCancel, onSave }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState(['All classes']);
  const toggle = (c) => setAudience(a => {
    if (c === 'All classes') return ['All classes'];
    const next = a.filter(x => x !== 'All classes');
    return next.includes(c) ? next.filter(x => x !== c) : [...next, c];
  });
  return (
    <Modal onClose={onCancel} width={480}>
      <div style={{ padding: 22 }}>
        <h3 className="sa-heading" style={{ margin: '0 0 16px', fontSize: 15.5, color: t.text }}>New announcement</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Title"><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Term 2 exams schedule" /></Field>
          {/* FIX: was onChcdange (typo) — the textarea never updated state. */}
          <Field label="Message"><textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Write your announcement…" style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, fontSize: 13, color: t.text, background: t.panel, outline: 'none', resize: 'vertical' }} /></Field>
          <Field label="Send to">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {['All classes', ...classes.map(c => c.name)].map(c => { const active = audience.includes(c); return <button key={c} type="button" onClick={() => toggle(c)} className="sa-btn" style={{ display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${active ? t.green : t.border}`, background: active ? t.greenSoft : '#fff', color: active ? t.green : t.text, borderRadius: 8, padding: '7px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{active ? <CheckCircle2 size={13} /> : <Circle size={13} color={t.faint} />} {c}</button>; })}
            </div>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button icon={Send} disabled={!title || !body} onClick={() => onSave({ id: uid(), title, body, audience, postedAt: new Date().toISOString() })}>Post announcement</Button>
        </div>
      </div>
    </Modal>
  );
}

function AnnouncementsPage({ announcements, loading, onNew, onDelete }) {
  return (
    <div className="sa-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <PageHead eyebrow="ANNOUNCEMENTS" text="Broadcast updates to one class or the whole school" />
        <Button icon={Megaphone} onClick={onNew}>New announcement</Button>
      </div>
      {loading ? <Skeleton h={160} r={10} /> : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" text="Post your first announcement to reach teachers and students." action={<div style={{ marginTop: 10 }}><Button icon={Megaphone} onClick={onNew}>New announcement</Button></div>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {announcements.map(a => (
            <div key={a.id} style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <p className="sa-heading" style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: t.text }}>{a.title}</p>
                <IconBtn size={26} icon={Trash2} tone="orange" onClick={() => onDelete(a)} title="Delete" />
              </div>
              <p style={{ margin: '6px 0 9px', fontSize: 12.5, color: t.subtext, lineHeight: 1.6 }}>{a.body}</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {a.audience.map(c => <Badge key={c} bg={t.blueSoft} color={t.blue}>{c}</Badge>)}
                <span style={{ fontSize: 11, color: t.faint }}>· {fmtDate(a.postedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- SETTINGS ---------------------------------- */

function SettingsPage() {
  return (
    <div className="sa-page-pad" style={{ padding: 22, maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PageHead eyebrow="SCHOOL SETTINGS" text="Basic details shown across the platform" />
      <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="School name"><Input defaultValue="Green Hills Academy" /></Field>
        <Field label="Academic year"><Select value="2026-2027" onChange={() => {}} options={['2026-2027', '2025-2026']} /></Field>
        <Field label="Contact email"><Input defaultValue="admin@greenhills.rw" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} /></Field>
        <p style={{ margin: '-6px 0 0', fontSize: 11, color: t.subtext }}>The school's email is the Google account used at registration and can't be changed here.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Button icon={Save}>Save changes</Button></div>
      </div>
    </div>
  );
}

/* ------------------------------------ APP ------------------------------------ */

export default function SchoolAdminDashboard() {
  const [pageLoading, setPageLoading] = useState(true);
  useEffect(() => { const id = setTimeout(() => setPageLoading(false), 700); return () => clearTimeout(id); }, []);
  const [section, setSection] = useState('overview');
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const go = (dest) => { if (dest === section) return; setSectionLoading(true); setTimeout(() => { setSection(dest); setSectionLoading(false); }, 400); };

  const [classes, setClasses] = useState(SEED_CLASSES);
  const [subjects, setSubjects] = useState(SEED_SUBJECTS);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [approvals, setApprovals] = useState([
    { id: uid(), type: 'teacher', name: 'Eric Habimana', email: 'eric.h@gmail.com', requestedAt: new Date().toISOString() },
    { id: uid(), type: 'student', name: 'Divine Iradukunda', email: 'divine.i@gmail.com', requestedAt: new Date().toISOString() },
  ]);
  const [announcements, setAnnouncements] = useState([]);

  const [teacherModal, setTeacherModal] = useState(null);
  const [studentModal, setStudentModal] = useState(null);
  const [classModal, setClassModal] = useState(null);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const counts = { teachers: teachers.length, students: students.length, classes: classes.length, subjects: subjects.length, approvals: approvals.length };

  const titles = { overview: 'Overview', teachers: 'Teachers', students: 'Students', classes: 'Classes', subjects: 'Subjects', approvals: 'Approvals', announcements: 'Announcements', settings: 'School settings' };
  // Teachers/students are no longer created from a "+" button — only classes
  // and announcements are, since people (with their Google email) come in
  // through Approvals.
  const newAction = { classes: () => setClassModal({}), announcements: () => setAnnouncementModal(true) }[section];
  const newLabel = { classes: 'Create class', announcements: 'New announcement' }[section];

  const saveTeacher = (data) => { setTeachers(list => list.map(x => x.id === data.id ? { ...x, ...data } : x)); setTeacherModal(null); };
  const saveStudent = (data) => {
    setStudents(list => list.map(x => x.id === data.id ? { ...x, ...data } : x));
    setClasses(list => list.map(c => c.name === data.className ? { ...c, studentCount: students.filter(s => s.className === c.name && s.id !== data.id).length + 1 } : c));
    setStudentModal(null);
  };
  const saveClass = (data) => { setClasses(list => data.id ? list.map(x => x.id === data.id ? data : x) : [{ ...data, id: uid() }, ...list]); setClassModal(null); };

  if (pageLoading) return <div className="sa-root" style={{ minHeight: '100vh' }}><GlobalStyle /><div style={{ padding: 22 }}><Skeleton h={40} w={220} /><div style={{ marginTop: 20 }}><Skeleton h={300} r={10} /></div></div></div>;

  return (
    <div className="sa-root" style={{ minHeight: '100vh', color: t.text }}>
      <GlobalStyle />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <div className="sa-sidebar-wrap" style={{ display: 'flex' }}><Sidebar section={section} go={go} counts={counts} sidebarOpen={false} setSidebarOpen={() => {}} /></div>
        {sidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.45)' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0 }}><Sidebar section={section} go={go} counts={counts} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /></div>
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header onNew={newAction} newLabel={newLabel} setSidebarOpen={setSidebarOpen} title={titles[section]} />
          <div className="sa-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {section === 'overview' && <Overview counts={counts} approvals={approvals} go={go} />}
            {section === 'teachers' && (
              <TeachersPage teachers={teachers} classes={classes} subjects={subjects} loading={sectionLoading}
                onEdit={setTeacherModal}
                onToggleStatus={(tc) => setTeachers(list => list.map(x => x.id === tc.id ? { ...x, status: x.status === 'active' ? 'suspended' : 'active' } : x))}
                onDelete={(tc) => setConfirmState({ kind: 'teacher', item: tc })} />
            )}
            {section === 'students' && (
              <StudentsPage students={students} classes={classes} loading={sectionLoading}
                onEdit={setStudentModal}
                onToggleStatus={(s) => setStudents(list => list.map(x => x.id === s.id ? { ...x, status: x.status === 'active' ? 'suspended' : 'active' } : x))}
                onDelete={(s) => setConfirmState({ kind: 'student', item: s })} />
            )}
            {section === 'classes' && <ClassesPage classes={classes} teachers={teachers} subjects={subjects} loading={sectionLoading} onAdd={() => setClassModal({})} onEdit={setClassModal} onDelete={(c) => setConfirmState({ kind: 'class', item: c })} />}
            {section === 'subjects' && <SubjectsPage subjects={subjects} loading={sectionLoading} onAdd={(s) => setSubjects(list => list.includes(s) ? list : [...list, s])} onDelete={(s) => setSubjects(list => list.filter(x => x !== s))} />}
            {section === 'approvals' && (
              <ApprovalsPage approvals={approvals} loading={sectionLoading}
                onApprove={(a) => { if (a.type === 'teacher') setTeachers(l => [{ id: uid(), name: a.name, email: a.email, subject: subjects[0] || '', assignedClasses: [], status: 'active' }, ...l]); else setStudents(l => [{ id: uid(), name: a.name, email: a.email, guardianEmail: '', className: classes[0]?.name || '', status: 'active' }, ...l]); setApprovals(list => list.filter(x => x.id !== a.id)); }}
                onReject={(a) => setApprovals(list => list.filter(x => x.id !== a.id))} />
            )}
            {section === 'announcements' && <AnnouncementsPage announcements={announcements} loading={sectionLoading} onNew={() => setAnnouncementModal(true)} onDelete={(a) => setAnnouncements(list => list.filter(x => x.id !== a.id))} />}
            {section === 'settings' && <SettingsPage />}
          </div>
        </div>
      </div>

      {teacherModal && <TeacherFormModal initial={teacherModal} classes={classes} subjects={subjects} onCancel={() => setTeacherModal(null)} onSave={saveTeacher} />}
      {studentModal && <StudentFormModal initial={studentModal} classes={classes} onCancel={() => setStudentModal(null)} onSave={saveStudent} />}
      {classModal && <ClassFormModal initial={classModal} teachers={teachers} subjects={subjects} onCancel={() => setClassModal(null)} onSave={saveClass} />}
      {announcementModal && <AnnouncementComposer classes={classes} onCancel={() => setAnnouncementModal(false)} onSave={(a) => { setAnnouncements(list => [a, ...list]); setAnnouncementModal(false); }} />}
      {confirmState && (
        <ConfirmModal
          title={`Remove this ${confirmState.kind}?`}
          text={`"${confirmState.item.name}" will be permanently removed. This can't be undone.`}
          confirmLabel="Remove"
          onCancel={() => setConfirmState(null)}
          onConfirm={() => {
            if (confirmState.kind === 'teacher') setTeachers(list => list.filter(x => x.id !== confirmState.item.id));
            if (confirmState.kind === 'student') setStudents(list => list.filter(x => x.id !== confirmState.item.id));
            if (confirmState.kind === 'class') setClasses(list => list.filter(x => x.id !== confirmState.item.id));
            setConfirmState(null);
          }} />
      )}
    </div>
  );
}