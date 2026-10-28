import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Mail,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  ShieldAlert,
  type LucideProps,
} from "lucide-react";
import { EXAMPLE_LABEL, formatMoney } from "./explore-crm-state";

// ---------------------------------------------------------------------------
// "Watch a day run": an animated workspace for one fictional day. The whole
// view is a pure function of the time of day and the mode, so scrubbing,
// replaying and stepping always agree. Local state only. All data fictional.
// ---------------------------------------------------------------------------

const HEADING_FONT = "'Plus Jakarta Sans', sans-serif";
const FOCUS = "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50";
const AMBER = {
  bg: "rgba(245, 158, 11, 0.14)",
  text: "#92400E",
  border: "rgba(245, 158, 11, 0.4)",
};
const RED = { bg: "rgba(220, 38, 38, 0.1)", text: "#B91C1C", border: "rgba(220, 38, 38, 0.3)" };
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Mode = "with" | "without";
type Icon = ComponentType<LucideProps>;

const DAY_START = 480; // 8:00am in minutes
const DAY_END = 1020; // 5:00pm

// Waypoints [seconds of playback, minute of day]. The clock slows down around
// events so a viewer can see them, and the scrubber follows the same axis.
const WAYPOINTS: [number, number][] = [
  [0, 480],
  [1.2, 482],
  [2, 482.4],
  [3.6, 482.9],
  [5.2, 483.2],
  [6.2, 484],
  [7.6, 578],
  [8.2, 580],
  [9.2, 600],
  [10, 624],
  [11.4, 630],
  [12.4, 640],
  [13.8, 805],
  [14.2, 810],
  [15.4, 830],
  [16.8, 895],
  [17.2, 900],
  [19, 905],
  [19.8, 915],
  [21.2, 960],
  [21.4, 968],
  [22, 970],
  [23.2, 971.6],
  [24.2, 985],
  [25.4, 1015],
  [25.8, 1020],
];
const DURATION = (WAYPOINTS[WAYPOINTS.length - 1]?.[0] ?? 1) * 1000;

function minuteAt(ms: number): number {
  const s = Math.max(0, Math.min(DURATION, ms)) / 1000;
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const [s1, m1] = WAYPOINTS[i] ?? [0, 0];
    if (s <= s1) {
      const [s0, m0] = WAYPOINTS[i - 1] ?? [0, 0];
      return m0 + ((m1 - m0) * (s - s0)) / (s1 - s0 || 1);
    }
  }
  return DAY_END;
}

function playAt(minute: number): number {
  for (let i = 1; i < WAYPOINTS.length; i++) {
    const [s1, m1] = WAYPOINTS[i] ?? [0, 0];
    if (minute <= m1) {
      const [s0, m0] = WAYPOINTS[i - 1] ?? [0, 0];
      return (s0 + ((s1 - s0) * (minute - m0)) / (m1 - m0 || 1)) * 1000;
    }
  }
  return DURATION;
}

function parts(minute: number): { h: number; m: number; text: string; ampm: string } {
  const total = Math.floor(minute);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h, m, text: `${h}:${String(m).padStart(2, "0")}`, ampm: h24 >= 12 ? "pm" : "am" };
}

function clockLabel(minute: number): string {
  const p = parts(minute);
  return `${p.text}${p.ampm}`;
}

// ---------------------------------------------------------------------------
// Script
// ---------------------------------------------------------------------------
interface DayEvent {
  t: number;
  time: string;
  with: string;
  without: string;
}

const EVENTS: DayEvent[] = [
  {
    t: 482,
    time: "8:02am",
    with: "A new enquiry arrives. The card appears and the customer's text lands.",
    without: "A new enquiry arrives from the website. Nobody sees it yet.",
  },
  {
    t: 482.9,
    time: "8:02am",
    with: "An instant reply goes out automatically, in under a minute.",
    without: "No reply goes out. The crew are already on site.",
  },
  {
    t: 483.2,
    time: "8:03am",
    with: "A call-back task is created and the owner is notified.",
    without: "No task and no alert. The enquiry sits in an inbox.",
  },
  {
    t: 580,
    time: "9:40am",
    with: "A second enquiry arrives and gets its own instant reply.",
    without: "A second enquiry arrives. It is missed in the noise.",
  },
  {
    t: 630,
    time: "10:30am",
    with: "Maria's quote is sent. It moves to Quote sent and a 3 day timer starts.",
    without: "Two enquiries are still waiting for a reply, now over two hours.",
  },
  {
    t: 810,
    time: "1:30pm",
    with: "Maria replies to her quote. The whole thread stays in one place.",
    without: "Still no reply to anyone. The wait is past five hours.",
  },
  {
    t: 900,
    time: "3:00pm",
    with: "Two quotes have gone quiet. Follow-ups are drafted and wait for your approval.",
    without: "Two quotes have gone quiet. Nobody has noticed.",
  },
  {
    t: 905,
    time: "3:05pm",
    with: "You approve in one tap. Both are sent and the cards move to Following up.",
    without: "Nobody follows up. The quotes keep going cold.",
  },
  {
    t: 970,
    time: "4:10pm",
    with: "Maria books. Her card moves to Booked and a reminder is scheduled.",
    without: "The waiting enquiries may have called someone else by now.",
  },
  {
    t: 1020,
    time: "5:00pm",
    with: "Every enquiry answered within 1 minute, 2 deals chased automatically.",
    without: "Two enquiries waited until the afternoon, one quote was never followed up.",
  },
];

