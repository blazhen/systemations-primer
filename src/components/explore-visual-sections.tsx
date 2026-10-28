import { useEffect, useRef, useState } from "react";
import {
  CalendarCheck,
  Clock,
  FileText,
  Inbox,
  ListChecks,
  MailCheck,
  MessageSquare,
  PhoneMissed,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CountUp, Reveal, usePrefersReducedMotion } from "./explore-motion";
import { SectionHeader } from "./explore-ui";

// ---------------------------------------------------------------------------
// Visual sections for the Explore page: a stats strip, the journey flow and a
// before/after week. All start states are applied only after mount, so server
// HTML and no-JS show everything finished. Reduced motion keeps that finished
// state. Animations use transform and opacity (plus the SVG path draw and
// simple colour changes).
// ---------------------------------------------------------------------------

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const HEADING_FONT = "'Plus Jakarta Sans', sans-serif";

type Phase = "static" | "armed" | "play";

// static: server render, no JS or reduced motion (finished look).
// armed: mounted and waiting to be seen (start state). play: seen, once only.
function usePlayOnce(ref: React.RefObject<HTMLElement | null>, threshold = 0.3): Phase {
  const [phase, setPhase] = useState<Phase>("static");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }
    setPhase("armed");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("play");
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return phase;
}

function clamp(n: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, n));
}

function FictionalNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[13px] ${className}`} style={{ color: "var(--sys-muted)" }}>
      Example, fictional data.
    </p>
  );
}

// ---------------------------------------------------------------------------
// 1. Stats strip
// ---------------------------------------------------------------------------
const STATS = [
  {
    icon: Clock,
    color: "var(--sys-blue)",
    lead: "Under",
    value: 60,
    suffix: "s",
    caption: "average first reply",
  },
  {
    icon: ShieldCheck,
    color: "var(--sys-green)",
    lead: "Only",
    value: 0,
    suffix: "",
    caption: "enquiries forgotten",
  },
  {
    icon: Inbox,
    color: "var(--sys-violet)",
    lead: "Just",
    value: 1,
    suffix: "",
    caption: "inbox for calls, texts and emails",
  },
];

export function StatsStrip() {
  const ref = useRef<HTMLElement>(null);
  const phase = usePlayOnce(ref, 0.4);
  const armed = phase === "armed";
  const play = phase === "play";

  return (
    <section ref={ref} className="bg-white px-4 py-10 sm:px-6 sm:py-14">
      <h2 className="sr-only">Systemations at a glance</h2>
      <div className="mx-auto max-w-[1120px]">
        <Reveal stagger className="grid gap-8 sm:grid-cols-3 sm:gap-0">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.caption}
                className={`flex flex-col items-center px-4 text-center ${i > 0 ? "sm:border-l" : ""}`}
                style={{ borderColor: "var(--sys-border)" }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    color: s.color,
                    background: "linear-gradient(145deg, #ffffff, #f1f6fb)",
                    border: "1px solid var(--sys-border)",
                    boxShadow: "0 6px 16px rgba(20, 33, 61, 0.08), 0 1px 2px rgba(20,33,61,0.05)",
                    transform: armed ? "scale(0.5) rotate(-24deg)" : "none",
                    opacity: armed ? 0 : 1,
                    transition: play
                      ? `transform 600ms ${EASE} ${i * 160}ms, opacity 400ms ease-out ${i * 160}ms`
                      : "none",
                  }}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <p className="mt-4 text-sm font-medium" style={{ color: "var(--sys-muted)" }}>
                  {s.lead}
                </p>
                <p
                  className="text-[56px] font-bold leading-none tracking-[-0.03em] tabular-nums sm:text-[64px]"
                  style={{ fontFamily: HEADING_FONT, color: "var(--sys-navy)" }}
                >
                  <CountUp value={s.value} suffix={s.suffix} duration={1400} />
                </p>
                <p className="mt-2 max-w-[240px] text-[15px]" style={{ color: "var(--sys-body)" }}>
                  {s.caption}
                </p>
              </div>
            );
          })}
        </Reveal>
        <FictionalNote className="mt-6 text-center" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Journey: first message to booked job
// ---------------------------------------------------------------------------
type ProofKind = "message" | "reply" | "task" | "quote" | "approval" | "calendar";

const JOURNEY: {
  icon: typeof Inbox;
  color: string;
  title: string;
  line: string;
  proof: ProofKind;
}[] = [
  {
    icon: MessageSquare,
    color: "var(--sys-blue)",
    title: "Customer messages",
    line: "Website, call or text",
    proof: "message",
  },
  {
    icon: Zap,
    color: "var(--sys-teal)",
    title: "Instant reply",
    line: "Under 60 seconds",
    proof: "reply",
  },
  {
    icon: ListChecks,
    color: "var(--sys-violet)",
    title: "Task for your team",
    line: "Nothing sits in someone's head",
    proof: "task",
  },
  {
    icon: FileText,
    color: "var(--sys-blue)",
    title: "Quote sent",
    line: "Follow-up timer starts",
    proof: "quote",
  },
  {
    icon: MailCheck,
    color: "#d98a00",
    title: "Follow-up drafted",
    line: "Waits for your approval",
    proof: "approval",
  },
  {
    icon: CalendarCheck,
    color: "var(--sys-green)",
    title: "Job booked",
    line: "Review requested after",
    proof: "calendar",
  },
];

const STEP_MS = 850;

function Proof({ kind, lit, anim }: { kind: ProofKind; lit: boolean; anim: boolean }) {
  const slow = (delay: number) => (anim ? `${delay}ms` : "0ms");
  const chip =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold";
  const shadow = "0 4px 12px rgba(20, 33, 61, 0.08), 0 1px 2px rgba(20, 33, 61, 0.05)";

  let body: React.ReactNode = null;
  if (kind === "message") {
    body = (
      <div
        className="max-w-[170px] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-left text-[12px]"
        style={{ border: "1px solid var(--sys-border)", boxShadow: shadow }}
      >
        Hi, can I get a quote for a bathroom?
      </div>
    );
  } else if (kind === "reply") {
    body = (
      <div
        className="max-w-[170px] rounded-2xl rounded-br-sm px-3 py-2 text-left text-[12px] text-white"
        style={{ background: "linear-gradient(135deg, #1e88e5, #14a79a)", boxShadow: shadow }}
      >
        Thanks Sam! We can visit Thursday.
        <span className="mt-0.5 block text-[10px] text-white/80">Sent in 42s</span>
      </div>
    );
  } else if (kind === "task") {
    body = (
      <div
        className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px]"
        style={{ border: "1px solid var(--sys-border)", boxShadow: shadow }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-md"
          style={{
            border: "1.5px solid var(--sys-green)",
            backgroundColor: lit ? "rgba(16,185,129,0.14)" : "transparent",
            transition: `background-color 300ms ease-out ${slow(500)}`,
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
            <path
              d="M3 8.5l3.2 3L13 4.5"
              stroke="var(--sys-green)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={lit ? 0 : 1}
              style={{ transition: `stroke-dashoffset 450ms ease-out ${slow(500)}` }}
            />
          </svg>
        </span>
        Call back within 1 hour
      </div>
    );
  } else if (kind === "quote") {
    body = (
      <div className="flex flex-col items-center gap-1.5">
        <span
          className={`${chip} bg-white`}
          style={{
            border: "1px solid var(--sys-border)",
            color: "var(--sys-navy)",
            boxShadow: shadow,
          }}
        >
          <FileText
            className="h-3.5 w-3.5"
            style={{ color: "var(--sys-blue)" }}
            aria-hidden="true"
          />
          Quote $4,850
        </span>
        <span className="text-[11px]" style={{ color: "var(--sys-muted)" }}>
          Follow-up in 2 days
        </span>
      </div>
    );
  } else if (kind === "approval") {
    body = (
      <span
        className={chip}
        style={{
          backgroundColor: "#FFF4DB",
          border: "1px solid #F5C56B",
          color: "#8a5a00",
          boxShadow: shadow,
        }}
      >
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#F5A623" }} />
        Awaiting approval
      </span>
    );
  } else {
    body = (
      <div
        className="w-[150px] rounded-xl bg-white p-2 text-left"
        style={{ border: "1px solid var(--sys-border)", boxShadow: shadow }}
      >
        <p className="text-[10px] font-semibold" style={{ color: "var(--sys-muted)" }}>
          Thursday
        </p>
        {["9:00", "11:00", "1:00"].map((t, i) => (
          <div
            key={t}
            className="relative mt-1 h-5 overflow-hidden rounded-md"
            style={{ backgroundColor: "#EEF3F8" }}
          >
            {i === 1 ? (
              <div
                className="absolute inset-0 origin-left"
                style={{
                  backgroundColor: "rgba(16,185,129,0.85)",
                  transform: lit ? "scaleX(1)" : "scaleX(0)",
                  transition: `transform 700ms ${EASE} ${slow(450)}`,
                }}
              />
            ) : null}
            <span
              className="relative px-1.5 text-[10px] font-semibold leading-5"
              style={{ color: i === 1 && lit ? "#fff" : "var(--sys-body)" }}
            >
              {t}
              {i === 1 ? " Sam, bathroom" : ""}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="mt-4 flex min-h-[64px] justify-start lg:justify-center"
      style={{
        opacity: lit ? 1 : 0,
        transform: lit ? "none" : "translateY(28px)",
        transition: anim ? `transform 500ms ${EASE}, opacity 500ms ease-out` : "none",
      }}
    >
      {body}
    </div>
  );
}

export function JourneySection() {
  const ref = useRef<HTMLElement>(null);
  const phase = usePlayOnce(ref, 0.3);
  const anim = phase === "play";
  const total = JOURNEY.length;
  const [progress, setProgress] = useState(total);

  useEffect(() => {
    if (phase === "armed") setProgress(0);
    if (phase !== "play") return;
    let n = 0;
    setProgress(0);
    const id = window.setInterval(() => {
      n += 1;
      setProgress(n);
      if (n >= total) window.clearInterval(id);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [phase, total]);

  // The line runs from the first node centre to the last (1/12 to 11/12 of the width).
  const frac = progress <= 1 ? 0 : (progress - 1) / (total - 1);
  const dotPos = 100 / (total * 2) + frac * (100 - 100 / total);
  const glow = "0 0 0 6px rgba(30, 136, 229, 0.16), 0 8px 22px rgba(30, 136, 229, 0.35)";

  return (
    <section ref={ref} className="sys-section-tinted px-4 py-14 sm:px-6 sm:py-20">
      <SectionHeader
        navyTitle="From first message to"
        gradientTitle="booked job."
        sub="Watch one enquiry travel through your business, with nobody chasing it."
      />
      <div className="mx-auto mt-12 max-w-[1120px]">
        <div className="relative">
          {/* Desktop path: draws itself, with a glowing dot riding along it. */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[26px] hidden h-0 lg:block"
            style={{ containerType: "inline-size" }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 100 2"
              preserveAspectRatio="none"
              className="absolute left-0 top-[-1px] h-[2px] w-full overflow-visible"
              fill="none"
            >
              <path
                d="M8.333 1 H91.667"
                stroke="#dbe5ef"
                strokeWidth="3"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M8.333 1 H91.667"
                stroke="url(#sys-journey-grad)"
                strokeWidth="3"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - frac}
                style={{ transition: anim ? `stroke-dashoffset ${STEP_MS}ms linear` : "none" }}
              />
              <defs>
                <linearGradient id="sys-journey-grad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="#1e88e5" />
                  <stop offset="0.6" stopColor="#14a79a" />
                  <stop offset="1" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <span
              className="absolute left-0 top-[-7px] h-3.5 w-3.5 rounded-full bg-white"
              style={{
                boxShadow: glow,
                border: "3px solid var(--sys-blue)",
                transform: `translateX(calc(${dotPos} * 1cqw - 7px))`,
                opacity: progress > 0 && progress < total ? 1 : 0,
                transition: anim
                  ? `transform ${STEP_MS}ms linear, opacity 400ms ease-out`
                  : "opacity 200ms",
              }}
            />
          </div>

          <ol className="relative grid list-none gap-0 p-0 lg:grid-cols-6 lg:gap-3">
            {JOURNEY.map((n, i) => {
              const Icon = n.icon;
              const lit = progress > i;
              const current = progress === i + 1 && progress < total;
              const last = i === total - 1;
              return (
                <li
                  key={n.title}
                  className="relative flex gap-4 pb-8 last:pb-0 lg:block lg:pb-0 lg:text-center"
                >
                  {/* Mobile: a line segment from this node down to the next. */}
                  {!last ? (
                    <span
                      className="absolute bottom-0 left-[25px] top-[52px] w-[3px] rounded-full lg:hidden"
                      style={{ backgroundColor: "#dbe5ef" }}
                      aria-hidden="true"
                    >
                      <span
                        className="absolute inset-0 origin-top rounded-full"
                        style={{
                          background: "linear-gradient(to bottom, #1e88e5, #14a79a)",
                          transform: progress > i + 1 ? "scaleY(1)" : "scaleY(0)",
                          transition: anim ? `transform ${STEP_MS}ms linear` : "none",
                        }}
                      />
                    </span>
                  ) : null}
                  <div className="relative z-10 shrink-0 lg:mx-auto lg:w-[52px]">
                    <div
                      className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl"
                      style={{
                        color: lit ? "#fff" : "var(--sys-muted)",
                        background: lit
                          ? `linear-gradient(145deg, ${n.color}, color-mix(in srgb, ${n.color} 70%, #14213d))`
                          : "#fff",
                        border: "1px solid var(--sys-border)",
                        boxShadow: current
                          ? "0 0 0 6px rgba(30,136,229,0.14), 0 12px 26px rgba(20,33,61,0.2)"
                          : lit
                            ? "0 10px 22px rgba(20,33,61,0.16), 0 2px 4px rgba(20,33,61,0.08)"
                            : "0 2px 6px rgba(20,33,61,0.05)",
                        transform: current ? "scale(1.1)" : lit ? "scale(1)" : "scale(0.92)",
                        transition: anim
                          ? `transform 500ms ${EASE}, box-shadow 500ms, color 300ms`
                          : "none",
                      }}
                      aria-hidden="true"
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.8} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 lg:mt-4">
                    <h3
                      className="text-[16px] font-bold leading-snug"
                      style={{
                        fontFamily: HEADING_FONT,
                        color: "var(--sys-navy)",
                        opacity: lit ? 1 : 0.45,
                        transition: anim ? "opacity 400ms ease-out" : "none",
                      }}
                    >
                      <span className="sr-only">{`Step ${i + 1}: `}</span>
                      {n.title}
                    </h3>
                    <p
                      className="mt-1 text-[14px] leading-snug"
                      style={{
                        color: "var(--sys-body)",
                        opacity: lit ? 1 : 0.45,
                        transition: anim ? "opacity 400ms ease-out" : "none",
                      }}
                    >
                      {n.line}
                    </p>
                    <Proof kind={n.proof} lit={lit} anim={anim} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <FictionalNote className="mt-8 text-center" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Before and after: scrub through a week
