import { useState, useEffect, useRef } from 'react';
import {
  User, GraduationCap, Bell, Filter, BookOpen, Share2,
  Users, LogOut, Settings, TrendingUp, ClipboardList, Plus,
  Eye, Pencil, EyeOff, Trash2, Image as ImageIcon, Paperclip, Link2, X,
  ChevronDown, Clock, CheckCircle2, Circle, Video, Menu, ArrowLeft,
  Wifi, Save, Send, FileText, AlertCircle, Type, GripVertical,
  CalendarClock, PlusCircle, ListChecks, PenLine, Zap, Copy, Layers, Check
} from 'lucide-react';

/* ---------------------------------- THEME ----------------------------------
   Three accent colors only — green, blue, orange — on a mandatory pure-white
   body. Neutral grays are structural, not counted as palette colors.
------------------------------------------------------------------------- */

const t = {
  bg: '#FFFFFF', surface: '#FFFFFF', panel: '#F7F8FA', sidebar: '#FFFFFF',
  border: '#E7E9EF', text: '#13151C', subtext: '#6B7280', faint: '#A1A7B3',
  green: '#0E9F6E', greenSoft: '#E7F8F1',
  blue: '#2A5CDB', blueSoft: '#EAF0FE',
  orange: '#EA5B0C', orangeSoft: '#FFEEE3',
  shimmer1: '#EEF0F4', shimmer2: '#F9FAFC',
};

const CLASS_OPTIONS = ['S5 HGL', 'S5 MEG A', 'S4 MEG B', 'S6 HGL'];
const FILTER_OPTIONS = ['All Classes', ...CLASS_OPTIONS];
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const genCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return 'Not set';
  const d = new Date(iso);
  if (isNaN(d)) return 'Not set';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* -------------------------------- PRIMITIVES -------------------------------- */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      .td-root { font-family: 'Inter', system-ui, sans-serif; background:#fff; }
      .td-heading { font-family: 'Poppins', system-ui, sans-serif; }
      @keyframes tdShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      .td-skel { background-image: linear-gradient(90deg, var(--s1) 0px, var(--s2) 40px, var(--s1) 80px); background-size: 600px 100%; animation: tdShimmer 1.4s infinite linear; }
      @keyframes tdFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .td-fade { animation: tdFade .28s ease both; }
      @keyframes tdSpin { to { transform: rotate(360deg); } }
      .td-spin { animation: tdSpin .8s linear infinite; }
      @keyframes tdPulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
      .td-pulse { animation: tdPulse 1.3s ease-in-out infinite; }
      .td-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .td-scroll::-webkit-scrollbar-thumb { background: #E7E9EF; border-radius: 8px; }
      .td-btn { transition: transform .1s ease, box-shadow .12s ease, background .15s ease, opacity .15s ease, border-color .15s ease; }
      .td-btn:active { transform: scale(0.97); }
      .td-card:hover { box-shadow: 0 4px 16px rgba(18,20,28,0.06); }
      textarea, input, select { font-family: inherit; }
      input[type="datetime-local"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      input:focus, textarea:focus, button:focus-visible { outline: 2px solid #2A5CDB55; outline-offset: 1px; }
      @media (max-width: 860px) {
        .td-hamburger { display: flex !important; }
        .td-desktop-filters { display: none !important; }
        .td-sidebar-wrap { display: none !important; }
        .td-header-actions span.td-btn-label { display: none; }
        .td-header-actions .td-btn { padding: 10px !important; }
      }
      @media (max-width: 480px) {
        .td-page-pad { padding: 16px !important; }
      }
    `}</style>
  );
}

function Skeleton({ w = '100%', h = 14, r = 6 }) {
  return <div className="td-skel" style={{ width: w, height: h, borderRadius: r, '--s1': t.shimmer1, '--s2': t.shimmer2 }} />;
}
function Spinner({ size = 14, color }) {
  return <div className="td-spin" style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}33`, borderTopColor: color }} />;
}
function Badge({ children, bg, color }) {
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, letterSpacing: 0.2, whiteSpace: 'nowrap' }}>{children}</span>;
}
function Chip({ children, tone = 'neutral' }) {
  const map = {
    neutral: { bg: t.panel, color: t.subtext },
    blue: { bg: t.blueSoft, color: t.blue },
    green: { bg: t.greenSoft, color: t.green },
    orange: { bg: t.orangeSoft, color: t.orange },
  };
  const c = map[tone];
  return <span style={{ background: c.bg, color: c.color, fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{children}</span>;
}
function IconBtn({ icon: Icon, onClick, tone = 'default', title, size = 32 }) {
  const tones = {
    default: { bg: t.panel, color: t.subtext },
    orange: { bg: t.orangeSoft, color: t.orange },
    blue: { bg: t.blueSoft, color: t.blue },
    green: { bg: t.greenSoft, color: t.green },
  };
  const c = tones[tone];
  return (
    <button type="button" title={title} onClick={onClick} className="td-btn"
      style={{ width: size, height: size, borderRadius: 8, border: 'none', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
      <Icon size={size * 0.46} />
    </button>
  );
}
function PrimaryButton({ children, onClick, icon: Icon, variant = 'solid', busy, disabled, style }) {
  const styles = {
    solid: { background: t.green, color: '#fff', border: 'none' },
    blue: { background: t.blue, color: '#fff', border: 'none' },
    soft: { background: t.orangeSoft, color: t.orange, border: 'none' },
    outline: { background: '#fff', color: t.text, border: `1px solid ${t.border}` },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy} className="td-btn"
      style={{ ...styles[variant], padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', ...style }}>
      {busy ? <Spinner size={13} color={variant === 'outline' || variant === 'soft' ? t.orange : '#fff'} /> : (Icon && <Icon size={14} />)}
      <span className="td-btn-label">{children}</span>
    </button>
  );
}
function Dropdown({ value, options, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="td-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 11px', fontSize: 12.5, fontWeight: 600, color: t.text, cursor: 'pointer' }}>
        {Icon && <Icon size={14} color={t.subtext} />}
        <span>{value}</span>
        <ChevronDown size={13} color={t.subtext} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div className="td-fade" style={{ position: 'absolute', top: '110%', left: 0, background: '#fff', border: `1px solid ${t.border}`, borderRadius: 8, boxShadow: '0 10px 24px rgba(18,20,28,0.12)', minWidth: 170, zIndex: 40, overflow: 'hidden' }}>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              style={{ padding: '9px 13px', fontSize: 12.5, cursor: 'pointer', color: opt === value ? t.blue : t.text, fontWeight: opt === value ? 700 : 500, background: opt === value ? t.blueSoft : 'transparent' }}
              onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = t.panel; }}
              onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'transparent'; }}>{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}
function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="td-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px', textAlign: 'center', gap: 5 }}>
      <div style={{ width: 52, height: 52, borderRadius: 10, background: t.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Icon size={24} color={t.green} />
      </div>
      <h3 className="td-heading" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: t.text }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: t.subtext, maxWidth: 300, lineHeight: 1.5 }}>{text}</p>
      {action}
    </div>
  );
}
function Modal({ children, onClose, width = 420 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="td-fade td-scroll" onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 10, width, maxWidth: '100%', maxHeight: '86vh', overflowY: 'auto', border: `1px solid ${t.border}` }}>
        {children}
      </div>
    </div>
  );
}
function ConfirmModal({ title, text, confirmLabel, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} width={360}>
      <div style={{ padding: 22 }}>
        <h3 className="td-heading" style={{ margin: '0 0 8px', fontSize: 15.5, color: t.text }}>{title}</h3>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: t.subtext, lineHeight: 1.5 }}>{text}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <PrimaryButton variant="outline" onClick={onCancel}>Cancel</PrimaryButton>
          <PrimaryButton variant="soft" onClick={onConfirm}>{confirmLabel}</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