const SUMMARY: Record<Mode, string> = {
  with: EVENTS[9]?.with ?? "",
  without: EVENTS[9]?.without ?? "",
};

interface CardDef {
  id: string;
  name: string;
  job: string;
  value: number;
  arrive: number;
  startCol: number;
  moves: [number, number][];
}

const CARDS: CardDef[] = [
  {
    id: "josh",
    name: "Josh T.",
    job: "Kitchen",
    value: 6400,
    arrive: 0,
    startCol: 1,
    moves: [[905, 2]],
  },
  {
    id: "maria",
    name: "Maria S.",
    job: "Bathroom",
    value: 4800,
    arrive: 482,
    startCol: 0,
    moves: [
      [630, 1],
      [905, 2],
      [970, 3],
    ],
  },
  {
    id: "priya",
    name: "Priya N.",
    job: "Deck",
    value: 3200,
    arrive: 580,
    startCol: 0,
    moves: [[630, 1]],
  },
  { id: "lena", name: "Lena W.", job: "Fence", value: 5100, arrive: 0, startCol: 3, moves: [] },
];

const COLUMNS = ["New", "Quote sent", "Following up", "Booked"];
const COL_COLOURS = ["var(--sys-blue)", "var(--sys-teal)", "var(--sys-violet)", "var(--sys-green)"];

interface Message {
  id: string;
  t: number;
  from: "cust" | "sys";
  text: string;
  typingFrom?: number;
  draftFrom?: number;
  withOnly: boolean;
}

const MESSAGES: Message[] = [
  {
    id: "m1",
    t: 482,
    from: "cust",
    text: "Hi, could I get a quote for a kitchen renovation in Box Hill?",
    withOnly: false,
  },
  {
    id: "m2",
    t: 482.9,
    from: "sys",
    typingFrom: 482.4,
    text: "Thanks Maria! Northside here. We have your enquiry and will call you within the hour.",
    withOnly: true,
  },
  {
    id: "m3",
    t: 630,
    from: "sys",
    typingFrom: 626,
    text: "Your quote is in your inbox. Reply here with any questions.",
    withOnly: true,
  },
  {
    id: "m4",
    t: 810,
    from: "cust",
    text: "Thanks, I'll talk it over with my partner.",
    withOnly: true,
  },
  {
    id: "m5",
    t: 905,
    from: "sys",
    typingFrom: 903,
    draftFrom: 900,
    text: "Hi Maria, just checking in on your quote. Happy to lock in a date.",
    withOnly: true,
  },
  {
    id: "m6",
    t: 970,
    from: "cust",
    text: "Let's book it in for next Friday.",
    withOnly: true,
  },
  {
    id: "m7",
    t: 971.6,
    from: "sys",
    typingFrom: 970.4,
    text: "Booked for Friday. You'll get a reminder the day before.",
    withOnly: true,
  },
];

interface ChipDef {
  id: string;
  from: number;
  until: number;
  text: string;
  tone: "blue" | "amber" | "green" | "violet";
  icon: Icon;
}