//
// Both panels are a pure function of the slider value (0 to 100). With the
// system, enquiries are answered within seconds and become bookings. Past the
// end of the week a gentle "live" clock keeps new enquiries arriving, so the
// finished state never looks frozen or quiet.
// ---------------------------------------------------------------------------
type Lead = {
  who: string;
  job: string;
  t: number; // arrival, in week units
  reply: number; // seconds to first reply with the system
  book: number; // week unit when booked with the system (Infinity: not part of the count)
  value: number;
};

// who, job, arrival, reply seconds, time to book (week units), value
const LEAD_ROWS: [string, string, number, number, number, number][] = [
  ["Mel, Parramatta", "Kitchen quote", 2, 12, 9, 3200],
  ["Raj, Brunswick", "Leaking tap", 8, 9, 10, 1800],
  ["Kate, Ryde", "Blocked drain", 14, 18, 8, 2400],
  ["Tom, Penrith", "Switchboard upgrade", 20, 15, 10, 2900],
  ["Lena, Geelong", "Fence replacement", 27, 21, 9, 1500],
  ["Ben, Footscray", "Bathroom reno", 33, 12, 10, 3600],
  ["Priya, Epping", "Hot water system", 40, 31, 9, 2100],
  ["Jack, Newtown", "Deck repair", 47, 14, 8, 2700],
  ["Sue, Camberwell", "Gutter replacement", 54, 10, 10, 3100],
  ["Omar, Liverpool", "Power points", 61, 17, 9, 1900],
  ["Zoe, Preston", "Pergola build", 69, 12, 8, 2600],
  ["Dan, Bondi", "Tiling job", 76, 25, 10, 3300],
  ["Ana, Frankston", "Painting quote", 82, 11, 9, 4200],
  ["Will, Cronulla", "Air-con install", 88, 16, 10, 3100],
];

