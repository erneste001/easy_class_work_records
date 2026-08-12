import { useState, useRef } from "react";
import {
  FileText,
  Plus,
  X,
  Link2,
  Image as ImageIcon,
  FileUp,
  Video,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  CalendarClock,
  Send,
  Save,
  Pencil,
  ChevronLeft,
  Eye,
} from "lucide-react";

// Palette from Home.jsx, applied via inline style (no Tailwind JIT here).
const C = {
  green: "#178754",
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

const CLASSES = ["Senior 1 A", "Senior 1 B", "Senior 2 A"];

const BLOCK_TYPES = [
  { id: "text", label: "Text", icon: FileText, hint: "Write an explanation or instructions" },
  { id: "link", label: "Link", icon: Link2, hint: "Google Docs, Canva, PowerPoint Online, PDF..." },
  { id: "image", label: "Image", icon: ImageIcon, hint: "Paste an image link to show it inline" },
  { id: "video", label: "Video / tutorial", icon: Video, hint: "YouTube or any tutorial link" },
  { id: "file", label: "File", icon: FileUp, hint: "Note the file name — upload happens on save" },
];

const inputCls = "w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none";

const INITIAL_NOTES = [
  {
    id: "n1",
    title: "Photosynthesis — full chapter notes",
    className: "Senior 2 A",
    status: "shared",
    shareDate: "2026-08-10",
    blocks: [
      { id: "b1", type: "text", value: "Read through the slides first, then watch the short video before Friday's quiz." },
      { id: "b2", type: "link", value: "https://docs.google.com/presentation/d/example" },
      { id: "b3", type: "video", value: "https://youtube.com/watch?v=example" },
    ],
  },
  {
    id: "n2",
    title: "Algebra — quadratic equations",
    className: "Senior 1 A",
    status: "draft",
    shareDate: "",
    blocks: [{ id: "b1", type: "text", value: "Draft — still adding worked examples." }],
  },
];

function StatusPill({ status }) {
  const shared = status === "shared";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
      style={{ background: shared ? C.greenSoft : "#F1F1F1", color: shared ? C.green : "#737373" }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: shared ? C.green : "#A3A3A3" }} />
      {shared ? "Shared" : "Draft"}
    </span>
  );
}

function blockIcon(type) {
  return BLOCK_TYPES.find((b) => b.id === type)?.icon || FileText;
}