/* Compact stat row — replaces the tall stat-card grid */
function StatMini({ icon: Icon, value, label, tone = 'green' }) {
  const map = { green: { bg: t.greenSoft, fg: t.green }, blue: { bg: t.blueSoft, fg: t.blue }, orange: { bg: t.orangeSoft, fg: t.orange } };
  const c = map[tone];
  return (
    <div className="td-fade" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 13px', flex: '1 1 148px' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color={c.fg} />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span className="td-heading" style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{value}</span>
        <span style={{ fontSize: 11, color: t.subtext, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
    </div>
  );
}
function StatRow({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{children}</div>;
}

function CardsSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
          <Skeleton w="70%" h={15} />
          <div style={{ marginTop: 9 }}><Skeleton w="40%" h={11} /></div>
          <div style={{ marginTop: 16 }}><Skeleton w={64} h={20} r={6} /></div>
          <div style={{ marginTop: 16, display: 'flex', gap: 7 }}>{[0, 1, 2, 3].map(j => <Skeleton key={j} w={30} h={30} r={7} />)}</div>
        </div>
      ))}
    </div>
  );
}
function PageSkeleton() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fff' }}>
      <div style={{ width: 236, background: '#fff', borderRight: `1px solid ${t.border}`, padding: 20 }}>
        <Skeleton w="70%" h={17} />
        <div style={{ marginTop: 24 }}><Skeleton w="100%" h={56} r={8} /></div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} w="100%" h={15} />)}</div>
      </div>
      <div style={{ flex: 1, padding: 22 }}>
        <Skeleton w={200} h={17} />
        <div style={{ marginTop: 18 }}><StatRow>{[0, 1, 2, 3].map(i => <Skeleton key={i} w="100%" h={48} r={8} />)}</StatRow></div>
        <div style={{ marginTop: 20 }}><CardsSkeleton /></div>
      </div>
    </div>
  );
}

/* ---------------------------------- SIDEBAR ---------------------------------- */

function NavItem({ icon: Icon, label, count, live, active, onClick }) {
  return (
    <li onClick={onClick} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, cursor: 'pointer', background: active ? t.greenSoft : 'transparent', color: active ? t.green : t.text }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.panel; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      <Icon size={15} />
      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{label}</span>
      {live ? <Badge bg={t.orangeSoft} color={t.orange}>LIVE</Badge> : count !== undefined ? (
        <span style={{ background: active ? '#fff' : t.blueSoft, color: active ? t.green : t.blue, borderRadius: 6, padding: '2px 7px', fontSize: 10.5, fontWeight: 700 }}>{String(count).padStart(2, '0')}</span>
      ) : null}
    </li>
  );
}

function Sidebar({ section, go, notesCount, quizzesCount, sidebarOpen, setSidebarOpen }) {
  const items = [
    { key: 'notes', icon: BookOpen, label: 'Notes', count: notesCount },
    { key: 'quizzes', icon: PenLine, label: 'Quizzes', count: quizzesCount },
    { key: 'students', icon: Users, label: 'Students' },
    { key: 'progress', icon: TrendingUp, label: 'Progress' },
    { key: 'live', icon: Wifi, label: 'Live Activity', live: true },
    { key: 'records', icon: ClipboardList, label: 'All Records' },
  ];
  return (
    <div style={{
      width: 236, background: '#fff', borderRight: `1px solid ${t.border}`, padding: '20px 16px',
      display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
      position: sidebarOpen ? 'fixed' : undefined, left: 0, top: 0, zIndex: 70,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: t.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={15} color="#fff" />
          </div>
          <div>
            <span className="td-heading" style={{ fontSize: 14, fontWeight: 700, color: t.text, display: 'block' }}>Easy Class</span>
            <span style={{ fontSize: 10, color: t.subtext }}>Teacher workspace</span>
          </div>
        </div>
        {sidebarOpen && <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.subtext, display: 'flex' }}><X size={18} /></button>}
      </div>

      <div style={{ background: t.panel, borderRadius: 9, padding: 12, display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.green}` }}>
          <User size={15} color={t.green} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="td-heading" style={{ margin: 0, fontSize: 12, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ms. Uwase Diane</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: t.green, fontWeight: 600 }}>● Academic Teacher</p>
        </div>
      </div>

      <ul className="td-scroll" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
        {items.map(it => <NavItem key={it.key} icon={it.icon} label={it.label} count={it.count} live={it.live} active={section === it.key} onClick={() => { go(it.key); setSidebarOpen(false); }} />)}
        <div style={{ height: 1, background: t.border, margin: '7px 3px' }} />
        <NavItem icon={Settings} label="Settings" active={section === 'settings'} onClick={() => { go('settings'); setSidebarOpen(false); }} />
      </ul>

      <button className="td-btn" style={{ display: 'grid', gridTemplateColumns: '20px 1fr', alignItems: 'center', gap: 10, marginTop: 8, padding: '9px 11px', borderRadius: 8, background: t.orangeSoft, color: t.orange, border: 'none', cursor: 'pointer' }}>
        <LogOut size={15} /><span style={{ fontSize: 12.5, fontWeight: 700, textAlign: 'left' }}>Sign Out</span>
      </button>
    </div>
  );
}

/* ---------------------------------- HEADER ---------------------------------- */

function Header({ selectedClass, setSelectedClass, onNewNote, onNewQuiz, setSidebarOpen, onFilterChange, title }) {
  return (
    <div style={{ height: 60, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: 12, background: '#fff', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button onClick={() => setSidebarOpen(true)} className="td-hamburger" style={{ background: t.panel, border: 'none', borderRadius: 8, width: 34, height: 34, display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.text, flexShrink: 0 }}><Menu size={17} /></button>
        <h2 className="td-heading" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h2>
      </div>
      <div className="td-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div className="td-desktop-filters" style={{ display: 'flex', gap: 8 }}>
          <Dropdown value={selectedClass} options={FILTER_OPTIONS} onChange={v => { setSelectedClass(v); onFilterChange && onFilterChange(); }} icon={Filter} />
        </div>
        <PrimaryButton variant="outline" icon={Plus} onClick={onNewNote}>New Note</PrimaryButton>
        <PrimaryButton variant="soft" icon={Plus} onClick={onNewQuiz}>New Quiz</PrimaryButton>
        <div style={{ position: 'relative' }}>
          <IconBtn icon={Bell} title="Notifications" />
          <span style={{ position: 'absolute', top: -3, right: -3, background: t.green, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 5, width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>0</span>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.blueSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><User size={15} color={t.blue} /></div>
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)} className="td-btn"
          style={{ border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: active === tab.key ? t.green : t.panel, color: active === tab.key ? '#fff' : t.text }}>
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}

function ClassPills({ classes }) {
  if (!classes || classes.length === 0) return <Chip tone="neutral">Not assigned yet</Chip>;
  return <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{classes.map(c => <Chip key={c} tone="blue">{c}</Chip>)}</div>;
}

/* Class multi-select used inside the Share modal */
function ClassPicker({ selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {CLASS_OPTIONS.map(c => {
        const active = selected.includes(c);
        return (
          <button key={c} type="button" onClick={() => onToggle(c)} className="td-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${active ? t.green : t.border}`, background: active ? t.greenSoft : '#fff', color: active ? t.green : t.text, borderRadius: 8, padding: '8px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            {active ? <CheckCircle2 size={14} /> : <Circle size={14} color={t.faint} />} {c}
          </button>
        );
      })}
    </div>
  );
}

