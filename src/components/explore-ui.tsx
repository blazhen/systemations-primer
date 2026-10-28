import { useEffect, useRef, useState } from "react";
import {
  CalendarCheck,
  FileText,
  Inbox,
  ListChecks,
  MailCheck,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { EXPLORE_CONFIG, LOGO_URL, type AgentProfile } from "./explore-data";
import { Reveal, useArmed, usePrefersReducedMotion, useScrollDrift } from "./explore-motion";

// ---------------------------------------------------------------------------
// Shared UI primitives (reuse the design system tokens)
// ---------------------------------------------------------------------------

export function Pill({
  children,
  variant = "violet",
}: {
  children: React.ReactNode;
  variant?: "violet" | "blue";
}) {
  const isBlue = variant === "blue";
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[14px] font-medium"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        border: "1px solid var(--sys-pill-border)",
        color: isBlue ? "var(--sys-blue-dark)" : "var(--sys-violet-dark)",
        boxShadow: "0 2px 4px rgba(20, 33, 61, 0.02)",
      }}
    >
      {children}
    </span>
  );
}

export function Divider() {
  return <div className="sys-divider-fade mx-auto max-w-[1120px]" />;
}

export function SectionHeader({
  pill,
  pillVariant = "violet",
  navyTitle,
  gradientTitle,
  sub,
}: {
  pill?: string;
  pillVariant?: "violet" | "blue";
  navyTitle: string;
  gradientTitle?: string;
  sub?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-[820px] text-center">
      {pill ? <Pill variant={pillVariant}>{pill}</Pill> : null}
      <h2
        className="mt-4 text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
        style={{
          fontFamily: "var(--sys-font-display)",
          color: "var(--sys-navy)",
        }}
      >
        {navyTitle}
        {gradientTitle ? (
          <>
            {" "}
            <span className="sys-gradient-text">{gradientTitle}</span>
          </>
        ) : null}
      </h2>
      {sub ? (
        <p
          className="mt-4 text-base leading-relaxed sm:text-lg"
          style={{ color: "var(--sys-body)" }}
        >
          {sub}
        </p>
      ) : null}
    </Reveal>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[20px] bg-white p-[26px] ${className}`}
      style={{
        border: "1px solid var(--sys-border)",
        boxShadow: "var(--sys-card-shadow)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function IconTile({
  icon: Icon,
  color,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
}) {
  return (
    <div
      className="sys-icon-tile flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white"
      style={{
        border: "1px solid var(--sys-border)",
        color,
        boxShadow: "0 2px 8px rgba(20, 33, 61, 0.04)",
      }}
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} />
    </div>
  );
}

// Small circular agent photo for the live text and voice demo headers.
// object-fit cover with a face-centred crop. Not a large portrait section.
export function AgentAvatar({ profile, size = 44 }: { profile: AgentProfile; size?: number }) {
  return (
    <img
      src={profile.photoUrl}
      alt={profile.alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-full object-cover"
      style={{
        width: size,
        height: size,
        objectPosition: "center 30%",
        border: "1px solid var(--sys-border)",
        boxShadow: "0 2px 8px rgba(20, 33, 61, 0.08)",
      }}
    />
  );
}

export function GuidedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: "rgba(20, 167, 154, 0.1)",
        border: "1px solid rgba(20, 167, 154, 0.2)",
        color: "var(--sys-teal)",
      }}
    >
      <Sparkles className="h-3 w-3" strokeWidth={2} />
      Guided example
    </span>
  );
}

// ---------------------------------------------------------------------------
// Brand bar + wordmark
// ---------------------------------------------------------------------------
export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <img
      src={LOGO_URL}
      alt="Systemations"
      height={small ? 24 : 28}
      decoding="async"
      loading={small ? "lazy" : undefined}
      style={{ height: small ? 24 : 28, width: "auto", display: "block" }}
      className="shrink-0"
    />
  );
}

export function BrandBar() {
  return (
    <header className="sys-sticky-header z-50">
      <div
        className="mx-auto flex h-14 w-full max-w-[1120px] items-center justify-between px-5 sm:px-6"
        style={{
          borderRadius: "20px",
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid var(--sys-border)",
          boxShadow: "0 8px 24px rgba(20, 33, 61, 0.06)",
        }}
      >
        <Wordmark />
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold"
          style={{
            color: "var(--sys-green-text)",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: "var(--sys-green)" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--sys-green)" }}
            />
          </span>
          <span className="hidden sm:inline">Before your Explore Your Options call</span>
          <span className="sm:hidden">Before your call</span>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// "System at work" stage: shown in the video frame until Dan's video is added.
// A calm loop of fictional events. Pauses when hidden or off screen; a plain
// static list under reduced motion.
// ---------------------------------------------------------------------------
const STAGE_EVENTS = [
  { time: "8:02am", text: "New enquiry from the website", icon: Inbox },
  { time: "8:02am", text: "Instant text reply sent", icon: MessageSquare },
  { time: "8:03am", text: "Task created: call back within 1 hour", icon: ListChecks },
  { time: "10:30am", text: "Quote sent", icon: FileText },
  { time: "1:30pm", text: "Quote follow-up drafted, awaiting your approval", icon: MailCheck },
  { time: "3:00pm", text: "Customer booked a site visit", icon: CalendarCheck },
];
// Ticks 0-5 reveal events, 6 holds, 7 fades out, then back to 0. 8 ticks x 1.75s = 14s.
const STAGE_TICKS = 8;
const STAGE_TICK_MS = 1750;

function StageEvent({ ev }: { ev: (typeof STAGE_EVENTS)[number] }) {
  const Icon = ev.icon;
  return (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 text-sky-300 sm:h-4 sm:w-4" strokeWidth={2} />
      <span className="shrink-0 font-semibold tabular-nums text-white/60">{ev.time}</span>
      <span className="min-w-0 truncate">{ev.text}</span>
    </>
  );
}

function SystemAtWorkStage() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  // Start part-way through so server HTML and no-JS show a populated feed.
  const [tick, setTick] = useState(2);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e?.isIntersecting ?? true), {
      threshold: 0.1,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const running = onScreen && tabVisible && !reduced;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % STAGE_TICKS), STAGE_TICK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  const count = Math.min(tick + 1, STAGE_EVENTS.length);
  const fading = tick === STAGE_TICKS - 1;
  const visible = STAGE_EVENTS.slice(0, count)
    .map((ev, i) => ({ ev, i, depth: count - 1 - i }))
    .filter((v) => v.depth <= 4);

  return (
    <div
      ref={rootRef}
      className={`relative flex h-full w-full flex-col items-center justify-between overflow-hidden px-3 py-2 sm:px-8 sm:py-5 ${running ? "" : "sys-feed-paused"}`}
    >
      <div className="sys-feed-glow" aria-hidden="true">
        <span />
      </div>
      <p className="relative text-[13px] leading-tight text-white/60">
        A day of the system working. Example, fictional data.
      </p>

      {reduced ? (
        <ul className="relative grid w-full max-w-[520px] list-none grid-cols-1 gap-1 overflow-y-auto p-0 sm:gap-2">
          {STAGE_EVENTS.map((ev) => (
            <li
              key={ev.text}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-[13px] text-white/90 sm:px-3.5 sm:py-2"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <StageEvent ev={ev} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="relative w-full max-w-[520px]">
          <div className="sys-feed" data-fading={fading} role="presentation">
            {visible.map(({ ev, i, depth }) => (
              <div
                key={i}
                className="sys-feed-card"
                data-d={depth}
                style={{ ["--d" as string]: depth }}
              >
                <StageEvent ev={ev} />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="relative text-[13px] font-medium leading-tight text-white/75">
        Dan's video is coming soon.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video-led hero (offer name, headline, then the video frame directly below)
// ---------------------------------------------------------------------------
const HERO_PLAIN_WORDS = ["Before", "we", "speak,", "see", "what"];
const HERO_GRADIENT_WORDS = ["is", "possible."];

export function VideoHero() {
  const { welcomeVideoUrl } = EXPLORE_CONFIG;
  const heroRef = useRef<HTMLElement>(null);
  const armed = useArmed();
  useScrollDrift(heroRef);

  return (
    <section
      ref={heroRef}
      className="sys-explore-hero relative -mt-16 px-4 pt-20 pb-4 sm:px-6 sm:pt-24 sm:pb-6"
    >
      <div className="sys-hero-ambient" aria-hidden="true">
        <span className="sys-hero-drift sys-hero-drift-a">
          <span className="sys-hero-blob sys-hero-blob-a" />
        </span>
        <span className="sys-hero-drift sys-hero-drift-b">
          <span className="sys-hero-blob sys-hero-blob-b" />
        </span>
      </div>
      <div className="mx-auto max-w-[740px] text-center">
        <span className={`inline-block ${armed ? "sys-hero-fade-on" : ""}`}>
          <Pill variant="violet">AI Operations Engine</Pill>
        </span>
        <h1
          className={`mt-5 text-balance text-[clamp(28px,7.5vw,42px)] font-bold tracking-[-0.02em] ${
            armed ? "sys-words-on" : ""
          }`}
          style={{
            fontFamily: "var(--sys-font-display)",
            lineHeight: 1.1,
            color: "var(--sys-navy)",
          }}
        >
          {HERO_PLAIN_WORDS.map((word, i) => (
            <span key={word}>
              <span className="sys-word" style={{ ["--w" as string]: i }}>
                {word}
              </span>{" "}
            </span>
          ))}
          {HERO_GRADIENT_WORDS.map((word, i) => (
            <span key={word}>
              <span
                className="sys-word sys-gradient-text sys-shimmer-text"
                style={{ ["--w" as string]: HERO_PLAIN_WORDS.length + i }}
              >
                {word}
              </span>
              {i < HERO_GRADIENT_WORDS.length - 1 ? " " : null}
            </span>
          ))}
        </h1>

        <div className="mt-6">
          <div
            className="relative mx-auto max-w-[720px] overflow-visible rounded-[10px] p-[10px] sm:rounded-[24px] sm:p-[14px]"
            style={{
              backgroundColor: "#1B2433",
              boxShadow:
                "0 20px 50px -15px rgba(16, 32, 51, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              className={`relative w-full overflow-hidden rounded-[6px] sm:aspect-video sm:rounded-[16px] ${
                welcomeVideoUrl ? "aspect-video" : "aspect-[4/3]"
              }`}
              style={{
                backgroundColor: "#070E1B",
                backgroundImage:
                  "radial-gradient(circle at center, rgba(30, 136, 229, 0.28) 0%, rgba(30, 41, 59, 0.22) 50%, transparent 80%)",
              }}
            >
              {welcomeVideoUrl ? (
                <iframe
                  src={welcomeVideoUrl}
                  title="A quick welcome from Dan, founder of Systemations"
                  className="h-full w-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <SystemAtWorkStage />
              )}
            </div>
          </div>
        </div>
        <p
          className="mx-auto mt-4 max-w-[720px] text-center text-[15px] leading-relaxed"
          style={{ color: "var(--sys-muted)" }}
        >
          Watch this 7-minute video where Dan explains how the AI Operations Engine could work for
          your business.
        </p>
      </div>
    </section>
  );
}