const CHIPS: ChipDef[] = [
  {
    id: "task",
    from: 483.2,
    until: 560,
    text: "Task: call back within 1 hour",
    tone: "blue",
    icon: ClipboardList,
  },
  { id: "notify", from: 483.4, until: 560, text: "Owner notified", tone: "violet", icon: Bell },
  {
    id: "ptask",
    from: 580.5,
    until: 650,
    text: "Task: call Priya back",
    tone: "blue",
    icon: ClipboardList,
  },
  {
    id: "quote",
    from: 630,
    until: 720,
    text: "Quote emailed, 3 day timer started",
    tone: "violet",
    icon: Mail,
  },
  {
    id: "draft",
    from: 900,
    until: 905,
    text: "Follow-ups drafted, awaiting approval",
    tone: "amber",
    icon: PenLine,
  },
  { id: "sent", from: 905, until: 990, text: "Approved and sent", tone: "green", icon: Check },
  {
    id: "book",
    from: 970,
    until: 5000,
    text: "Booked, reminder scheduled",
    tone: "green",
    icon: CalendarCheck,
  },
];

const TONES: Record<ChipDef["tone"], { bg: string; text: string; border: string }> = {
  blue: {
    bg: "rgba(30, 136, 229, 0.1)",
    text: "var(--sys-blue-dark)",
    border: "rgba(30, 136, 229, 0.28)",
  },
  violet: {
    bg: "rgba(124, 58, 237, 0.09)",
    text: "var(--sys-violet)",
    border: "rgba(124, 58, 237, 0.28)",
  },
  amber: { bg: AMBER.bg, text: AMBER.text, border: AMBER.border },
  green: {
    bg: "rgba(16, 185, 129, 0.12)",
    text: "var(--sys-green-text)",
    border: "rgba(16, 185, 129, 0.32)",
  },
};

// ---------------------------------------------------------------------------
// Pure view: everything on screen comes from (minute, mode).
// ---------------------------------------------------------------------------
interface CardView {
  def: CardDef;
  shown: boolean;
  col: number;
  row: number;
  badge: { text: string; tone: "red" | "amber" } | null;
  ring: boolean;
}

function waitText(wait: number): string {
  if (wait < 60) return `waiting ${Math.max(1, Math.floor(wait))}m`;
  return `waiting ${Math.floor(wait / 60)}h`;
}