function ShareModal({ item, kind, onCancel, onSave }) {
  const [selected, setSelected] = useState(item.assignedClasses || []);
  const [saving, setSaving] = useState(false);
  const toggle = (c) => setSelected(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);
  return (
    <Modal onClose={onCancel} width={420}>
      <div style={{ padding: 22 }}>
        <h3 className="td-heading" style={{ margin: '0 0 4px', fontSize: 15.5, color: t.text }}>Share {kind}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: t.subtext, lineHeight: 1.5 }}>
          "{item.title || 'Untitled'}" — choose one or more classes that can view this. You can update this list any time.
        </p>
        <ClassPicker selected={selected} onToggle={toggle} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 22 }}>
          <PrimaryButton variant="outline" onClick={onCancel}>Cancel</PrimaryButton>
          <PrimaryButton icon={Send} busy={saving} disabled={selected.length === 0}
            onClick={() => { setSaving(true); setTimeout(() => onSave(selected), 450); }}>
            Share to {selected.length || 0} class{selected.length === 1 ? '' : 'es'}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

/* ----------------------------------- NOTES ----------------------------------- */

function NoteCard({ note, onView, onEdit, onShare, onUnshare, onDelete }) {
  return (
    <div className="td-card td-fade" style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, borderLeft: `3px solid ${note.status === 'shared' ? t.green : t.orange}`, display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div>
        <h4 className="td-heading" style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: t.text }}>{note.title || 'Untitled note'}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, color: t.subtext, fontSize: 11, flexWrap: 'wrap' }}>
          <Clock size={11} /><span>{fmtDate(note.updatedAt)}</span>
          <span>·</span><Layers size={11} /><span>{note.pages.length} page{note.pages.length === 1 ? '' : 's'}</span>
          {note.attachments.length > 0 && <><span>·</span><Paperclip size={11} /><span>{note.attachments.length}</span></>}
          {note.links.length > 0 && <><span>·</span><Video size={11} /><span>{note.links.length}</span></>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Badge bg={note.status === 'shared' ? t.greenSoft : t.orangeSoft} color={note.status === 'shared' ? t.green : t.orange}>{note.status === 'shared' ? 'Shared' : 'Draft'}</Badge>
        <ClassPills classes={note.assignedClasses} />
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 3 }}>
        <IconBtn icon={Eye} onClick={() => onView(note)} title="Preview" />
        <IconBtn icon={Pencil} onClick={() => onEdit(note)} title="Edit" tone="blue" />
        {note.status === 'shared'
          ? <IconBtn icon={EyeOff} onClick={() => onUnshare(note)} title="Unshare" tone="orange" />
          : <IconBtn icon={Share2} onClick={() => onShare(note)} title="Share to classes" tone="green" />}
        <IconBtn icon={Trash2} onClick={() => onDelete(note)} title="Delete" tone="orange" />
      </div>
    </div>
  );
}