export default function NotesDashboard() {
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [editing, setEditing] = useState(null); // note object being edited, or null
  const [toast, setToast] = useState("");

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  const startNewNote = () => {
    setEditing({
      id: `n${Date.now()}`,
      title: "",
      className: CLASSES[0],
      status: "draft",
      shareDate: "",
      blocks: [],
      isNew: true,
    });
  };

  const saveNote = (note, publish) => {
    const clean = { ...note, status: publish ? "shared" : "draft" };
    delete clean.isNew;
    setNotes((list) => {
      const exists = list.some((n) => n.id === clean.id);
      return exists ? list.map((n) => (n.id === clean.id ? clean : n)) : [clean, ...list];
    });
    setEditing(null);
    notify(publish ? "Note shared with the class." : "Draft saved.");
  };

  const deleteNote = (id) => {
    setNotes((list) => list.filter((n) => n.id !== id));
    notify("Note deleted.");
  };

  if (editing) {
    return <NoteEditor note={editing} onCancel={() => setEditing(null)} onSave={saveNote} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 ecw-body text-neutral-900 px-5 sm:px-8 py-7">
      {FONT}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl" style={{ background: C.navy }}>
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="ecw-heading text-xl font-extrabold text-neutral-900 mb-1">Notes</h1>
            <p className="text-xs text-neutral-500">Prepare notes, arrange them how you like, and share when ready.</p>
          </div>
          <button
            onClick={startNewNote}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2.5 rounded-lg hover:opacity-90"
            style={{ background: C.green }}
          >
            <Plus className="w-4 h-4" /> New note
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {notes.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-neutral-200 p-10 text-center">
              <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-xs text-neutral-400">No notes yet — create your first one.</p>
            </div>
          )}
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl border border-neutral-100 p-4 sm:p-5 flex flex-wrap items-center gap-4">
              <span className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.greenSoft }}>
                <FileText className="w-5 h-5" style={{ color: C.green }} />
              </span>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="ecw-heading font-bold text-sm text-neutral-900">{note.title || "Untitled note"}</h3>
                  <StatusPill status={note.status} />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {note.className} · {note.blocks.length} block{note.blocks.length === 1 ? "" : "s"}
                  {note.shareDate && <> · shares {note.shareDate}</>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditing({ ...note })}
                  className="flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50"
                  style={{ color: C.navy }}
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ note, onCancel, onSave }) {
  const [title, setTitle] = useState(note.title);
  const [className, setClassName] = useState(note.className);
  const [shareDate, setShareDate] = useState(note.shareDate);
  const [blocks, setBlocks] = useState(note.blocks);
  const [pickerOpen, setPickerOpen] = useState(false);

  const addBlock = (type) => {
    setBlocks((list) => [...list, { id: `b${Date.now()}`, type, value: "" }]);
    setPickerOpen(false);
  };
  const updateBlock = (id, value) => setBlocks((list) => list.map((b) => (b.id === id ? { ...b, value } : b)));
  const removeBlock = (id) => setBlocks((list) => list.filter((b) => b.id !== id));
  const moveBlock = (id, dir) => {
    setBlocks((list) => {
      const idx = list.findIndex((b) => b.id === id);
      const swap = idx + dir;
      if (swap < 0 || swap >= list.length) return list;
      const copy = [...list];
      [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
      return copy;
    });
  };

  const buildNote = (extra) => ({ ...note, title, className, shareDate, blocks, ...extra });

  return (
    <div className="min-h-screen bg-neutral-50 ecw-body text-neutral-900 px-5 sm:px-8 py-7">
      {FONT}
      <div className="max-w-3xl mx-auto">
        <button onClick={onCancel} className="flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-neutral-800 mb-4">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to notes
        </button>

        <div className="bg-white rounded-xl border border-neutral-100 p-5 sm:p-6 mb-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title, e.g. Photosynthesis — full chapter"
            className="ecw-heading w-full text-lg font-extrabold text-neutral-900 placeholder-neutral-300 focus:outline-none mb-4"
          />
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="text-[11px] font-bold text-neutral-600 mb-1 block">Class</label>
              <select value={className} onChange={(e) => setClassName(e.target.value)} className={inputCls}>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-[11px] font-bold text-neutral-600 mb-1 flex items-center gap-1">
                <CalendarClock className="w-3 h-3" /> Share date
              </label>
              <input type="date" value={shareDate} onChange={(e) => setShareDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Content blocks — arranged in whatever order the teacher wants */}
        <div className="flex flex-col gap-3 mb-4">
          {blocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={i}
              total={blocks.length}
              onChange={(v) => updateBlock(block.id, v)}
              onRemove={() => removeBlock(block.id)}
              onMove={(dir) => moveBlock(block.id, dir)}
            />
          ))}
          {blocks.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-neutral-200 p-8 text-center">
              <p className="text-xs text-neutral-400">Add your first block below — text, a link, an image, a video, or a file.</p>
            </div>
          )}
        </div>

        <div className="relative mb-8">
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg border-2 border-dashed w-full justify-center"
            style={{ borderColor: "rgba(23,135,84,0.3)", color: C.green }}
          >
            <Plus className="w-4 h-4" /> Add a block
          </button>
          {pickerOpen && (
            <div className="absolute z-10 mt-1.5 w-full bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
              {BLOCK_TYPES.map((bt) => {
                const Icon = bt.icon;
                return (
                  <button
                    key={bt.id}
                    onClick={() => addBlock(bt.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-50 last:border-b-0"
                  >
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.greenSoft }}>
                      <Icon className="w-4 h-4" style={{ color: C.green }} />
                    </span>
                    <span>
                      <p className="text-xs font-bold text-neutral-800">{bt.label}</p>
                      <p className="text-[10px] text-neutral-400">{bt.hint}</p>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 sticky bottom-5">
          <button
            onClick={() => onSave(buildNote(), false)}
            className="flex items-center gap-1.5 text-xs font-bold px-5 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50"
            style={{ color: C.navy }}
          >
            <Save className="w-4 h-4" /> Save as draft
          </button>
          <button
            onClick={() => onSave(buildNote(), true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-5 py-3 rounded-lg hover:opacity-90"
            style={{ background: C.green }}
          >
            <Send className="w-4 h-4" /> Share with class
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockEditor({ block, index, total, onChange, onRemove, onMove }) {
  const Icon = blockIcon(block.type);
  const meta = BLOCK_TYPES.find((b) => b.id === block.type);

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-4 flex items-start gap-3">
      <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
        <GripVertical className="w-3.5 h-3.5 text-neutral-300" />
        <button onClick={() => onMove(-1)} disabled={index === 0} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30">
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30">
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.greenSoft }}>
        <Icon className="w-4 h-4" style={{ color: C.green }} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1.5">{meta.label}</p>
        {block.type === "text" ? (
          <textarea
            value={block.value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder="Write here..."
            className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none resize-none"
          />
        ) : block.type === "file" ? (
          <input
            value={block.value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="File name, e.g. chapter-4-slides.pptx"
            className={inputCls}
          />
        ) : (
          <input
            value={block.value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              block.type === "link" ? "Paste a Google Docs, Canva, or PDF link"
              : block.type === "image" ? "Paste an image link"
              : "Paste a video or tutorial link"
            }
            className={inputCls}
          />
        )}
        {block.type === "image" && block.value && (
          <img src={block.value} alt="" className="mt-2 max-h-40 rounded-lg border border-neutral-100 object-cover" onError={(e) => (e.target.style.display = "none")} />
        )}
      </div>

      <button onClick={onRemove} className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-300 hover:bg-red-50 hover:text-red-600 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}