function viewAt(minute: number, mode: Mode) {
  const withSys = mode === "with";
  const rowsUsed = [0, 0, 0, 0];
  const cards: CardView[] = CARDS.map((def) => {
    const shown = minute >= def.arrive;
    let col = def.startCol;
    if (withSys) for (const [t, c] of def.moves) if (minute >= t) col = c;
    const row = shown ? (rowsUsed[col] ?? 0) : 0;
    if (shown) rowsUsed[col] = row + 1;
    let badge: CardView["badge"] = null;
    if (shown) {
      if (withSys) {
        if ((def.id === "maria" || def.id === "josh") && minute >= 900 && minute < 905)
          badge = { text: "Awaiting OK", tone: "amber" };
      } else if (def.startCol === 0 && def.arrive > 0) {
        badge = { text: waitText(minute - def.arrive), tone: "red" };
      } else if (def.id === "josh" && minute >= 900) {
        badge = { text: "Gone cold", tone: "amber" };
      }
    }
    const ring = withSys && def.id === "maria" && minute >= 970 && minute < 976;
    return { def, shown, col, row, badge, ring };
  });

  const messages = MESSAGES.filter((m) => minute >= m.t && (withSys || !m.withOnly));
  const typing = withSys
    ? MESSAGES.some((m) => m.typingFrom !== undefined && minute >= m.typingFrom && minute < m.t)
    : false;
  const draft = withSys
    ? (MESSAGES.find((m) => m.draftFrom !== undefined && minute >= m.draftFrom && minute < m.t) ??
      null)
    : null;
  const chips = withSys ? CHIPS.filter((c) => minute >= c.from && minute < c.until) : [];

  const replies = withSys ? [482.9, 580.9, 630, 905, 971.6].filter((t) => minute >= t).length : 0;
  const followed = withSys && minute >= 905 ? 2 : 0;
  const saved = withSys && minute >= 905 ? 11200 : 0;
  const respSeconds = withSys ? (minute >= 482.9 ? 42 : 0) : Math.max(0, minute - 482) * 60;

  let eventIndex = -1;
  EVENTS.forEach((e, i) => {
    if (minute >= e.t) eventIndex = i;
  });
  return {
    cards,
    messages,
    typing,
    draft,
    chips,
    replies,
    followed,
    saved,
    respSeconds,
    eventIndex,
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Eases toward `target` frame by frame. Instant when motion is reduced. */
function useEased(target: number, reduced: boolean): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    if (reduced) {
      current.current = target;
      setValue(target);
      return;
    }
    let raf = 0;
    const tick = () => {
      const next = current.current + (target - current.current) * 0.16;
      current.current = Math.abs(target - next) < 0.5 ? target : next;
      setValue(current.current);
      if (current.current !== target) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);
  return value;
}

function Tile({
  label,
  value,
  format,
  reduced,
  tone,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  reduced: boolean;
  tone: string;
}) {
  const shown = useEased(value, reduced);
  return (
    <div
      className="min-w-0 rounded-[14px] bg-white px-3 py-2.5"
      style={{ border: "1px solid var(--sys-border)", borderTop: `3px solid ${tone}` }}
    >
      <p className="truncate text-[11px] font-semibold" style={{ color: "var(--sys-muted)" }}>
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-lg font-bold tabular-nums"
        style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
      >
        {format(shown)}
      </p>
    </div>
  );
}

function formatResponse(mode: Mode, seconds: number): string {
  if (mode === "with") return seconds < 1 ? "No enquiry yet" : `${Math.round(seconds)} sec`;
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "No enquiry yet";
  if (mins < 60) return `${mins} min and counting`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m and counting`;
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
function AnalogueClock({ minute }: { minute: number }) {
  const hourAngle = (((minute / 60) % 12) * 30 * Math.PI) / 180;
  const minAngle = ((minute % 60) * 6 * Math.PI) / 180;
  const hx = 32 + Math.sin(hourAngle) * 14;
  const hy = 32 - Math.cos(hourAngle) * 14;
  const mx = 32 + Math.sin(minAngle) * 22;
  const my = 32 - Math.cos(minAngle) * 22;
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={32 + Math.sin(a) * 26}
            y1={32 - Math.cos(a) * 26}
            x2={32 + Math.sin(a) * 29}
            y2={32 - Math.cos(a) * 29}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.5"
          />
        );
      })}
      <line x1="32" y1="32" x2={hx} y2={hy} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <line
        x1="32"
        y1="32"
        x2={mx}
        y2={my}
        stroke="#7DD3FC"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="2.5" fill="#fff" />
    </svg>
  );
}

const ROW = 66;
const HEAD = 44;

function Kanban({ cards, reduced }: { cards: CardView[]; reduced: boolean }) {
  const counts = [0, 1, 2, 3].map((c) => cards.filter((x) => x.shown && x.col === c).length);
  const move = reduced ? "none" : `transform 500ms ${EASE}, opacity 400ms ease`;
  return (
    <div
      className="relative overflow-hidden rounded-[16px]"
      style={{ height: HEAD + ROW * 3 + 8, backgroundColor: "rgba(20, 33, 61, 0.035)" }}
    >
      <div className="absolute inset-0 grid grid-cols-4">
        {COLUMNS.map((name, i) => (
          <div
            key={name}
            className="min-w-0 px-1 pt-2"
            style={{ borderLeft: i === 0 ? "none" : "1px dashed var(--sys-border)" }}
          >
            <div className="flex items-center justify-between gap-1 px-1">
              <span
                className="min-w-0 truncate text-[10px] font-bold min-[420px]:text-[11px]"
                style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
              >
                {name}
              </span>
              <span
                key={counts[i]}
                className="dr-anim inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums text-white"
                style={{
                  backgroundColor: COL_COLOURS[i],
                  animation: reduced ? "none" : `dr-bump 420ms ${EASE}`,
                }}
              >
                {counts[i]}
              </span>
            </div>
            <div
              className="mx-1 mt-1.5 h-0.5 rounded-full"
              style={{ backgroundColor: COL_COLOURS[i], opacity: 0.55 }}
            />
          </div>
        ))}
      </div>
      {cards.map((c) => {
        const y = HEAD + c.row * ROW + (c.shown ? 0 : -22);
        return (
          <div
            key={c.def.id}
            className="absolute left-0 top-0 w-1/4 px-[3px]"
            style={{
              transform: `translate(${c.col * 100}%, ${y}px)`,
              opacity: c.shown ? 1 : 0,
              transition: move,
              willChange: "transform",
            }}
          >
            <div
              className="relative min-w-0 rounded-[10px] bg-white px-1.5 py-1.5"
              style={{
                height: ROW - 6,
                border: "1px solid var(--sys-border)",
                borderLeft: `3px solid ${COL_COLOURS[c.col]}`,
                boxShadow: "0 2px 6px rgba(20, 33, 61, 0.1)",
              }}
            >
              <p
                className="truncate text-[11px] font-bold leading-tight"
                style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
              >
                {c.def.name}
              </p>
              <p
                className="truncate text-[10px] leading-tight"
                style={{ color: "var(--sys-muted)" }}
              >
                {c.def.job}
              </p>
              <p
                className="truncate text-[11px] font-bold tabular-nums leading-tight"
                style={{ color: "var(--sys-navy)" }}
              >
                {formatMoney(c.def.value)}
              </p>
              {c.badge ? (
                <span
                  className="mt-0.5 inline-block max-w-full truncate rounded-full px-1.5 text-[9px] font-bold leading-[14px]"
                  style={{
                    backgroundColor: c.badge.tone === "red" ? RED.bg : AMBER.bg,
                    color: c.badge.tone === "red" ? RED.text : AMBER.text,
                    border: `1px solid ${c.badge.tone === "red" ? RED.border : AMBER.border}`,
                  }}
                >
                  {c.badge.text}
                </span>
              ) : null}
              {c.ring ? (
                <span
                  aria-hidden="true"
                  className="dr-anim pointer-events-none absolute inset-0 rounded-[10px]"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.35)",
                    animation: reduced ? "none" : `dr-ring 1400ms ease-out both`,
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Bubble({ m, reduced }: { m: Message; reduced: boolean }) {
  const mine = m.from === "sys";
  return (
    <div
      className={`dr-anim flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`}
      style={{ animation: reduced ? "none" : `dr-rise 420ms ${EASE} both` }}
    >
      <p
        className="max-w-[88%] break-words rounded-[16px] px-3 py-2 text-xs leading-snug"
        style={
          mine
            ? { backgroundColor: "var(--sys-blue)", color: "#fff", borderBottomRightRadius: 4 }
            : {
                backgroundColor: "#fff",
                color: "var(--sys-navy)",
                borderBottomLeftRadius: 4,
                border: "1px solid var(--sys-border)",
              }
        }
      >
        {m.text}
      </p>
      {mine ? (
        <span
          className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: "var(--sys-green-text)" }}
        >
          <Check className="h-3 w-3" aria-hidden="true" /> Sent automatically
        </span>
      ) : null}
    </div>
  );
}

function Phone({
  view,
  mode,
  reduced,
  minute,
}: {
  view: ReturnType<typeof viewAt>;
  mode: Mode;
  reduced: boolean;
  minute: number;
}) {
  return (
    <div
      className="mx-auto w-full max-w-[270px] rounded-[34px] p-2.5"
      style={{
        background: "linear-gradient(160deg, #1b2a4a, var(--sys-navy))",
        boxShadow: "0 24px 48px rgba(20, 33, 61, 0.28), inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      <div className="overflow-hidden rounded-[26px]" style={{ backgroundColor: "#EEF2F7" }}>
        <div
          className="flex items-center gap-2 bg-white px-3 py-2"
          style={{ borderBottom: "1px solid var(--sys-border)" }}
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: "var(--sys-violet)" }}
          >
            MS
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold" style={{ color: "var(--sys-navy)" }}>
              Maria S.
            </p>
            <p className="truncate text-[10px]" style={{ color: "var(--sys-muted)" }}>
              Text messages
            </p>
          </div>
        </div>
        <div className="relative flex h-[236px] flex-col justify-end gap-2 overflow-hidden px-2.5 py-2.5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8"
            style={{ background: "linear-gradient(to bottom, #EEF2F7, rgba(238,242,247,0))" }}
          />
          {view.messages.length === 0 ? (
            <p className="text-center text-[11px]" style={{ color: "var(--sys-muted)" }}>
              No messages yet
            </p>
          ) : null}
          {view.messages.map((m) => (
            <Bubble key={m.id} m={m} reduced={reduced} />
          ))}
          {view.draft ? (
            <div
              key="draft"
              className="dr-anim flex flex-col items-end"
              style={{ animation: reduced ? "none" : `dr-rise 420ms ${EASE} both` }}
            >
              <p
                className="max-w-[88%] break-words rounded-[16px] px-3 py-2 text-xs leading-snug"
                style={{
                  backgroundColor: AMBER.bg,
                  color: AMBER.text,
                  border: `1px dashed ${AMBER.border}`,
                }}
              >
                {view.draft.text}
              </p>
              <span className="mt-0.5 text-[10px] font-bold" style={{ color: AMBER.text }}>
                Draft, awaiting your approval
              </span>
            </div>
          ) : null}
          {view.typing ? (
            <div className="flex justify-end" key="typing">
              <span
                className="inline-flex items-center gap-1 rounded-[16px] px-3 py-2.5"
                style={{ backgroundColor: "rgba(30, 136, 229, 0.18)" }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="dr-anim h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: "var(--sys-blue)",
                      animation: reduced
                        ? "none"
                        : `dr-dot 900ms ease-in-out ${i * 150}ms infinite`,
                    }}
                  />
                ))}
                <span className="sr-only">Typing</span>
              </span>
            </div>
          ) : null}
          {mode === "without" && minute >= 482 ? (
            <p
              className="mx-auto rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{
                backgroundColor: RED.bg,
                color: RED.text,
                border: `1px solid ${RED.border}`,
              }}
            >
              No reply yet, {waitText(minute - 482)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ChipArea({
  chips,
  mode,
  minute,
  reduced,
}: {
  chips: ChipDef[];
  mode: Mode;
  minute: number;
  reduced: boolean;
}) {
  return (
    <div className="mt-3 flex min-h-[84px] flex-wrap content-start gap-1.5">
      {mode === "without" && minute >= 482 ? (
        <span
          className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: RED.bg, color: RED.text, border: `1px solid ${RED.border}` }}
        >
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">Nothing triggered: no task, no alert</span>
        </span>
      ) : null}
      {chips.map((c) => {
        const tone = TONES[c.tone];
        const ChipIcon = c.icon;
        return (
          <span
            key={c.id}
            className="dr-anim inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: tone.bg,
              color: tone.text,
              border: `1px solid ${tone.border}`,
              animation: reduced ? "none" : `dr-pop 460ms ${EASE} both`,
            }}
          >
            <ChipIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{c.text}</span>
          </span>
        );
      })}
    </div>
  );
}

const BTN = `sys-crm-motion inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold active:scale-[0.98] ${FOCUS}`;
const BTN_STYLE = {
  border: "1px solid var(--sys-border)",
  color: "var(--sys-navy)",
  backgroundColor: "#fff",
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function DayRun() {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>("with");
  const [play, setPlay] = useState(0);
  const [wantPlay, setWantPlay] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [inView, setInView] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const autoStarted = useRef(false);
  const reducedInit = useRef(false);

  const minute = minuteAt(play);
  const view = useMemo(() => viewAt(minute, mode), [minute, mode]);
  const clock = parts(minute);
  const running = wantPlay && inView && !tabHidden && !reduced && play < DURATION;

  // Reduced motion: show the end of the day, then step through events.
  useEffect(() => {
    if (reduced && !reducedInit.current) {
      reducedInit.current = true;
      setWantPlay(false);
      setPlay(DURATION);
    }
  }, [reduced]);

  // Visibility: auto-start the first time on screen, pause when off screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((e) => e.isIntersecting);
        setInView(seen);
        if (seen && !autoStarted.current) {
          autoStarted.current = true;
          setWantPlay(true);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Reduced motion users never auto-play.
  useEffect(() => {
    if (reduced) setWantPlay(false);
  }, [reduced]);

  // The clock.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      setPlay((p) => Math.min(DURATION, p + dt * speed));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, speed]);

  useEffect(() => {
    if (play >= DURATION) setWantPlay(false);
  }, [play]);

  const togglePlay = useCallback(() => {
    if (play >= DURATION) {
      setPlay(0);
      setWantPlay(true);
    } else {
      setWantPlay((w) => !w);
    }
  }, [play]);

  const restart = useCallback(() => {
    setPlay(0);
    setWantPlay(!reduced);
    autoStarted.current = true;
  }, [reduced]);

  const stepTo = useCallback((dir: 1 | -1) => {
    setWantPlay(false);
    setPlay((p) => {
      const m = minuteAt(p);
      let idx = -1;
      EVENTS.forEach((e, i) => {
        if (m >= e.t - 0.001) idx = i;
      });
      const next = Math.max(0, Math.min(EVENTS.length - 1, idx + dir));
      return playAt(EVENTS[next]?.t ?? DAY_END) + 1;
    });
  }, []);

  const event = view.eventIndex >= 0 ? EVENTS[view.eventIndex] : undefined;
  const caption = event
    ? `${event.time}. ${mode === "with" ? event.with : event.without}`
    : "8:00am. The day starts. Nothing has happened yet.";
  const done = minute >= DAY_END - 0.01;
  const progress = Math.min(1, play / DURATION);

  return (
    <section
      ref={rootRef}
      aria-label="Watch a day run"
      className="min-w-0 rounded-[24px] bg-white p-4 sm:p-6"
      style={{ border: "1px solid var(--sys-border)", boxShadow: "var(--sys-card-shadow)" }}
    >
      <style>{`
        @keyframes dr-rise { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: none; } }
        @keyframes dr-pop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes dr-bump { 0% { transform: scale(1); } 40% { transform: scale(1.45); } 100% { transform: scale(1); } }
        @keyframes dr-dot { 0%, 70%, 100% { opacity: 0.35; transform: translateY(0); } 35% { opacity: 1; transform: translateY(-3px); } }
        @keyframes dr-ring { 0% { opacity: 0.9; transform: scale(1); } 100% { opacity: 0; transform: scale(1.35); } }
        @media (prefers-reduced-motion: reduce) { .dr-anim { animation: none !important; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", color: "var(--sys-violet)" }}
        >
          <CalendarClock className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
            >
              Watch a day run
            </h3>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: "rgba(20, 167, 154, 0.1)",
                border: "1px solid rgba(20, 167, 154, 0.2)",
                color: "var(--sys-teal)",
              }}
            >
              {EXAMPLE_LABEL}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--sys-body)" }}>
            One ordinary day for a trades business. Switch between having the system and not.
          </p>
        </div>
      </div>

      <div
        className="mt-4 inline-flex max-w-full flex-wrap rounded-[22px] p-1"
        role="group"
        aria-label="Compare the day"
        style={{ backgroundColor: "rgba(20, 33, 61, 0.05)" }}
      >
        {(["with", "without"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`sys-crm-motion min-h-11 rounded-full px-4 text-sm font-semibold ${FOCUS}`}
            style={
              mode === m
                ? { backgroundColor: "var(--sys-navy)", color: "#fff" }
                : { color: "var(--sys-body)" }
            }
          >
            {m === "with" ? "With the system" : "Without the system"}
          </button>
        ))}
      </div>

      {/* Workspace card */}
      <div
        className="mt-4 overflow-hidden rounded-[20px]"
        style={{
          border: "1px solid var(--sys-border)",
          boxShadow: "0 18px 40px rgba(20, 33, 61, 0.12)",
        }}
      >
        {/* Clock strip */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-white"
          style={{ background: "linear-gradient(120deg, var(--sys-navy), #243B6B)" }}
        >
          <AnalogueClock minute={minute} />
          <div className="flex items-baseline gap-1" aria-hidden="true">
            <span
              className="text-4xl font-bold tabular-nums leading-none sm:text-5xl"
              style={{ fontFamily: HEADING_FONT }}
            >
              {clock.text}
            </span>
            <span className="text-base font-semibold opacity-80">{clock.ampm}</span>
          </div>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate text-sm font-bold" style={{ fontFamily: HEADING_FONT }}>
              Northside Home Services, one day
            </p>
            <p className="text-xs opacity-80">
              {mode === "with" ? "With the system" : "Without the system"}
            </p>
          </div>
        </div>

        {/* Progress track */}
        <div className="bg-white px-4 pb-1 pt-4">
          <div
            aria-hidden="true"
            className="relative mx-[7px] h-1.5 rounded-full"
            style={{ backgroundColor: "rgba(20, 33, 61, 0.1)" }}
          >
            <div
              className="absolute inset-0 origin-left rounded-full"
              style={{
                transform: `scaleX(${progress})`,
                background: "linear-gradient(90deg, var(--sys-blue), var(--sys-teal))",
              }}
            />
            {EVENTS.map((e, i) => {
              const lit = minute >= e.t;
              return (
                <span
                  key={e.t}
                  className="absolute top-1/2 h-3.5 w-3.5 rounded-full"
                  style={{
                    left: `${(playAt(e.t) / DURATION) * 100}%`,
                    marginLeft: -7,
                    marginTop: -7,
                    backgroundColor: lit
                      ? mode === "with"
                        ? "var(--sys-green)"
                        : "#DC2626"
                      : "#fff",
                    border: `2px solid ${lit ? "#fff" : "var(--sys-border)"}`,
                    boxShadow: lit ? "0 0 0 2px rgba(30, 136, 229, 0.25)" : "none",
                    transform: i === view.eventIndex && !reduced ? "scale(1.25)" : "scale(1)",
                    transition: reduced ? "none" : `transform 300ms ${EASE}, opacity 300ms ease`,
                  }}
                />
              );
            })}
          </div>
          <div
            className="mt-2 flex justify-between text-[11px] font-semibold"
            style={{ color: "var(--sys-muted)" }}
          >
            <span>8am</span>
            <span>5pm</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-white px-4 pb-3">
          {reduced ? (
            <>
              <button type="button" onClick={() => stepTo(-1)} className={BTN} style={BTN_STYLE}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous event
              </button>
              <button type="button" onClick={() => stepTo(1)} className={BTN} style={BTN_STYLE}>
                Next event <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={togglePlay}
              className={`${BTN} text-white`}
              style={{ backgroundColor: "var(--sys-blue)", border: "1px solid transparent" }}
            >
              {running ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {running ? "Pause" : done ? "Play again" : "Play"}
            </button>
          )}
          <button type="button" onClick={restart} className={BTN} style={BTN_STYLE}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restart
          </button>
          {!reduced ? (
            <div
              className="inline-flex rounded-full p-1"
              role="group"
              aria-label="Speed"
              style={{ backgroundColor: "rgba(20, 33, 61, 0.05)" }}
            >
              {([1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={speed === s}
                  onClick={() => setSpeed(s)}
                  className={`sys-crm-motion min-h-11 min-w-11 rounded-full px-3 text-sm font-bold ${FOCUS}`}
                  style={
                    speed === s
                      ? { backgroundColor: "var(--sys-navy)", color: "#fff" }
                      : { color: "var(--sys-body)" }
                  }
                >
                  {s}x
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex min-h-11 min-w-0 flex-1 basis-48 items-center gap-2">
            <label
              htmlFor="dayrun-scrub"
              className="shrink-0 text-xs font-semibold"
              style={{ color: "var(--sys-muted)" }}
            >
              Time of day
            </label>
            <input
              id="dayrun-scrub"
              type="range"
              min={0}
              max={DURATION}
              step={20}
              value={play}
              aria-valuetext={clockLabel(minute)}
              onChange={(e) => {
                setWantPlay(false);
                setPlay(Number(e.target.value));
              }}
              className={`h-11 min-w-0 flex-1 cursor-pointer rounded-full ${FOCUS}`}
              style={{ accentColor: "var(--sys-blue)" }}
            />
          </div>
        </div>

        {/* Visual stage */}
        <div
          aria-hidden="true"
          className="grid min-w-0 gap-5 px-4 pb-5 pt-2 lg:grid-cols-[1.4fr_1fr]"
          style={{ backgroundColor: "#fff" }}
        >
          <div className="min-w-0">
            <p
              className="mb-2 text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--sys-muted)" }}
            >
              The pipeline
            </p>
            <Kanban cards={view.cards} reduced={reduced} />
          </div>
          <div className="min-w-0">
            <p
              className="mb-2 text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--sys-muted)" }}
            >
              What the customer sees
            </p>
            <Phone view={view} mode={mode} reduced={reduced} minute={minute} />
            <ChipArea chips={view.chips} mode={mode} minute={minute} reduced={reduced} />
          </div>
        </div>

        {/* Live caption */}
        <div
          className="px-4 py-3"
          style={{
            backgroundColor: mode === "with" ? "rgba(16, 185, 129, 0.08)" : AMBER.bg,
            borderTop: "1px solid var(--sys-border)",
          }}
        >
          <p
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--sys-muted)" }}
          >
            Now
          </p>
          <p
            role="status"
            aria-live="polite"
            className="mt-0.5 break-words text-sm font-medium"
            style={{ color: "var(--sys-navy)" }}
          >
            {caption}
          </p>
        </div>

        {/* Result strip */}
        <div className="grid grid-cols-2 gap-2 bg-white px-4 py-4 lg:grid-cols-4">
          <Tile
            label="Replies sent"
            value={view.replies}
            format={(n) => String(Math.round(n))}
            reduced={reduced}
            tone="var(--sys-blue)"
          />
          <Tile
            label="Response time"
            value={view.respSeconds}
            format={(n) => formatResponse(mode, n)}
            reduced={reduced}
            tone={mode === "with" ? "var(--sys-teal)" : "#DC2626"}
          />
          <Tile
            label="Deals followed up"
            value={view.followed}
            format={(n) => String(Math.round(n))}
            reduced={reduced}
            tone="var(--sys-violet)"
          />
          <Tile
            label="Kept from going cold"
            value={view.saved}
            format={(n) => (n < 1 ? "$0" : formatMoney(Math.round(n)))}
            reduced={reduced}
            tone="var(--sys-green)"
          />
        </div>
      </div>

      {done ? (
        <p
          className="mt-4 break-words rounded-[14px] px-4 py-3 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--sys-navy)", fontFamily: HEADING_FONT }}
        >
          {SUMMARY[mode]}
        </p>
      ) : null}
    </section>
  );
}