function NotePreviewModal({ note, onClose }) {
  const [page, setPage] = useState(0);
  const p = note.pages[page] || note.pages[0];
  return (
    <Modal onClose={onClose} width={640}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h2 className="td-heading" style={{ margin: 0, fontSize: 18, color: t.text }}>{note.title || 'Untitled note'}</h2>
            <p style={{ margin: '5px 0 0', fontSize: 11.5, color: t.subtext }}>updated {fmtDate(note.updatedAt)} · {note.pages.length} page{note.pages.length === 1 ? '' : 's'}</p>
          </div>
          <IconBtn icon={X} onClick={onClose} />
        </div>

        {note.pages.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16, paddingBottom: 2 }}>
            {note.pages.map((pg, i) => (
              <button key={pg.id} onClick={() => setPage(i)} className="td-btn"
                style={{ border: 'none', borderRadius: 7, padding: '6px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: i === page ? t.blue : t.panel, color: i === page ? '#fff' : t.text }}>
                {pg.title || `Page ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {p.blocks.length === 0 && <p style={{ color: t.subtext, fontSize: 13 }}>This page has no content yet.</p>}
          {p.blocks.map(b => b.type === 'text' ? (
            <p key={b.id} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: t.text, whiteSpace: 'pre-wrap' }}>{b.content}</p>
          ) : (
            <div key={b.id}>
              <img src={b.url} alt={b.caption} style={{ width: '100%', borderRadius: 8, border: `1px solid ${t.border}` }} />
              {b.caption && <p style={{ margin: '5px 0 0', fontSize: 11, color: t.subtext, textAlign: 'center' }}>{b.caption}</p>}
            </div>
          ))}
        </div>

        {note.attachments.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p className="td-heading" style={{ fontSize: 12, fontWeight: 700, color: t.text, margin: '0 0 7px' }}>Materials</p>
            {note.attachments.map(a => <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: t.subtext, padding: '5px 0' }}><Paperclip size={12} /> {a.name}</div>)}
          </div>
        )}
        {note.links.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p className="td-heading" style={{ fontSize: 12, fontWeight: 700, color: t.text, margin: '0 0 7px' }}>Tutorials & videos</p>
            {note.links.map((l, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: t.blue, padding: '5px 0', wordBreak: 'break-all' }}><Video size={12} /> {l}</div>)}
          </div>
        )}
      </div>
    </Modal>
  );
}

function NotesDashboard({ notes, loading, filter, setFilter, onView, onEdit, onShare, onUnshare, onDelete, onNewNote }) {
  const filtered = notes.filter(n => filter === 'all' ? true : filter === 'shared' ? n.status === 'shared' : n.status === 'draft');
  const stats = {
    total: notes.length,
    shared: notes.filter(n => n.status === 'shared').length,
    draft: notes.filter(n => n.status === 'draft').length,
    pages: notes.reduce((s, n) => s + n.pages.length, 0),
  };
  return (
    <div className="td-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: t.green }}>NOTES</p>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: t.subtext }}>Prepare study materials, then share to any class when they're ready</p>
        </div>
        <PrimaryButton icon={Plus} onClick={onNewNote}>New Note</PrimaryButton>
      </div>

      {loading ? <StatRow>{[0, 1, 2, 3].map(i => <Skeleton key={i} w="100%" h={48} r={8} />)}</StatRow> : (
        <StatRow>
          <StatMini icon={BookOpen} value={stats.total} label="Total notes" tone="green" />
          <StatMini icon={Share2} value={stats.shared} label="Shared" tone="blue" />
          <StatMini icon={Pencil} value={stats.draft} label="Drafts" tone="orange" />
          <StatMini icon={Layers} value={stats.pages} label="Pages written" tone="green" />
        </StatRow>
      )}

      {loading ? <Skeleton w={240} h={34} r={8} /> : (
        <Tabs active={filter} onChange={setFilter} tabs={[{ key: 'all', label: 'All', count: stats.total }, { key: 'shared', label: 'Shared', count: stats.shared }, { key: 'draft', label: 'Drafts', count: stats.draft }]} />
      )}

      {loading ? <CardsSkeleton /> : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title={notes.length === 0 ? 'No notes yet' : 'Nothing here'}
          text={notes.length === 0 ? 'Notes don\u2019t need a class right away — write freely, then share when ready.' : 'No notes match this filter yet.'}
          action={notes.length === 0 && <div style={{ marginTop: 12 }}><PrimaryButton icon={Plus} onClick={onNewNote}>Create your first note</PrimaryButton></div>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
          {filtered.map(n => <NoteCard key={n.id} note={n} onView={onView} onEdit={onEdit} onShare={onShare} onUnshare={onUnshare} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- NOTE EDITOR -------------------------------
   Supports multiple pages per note, e.g. Chapter 1 / Chapter 2 / Exercises.
------------------------------------------------------------------------- */

function NoteEditor({ initial, onCancel, onSave, loading }) {
  const [title, setTitle] = useState(initial.title);
  const [pages, setPages] = useState(initial.pages);
  const [activePage, setActivePage] = useState(0);
  const [attachments, setAttachments] = useState(initial.attachments);
  const [links, setLinks] = useState(initial.links);
  const [linkInput, setLinkInput] = useState('');
  const [saving, setSaving] = useState(null);
  const fileImgRef = useRef(null);
  const fileAttRef = useRef(null);

  const page = pages[activePage] || pages[0];
  const setPageBlocks = (blocks) => setPages(ps => ps.map((p, i) => i === activePage ? { ...p, blocks } : p));
  const setPageTitle = (val) => setPages(ps => ps.map((p, i) => i === activePage ? { ...p, title: val } : p));

  const addPage = () => { setPages(ps => [...ps, { id: uid(), title: `Page ${ps.length + 1}`, blocks: [] }]); setActivePage(pages.length); };
  const removePage = (idx) => {
    if (pages.length === 1) return;
    setPages(ps => ps.filter((_, i) => i !== idx));
    setActivePage(a => Math.max(0, a >= idx ? a - 1 : a));
  };

  const addBlock = (type) => setPageBlocks([...page.blocks, { id: uid(), type, content: '', url: '', caption: '' }]);
  const updateBlock = (id, patch) => setPageBlocks(page.blocks.map(x => x.id === id ? { ...x, ...patch } : x));
  const removeBlock = (id) => setPageBlocks(page.blocks.filter(x => x.id !== id));
  const moveBlock = (id, dir) => {
    const idx = page.blocks.findIndex(x => x.id === id);
    const to = idx + dir;
    if (to < 0 || to >= page.blocks.length) return;
    const copy = [...page.blocks];
    [copy[idx], copy[to]] = [copy[to], copy[idx]];
    setPageBlocks(copy);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPageBlocks([...page.blocks, { id: uid(), type: 'image', url: reader.result, caption: '' }]);
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const handleAttachment = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments(a => [...a, ...files.map(f => ({ id: uid(), name: f.name, size: f.size }))]);
    e.target.value = '';
  };
  const addLink = () => { if (!linkInput.trim()) return; setLinks(l => [...l, linkInput.trim()]); setLinkInput(''); };

  const doSave = () => {
    setSaving(true);
    setTimeout(() => { onSave({ ...initial, title, pages, attachments, links, updatedAt: new Date().toISOString() }); setSaving(false); }, 550);
  };

  if (loading) {
    return (
      <div style={{ padding: 22, maxWidth: 780 }}>
        <Skeleton w={130} h={15} />
        <div style={{ marginTop: 18 }}><Skeleton w="100%" h={44} r={8} /></div>
        <div style={{ marginTop: 18 }}><Skeleton w="100%" h={130} r={10} /></div>
      </div>
    );
  }

  return (
    <div className="td-fade td-page-pad" style={{ padding: 22, maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconBtn icon={ArrowLeft} onClick={onCancel} title="Back" />
        <h2 className="td-heading" style={{ margin: 0, fontSize: 16, color: t.text }}>{initial.title ? 'Edit note' : 'New note'}</h2>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title"
          style={{ width: '100%', border: `1px solid ${t.border}`, borderRadius: 8, padding: '11px 13px', fontSize: 15, fontWeight: 700, color: t.text, background: t.panel, outline: 'none' }} />
        <p style={{ margin: '9px 0 0', fontSize: 11.5, color: t.subtext }}>Not assigned to a class yet — pick classes when you share it from the dashboard.</p>
      </div>

      {/* Page navigator */}
      <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <p className="td-heading" style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: t.text, display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={14} color={t.blue} /> Pages</p>
          <PrimaryButton variant="soft" icon={PlusCircle} onClick={addPage}>Add page</PrimaryButton>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {pages.map((p, i) => (
            <div key={p.id} onClick={() => setActivePage(i)} className="td-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderRadius: 7, padding: '6px 6px 6px 11px', background: i === activePage ? t.green : t.panel, color: i === activePage ? '#fff' : t.text }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{p.title || `Page ${i + 1}`}</span>
              {pages.length > 1 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); removePage(i); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === activePage ? '#fff' : t.subtext, display: 'flex', padding: 3 }}><X size={12} /></button>
              )}
            </div>
          ))}
        </div>
        <input value={page.title} onChange={e => setPageTitle(e.target.value)} placeholder="Page title (e.g. Chapter 1 — Cell structure)"
          style={{ width: '100%', marginTop: 12, border: `1px solid ${t.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 12.5, fontWeight: 600, color: t.text, background: t.panel, outline: 'none' }} />
      </div>

      <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <p className="td-heading" style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: t.text }}>Content of "{page.title || `Page ${activePage + 1}`}"</p>
          <div style={{ display: 'flex', gap: 7 }}>
            <PrimaryButton variant="soft" icon={Type} onClick={() => addBlock('text')}>Text</PrimaryButton>
            <PrimaryButton variant="soft" icon={ImageIcon} onClick={() => fileImgRef.current.click()}>Image</PrimaryButton>
            <input ref={fileImgRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </div>
        </div>

        {page.blocks.length === 0 ? (
          <EmptyState icon={FileText} title="Start writing" text="Add a text block or an image to this page, then arrange them in any order." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {page.blocks.map(b => (
              <div key={b.id} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, background: t.panel }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.subtext, fontSize: 10.5, fontWeight: 700 }}><GripVertical size={12} /> {b.type === 'text' ? 'TEXT BLOCK' : 'IMAGE'}</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <IconBtn size={26} icon={ChevronDown} onClick={() => moveBlock(b.id, 1)} title="Move down" />
                    <div style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><IconBtn size={26} icon={ChevronDown} onClick={() => moveBlock(b.id, -1)} title="Move up" /></div>
                    <IconBtn size={26} icon={Trash2} tone="orange" onClick={() => removeBlock(b.id)} title="Remove" />
                  </div>
                </div>
                {b.type === 'text' ? (
                  <textarea value={b.content} onChange={e => updateBlock(b.id, { content: e.target.value })} placeholder="Type notes here…" rows={4}
                    style={{ width: '100%', border: `1px solid ${t.border}`, borderRadius: 7, padding: 11, fontSize: 13, resize: 'vertical', color: t.text, background: '#fff', outline: 'none' }} />
                ) : (
                  <div>
                    <img src={b.url} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 7, border: `1px solid ${t.border}` }} />
                    <input value={b.caption} onChange={e => updateBlock(b.id, { caption: e.target.value })} placeholder="Add a caption (optional)"
                      style={{ width: '100%', marginTop: 7, border: `1px solid ${t.border}`, borderRadius: 7, padding: 8, fontSize: 12, color: t.text, background: '#fff', outline: 'none' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
        <p className="td-heading" style={{ margin: '0 0 11px', fontSize: 12.5, fontWeight: 700, color: t.text }}>Materials & source files</p>
        <PrimaryButton variant="outline" icon={Paperclip} onClick={() => fileAttRef.current.click()}>Upload from device</PrimaryButton>
        <input ref={fileAttRef} type="file" multiple hidden onChange={handleAttachment} />
        {attachments.length > 0 && (
          <div style={{ marginTop: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {attachments.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.panel, borderRadius: 8, padding: '7px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: t.text, minWidth: 0 }}><FileText size={13} color={t.blue} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span></div>
                <IconBtn size={24} icon={X} tone="orange" onClick={() => setAttachments(list => list.filter(x => x.id !== a.id))} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
        <p className="td-heading" style={{ margin: '0 0 11px', fontSize: 12.5, fontWeight: 700, color: t.text }}>Tutorials & video links</p>
        <div style={{ display: 'flex', gap: 7 }}>
          <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="Paste a tutorial or video link"
            style={{ flex: 1, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, fontSize: 12.5, color: t.text, background: t.panel, outline: 'none' }}
            onKeyDown={e => e.key === 'Enter' && addLink()} />
          <PrimaryButton variant="soft" icon={Link2} onClick={addLink}>Add</PrimaryButton>
        </div>
        {links.length > 0 && (
          <div style={{ marginTop: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {links.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.panel, borderRadius: 8, padding: '7px 11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: t.blue, minWidth: 0 }}><Video size={13} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</span></div>
                <IconBtn size={24} icon={X} tone="orange" onClick={() => setLinks(ls => ls.filter((_, idx) => idx !== i))} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingBottom: 18 }}>
        <PrimaryButton variant="outline" onClick={onCancel}>Discard</PrimaryButton>
        <PrimaryButton icon={Save} busy={saving} onClick={doSave}>Save note</PrimaryButton>
      </div>
    </div>
  );
}

/* ---------------------------------- QUIZZES ----------------------------------
   Kahoot-style hosting: generate a join code and open a lobby screen.
------------------------------------------------------------------------- */

function QuizCard({ quiz, onView, onEdit, onShare, onUnshare, onDelete, onSchedule, onHost }) {
  const hasWritten = quiz.questions.some(q => q.type === 'written');
  const gradeLabel = quiz.questions.length === 0 ? '—' : hasWritten ? 'Auto + manual' : 'Auto-graded';
  const points = quiz.questions.reduce((s, q) => s + (Number(q.points) || 0), 0);
  return (
    <div className="td-card td-fade" style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, borderLeft: `3px solid ${quiz.status === 'shared' ? t.green : t.orange}`, display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div>
        <h4 className="td-heading" style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: t.text }}>{quiz.title || 'Untitled quiz'}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, color: t.subtext, fontSize: 11, flexWrap: 'wrap' }}>
          <ListChecks size={11} /><span>{quiz.questions.length} question{quiz.questions.length === 1 ? '' : 's'}</span><span>·</span><span>{points} pts</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge bg={quiz.status === 'shared' ? t.greenSoft : t.orangeSoft} color={quiz.status === 'shared' ? t.green : t.orange}>{quiz.status === 'shared' ? 'Shared' : 'Draft'}</Badge>
        <Badge bg={t.blueSoft} color={t.blue}>{gradeLabel}</Badge>
        {quiz.code && <Badge bg={t.panel} color={t.text}>CODE {quiz.code}</Badge>}
      </div>
      <ClassPills classes={quiz.assignedClasses} />
      <button onClick={() => onSchedule(quiz)} className="td-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: t.panel, border: `1px dashed ${t.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 11, color: t.subtext, cursor: 'pointer', textAlign: 'left' }}>
        <CalendarClock size={12} /><span>{fmtDateTime(quiz.startTime)} → {fmtDateTime(quiz.endTime)}</span>
      </button>
      <div style={{ display: 'flex', gap: 7, marginTop: 2, flexWrap: 'wrap' }}>
        <IconBtn icon={Eye} onClick={() => onView(quiz)} title="Preview" />
        <IconBtn icon={Pencil} onClick={() => onEdit(quiz)} title="Edit" tone="blue" />
        {quiz.status === 'shared'
          ? <IconBtn icon={EyeOff} onClick={() => onUnshare(quiz)} title="Unshare" tone="orange" />
          : <IconBtn icon={Share2} onClick={() => onShare(quiz)} title="Share to classes" tone="green" />}
        <IconBtn icon={Zap} onClick={() => onHost(quiz)} title="Host a live session" tone="orange" />
        <IconBtn icon={Trash2} onClick={() => onDelete(quiz)} title="Delete" tone="orange" />
      </div>
    </div>
  );
}

function ScheduleModal({ quiz, onCancel, onSave }) {
  const [start, setStart] = useState(quiz.startTime || '');
  const [end, setEnd] = useState(quiz.endTime || '');
  const [saving, setSaving] = useState(false);
  return (
    <Modal onClose={onCancel} width={380}>
      <div style={{ padding: 22 }}>
        <h3 className="td-heading" style={{ margin: '0 0 4px', fontSize: 15.5, color: t.text }}>Adjust schedule</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: t.subtext }}>{quiz.title || 'Untitled quiz'} — extend or change the window anytime.</p>
        <label style={{ fontSize: 11, fontWeight: 700, color: t.subtext }}>Starts</label>
        <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} style={{ width: '100%', marginTop: 5, marginBottom: 12, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, fontSize: 12.5, color: t.text, background: t.panel, outline: 'none' }} />
        <label style={{ fontSize: 11, fontWeight: 700, color: t.subtext }}>Ends</label>
        <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} style={{ width: '100%', marginTop: 5, marginBottom: 18, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, fontSize: 12.5, color: t.text, background: t.panel, outline: 'none' }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <PrimaryButton variant="outline" onClick={onCancel}>Cancel</PrimaryButton>
          <PrimaryButton icon={Save} busy={saving} onClick={() => { setSaving(true); setTimeout(() => onSave(start, end), 450); }}>Save changes</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

/* Kahoot-style lobby: big join code, live pulse, copy-to-clipboard */
function HostLiveModal({ quiz, onClose, onGenerate }) {
  const [code] = useState(() => quiz.code || genCode());
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (!quiz.code) onGenerate(quiz.id, code); }, []); // eslint-disable-line

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Modal onClose={onClose} width={420}>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span className="td-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: t.orange }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: t.orange, letterSpacing: 0.4 }}>LIVE SESSION · WAITING FOR STUDENTS</span>
        </div>
        <h3 className="td-heading" style={{ margin: '6px 0 2px', fontSize: 16, color: t.text }}>{quiz.title || 'Untitled quiz'}</h3>
        <p style={{ margin: '0 0 18px', fontSize: 12, color: t.subtext }}>Students join at <b>easyclass.app/join</b> using this class code</p>

        <div style={{ width: '100%', background: t.green, borderRadius: 10, padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1, opacity: 0.85 }}>CLASS CODE</span>
          <span className="td-heading" style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: 6, fontFamily: 'monospace' }}>{code}</span>
          <button onClick={copy} type="button" className="td-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 7, padding: '7px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy code</>}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, width: '100%' }}>
          <StatMini icon={ListChecks} value={quiz.questions.length} label="Questions" tone="blue" />
          <StatMini icon={Users} value={0} label="Joined" tone="orange" />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, width: '100%' }}>
          <PrimaryButton variant="outline" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Close</PrimaryButton>
          <PrimaryButton onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Start quiz</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

function QuizPreviewModal({ quiz, onClose }) {
  return (
    <Modal onClose={onClose} width={640}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
          <div>
            <h2 className="td-heading" style={{ margin: 0, fontSize: 18, color: t.text }}>{quiz.title || 'Untitled quiz'}</h2>
            <p style={{ margin: '5px 0 0', fontSize: 11.5, color: t.subtext }}>{fmtDateTime(quiz.startTime)} → {fmtDateTime(quiz.endTime)}</p>
          </div>
          <IconBtn icon={X} onClick={onClose} />
        </div>
        {quiz.description && <p style={{ fontSize: 12.5, color: t.subtext, lineHeight: 1.6 }}>{quiz.description}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          {quiz.questions.length === 0 && <p style={{ color: t.subtext, fontSize: 13 }}>No questions added yet.</p>}
          {quiz.questions.map((q, i) => (
            <div key={q.id} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.text }}>Q{i + 1}. {q.question || 'Untitled question'}</p>
                <Badge bg={t.blueSoft} color={t.blue}>{q.points || 0} pt</Badge>
              </div>
              {q.type === 'mcq' ? (
                <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {q.options.map(o => <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: o.correct ? t.green : t.text }}>{o.correct ? <CheckCircle2 size={13} /> : <Circle size={13} color={t.faint} />} {o.text || 'Option'}</div>)}
                </div>
              ) : <p style={{ marginTop: 9, fontSize: 11.5, color: t.subtext, fontStyle: 'italic' }}>Written answer — graded manually by teacher</p>}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function QuizzesDashboard({ quizzes, loading, filter, setFilter, onView, onEdit, onShare, onUnshare, onDelete, onNewQuiz, onSchedule, onHost }) {
  const filtered = quizzes.filter(q => filter === 'all' ? true : filter === 'shared' ? q.status === 'shared' : q.status === 'draft');
  const stats = { total: quizzes.length, shared: quizzes.filter(q => q.status === 'shared').length, draft: quizzes.filter(q => q.status === 'draft').length, questions: quizzes.reduce((s, q) => s + q.questions.length, 0) };
  return (
    <div className="td-page-pad" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: t.green }}>QUIZZES</p>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: t.subtext }}>Build a quiz, then host it live with a class join code</p>
        </div>
        <PrimaryButton icon={Plus} onClick={onNewQuiz}>New Quiz</PrimaryButton>
      </div>

      {loading ? <StatRow>{[0, 1, 2, 3].map(i => <Skeleton key={i} w="100%" h={48} r={8} />)}</StatRow> : (
        <StatRow>
          <StatMini icon={PenLine} value={stats.total} label="Total quizzes" tone="green" />
          <StatMini icon={Share2} value={stats.shared} label="Shared" tone="blue" />
          <StatMini icon={Pencil} value={stats.draft} label="Drafts" tone="orange" />
          <StatMini icon={ListChecks} value={stats.questions} label="Questions written" tone="green" />
        </StatRow>
      )}

      {loading ? <Skeleton w={240} h={34} r={8} /> : (
        <Tabs active={filter} onChange={setFilter} tabs={[{ key: 'all', label: 'All', count: stats.total }, { key: 'shared', label: 'Shared', count: stats.shared }, { key: 'draft', label: 'Drafts', count: stats.draft }]} />
      )}

      {loading ? <CardsSkeleton /> : filtered.length === 0 ? (
        <EmptyState icon={PenLine} title={quizzes.length === 0 ? 'No quizzes yet' : 'Nothing here'}
          text={quizzes.length === 0 ? 'Build a quiz first — assign it to classes and go live only when you\u2019re ready.' : 'No quizzes match this filter yet.'}
          action={quizzes.length === 0 && <div style={{ marginTop: 12 }}><PrimaryButton icon={Plus} onClick={onNewQuiz}>Build your first quiz</PrimaryButton></div>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
          {filtered.map(q => <QuizCard key={q.id} quiz={q} onView={onView} onEdit={onEdit} onShare={onShare} onUnshare={onUnshare} onDelete={onDelete} onSchedule={onSchedule} onHost={onHost} />)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- QUIZ EDITOR ------------------------------- */

function QuestionEditor({ q, index, onChange, onRemove }) {
  const setField = (patch) => onChange({ ...q, ...patch });
  const addOption = () => setField({ options: [...q.options, { id: uid(), text: '', correct: false }] });
  const updateOption = (id, patch) => setField({ options: q.options.map(o => o.id === id ? { ...o, ...patch } : o) });
  const removeOption = (id) => setField({ options: q.options.filter(o => o.id !== id) });
  const markCorrect = (id) => setField({ options: q.options.map(o => ({ ...o, correct: o.id === id })) });

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 15, background: t.panel }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 11 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: t.blue }}>QUESTION {index + 1}</span>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 7, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
            <button onClick={() => setField({ type: 'mcq' })} type="button" style={{ border: 'none', padding: '6px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: q.type === 'mcq' ? t.green : 'transparent', color: q.type === 'mcq' ? '#fff' : t.subtext }}>Multiple choice</button>
            <button onClick={() => setField({ type: 'written' })} type="button" style={{ border: 'none', padding: '6px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: q.type === 'written' ? t.green : 'transparent', color: q.type === 'written' ? '#fff' : t.subtext }}>Written</button>
          </div>
          <input type="number" min={1} value={q.points} onChange={e => setField({ points: e.target.value })} style={{ width: 50, border: `1px solid ${t.border}`, borderRadius: 7, padding: '6px 7px', fontSize: 11.5, textAlign: 'center', color: t.text, background: '#fff', outline: 'none' }} />
          <span style={{ fontSize: 10.5, color: t.subtext }}>pts</span>
          <IconBtn size={26} icon={Trash2} tone="orange" onClick={onRemove} title="Remove question" />
        </div>
      </div>
      <textarea value={q.question} onChange={e => setField({ question: e.target.value })} rows={2} placeholder="Write the question…"
        style={{ width: '100%', border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, fontSize: 13, resize: 'vertical', color: t.text, background: '#fff', outline: 'none' }} />
      {q.type === 'mcq' ? (
        <div style={{ marginTop: 11, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {q.options.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <button type="button" onClick={() => markCorrect(o.id)} title="Mark as correct answer" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>{o.correct ? <CheckCircle2 size={17} color={t.green} /> : <Circle size={17} color={t.faint} />}</button>
              <input value={o.text} onChange={e => updateOption(o.id, { text: e.target.value })} placeholder="Option text" style={{ flex: 1, border: `1px solid ${t.border}`, borderRadius: 7, padding: 8, fontSize: 12, color: t.text, background: '#fff', outline: 'none' }} />
              <IconBtn size={24} icon={X} onClick={() => removeOption(o.id)} title="Remove option" />
            </div>
          ))}
          <button type="button" onClick={addOption} className="td-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: t.green, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: '3px 0', width: 'fit-content' }}><PlusCircle size={13} /> Add option</button>
        </div>
      ) : <div style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 6, color: t.subtext, fontSize: 11 }}><AlertCircle size={12} /> Student writes a free-text answer — you'll grade it manually.</div>}
    </div>
  );
}

function QuizEditor({ initial, onCancel, onSave, loading }) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [questions, setQuestions] = useState(initial.questions);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => setQuestions(qs => [...qs, { id: uid(), type: 'mcq', question: '', points: 1, options: [{ id: uid(), text: '', correct: true }, { id: uid(), text: '', correct: false }] }]);
  const updateQuestion = (id, next) => setQuestions(qs => qs.map(q => q.id === id ? next : q));
  const removeQuestion = (id) => setQuestions(qs => qs.filter(q => q.id !== id));
  const totalPoints = questions.reduce((s, q) => s + (Number(q.points) || 0), 0);

  const doSave = () => {
    setSaving(true);
    setTimeout(() => { onSave({ ...initial, title, description, startTime, endTime, questions, updatedAt: new Date().toISOString() }); setSaving(false); }, 550);
  };

  if (loading) {
    return (
      <div style={{ padding: 22, maxWidth: 780 }}>
        <Skeleton w={130} h={15} />
        <div style={{ marginTop: 18 }}><Skeleton w="100%" h={44} r={8} /></div>
        <div style={{ marginTop: 18 }}><Skeleton w="100%" h={150} r={10} /></div>
      </div>
    );
  }

  return (
    <div className="td-fade td-page-pad" style={{ padding: 22, maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconBtn icon={ArrowLeft} onClick={onCancel} title="Back" />
        <h2 className="td-heading" style={{ margin: 0, fontSize: 16, color: t.text }}>{initial.title ? 'Edit quiz' : 'New quiz'}</h2>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz title" style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: '11px 13px', fontSize: 15, fontWeight: 700, color: t.text, background: t.panel, outline: 'none' }} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Instructions for students (optional)" rows={2} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 11, fontSize: 12.5, color: t.text, background: t.panel, outline: 'none', resize: 'vertical' }} />
        <p style={{ margin: 0, fontSize: 11.5, color: t.subtext }}>Not assigned to a class yet — pick classes when you share it from the dashboard.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: t.subtext }}>Starts</label><input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', marginTop: 5, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, fontSize: 12.5, color: t.text, background: t.panel, outline: 'none' }} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: t.subtext }}>Ends</label><input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', marginTop: 5, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, fontSize: 12.5, color: t.text, background: t.panel, outline: 'none' }} /></div>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${t.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <p className="td-heading" style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: t.text }}>Questions <span style={{ color: t.subtext, fontWeight: 500 }}>· {totalPoints} pts total</span></p>
          <PrimaryButton variant="soft" icon={Plus} onClick={addQuestion}>Add question</PrimaryButton>
        </div>
        {questions.length === 0 ? (
          <EmptyState icon={ListChecks} title="No questions yet" text="Add multiple-choice questions for instant grading, or written ones you'll grade yourself." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{questions.map((q, i) => <QuestionEditor key={q.id} q={q} index={i} onChange={next => updateQuestion(q.id, next)} onRemove={() => removeQuestion(q.id)} />)}</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingBottom: 18 }}>
        <PrimaryButton variant="outline" onClick={onCancel}>Discard</PrimaryButton>
        <PrimaryButton icon={Save} busy={saving} onClick={doSave}>Save quiz</PrimaryButton>
      </div>
    </div>
  );
}

/* ------------------------------ PLACEHOLDER PAGES ------------------------------ */

function PlaceholderPage({ icon: Icon, title, text, loading }) {
  if (loading) return <div style={{ padding: 22 }}><CardsSkeleton count={3} /></div>;
  return <div style={{ padding: 22 }}><EmptyState icon={Icon} title={title} text={text} /></div>;
}

/* ------------------------------------ APP ------------------------------------ */

export default function TeacherDashboard() {
  const [pageLoading, setPageLoading] = useState(true);
  useEffect(() => { const id = setTimeout(() => setPageLoading(false), 800); return () => clearTimeout(id); }, []);

  const [section, setSection] = useState('notes');
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('All Classes');

  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [notesFilter, setNotesFilter] = useState('all');
  const [quizzesFilter, setQuizzesFilter] = useState('all');

  const [editingNote, setEditingNote] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [previewNote, setPreviewNote] = useState(null);
  const [previewQuiz, setPreviewQuiz] = useState(null);
  const [scheduleQuiz, setScheduleQuiz] = useState(null);
  const [hostQuiz, setHostQuiz] = useState(null);
  const [shareTarget, setShareTarget] = useState(null); // { kind: 'note'|'quiz', item }
  const [confirmDelete, setConfirmDelete] = useState(null);

  const go = (dest) => { if (dest === section) return; setSectionLoading(true); setTimeout(() => { setSection(dest); setSectionLoading(false); }, 450); };
  const flashFilter = () => { setSectionLoading(true); setTimeout(() => setSectionLoading(false), 380); };

  const blankNote = () => ({ id: uid(), title: '', pages: [{ id: uid(), title: 'Page 1', blocks: [] }], attachments: [], links: [], assignedClasses: [], status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const blankQuiz = () => ({ id: uid(), title: '', description: '', startTime: '', endTime: '', questions: [], assignedClasses: [], status: 'draft', code: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

  const openNewNote = () => { setEditingNote({ data: blankNote(), loading: true }); setSection('noteEditor'); setTimeout(() => setEditingNote(e => e && { ...e, loading: false }), 450); };
  const openEditNote = (note) => { setEditingNote({ data: note, loading: true }); setSection('noteEditor'); setTimeout(() => setEditingNote(e => e && { ...e, loading: false }), 450); };
  const openNewQuiz = () => { setEditingQuiz({ data: blankQuiz(), loading: true }); setSection('quizEditor'); setTimeout(() => setEditingQuiz(e => e && { ...e, loading: false }), 450); };
  const openEditQuiz = (quiz) => { setEditingQuiz({ data: quiz, loading: true }); setSection('quizEditor'); setTimeout(() => setEditingQuiz(e => e && { ...e, loading: false }), 450); };

  const saveNote = (note) => { setNotes(list => list.some(n => n.id === note.id) ? list.map(n => n.id === note.id ? note : n) : [note, ...list]); setEditingNote(null); setSection('notes'); };
  const saveQuiz = (quiz) => { setQuizzes(list => list.some(q => q.id === quiz.id) ? list.map(q => q.id === quiz.id ? quiz : q) : [quiz, ...list]); setEditingQuiz(null); setSection('quizzes'); };

  const unshareNote = (note) => setNotes(list => list.map(n => n.id === note.id ? { ...n, status: 'draft' } : n));
  const unshareQuiz = (quiz) => setQuizzes(list => list.map(q => q.id === quiz.id ? { ...q, status: 'draft' } : q));

  const applyShare = (classes) => {
    if (shareTarget.kind === 'note') setNotes(list => list.map(n => n.id === shareTarget.item.id ? { ...n, assignedClasses: classes, status: 'shared' } : n));
    else setQuizzes(list => list.map(q => q.id === shareTarget.item.id ? { ...q, assignedClasses: classes, status: 'shared' } : q));
    setShareTarget(null);
  };

  const matchesClassFilter = (assignedClasses) => selectedClass === 'All Classes' || (assignedClasses || []).includes(selectedClass);
  const visibleNotes = notes.filter(n => matchesClassFilter(n.assignedClasses));
  const visibleQuizzes = quizzes.filter(q => matchesClassFilter(q.assignedClasses));

  const titles = { notes: 'Notes', noteEditor: 'Note editor', quizzes: 'Quizzes', quizEditor: 'Quiz builder', students: 'Students', progress: 'Progress', live: 'Live Activity', records: 'All Records', settings: 'Settings' };

  if (pageLoading) return <div className="td-root" style={{ minHeight: '100vh' }}><GlobalStyle /><PageSkeleton /></div>;

  return (
    <div className="td-root" style={{ minHeight: '100vh', color: t.text }}>
      <GlobalStyle />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <div className="td-sidebar-wrap" style={{ display: 'flex' }}>
          <Sidebar section={section} go={go} notesCount={notes.length} quizzesCount={quizzes.length} sidebarOpen={false} setSidebarOpen={() => {}} />
        </div>

        {sidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,23,0.45)' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0 }}><Sidebar section={section} go={go} notesCount={notes.length} quizzesCount={quizzes.length} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /></div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header selectedClass={selectedClass} setSelectedClass={setSelectedClass} onNewNote={openNewNote} onNewQuiz={openNewQuiz} setSidebarOpen={setSidebarOpen} onFilterChange={flashFilter} title={titles[section]} />

          <div className="td-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {section === 'notes' && (
              <NotesDashboard notes={visibleNotes} loading={sectionLoading} filter={notesFilter} setFilter={f => { setNotesFilter(f); flashFilter(); }}
                onView={setPreviewNote} onEdit={openEditNote} onShare={(n) => setShareTarget({ kind: 'note', item: n })} onUnshare={unshareNote}
                onDelete={(n) => setConfirmDelete({ type: 'note', item: n })} onNewNote={openNewNote} />
            )}
            {section === 'noteEditor' && editingNote && <NoteEditor initial={editingNote.data} loading={editingNote.loading} onCancel={() => { setEditingNote(null); setSection('notes'); }} onSave={saveNote} />}
            {section === 'quizzes' && (
              <QuizzesDashboard quizzes={visibleQuizzes} loading={sectionLoading} filter={quizzesFilter} setFilter={f => { setQuizzesFilter(f); flashFilter(); }}
                onView={setPreviewQuiz} onEdit={openEditQuiz} onShare={(q) => setShareTarget({ kind: 'quiz', item: q })} onUnshare={unshareQuiz}
                onDelete={(q) => setConfirmDelete({ type: 'quiz', item: q })} onNewQuiz={openNewQuiz} onSchedule={setScheduleQuiz} onHost={setHostQuiz} />
            )}
            {section === 'quizEditor' && editingQuiz && <QuizEditor initial={editingQuiz.data} loading={editingQuiz.loading} onCancel={() => { setEditingQuiz(null); setSection('quizzes'); }} onSave={saveQuiz} />}
            {section === 'students' && <PlaceholderPage loading={sectionLoading} icon={Users} title="No students linked yet" text="Once students join your class, they'll be listed here with their activity." />}
            {section === 'progress' && <PlaceholderPage loading={sectionLoading} icon={TrendingUp} title="No progress data yet" text="Progress charts will appear once students start submitting quizzes." />}
            {section === 'live' && <PlaceholderPage loading={sectionLoading} icon={Wifi} title="No live session running" text="Host a quiz to see attendance and answers here in real time." />}
            {section === 'records' && <PlaceholderPage loading={sectionLoading} icon={ClipboardList} title="No records yet" text="Every note and quiz you share will be logged here for reference." />}
            {section === 'settings' && <PlaceholderPage loading={sectionLoading} icon={Settings} title="Workspace settings" text="Preferences for your account and classes will live here." />}
          </div>
        </div>
      </div>

      {previewNote && <NotePreviewModal note={previewNote} onClose={() => setPreviewNote(null)} />}
      {previewQuiz && <QuizPreviewModal quiz={previewQuiz} onClose={() => setPreviewQuiz(null)} />}
      {scheduleQuiz && <ScheduleModal quiz={scheduleQuiz} onCancel={() => setScheduleQuiz(null)} onSave={(start, end) => { setQuizzes(list => list.map(q => q.id === scheduleQuiz.id ? { ...q, startTime: start, endTime: end } : q)); setScheduleQuiz(null); }} />}
      {hostQuiz && <HostLiveModal quiz={hostQuiz} onClose={() => setHostQuiz(null)} onGenerate={(id, code) => setQuizzes(list => list.map(q => q.id === id ? { ...q, code } : q))} />}
      {shareTarget && <ShareModal item={shareTarget.item} kind={shareTarget.kind} onCancel={() => setShareTarget(null)} onSave={applyShare} />}
      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${confirmDelete.type === 'note' ? 'note' : 'quiz'}?`}
          text={`"${confirmDelete.item.title || 'Untitled'}" will be permanently removed. This can't be undone.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (confirmDelete.type === 'note') setNotes(list => list.filter(n => n.id !== confirmDelete.item.id));
            else setQuizzes(list => list.filter(q => q.id !== confirmDelete.item.id));
            setConfirmDelete(null);
          }} />
      )}
    </div>
  );
}