const LEADS: Lead[] = LEAD_ROWS.map(([who, job, t, reply, d, value]) => ({
  who,
  job,
  t,
  reply,
  book: t + d,
  value,
}));

// Enquiries that keep arriving after the week ends (looping gently while on screen).
const LIVE_POOL: [string, string, number][] = [
  ["Nina, Hornsby", "Gutter clean", 12],
  ["Leo, Richmond", "Heater service", 9],
  ["Amy, Blacktown", "Ceiling fan", 14],
  ["Ravi, Dandenong", "Fence repair", 11],
  ["Cara, Manly", "Window seal", 18],
  ["Ed, Werribee", "Garage door", 10],
];

// Without the system: three of the same enquiries still got booked, late.
const WITHOUT_BOOKED: { idx: number; delay: number; value: number }[] = [
  { idx: 1, delay: 22, value: 2600 },
  { idx: 5, delay: 22, value: 2300 },
  { idx: 9, delay: 22, value: 3000 },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const LIFE = 24; // how long a new card stays in the lane before it is answered
const CHIP_LIFE = 12; // how long the "Replied in" chip shows
const CARD_H = 64;
const CARD_PITCH = 70;
const ROW_H = 44;
const ROW_PITCH = 50;
const BODY_H = 204;
const HEAD_H = 28;
const LIVE_MS = 2000;
const LIVE_STEP = 8;
const MAX_NEW = 3;
const MAX_ROWS = 4;
const COLD_SCALE = 18;

const BA_CSS = `
@keyframes sys-ba-x { 0% { transform: translateX(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateX(32px); opacity: 0; } }
@keyframes sys-ba-y { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(22px); opacity: 0; } }
@keyframes sys-ba-pulse { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(2.6); opacity: 0; } }
.sys-ba-x { animation: sys-ba-x 1.6s ease-in-out infinite; }
.sys-ba-y { animation: sys-ba-y 1.6s ease-in-out infinite; }
.sys-ba-pulse { animation: sys-ba-pulse 1.8s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .sys-ba-x, .sys-ba-y, .sys-ba-pulse { animation: none !important; opacity: 1; }
  .sys-ba-pulse { opacity: 0; }
}
`;

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-AU")}`;
}

