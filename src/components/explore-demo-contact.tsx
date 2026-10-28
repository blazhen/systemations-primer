import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowRightLeft,
  Building2,
  Check,
  ChevronDown,
  Clock,
  ListChecks,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  Send,
  StickyNote,
  TriangleAlert,
  User,
} from "lucide-react";
import { Card, IconTile } from "./explore-ui";
import { useBusinessBrief } from "./explore-business-brief";
import {
  businessName,
  EXAMPLE_LABEL,
  firstName,
  formatMoney,
  isStuck,
  stageLabel,
  useCrm,
  type Contact,
  type EventKind,
  type TimelineEvent,
} from "./explore-crm-state";

// ---------------------------------------------------------------------------
// Contact demo: a real CRM record. Details and tags, a thread-style timeline
// with "why this happened", job and tasks, a draft to approve, and a form to
// add your own made-up lead. Everything is simulated; nothing is sent.
// ---------------------------------------------------------------------------

const FEATURED: { id: string; label: string }[] = [
  { id: "priya", label: "New enquiry" },
  { id: "alex", label: "Quote out" },
  { id: "mark", label: "Repeat customer" },
];

const HEADING_FONT = "'Plus Jakarta Sans', sans-serif";
const FOCUS_RING = "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50";
const MOTION = "sys-crm-motion transition-[transform,opacity,background-color,border-color,color]";

const KIND_ICON: Record<
  EventKind,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  sms: MessageSquare,
  email: Mail,
  call: Phone,
  note: StickyNote,
  stage: ArrowRightLeft,
  task: ListChecks,
};

const KIND_LABEL: Record<EventKind, string> = {
  sms: "Text message",
  email: "Email",
  call: "Call",
  note: "Note",
  stage: "Stage change",
  task: "Task",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #1E6FB8, #174A78)",
  "linear-gradient(135deg, #7C5CFC, #5B3FD0)",
  "linear-gradient(135deg, #14A79A, #0E7C72)",
  "linear-gradient(135deg, #1E88E5, #7C5CFC)",
];

// Reduced motion preference, read after mount so the server and browser agree.
function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

// Fades or slides its children in when it mounts (only when `animate`). The
// starting classes are motion-safe, so reduced motion never hides anything.
function Enter({
  animate,
  from,
  duration = "motion-safe:duration-200",
  className = "",
  children,
}: {
  animate: boolean;
  from: string;
  duration?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [on, setOn] = useState(!animate);
  useEffect(() => {
    if (on) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [on]);
  return (
    <div
      className={`sys-crm-motion motion-safe:transition-[transform,opacity] motion-safe:ease-out ${duration} ${on ? "" : from} ${className}`}
    >
      {children}
    </div>
  );
}

// A tick that draws itself in. Only the stroke offset animates, on a tiny icon.
function DrawCheck({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`sys-crm-motion motion-safe:transition-[stroke-dashoffset] motion-safe:duration-300 motion-safe:ease-out ${className}`}
      style={{
        strokeDasharray: 1,
        strokeDashoffset: on ? 0 : 1,
        transitionDelay: `${delay}ms`,
      }}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
    </svg>
  );
}

const LEAD_STEPS = ["Auto-reply sent", "Task created", "Added to New"];

// Success checklist: the ticks arrive one after another (delay per row).
function LeadChecklist() {
  return (
    <ul className="mt-2 space-y-1.5">
      {LEAD_STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2 text-sm font-semibold">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: "var(--sys-green)" }}
          >
            <DrawCheck className="h-3 w-3" delay={150 + i * 300} />
          </span>
          {s}
        </li>
      ))}
    </ul>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return letters.join("") || "?";
}

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return (
    AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length] ?? "linear-gradient(135deg, #1E6FB8, #174A78)"
  );
}

function Avatar({ contact, size = 56 }: { contact: Contact; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        fontFamily: HEADING_FONT,
        background: gradientFor(contact.id),
        boxShadow: "0 6px 16px rgba(20, 33, 61, 0.16), inset 0 0 0 2px rgba(255,255,255,0.35)",
      }}
    >
      {initials(contact.name)}
    </span>
  );
}

function PanelTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3
      id={id}
      className="text-base font-bold tracking-[-0.01em]"
      style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
    >
      {children}
    </h3>
  );
}

function AmberChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        color: "#92400E",
      }}
    >
      {children}
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-2.5">
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]"
        style={{ backgroundColor: "rgba(30, 136, 229, 0.08)", color: "var(--sys-blue)" }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <dt
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--sys-muted)" }}
        >
          {label}
        </dt>
        <dd className="break-words text-sm font-medium" style={{ color: "var(--sys-navy)" }}>
          {value || "Not given yet"}
        </dd>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline event (a button, with an inline "Why this happened" panel)
// ---------------------------------------------------------------------------
function EventItem({
  event,
  open,
  fresh,
  flash,
  onToggle,
}: {
  event: TimelineEvent;
  open: boolean;
  fresh: boolean;
  flash: boolean;
  onToggle: () => void;
}) {
  const panelId = `why-${useId()}`;
  const Icon = KIND_ICON[event.kind];
  const isSystem = event.direction === "system";
  const isOut = event.direction === "out";

  const panel = (
    <div
      id={panelId}
      inert={!open}
      className={`sys-crm-motion grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-200 motion-safe:ease-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className="mt-2 rounded-[12px] px-3.5 py-3 text-left text-[13px] leading-relaxed"
          style={{
            backgroundColor: "rgba(124, 92, 252, 0.06)",
            border: "1px solid rgba(124, 92, 252, 0.2)",
            color: "var(--sys-body)",
          }}
        >
          <h4
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-violet)" }}
          >
            Why this happened
          </h4>
          {event.cause ? (
            <dl className="mt-1.5 space-y-1">
              <div className="break-words">
                <dt className="inline font-semibold" style={{ color: "var(--sys-navy)" }}>
                  Workflow:{" "}
                </dt>
                <dd className="inline">{event.cause.workflow}</dd>
              </div>
              <div className="break-words">
                <dt className="inline font-semibold" style={{ color: "var(--sys-navy)" }}>
                  Step:{" "}
                </dt>
                <dd className="inline">{event.cause.step}</dd>
              </div>
              <div className="break-words">
                <dt className="inline font-semibold" style={{ color: "var(--sys-navy)" }}>
                  Why:{" "}
                </dt>
                <dd className="inline">{event.cause.why}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-1.5">A person did this, no automatic step.</p>
          )}
        </div>
      </div>
    </div>
  );

  const meta = (
    <span
      className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold"
      style={{ color: "var(--sys-muted)" }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="sr-only">{KIND_LABEL[event.kind]}, </span>
      <span className="truncate">{event.when}</span>
    </span>
  );

  if (isSystem) {
    return (
      <li className={`flex flex-col items-center ${fresh ? "sys-pop" : ""}`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={`${MOTION} ${FOCUS_RING} ${flash ? "sys-flash" : ""} flex min-h-11 w-full max-w-[420px] flex-col items-center justify-center gap-0.5 rounded-[12px] px-3 py-1.5 text-center hover:bg-slate-50`}
        >
          {meta}
          <span className="break-words text-xs leading-snug" style={{ color: "var(--sys-body)" }}>
            {event.text}
          </span>
        </button>
        <div className="w-full max-w-[420px]">{panel}</div>
      </li>
    );
  }

  return (
    <li
      className={`flex flex-col ${isOut ? "items-end" : "items-start"} ${fresh ? "sys-pop" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${MOTION} ${FOCUS_RING} ${flash ? "sys-flash" : ""} group min-h-11 max-w-[88%] min-w-0 px-3.5 py-2.5 text-left hover:-translate-y-px ${
          isOut ? "rounded-[16px] rounded-br-[4px]" : "rounded-[16px] rounded-bl-[4px]"
        }`}
        style={{
          backgroundColor: isOut ? "rgba(30, 136, 229, 0.09)" : "#F6F8FB",
          border: `1px solid ${isOut ? "rgba(30, 136, 229, 0.25)" : "var(--sys-border)"}`,
          boxShadow: open
            ? "0 6px 16px rgba(20, 33, 61, 0.08)"
            : "0 1px 3px rgba(20, 33, 61, 0.04)",
        }}
      >
        <span className="flex items-center justify-between gap-3">
          {meta}
          <ChevronDown
            className={`sys-crm-motion h-3.5 w-3.5 shrink-0 motion-safe:transition-transform motion-safe:duration-200 ${open ? "rotate-180" : ""}`}
            style={{ color: "var(--sys-muted)" }}
            aria-hidden="true"
          />
        </span>
        <span
          className="mt-1 block break-words text-sm leading-snug"
          style={{ color: "var(--sys-navy)" }}
        >
          {event.text}
        </span>
        <span className="mt-1 block text-[11px]" style={{ color: "var(--sys-muted)" }}>
          {isOut ? "Sent by us" : "From the customer"}
        </span>
      </button>
      <div className="w-full max-w-[88%]">{panel}</div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function ContactDemo() {
  const { brief } = useBusinessBrief();
  const { contacts, selected, select, toggleTask, chase, approve, addLead, reset } = useCrm();
  const uid = useId();

  const stage = stageLabel(selected.stage, brief);
  const stuck = isStuck(selected);
  const canChase = stuck || selected.stage === "quote" || selected.stage === "following";
  const awaiting = selected.draft?.status === "awaiting";
  const firstOpen = selected.tasks.find((t) => !t.done);

  // Timeline: which event is open, and keep the newest in view.
  const [openEvent, setOpenEvent] = useState<{ contactId: string; eventId: string } | null>(null);
  const openId = openEvent && openEvent.contactId === selected.id ? openEvent.eventId : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<{ id: string; ids: string[] }>({
    id: selected.id,
    ids: selected.timeline.map((e) => e.id),
  });
  const [updatedNote, setUpdatedNote] = useState("");
  const [fresh, setFresh] = useState<string[]>([]);
  const count = selected.timeline.length;
  const timeline = selected.timeline;
  const newestFresh = fresh[fresh.length - 1];

  const reduced = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    }
    const prev = prevRef.current;
    const ids = timeline.map((e) => e.id);
    if (prev.id === selected.id && ids.length > prev.ids.length) {
      setUpdatedNote("Timeline updated");
      setFresh(ids.filter((i) => !prev.ids.includes(i)));
    } else {
      setUpdatedNote("");
      setFresh([]);
    }
    prevRef.current = { id: selected.id, ids };
  }, [selected.id, timeline]);

  // "Card moved to X" chip beside the stage pill, for 3 seconds.
  const stageRef = useRef({ id: selected.id, stage: selected.stage });
  const [moved, setMoved] = useState<{ key: number; text: string } | null>(null);
  useEffect(() => {
    const p = stageRef.current;
    if (p.id !== selected.id) {
      setMoved(null);
    } else if (p.stage !== selected.stage) {
      setMoved({ key: Date.now(), text: `Card moved to ${stageLabel(selected.stage, brief)}` });
    }
    stageRef.current = { id: selected.id, stage: selected.stage };
  }, [selected.id, selected.stage, brief]);
  useEffect(() => {
    if (!moved) return;
    const t = window.setTimeout(() => setMoved(null), 3000);
    return () => window.clearTimeout(t);
  }, [moved]);

  // A new draft shows a short typing shimmer before its text.
  const draftRef = useRef<{ id: string; draftId: string | null }>({
    id: selected.id,
    draftId: selected.draft?.id ?? null,
  });
  const [typingId, setTypingId] = useState<string | null>(null);
  useEffect(() => {
    const p = draftRef.current;
    const d = selected.draft;
    if (!reduced && p.id === selected.id && d && d.status === "awaiting" && d.id !== p.draftId) {
      setTypingId(d.id);
    }
    draftRef.current = { id: selected.id, draftId: d?.id ?? null };
  }, [selected.id, selected.draft, reduced]);
  useEffect(() => {
    if (!typingId) return;
    const t = window.setTimeout(() => setTypingId(null), 600);
    return () => window.clearTimeout(t);
  }, [typingId]);

  // Add-a-lead form.
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; message?: string }>({});
  const [knownBefore, setKnownBefore] = useState<string[] | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const newLead = knownBefore ? contacts.find((c) => !knownBefore.includes(c.id)) : undefined;
  const showConfirm = Boolean(newLead && newLead.id === selected.id);

  function submitLead(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const m = message.trim();
    const next: { name?: string; message?: string } = {};
    if (!n) next.name = "Please type a name.";
    if (!m) next.message = "Please type a short message.";
    setErrors(next);
    if (next.name) {
      nameRef.current?.focus();
      return;
    }
    if (next.message) {
      messageRef.current?.focus();
      return;
    }
    setKnownBefore(contacts.map((c) => c.id));
    addLead(n, m);
    setName("");
    setMessage("");
  }

  const featured = FEATURED.map((f) => ({
    ...f,
    contact: contacts.find((c) => c.id === f.id),
  })).filter((f): f is { id: string; label: string; contact: Contact } => Boolean(f.contact));
  const leads = contacts.filter((c) => c.id.startsWith("lead-"));

  const nameErrId = `${uid}-name-err`;
  const msgErrId = `${uid}-msg-err`;
  const helpId = `${uid}-help`;

  return (
    <div className="space-y-6">
      {/* Heading and picker */}
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3
            className="text-xl font-bold tracking-[-0.01em] sm:text-2xl"
            style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
          >
            One record for every customer
          </h3>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              backgroundColor: "rgba(124, 92, 252, 0.08)",
              border: "1px solid rgba(124, 92, 252, 0.2)",
              color: "var(--sys-violet)",
            }}
          >
            {EXAMPLE_LABEL}
          </span>
        </div>
        <p
          className="mt-2 max-w-[680px] text-sm leading-relaxed sm:text-base"
          style={{ color: "var(--sys-body)" }}
        >
          Pick a sample contact for {businessName(brief)}. Every text, call, task and stage change
          lands on one record. Tap any timeline entry to see why it happened.
        </p>

        <div role="group" aria-label="Sample contacts" className="mt-4 grid gap-3 md:grid-cols-3">
          {featured.map(({ id, label, contact }) => {
            const active = contact.id === selected.id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => select(contact.id)}
                className={`${MOTION} ${FOCUS_RING} flex min-h-11 min-w-0 items-start gap-3 rounded-[16px] bg-white p-3.5 text-left hover:-translate-y-0.5`}
                style={{
                  border: `1px solid ${active ? "var(--sys-blue)" : "var(--sys-border)"}`,
                  boxShadow: active
                    ? "0 10px 24px rgba(30, 136, 229, 0.16)"
                    : "var(--sys-card-shadow)",
                  backgroundColor: active ? "rgba(30, 136, 229, 0.04)" : "#fff",
                }}
              >
                <Avatar contact={contact} size={40} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className="break-words text-sm font-bold"
                      style={{ color: "var(--sys-navy)" }}
                    >
                      {contact.name}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: active ? "var(--sys-blue)" : "#EEF2F7",
                        color: active ? "#fff" : "var(--sys-body)",
                      }}
                    >
                      {label}
                    </span>
                  </span>
                  <span
                    className="mt-1 block break-words text-xs leading-snug"
                    style={{ color: "var(--sys-muted)" }}
                  >
                    {contact.summary}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {leads.length > 0 ? (
          <div
            role="group"
            aria-label="Leads you added"
            className="mt-3 flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-semibold" style={{ color: "var(--sys-muted)" }}>
              Added by you
            </span>
            {leads.map((l) => {
              const active = l.id === selected.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => select(l.id)}
                  className={`${MOTION} ${FOCUS_RING} inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-white py-1 pl-1.5 pr-4 text-sm font-semibold hover:-translate-y-px ${l.id === newLead?.id ? "sys-pop" : ""}`}
                  style={{
                    border: `1px solid ${active ? "var(--sys-blue)" : "var(--sys-border)"}`,
                    color: "var(--sys-navy)",
                    backgroundColor: active ? "rgba(30, 136, 229, 0.06)" : "#fff",
                  }}
                >
                  <Avatar contact={l} size={30} />
                  <span className="min-w-0 break-words">{l.name}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* The record (crossfades when the sample contact changes) */}
      <Enter
        key={selected.id}
        animate={hydrated}
        from="motion-safe:opacity-0"
        duration="motion-safe:duration-[180ms]"
        className="space-y-6"
      >
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
          {/* 1. Summary */}
          <Card className="min-w-0 !p-5 lg:row-span-2">
            <section aria-labelledby={`${uid}-details`}>
              <PanelTitle id={`${uid}-details`}>Details and tags</PanelTitle>
              <div className="mt-4 flex items-center gap-3">
                <Avatar contact={selected} />
                <div className="min-w-0">
                  <h4
                    className="break-words text-lg font-bold leading-tight"
                    style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
                  >
                    {selected.name}
                  </h4>
                  {selected.company ? (
                    <p className="break-words text-sm" style={{ color: "var(--sys-body)" }}>
                      {selected.company}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Enter
                  key={selected.stage}
                  animate={hydrated}
                  from="motion-safe:-translate-y-1.5 motion-safe:opacity-0"
                  className="inline-flex max-w-full"
                >
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: "rgba(30, 136, 229, 0.1)",
                      border: "1px solid rgba(30, 136, 229, 0.25)",
                      color: "var(--sys-blue-dark)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: "var(--sys-blue)" }}
                    />
                    <span className="sr-only">Current stage: </span>
                    {stage}
                  </span>
                </Enter>
                <span aria-live="polite" className="min-w-0">
                  {moved ? (
                    <Enter
                      key={moved.key}
                      animate
                      from="motion-safe:translate-x-1.5 motion-safe:opacity-0"
                      className="inline-flex max-w-full"
                    >
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          backgroundColor: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          color: "var(--sys-green-text)",
                        }}
                      >
                        <Check className="h-3 w-3 shrink-0" strokeWidth={2.6} />
                        <span className="break-words">{moved.text}</span>
                      </span>
                    </Enter>
                  ) : null}
                </span>
              </div>

              <dl className="mt-3 divide-y" style={{ borderColor: "var(--sys-border)" }}>
                <DetailRow icon={Phone} label="Phone" value={selected.phone} />
                <DetailRow icon={Mail} label="Email" value={selected.email} />
                <DetailRow icon={MapPin} label="Suburb" value={selected.suburb} />
                <DetailRow icon={Building2} label="Source" value={selected.source} />
                <DetailRow icon={User} label="Owner" value={selected.owner} />
              </dl>

              <h4
                className="mt-4 text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--sys-muted)" }}
              >
                Tags
              </h4>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {selected.tags.map((t) => (
                  <li
                    key={t}
                    className="max-w-full break-words rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: "rgba(20, 167, 154, 0.09)",
                      border: "1px solid rgba(20, 167, 154, 0.22)",
                      color: "var(--sys-teal)",
                    }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          </Card>

          {/* 2. Job, value and next action (right column on wide screens) */}
          <Card className="min-w-0 !p-5 lg:col-start-3 lg:row-start-1">
            <section aria-labelledby={`${uid}-job`}>
              <PanelTitle id={`${uid}-job`}>Job and value</PanelTitle>
              <p
                className="mt-3 break-words text-sm font-semibold"
                style={{ color: "var(--sys-navy)" }}
              >
                {selected.job}
              </p>
              <p
                className="mt-1 text-3xl font-bold tracking-[-0.02em]"
                style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
              >
                {formatMoney(selected.value)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "var(--sys-muted)" }}
                >
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                  {selected.daysInStage === 0
                    ? "Entered this stage today"
                    : `${selected.daysInStage} ${selected.daysInStage === 1 ? "day" : "days"} in ${stage}`}
                </span>
                {stuck ? (
                  <AmberChip>
                    <TriangleAlert className="h-3 w-3" strokeWidth={2.2} />
                    Stuck
                  </AmberChip>
                ) : null}
              </div>

              <div
                className="mt-4 rounded-[14px] p-3.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30,136,229,0.08), rgba(124,92,252,0.08))",
                  border: "1px solid rgba(30, 136, 229, 0.2)",
                }}
              >
                <h4
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--sys-blue-dark)" }}
                >
                  Next action
                </h4>
                <p
                  className="mt-1 break-words text-sm font-semibold leading-snug"
                  style={{ color: "var(--sys-navy)" }}
                >
                  {firstOpen
                    ? `${firstOpen.title}, ${firstOpen.due.toLowerCase()}`
                    : "Nothing waiting on you"}
                </p>
              </div>

              {canChase ? (
                <button
                  type="button"
                  onClick={() => chase(selected.id)}
                  disabled={awaiting}
                  className={`${MOTION} ${FOCUS_RING} mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0`}
                  style={{
                    background: "linear-gradient(to right, #1E6FB8, #174A78)",
                    boxShadow: "0 6px 16px rgba(30, 111, 184, 0.28)",
                  }}
                >
                  <Send className="h-4 w-4" strokeWidth={2} />
                  {awaiting ? "Draft waiting for approval" : `Chase ${firstName(selected.name)}`}
                </button>
              ) : null}
            </section>
          </Card>

          {/* 3. Timeline */}
          <Card className="min-w-0 !p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <section aria-labelledby={`${uid}-timeline`}>
              <div className="flex items-center justify-between gap-3">
                <PanelTitle id={`${uid}-timeline`}>Timeline</PanelTitle>
                <span className="text-xs" style={{ color: "var(--sys-muted)" }}>
                  {count} {count === 1 ? "event" : "events"}
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--sys-muted)" }}>
                Oldest first. Select an entry to see why it happened.
              </p>
              <div
                ref={scrollRef}
                className="mt-4 max-h-[460px] overflow-y-auto rounded-[14px] pr-1"
                tabIndex={-1}
              >
                <ol className="space-y-3 pb-1">
                  {selected.timeline.map((ev) => (
                    <EventItem
                      key={ev.id}
                      event={ev}
                      fresh={fresh.includes(ev.id)}
                      flash={ev.id === newestFresh}
                      open={openId === ev.id}
                      onToggle={() =>
                        setOpenEvent(
                          openId === ev.id ? null : { contactId: selected.id, eventId: ev.id },
                        )
                      }
                    />
                  ))}
                </ol>
              </div>
              <p role="status" aria-live="polite" className="sr-only">
                {updatedNote}
              </p>
            </section>
          </Card>

          {/* 4. Tasks */}
          <Card className="min-w-0 !p-5 lg:col-start-3 lg:row-start-2">
            <section aria-labelledby={`${uid}-tasks`}>
              <PanelTitle id={`${uid}-tasks`}>Tasks</PanelTitle>
              {selected.tasks.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "var(--sys-muted)" }}>
                  No tasks on this record.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {selected.tasks.map((t) => {
                    const inputId = `${uid}-task-${t.id}`;
                    const hintId = `${inputId}-hint`;
                    return (
                      <li key={t.id}>
                        <label
                          htmlFor={inputId}
                          className={`${MOTION} flex min-h-11 cursor-pointer items-start gap-3 rounded-[12px] p-2.5 hover:bg-slate-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-300/50`}
                          style={{ border: "1px solid var(--sys-border)" }}
                        >
                          <span className="relative mt-0.5 h-5 w-5 shrink-0">
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={t.done}
                              onChange={() => toggleTask(selected.id, t.id)}
                              aria-describedby={t.movesTo && !t.done ? hintId : undefined}
                              className="peer absolute inset-0 m-0 h-5 w-5 cursor-pointer appearance-none rounded-[6px] bg-white focus:outline-none"
                              style={{ border: "2px solid var(--sys-border)" }}
                            />
                            <span
                              aria-hidden="true"
                              className="sys-crm-motion pointer-events-none absolute inset-0 scale-0 rounded-[6px] opacity-0 motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-checked:scale-100 peer-checked:opacity-100"
                              style={{ backgroundColor: "var(--sys-blue)" }}
                            />
                            <Check
                              aria-hidden="true"
                              className="sys-crm-motion pointer-events-none absolute inset-0.5 h-4 w-4 scale-50 text-white opacity-0 motion-safe:transition-[transform,opacity] motion-safe:delay-75 motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-checked:scale-100 peer-checked:opacity-100"
                              strokeWidth={3}
                            />
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`sys-crm-motion relative block max-w-full break-words text-sm font-semibold after:absolute after:left-0 after:top-1/2 after:h-px after:w-full after:origin-left after:bg-current motion-safe:after:transition-transform motion-safe:after:duration-300 ${
                                t.done ? "after:scale-x-100" : "after:scale-x-0"
                              }`}
                              style={{ color: t.done ? "var(--sys-muted)" : "var(--sys-navy)" }}
                            >
                              {t.title}
                            </span>
                            <span className="block text-xs" style={{ color: "var(--sys-muted)" }}>
                              {t.done ? "Done" : `Due: ${t.due}`}
                            </span>
                            {t.movesTo && !t.done ? (
                              <span
                                id={hintId}
                                className="mt-0.5 block break-words text-xs"
                                style={{ color: "var(--sys-blue-dark)" }}
                              >
                                Ticking this moves the card to {stageLabel(t.movesTo, brief)}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </Card>
        </div>

        {/* Draft */}
        {selected.draft ? (
          <Card className="!p-5">
            <section aria-labelledby={`${uid}-draft`}>
              <div className="flex flex-wrap items-center gap-3">
                <IconTile icon={Mail} color="var(--sys-violet)" />
                <PanelTitle id={`${uid}-draft`}>Approve a draft reply</PanelTitle>
                {selected.draft.status === "awaiting" ? (
                  <AmberChip>Awaiting your approval</AmberChip>
                ) : (
                  <span
                    className="sys-pop inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      color: "var(--sys-green-text)",
                    }}
                  >
                    <DrawCheck className="h-3.5 w-3.5" />
                    Sent
                  </span>
                )}
              </div>
              <div
                className="mt-4 rounded-[14px] p-4"
                style={{ backgroundColor: "#F6F8FB", border: "1px solid var(--sys-border)" }}
              >
                <p className="break-words text-sm font-bold" style={{ color: "var(--sys-navy)" }}>
                  {selected.draft.subject}
                </p>
                {selected.draft.id === typingId ? (
                  <div
                    className="mt-3 space-y-2"
                    role="status"
                    aria-label="Writing the draft"
                    aria-busy="true"
                  >
                    <div className="sys-shimmer sys-crm-motion h-3 w-full rounded-full bg-slate-200" />
                    <div className="sys-shimmer sys-crm-motion h-3 w-11/12 rounded-full bg-slate-200" />
                    <div className="sys-shimmer sys-crm-motion h-3 w-2/3 rounded-full bg-slate-200" />
                  </div>
                ) : (
                  <p
                    className="mt-2 break-words text-sm leading-relaxed"
                    style={{ color: "var(--sys-body)" }}
                  >
                    {selected.draft.body}
                  </p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {selected.draft.status === "awaiting" ? (
                  <button
                    type="button"
                    onClick={() => approve(selected.id)}
                    className={`${MOTION} ${FOCUS_RING} inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white hover:-translate-y-px`}
                    style={{
                      background: "linear-gradient(to right, #1E6FB8, #174A78)",
                      boxShadow: "0 6px 16px rgba(30, 111, 184, 0.28)",
                    }}
                  >
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                    Approve and send
                  </button>
                ) : null}
                <p
                  className="min-w-0 text-xs leading-relaxed"
                  style={{ color: "var(--sys-muted)" }}
                >
                  Nothing is sent without your approval. Nothing is really sent in this demo.
                </p>
              </div>
            </section>
          </Card>
        ) : null}
      </Enter>

      {/* Add your own lead */}
      <Card className="!p-5">
        <section aria-labelledby={`${uid}-lead`}>
          <div className="flex items-center gap-3">
            <IconTile icon={Plus} color="var(--sys-blue)" />
            <PanelTitle id={`${uid}-lead`}>Add your own lead</PanelTitle>
          </div>
          <p id={helpId} className="mt-3 text-sm" style={{ color: "var(--sys-body)" }}>
            Type a made-up name. This is only a demo, nothing is sent.
          </p>
          <form
            onSubmit={submitLead}
            noValidate
            className="mt-4 grid gap-4 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)_auto] md:items-start"
          >
            <div className="min-w-0">
              <label
                htmlFor={`${uid}-name`}
                className="block text-sm font-semibold"
                style={{ color: "var(--sys-navy)" }}
              >
                Name
              </label>
              <input
                ref={nameRef}
                id={`${uid}-name`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                autoComplete="off"
                required
                aria-required="true"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? `${helpId} ${nameErrId}` : helpId}
                className={`${FOCUS_RING} mt-1.5 min-h-11 w-full rounded-[12px] bg-white px-3.5 text-sm`}
                style={{
                  border: `1px solid ${errors.name ? "#B45309" : "var(--sys-border)"}`,
                  color: "var(--sys-navy)",
                }}
              />
              {errors.name ? (
                <p
                  id={nameErrId}
                  role="alert"
                  className="mt-1.5 text-xs font-semibold"
                  style={{ color: "#B45309" }}
                >
                  {errors.name}
                </p>
              ) : null}
            </div>
            <div className="min-w-0">
              <label
                htmlFor={`${uid}-msg`}
                className="block text-sm font-semibold"
                style={{ color: "var(--sys-navy)" }}
              >
                Message
              </label>
              <textarea
                ref={messageRef}
                id={`${uid}-msg`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={300}
                rows={3}
                required
                aria-required="true"
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={errors.message ? `${helpId} ${msgErrId}` : helpId}
                className={`${FOCUS_RING} mt-1.5 min-h-11 w-full resize-y rounded-[12px] bg-white px-3.5 py-2.5 text-sm`}
                style={{
                  border: `1px solid ${errors.message ? "#B45309" : "var(--sys-border)"}`,
                  color: "var(--sys-navy)",
                }}
              />
              {errors.message ? (
                <p
                  id={msgErrId}
                  role="alert"
                  className="mt-1.5 text-xs font-semibold"
                  style={{ color: "#B45309" }}
                >
                  {errors.message}
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className={`${MOTION} ${FOCUS_RING} inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white hover:-translate-y-px md:mt-[26px]`}
              style={{
                background: "linear-gradient(to right, #1E6FB8, #174A78)",
                boxShadow: "0 6px 16px rgba(30, 111, 184, 0.28)",
              }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              Add lead
            </button>
          </form>

          {showConfirm ? (
            <div
              key={newLead?.id}
              role="status"
              className="sys-pop mt-4 rounded-[14px] p-3.5 text-sm font-medium"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "var(--sys-green-text)",
              }}
            >
              <p className="font-bold">Lead added</p>
              <LeadChecklist />
              <p className="mt-2 text-xs font-normal">See it in the Timeline above.</p>
            </div>
          ) : null}
        </section>
      </Card>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="button"
          onClick={() => {
            reset();
            setKnownBefore(null);
            setOpenEvent(null);
          }}
          className={`${MOTION} ${FOCUS_RING} inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold hover:bg-slate-50`}
          style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2} />
          Reset demo data
        </button>
        <p className="min-w-0 text-xs" style={{ color: "var(--sys-muted)" }}>
          Your changes are saved in this browser for 24 hours.
        </p>
      </div>
    </div>
  );
}