// Eases a displayed number toward its target (running total). Instant when disabled.
function useSmooth(target: number, enabled: boolean): number {
  const [shown, setShown] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (!enabled) {
      cur.current = target;
      setShown(target);
      return;
    }
    const from = cur.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = clamp((now - start) / 600);
      cur.current = from + (target - from) * (1 - Math.pow(1 - t, 3));
      setShown(cur.current);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled]);
  return shown;
}

type CardTone = { bg: string; bd: string; fg: string };

const TONE_NEW: CardTone = { bg: "#ffffff", bd: "var(--sys-border)", fg: "var(--sys-navy)" };
const TONE_AMBER: CardTone = { bg: "#FFF4DB", bd: "#F5C56B", fg: "#6b4a00" };
const TONE_COLD: CardTone = { bg: "#EDEFF2", bd: "#D3D8DF", fg: "#6f7886" };
const TONE_BOOKED: CardTone = { bg: "#E8F8F1", bd: "#8fdcbc", fg: "#0b5e43" };
const TONE_PLAIN: CardTone = { bg: "#ffffff", bd: "#DADEE4", fg: "#5b6573" };

function EnquiryCard({
  lead,
  state,
  rank,
  tone,
  tag,
  chip,
  tr,
  shadow,
}: {
  lead: Lead;
  state: "pre" | "on" | "gone";
  rank: number;
  tone: CardTone;
  tag: string;
  chip: boolean;
  tr: string;
  shadow: boolean;
}) {
  const on = state === "on";
  const transform =
    state === "pre"
      ? "translateY(-30px)"
      : state === "gone"
        ? `translateY(${MAX_NEW * CARD_PITCH - 14}px)`
        : `translateY(${rank * CARD_PITCH}px)`;
  return (
    <div
      aria-hidden={on ? undefined : true}
      className="absolute inset-x-0 top-0 flex flex-col justify-center rounded-xl px-3"
      style={{
        height: CARD_H,
        backgroundColor: tone.bg,
        border: `1px solid ${tone.bd}`,
        color: tone.fg,
        opacity: on ? 1 : 0,
        transform,
        boxShadow: on && shadow ? "0 4px 12px rgba(20,33,61,0.07)" : "none",
        transition: tr,
      }}
    >
      <p className="truncate text-[13px] font-semibold leading-4">{lead.who}</p>
      <p className="truncate text-[13px] leading-4 opacity-80">{lead.job}</p>
      {chip ? (
        <span
          className="mt-0.5 inline-flex w-fit max-w-full items-center truncate rounded-full px-2 text-[13px] font-semibold leading-4"
          style={{ backgroundColor: "rgba(16,185,129,0.14)", color: "#0b5e43" }}
        >
          Replied in {lead.reply}s
        </span>
      ) : (
        <p className="mt-0.5 truncate text-[13px] font-semibold leading-4">{tag}</p>
      )}
    </div>
  );
}

function BookedRow({
  who,
  job,
  value,
  rank,
  tone,
  tr,
}: {
  who: string;
  job: string;
  value: number;
  rank: number; // 0 is the newest booked row; -1 means not booked yet
  tone: CardTone;
  tr: string;
}) {
  const booked = rank >= 0;
  const shown = booked && rank < MAX_ROWS;
  const transform = !booked
    ? "translateY(-20px)"
    : rank < MAX_ROWS
      ? `translateY(${rank * ROW_PITCH}px)`
      : `translateY(${MAX_ROWS * ROW_PITCH}px)`;
  return (
    <div
      aria-hidden={shown ? undefined : true}
      className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 rounded-lg px-3"
      style={{
        height: ROW_H,
        backgroundColor: tone.bg,
        border: `1px solid ${tone.bd}`,
        color: tone.fg,
        opacity: shown ? (rank === MAX_ROWS - 1 ? 0.7 : 1) : 0,
        transform,
        transition: tr,
      }}
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-4">{who}</p>
        <p className="truncate text-[13px] leading-4 opacity-80">{job}</p>
      </div>
      <span className="shrink-0 text-[13px] font-bold tabular-nums">{money(value)}</span>
    </div>
  );
}

function Connector({ live }: { live: boolean }) {
  const play = live ? "running" : "paused";
  return (
    <>
      <div
        className="relative hidden w-full items-center justify-center sm:flex"
        style={{ marginTop: HEAD_H, height: BODY_H }}
        aria-hidden="true"
      >
        <span
          className="absolute left-1 right-1 h-[2px] rounded-full"
          style={{ background: "linear-gradient(90deg, #dbe5ef, var(--sys-blue), #dbe5ef)" }}
        />
        <span
          className="sys-ba-x absolute left-0 h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--sys-blue)", animationPlayState: play }}
        />
      </div>
      <div className="relative mx-auto h-8 w-[2px] sm:hidden" aria-hidden="true">
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: "linear-gradient(180deg, #dbe5ef, var(--sys-blue), #dbe5ef)" }}
        />
        <span
          className="sys-ba-y absolute -left-[3px] top-0 h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--sys-blue)", animationPlayState: play }}
        />
      </div>
    </>
  );
}

function LaneBox({
  tone,
  live,
  leftBody,
  rightBody,
  leftFoot,
  rightFoot,
}: {
  tone: "with" | "without";
  live: boolean;
  leftBody: React.ReactNode;
  rightBody: React.ReactNode;
  leftFoot: React.ReactNode;
  rightFoot: React.ReactNode;
}) {
  const muted = tone === "without" ? "#6f7886" : "var(--sys-muted)";
  const head = (text: string) => (
    <p
      className="flex items-center text-[13px] font-semibold"
      style={{ height: HEAD_H, color: muted }}
    >
      {text}
    </p>
  );
  const foot = "mt-3 flex h-8 items-center gap-2 text-[13px]";
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: tone === "without" ? "#E9EBEF" : "linear-gradient(180deg, #f8fbfe, #f1f6fb)",
        border: `1px solid ${tone === "without" ? "#DADEE4" : "var(--sys-border)"}`,
      }}
    >
      <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] sm:gap-y-0">
        <div className="min-w-0">
          {head("New enquiries")}
          <div className="relative" style={{ height: BODY_H }}>
            {leftBody}
          </div>
          <div className={foot}>{leftFoot}</div>
        </div>
        <Connector live={live} />
        <div className="min-w-0">
          {head("Booked this week")}
          <div className="relative overflow-hidden" style={{ height: BODY_H }}>
            {rightBody}
          </div>
          <div className={foot}>{rightFoot}</div>
        </div>
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  color,
  label,
  muted,
  children,
}: {
  icon: typeof Inbox;
  color: string;
  label: string;
  muted: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-[104px] flex-col rounded-xl p-3"
      style={{
        background: muted ? "rgba(255,255,255,0.7)" : "linear-gradient(160deg, #ffffff, #f1f8f6)",
        border: `1px solid ${muted ? "#DADEE4" : "var(--sys-border)"}`,
      }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color }} aria-hidden="true" />
      <p
        className="mt-2 text-[26px] font-bold leading-none tabular-nums"
        style={{ fontFamily: HEADING_FONT, color: muted ? "#5b6573" : "var(--sys-navy)" }}
      >
        {children}
      </p>
      <p
        className="mt-1.5 text-[13px] leading-snug"
        style={{ color: muted ? "#6f7886" : "var(--sys-body)" }}
      >
        {label}
      </p>
    </div>
  );
}

function ageTone(age: number): { tone: CardTone; tag: string } {
  if (age < 0.3) return { tone: TONE_NEW, tag: "Waiting" };
  if (age < 0.7) return { tone: TONE_AMBER, tag: "Going cold" };
  return { tone: TONE_COLD, tag: "Gone cold" };
}

export function BeforeAfterSection() {
  const ref = useRef<HTMLElement>(null);
  const phase = usePlayOnce(ref, 0.25);
  const reduced = usePrefersReducedMotion();
  const [week, setWeek] = useState(100);
  const [ticks, setTicks] = useState(3); // finished state shows live cards already
  const [live, setLive] = useState(false);
  const raf = useRef(0);
  const animate = phase === "play";

  // Autoplay once on first view (about 8 seconds), then settle on the live end state.
  useEffect(() => {
    if (phase === "armed") {
      setWeek(0);
      setTicks(0);
    }
    if (phase !== "play") return;
    const start = performance.now();
    const dur = 8000;
    const tick = (now: number) => {
      const t = clamp((now - start) / dur);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setWeek(eased * 100);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [phase]);

  // Loops only run while the section is on screen and the tab is visible.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let onScreen = false;
    let tabOk = !document.hidden;
    const update = () => setLive(onScreen && tabOk);
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        update();
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    const onVis = () => {
      tabOk = !document.hidden;
      update();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const atEnd = week >= 100;
  const looping = live && atEnd && !reduced && phase !== "static";
  useEffect(() => {
    if (!looping) return;
    const id = window.setInterval(() => setTicks((n) => n + 1), LIVE_MS);
    return () => window.clearInterval(id);
  }, [looping]);

  const dayIndex = Math.min(DAYS.length - 1, Math.floor(week / 20.0001));
  const clock = atEnd ? 100 + ticks * LIVE_STEP : week;
  const frac = week / 100;

  // Transitions: full motion, or plain 250ms fades when reduced motion is on.
  const tr = reduced
    ? "opacity 250ms ease-out, background-color 250ms ease-out"
    : animate
      ? `transform 600ms ${EASE}, opacity 450ms ease-out, background-color 600ms, border-color 600ms, color 600ms`
      : "none";

  // ---- With the system ----
  const liveLeads: Lead[] = [];
  if (atEnd) {
    for (let k = Math.max(1, ticks - 3); k <= ticks; k += 1) {
      const p = LIVE_POOL[k % LIVE_POOL.length] ?? LIVE_POOL[0] ?? ["", "", 12];
      liveLeads.push({
        who: p[0],
        job: p[1],
        t: 100 + k * LIVE_STEP,
        reply: p[2],
        book: Infinity,
        value: 0,
      });
    }
  }
  const withLeads = [...LEADS, ...liveLeads];
  const withVisible = withLeads.filter((l) => l.t <= clock && clock - l.t < LIFE).slice(-MAX_NEW);
  const bookedCount = LEADS.filter((l) => l.book <= week).length;
  const bookedTotal = LEADS.reduce((s, l) => (l.book <= week ? s + l.value : s), 0);
  const totalShown = useSmooth(bookedTotal, animate && !reduced);

  // ---- Without the system ----
  const woVisible = LEADS.filter((l) => l.t <= week).slice(-MAX_NEW);
  const woBooked = WITHOUT_BOOKED.filter((b) => (LEADS[b.idx]?.t ?? Infinity) + b.delay <= week);
  const woTotal = woBooked.reduce((s, b) => s + b.value, 0);
  const goneCold = LEADS.filter(
    (l, i) => l.t <= week && (week - l.t) / COLD_SCALE >= 0.7 && !woBooked.some((b) => b.idx === i),
  ).length;
  const missed = Math.round(frac * 9);
  const unfollowed = Math.round(frac * 6);
  const cold = Math.round((frac * 14200) / 100) * 100;

  const badge = (text: string, muted: boolean) => (
    <span
      className="rounded-full px-2.5 py-0.5 text-[13px] font-bold tabular-nums"
      style={{
        backgroundColor: muted ? "#DADEE4" : "rgba(16,185,129,0.16)",
        color: muted ? "#5b6573" : "#0b5e43",
      }}
    >
      {text}
    </span>
  );

  return (
    <section ref={ref} className="bg-white px-4 py-14 sm:px-6 sm:py-20">
      <style>{BA_CSS}</style>
      <SectionHeader
        navyTitle="A normal week, with and without"
        gradientTitle="the system."
        sub="Same enquiries, same team. Slide through the week and see where they end up."
      />

      <div className="mx-auto mt-10 max-w-[1120px]">
        <div
          className="mx-auto max-w-[620px] rounded-2xl px-5 py-4"
          style={{
            background: "linear-gradient(180deg, #ffffff, #f4f8fc)",
            border: "1px solid var(--sys-border)",
            boxShadow: "var(--sys-card-shadow)",
          }}
        >
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="sys-week-slider"
              className="text-[15px] font-bold"
              style={{ fontFamily: HEADING_FONT, color: "var(--sys-navy)" }}
            >
              Compare: slide through the week
            </label>
            <span className="text-[14px] font-semibold" style={{ color: "var(--sys-blue-dark)" }}>
              {DAYS[dayIndex]}
            </span>
          </div>
          <input
            id="sys-week-slider"
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(week)}
            aria-valuetext={DAYS[dayIndex]}
            onChange={(e) => {
              cancelAnimationFrame(raf.current);
              setWeek(Number(e.target.value));
            }}
            className="mt-1 block h-11 w-full cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ accentColor: "var(--sys-blue)", outlineColor: "var(--sys-blue)" }}
          />
          <div
            className="flex justify-between text-[13px]"
            style={{ color: "var(--sys-muted)" }}
            aria-hidden="true"
          >
            {DAYS.map((d) => (
              <span key={d}>{d.slice(0, 3)}</span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Without */}
          <div
            className="flex flex-col rounded-[22px] p-4 sm:p-6"
            style={{
              backgroundColor: "#F3F4F6",
              border: "1px solid #E1E4E9",
              boxShadow: "0 1px 2px rgba(20,33,61,0.04)",
            }}
          >
            <h3
              className="mb-4 text-[20px] font-bold"
              style={{ fontFamily: HEADING_FONT, color: "#5b6573" }}
            >
              Without
            </h3>
            <LaneBox
              tone="without"
              live={false}
              leftBody={LEADS.map((l, i) => {
                const idx = woVisible.indexOf(l);
                const b = WITHOUT_BOOKED.find((x) => x.idx === i);
                const isBooked = !!b && l.t + b.delay <= week;
                const aged = ageTone((week - l.t) / COLD_SCALE);
                const tone = isBooked ? TONE_BOOKED : aged.tone;
                return (
                  <EnquiryCard
                    key={l.who}
                    lead={l}
                    state={idx >= 0 ? "on" : l.t <= week ? "gone" : "pre"}
                    rank={woVisible.length - 1 - idx}
                    tone={tone}
                    tag={isBooked ? "Booked" : aged.tag}
                    chip={false}
                    tr={tr}
                    shadow={tone !== TONE_COLD}
                  />
                );
              })}
              rightBody={
                <>
                  {WITHOUT_BOOKED.map((b) => {
                    const l = LEADS[b.idx];
                    if (!l) return null;
                    const order = woBooked.findIndex((x) => x.idx === b.idx);
                    return (
                      <BookedRow
                        key={l.who}
                        who={l.who}
                        job={l.job}
                        value={b.value}
                        rank={order >= 0 ? woBooked.length - 1 - order : -1}
                        tone={TONE_PLAIN}
                        tr={tr}
                      />
                    );
                  })}
                  <div
                    className="absolute inset-x-0 flex items-center gap-2 rounded-lg px-3 text-[13px] leading-4"
                    style={{
                      top: BODY_H - ROW_H,
                      height: ROW_H,
                      border: "1px dashed #B9C0CB",
                      color: "#6f7886",
                    }}
                  >
                    <PhoneMissed className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      Missed: {missed} calls, {unfollowed} quotes never followed up
                    </span>
                  </div>
                </>
              }
              leftFoot={
                <>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "#9aa3b0" }}
                    aria-hidden="true"
                  />
                  <span className="font-semibold tabular-nums" style={{ color: "#6f7886" }}>
                    {goneCold} gone cold
                  </span>
                </>
              }
              rightFoot={
                <>
                  {badge(`${woBooked.length} booked`, true)}
                  <span className="font-bold tabular-nums" style={{ color: "#5b6573" }}>
                    {money(woTotal)}
                  </span>
                </>
              }
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Tile icon={PhoneMissed} color="#8a93a1" label="missed calls" muted>
                {missed}
              </Tile>
              <Tile icon={FileText} color="#8a93a1" label="quotes never followed up" muted>
                {unfollowed}
              </Tile>
              <Tile icon={Inbox} color="#8a93a1" label="gone cold" muted>
                {money(cold)}
              </Tile>
              <Tile icon={Clock} color="#8a93a1" label="hours to first reply, on average" muted>
                <CountUp value={26} duration={1400} />
              </Tile>
            </div>
          </div>

          {/* With */}
          <div
            className="relative flex flex-col overflow-hidden rounded-[22px] bg-white p-4 sm:p-6"
            style={{
              border: "1px solid var(--sys-border)",
              boxShadow: "var(--sys-card-shadow), 0 24px 48px -24px rgba(30,136,229,0.28)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: "linear-gradient(90deg, #1e88e5, #14a79a, #10b981)" }}
              aria-hidden="true"
            />
            <h3
              className="mb-4 text-[20px] font-bold"
              style={{ fontFamily: HEADING_FONT, color: "var(--sys-navy)" }}
            >
              With Systemations
            </h3>
            <LaneBox
              tone="with"
              live={live && !reduced}
              leftBody={withLeads.map((l) => {
                const idx = withVisible.indexOf(l);
                return (
                  <EnquiryCard
                    key={`${l.t}-${l.who}`}
                    lead={l}
                    state={idx >= 0 ? "on" : l.t <= clock ? "gone" : "pre"}
                    rank={withVisible.length - 1 - idx}
                    tone={TONE_NEW}
                    tag="Answered"
                    chip={clock - l.t < CHIP_LIFE}
                    tr={tr}
                    shadow
                  />
                );
              })}
              rightBody={LEADS.map((l, i) => (
                <BookedRow
                  key={l.who}
                  who={l.who}
                  job={l.job}
                  value={l.value}
                  rank={l.book <= week ? bookedCount - 1 - i : -1}
                  tone={TONE_BOOKED}
                  tr={tr}
                />
              ))}
              leftFoot={
                <>
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span
                      className="sys-ba-pulse absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: "var(--sys-green)",
                        animationPlayState: live ? "running" : "paused",
                      }}
                    />
                    <span
                      className="relative h-2 w-2 rounded-full"
                      style={{ backgroundColor: "var(--sys-green)" }}
                    />
                  </span>
                  <span className="font-semibold" style={{ color: "var(--sys-body)" }}>
                    New enquiries arriving
                  </span>
                </>
              }
              rightFoot={
                <>
                  {badge(`${bookedCount} booked`, false)}
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
                  >
                    {money(totalShown)}
                  </span>
                </>
              }
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Tile icon={Inbox} color="var(--sys-blue)" label="enquiries answered" muted={false}>
                <CountUp value={23} duration={1600} />
              </Tile>
              <Tile icon={ShieldCheck} color="var(--sys-green)" label="missed" muted={false}>
                <CountUp value={0} duration={1600} />
              </Tile>
              <Tile
                icon={MailCheck}
                color="var(--sys-violet)"
                label="quotes followed up automatically"
                muted={false}
              >
                <CountUp value={6} duration={1600} />
              </Tile>
              <Tile icon={Zap} color="var(--sys-teal)" label="saved from going cold" muted={false}>
                <CountUp value={14200} prefix="$" duration={1600} />
              </Tile>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[13px]" style={{ color: "var(--sys-muted)" }}>
          Example, fictional data. Your numbers will be your own.
        </p>
      </div>
    </section>
  );
}
