import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  MousePointer2,
  RotateCcw,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { useBusinessBrief } from "./explore-business-brief";
import {
  EXAMPLE_LABEL,
  STAGES,
  businessName,
  formatMoney,
  isStuck,
  jobLabel,
  stageById,
  stageLabel,
  useCrm,
  type Contact,
  type StageId,
} from "./explore-crm-state";
import { DayRun } from "./explore-demo-dayrun";
import { Card, IconTile } from "./explore-ui";

// ---------------------------------------------------------------------------
// Pipeline demo: a roomy board you can drag (or tap) cards across, stuck-deal
// chasing, stage automations and a scripted "day" feed. All data fictional.
// Australian English.
// ---------------------------------------------------------------------------

const HEADING_FONT = "'Plus Jakarta Sans', sans-serif";
const FOCUS = "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50";
const AMBER = {
  bg: "rgba(245, 158, 11, 0.12)",
  text: "#92400E",
  border: "rgba(245, 158, 11, 0.3)",
};
const FLIP_MS = 300;
const HINT_KEY = "sys-pipeline-hint-played";

const STAGE_COLOURS: Record<StageId, string> = {
  new: "var(--sys-blue)",
  contacted: "var(--sys-violet)",
  quote: "var(--sys-teal)",
  following: "var(--sys-blue-dark)",
  booked: "var(--sys-green)",
  won: "var(--sys-green-text)",
  lost: "var(--sys-muted)",
};

const OWNER_COLOURS = [
  "var(--sys-blue)",
  "var(--sys-violet)",
  "var(--sys-teal)",
  "var(--sys-blue-dark)",
];

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function ownerColour(name: string): string {
  let n = 0;
  for (const ch of name) n += ch.charCodeAt(0);
  return OWNER_COLOURS[n % OWNER_COLOURS.length] ?? "var(--sys-blue)";
}

function daysText(days: number): string {
  if (days <= 0) return "Today";
  return days === 1 ? "1 day" : `${days} days`;
}

/** Short "what happens next" line, taken from each stage's automation. */
function nextStep(c: Contact): string {
  switch (c.stage) {
    case "new":
      return "Next: call back within the hour";
    case "contacted":
      return "Next: booking link for a site visit";
    case "quote": {
      const left = 3 - c.daysInStage;
      if (left <= 0) return "Next: follow-up is due now";
      return `Next: follow-up in ${left} ${left === 1 ? "day" : "days"}`;
    }
    case "following":
      return "Next: draft waits for your approval";
    case "booked":
      return "Next: reminder the day before the job";
    case "won":
      return "Next: review request goes out";
    default:
      return "Next: check back in six months";
  }
}

function stageProgress(stage: StageId): number {
  if (stage === "lost") return 0.04;
  const i = STAGES.findIndex((s) => s.id === stage);
  return Math.min(1, (i + 1) / 6);
}

// ---------------------------------------------------------------------------
// Local hooks
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

/** Counts up to `target` over 600ms (ease-out). Instant when motion is reduced. */
function useCountUp(target: number, reduced: boolean): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduced) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = from.current;
    if (start === target) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 600);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = start + (target - start) * eased;
      from.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);
  return value;
}

function StatTile({
  label,
  value,
  format,
  reduced,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  reduced: boolean;
}) {
  const shown = useCountUp(value, reduced);
  return (
    <div
      className="min-w-0 rounded-[16px] bg-white px-4 py-3"
      style={{ border: "1px solid var(--sys-border)", boxShadow: "var(--sys-card-shadow)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "var(--sys-muted)" }}>
        {label}
      </p>
      <p
        className="mt-0.5 text-xl font-bold tabular-nums"
        style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
      >
        {format(shown)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
function DealCard({
  contact,
  index,
  isDragging,
  onDragStart,
  onDragEnd,
  onMove,
  refocusKey,
  flash,
  reduced,
  register,
}: {
  contact: Contact;
  index: number;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onMove: (id: string, to: StageId) => void;
  refocusKey: number;
  flash: boolean;
  reduced: boolean;
  register: (id: string, el: HTMLElement | null) => void;
}) {
  const { brief } = useBusinessBrief();
  const { chase, openContact } = useCrm();
  const [moving, setMoving] = useState(false);
  const [target, setTarget] = useState<StageId>(
    STAGES.find((s) => s.id !== contact.stage)?.id ?? "new",
  );
  const moveBtn = useRef<HTMLButtonElement>(null);
  const stuck = isStuck(contact);
  const awaiting = contact.draft?.status === "awaiting";
  const colour = STAGE_COLOURS[contact.stage];
  const others = STAGES.filter((s) => s.id !== contact.stage);
  const selectId = `move-${contact.id}`;

  // After a move the card is a new element in another column: refocus its Move button.
  useEffect(() => {
    if (refocusKey > 0) moveBtn.current?.focus();
    // Only run when this card is the one that was just moved (key changes on mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeMenu() {
    setMoving(false);
    moveBtn.current?.focus();
  }

  const restBg = stuck ? "#FFFBEB" : "#fff";
  const company = contact.company.trim();

  return (
    <li
      ref={(el) => register(contact.id, el)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", contact.id);
        onDragStart(contact.id);
      }}
      onDragEnd={onDragEnd}
      className={`sys-lift min-w-0 cursor-grab rounded-[16px] p-4 shadow-[0_2px_10px_rgba(20,33,61,0.08),0_1px_2px_rgba(20,33,61,0.05)] active:cursor-grabbing ${
        flash && !reduced ? "sys-pop" : ""
      }`}
      style={{
        border: `1px solid ${stuck ? AMBER.border : "var(--sys-border)"}`,
        borderLeft: `4px solid ${stuck ? "#F59E0B" : colour}`,
        backgroundColor: flash && !reduced ? "rgba(30, 136, 229, 0.16)" : restBg,
        opacity: isDragging ? 0.5 : 1,
        outline: isDragging ? "2px dashed var(--sys-blue)" : undefined,
        outlineOffset: isDragging ? "2px" : undefined,
        ...(isDragging
          ? {
              boxShadow: "0 18px 38px rgba(20, 33, 61, 0.22)",
              transform: reduced ? undefined : "rotate(2deg) scale(0.98)",
            }
          : {}),
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold"
          style={{
            backgroundColor: `color-mix(in srgb, ${colour} 12%, white)`,
            border: `1px solid color-mix(in srgb, ${colour} 35%, white)`,
            color: "var(--sys-navy)",
          }}
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colour }}
          />
          {stageLabel(contact.stage, brief)}
        </span>
        <span
          className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
          style={
            stuck
              ? {
                  backgroundColor: AMBER.bg,
                  color: AMBER.text,
                  border: `1px solid ${AMBER.border}`,
                }
              : {
                  backgroundColor: "rgba(20, 33, 61, 0.05)",
                  color: "var(--sys-body)",
                  border: "1px solid var(--sys-border)",
                }
          }
        >
          {stuck ? (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-amber-500 motion-safe:animate-pulse"
            />
          ) : null}
          {stuck ? `Stuck ${daysText(contact.daysInStage)}` : daysText(contact.daysInStage)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => openContact(contact.id)}
        title={`Open ${contact.name}`}
        className={`mt-3 block min-h-8 w-full truncate rounded-[6px] text-left text-base font-semibold leading-snug hover:underline ${FOCUS}`}
        style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
      >
        {contact.name}
      </button>
      {company ? (
        <p className="truncate text-sm font-medium" style={{ color: "var(--sys-body)" }}>
          {company}
        </p>
      ) : null}
      <p className="truncate text-sm" style={{ color: "var(--sys-muted)" }}>
        {jobLabel(contact, index, brief)}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
        >
          {formatMoney(contact.value)}
        </span>
        <span className="ml-auto flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: ownerColour(contact.owner) }}
          >
            {initials(contact.owner)}
          </span>
          <span className="sr-only">Owner: </span>
          <span
            className="min-w-0 truncate text-sm font-medium"
            style={{ color: "var(--sys-body)" }}
          >
            {contact.owner}
          </span>
        </span>
      </div>

      <div className="mt-3">
        <p
          className="flex items-center gap-1.5 text-[13px] font-medium"
          style={{ color: stuck ? AMBER.text : "var(--sys-muted)" }}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">{nextStep(contact)}</span>
        </p>
        <div
          aria-hidden="true"
          className="mt-2 h-1 overflow-hidden rounded-full"
          style={{ backgroundColor: "rgba(20, 33, 61, 0.07)" }}
        >
          <div
            className="h-full w-full origin-left rounded-full"
            style={{
              backgroundColor: stuck ? "#F59E0B" : colour,
              transform: `scaleX(${stageProgress(contact.stage)})`,
            }}
          />
        </div>
      </div>

      {stuck ? (
        <div className="mt-3">
          {awaiting ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="text-xs font-semibold" style={{ color: AMBER.text }}>
                Awaiting your approval
              </span>
              <button
                type="button"
                onClick={() => openContact(contact.id)}
                className={`sys-crm-motion inline-flex min-h-11 items-center whitespace-nowrap rounded-[10px] px-1 text-sm font-semibold underline underline-offset-2 hover:opacity-80 ${FOCUS}`}
                style={{ color: AMBER.text }}
              >
                Review draft
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => chase(contact.id)}
              className={`sys-crm-motion inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-[12px] px-4 text-sm font-bold hover:opacity-90 active:scale-[0.98] ${FOCUS}`}
              style={{ backgroundColor: "#F59E0B", color: "#451A03" }}
            >
              Chase
            </button>
          )}
        </div>
      ) : null}

      <div className="mt-3 flex items-center">
        <button
          ref={moveBtn}
          type="button"
          data-move-btn={contact.id}
          aria-expanded={moving}
          aria-label={`Move ${contact.name} to another stage`}
          onClick={() => setMoving((v) => !v)}
          className={`sys-crm-motion inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[12px] px-4 text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] ${FOCUS}`}
          style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
        >
          <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
          Move
        </button>
      </div>

      {moving ? (
        <div
          className="sys-pop mt-2 flex flex-col gap-2 rounded-[12px] p-3"
          style={{
            backgroundColor: "rgba(20, 33, 61, 0.04)",
            border: "1px solid var(--sys-border)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              closeMenu();
            }
          }}
        >
          <label
            htmlFor={selectId}
            className="text-sm font-semibold"
            style={{ color: "var(--sys-navy)" }}
          >
            Move {contact.name} to
          </label>
          <select
            id={selectId}
            value={target}
            onChange={(e) => setTarget(e.target.value as StageId)}
            autoFocus
            className={`min-h-11 w-full min-w-0 rounded-[10px] bg-white px-2 text-sm ${FOCUS}`}
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          >
            {others.map((s) => (
              <option key={s.id} value={s.id}>
                {stageLabel(s.id, brief)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setMoving(false);
              onMove(contact.id, target);
            }}
            className={`sys-crm-motion inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-[12px] px-4 text-sm font-bold text-white hover:opacity-90 active:scale-[0.98] ${FOCUS}`}
            style={{ backgroundColor: "var(--sys-blue)" }}
          >
            Move now
          </button>
        </div>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Stage automations
// ---------------------------------------------------------------------------
function StageAutomations() {
  const { brief } = useBusinessBrief();
  const [active, setActive] = useState<StageId>("quote");
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});
  const def = stageById(active);

  function onKey(e: React.KeyboardEvent, i: number) {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % STAGES.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (i - 1 + STAGES.length) % STAGES.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = STAGES.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const id = STAGES[next]?.id;
    if (!id) return;
    setActive(id);
    tabs.current[id]?.focus();
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <IconTile icon={Workflow} color="var(--sys-blue)" />
        <div className="min-w-0 flex-1">
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
          >
            What happens at each stage
          </h3>
          <p className="text-sm" style={{ color: "var(--sys-body)" }}>
            Pick a stage to see what the system does for you, and when it stops.
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Pipeline stage"
        className="mt-4 flex gap-2 overflow-x-auto pb-1"
      >
        {STAGES.map((s, i) => {
          const on = s.id === active;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabs.current[s.id] = el;
              }}
              id={`tab-${s.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="stage-automation-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(s.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`sys-crm-motion min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold active:scale-[0.98] ${FOCUS}`}
              style={
                on
                  ? {
                      backgroundColor: STAGE_COLOURS[s.id],
                      color: "#fff",
                      border: "1px solid transparent",
                    }
                  : {
                      backgroundColor: "#fff",
                      color: "var(--sys-body)",
                      border: "1px solid var(--sys-border)",
                    }
              }
            >
              {stageLabel(s.id, brief)}
            </button>
          );
        })}
      </div>

      <div
        id="stage-automation-panel"
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        className="mt-4 grid min-w-0 gap-4 md:grid-cols-[1fr_1.4fr]"
      >
        <div className="min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--sys-muted)" }}
          >
            Trigger
          </p>
          <p className="mt-1 break-words text-sm" style={{ color: "var(--sys-navy)" }}>
            {def.automation.trigger}
          </p>
          <p
            className="mt-4 text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--sys-muted)" }}
          >
            What stops it
          </p>
          <p className="mt-1 break-words text-sm" style={{ color: "var(--sys-navy)" }}>
            {def.automation.stops}
          </p>
        </div>
        <div className="min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--sys-muted)" }}
          >
            Steps, in order
          </p>
          <ol className="mt-2 space-y-2">
            {def.automation.steps.map((step, i) => (
              <li key={step} className="flex min-w-0 items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: STAGE_COLOURS[active] }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 break-words text-sm" style={{ color: "var(--sys-body)" }}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const CLOSED: StageId[] = ["won", "lost"];
const HINT_STAGES: StageId[] = ["new", "contacted", "quote", "following"];

export function PipelineDemo() {
  const { brief } = useBusinessBrief();
  const { contacts, move, reset, atRisk } = useCrm();
  const reduced = useReducedMotion();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<StageId | null>(null);
  const [last, setLast] = useState<{ name: string; stage: StageId } | null>(null);
  const [movedId, setMovedId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [edges, setEdges] = useState({ left: false, right: true });
  const [activeIdx, setActiveIdx] = useState(0);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const boardWrap = useRef<HTMLDivElement>(null);
  const columns = useRef<Record<string, HTMLElement | null>>({});
  const cardEls = useRef(new Map<string, HTMLElement>());
  const flipFrom = useRef<Map<string, DOMRect> | null>(null);
  const interacted = useRef(false);
  const played = useRef(false);

  const active = brief !== null;

  const byStage = useMemo(() => {
    const map = new Map<StageId, Contact[]>();
    for (const s of STAGES) map.set(s.id, []);
    for (const c of contacts) map.get(c.stage)?.push(c);
    return map;
  }, [contacts]);

  const maxCount = useMemo(
    () => Math.max(1, ...STAGES.map((s) => byStage.get(s.id)?.length ?? 0)),
    [byStage],
  );

  const stats = useMemo(() => {
    const open = contacts.filter((c) => !CLOSED.includes(c.stage));
    const openValue = open.reduce((n, c) => n + c.value, 0);
    const won = contacts.filter((c) => c.stage === "won").length;
    const avg = open.length ? open.reduce((n, c) => n + c.daysInStage, 0) / open.length : 0;
    return { openValue, won, avg };
  }, [contacts]);

  const updateScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
    let best = 0;
    let bestDist = Infinity;
    STAGES.forEach((s, i) => {
      const col = columns.current[s.id];
      if (!col) return;
      const d = Math.abs(col.offsetLeft - el.scrollLeft);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setActiveIdx(best);
  }, []);

  useEffect(() => {
    updateScroll();
    window.addEventListener("resize", updateScroll);
    return () => window.removeEventListener("resize", updateScroll);
  }, [updateScroll]);

  useEffect(() => {
    if (!flashId) return;
    const t = window.setTimeout(() => setFlashId(null), 160);
    return () => window.clearTimeout(t);
  }, [flashId]);

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cardEls.current.set(id, el);
    else cardEls.current.delete(id);
  }, []);

  // FLIP: remember where every card is before a move, then animate from there.
  useIsoLayoutEffect(() => {
    const from = flipFrom.current;
    if (!from) return;
    flipFrom.current = null;
    cardEls.current.forEach((el, id) => {
      const a = from.get(id);
      if (!a || typeof el.animate !== "function") return;
      const b = el.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], {
        duration: FLIP_MS,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
    });
  }, [contacts]);

  const doMove = useCallback(
    (id: string, to: StageId, by: "drag" | "button") => {
      const c = contacts.find((x) => x.id === id);
      if (!c || c.stage === to) return;
      if (!reduced) {
        const snap = new Map<string, DOMRect>();
        cardEls.current.forEach((el, key) => snap.set(key, el.getBoundingClientRect()));
        flipFrom.current = snap;
      }
      move(id, to, by);
      setLast({ name: c.name, stage: to });
      setMovedId(by === "button" ? id : null);
      setFlashId(id);
    },
    [contacts, move, reduced],
  );

  const latest = useRef({ contacts, doMove });
  useEffect(() => {
    latest.current = { contacts, doMove };
  });

  // Idle nudge: once per visit, 8 seconds after the board scrolls into view.
  useEffect(() => {
    if (reduced) return;
    const node = boardWrap.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    try {
      if (window.sessionStorage.getItem(HINT_KEY)) return;
    } catch {
      // Storage blocked: still fine to run once per page load.
    }
    const timers: number[] = [];

    function run() {
      if (interacted.current || played.current || !node) return;
      const { contacts: list } = latest.current;
      const cands = list.filter((c) => !isStuck(c) && HINT_STAGES.includes(c.stage));
      const sr = scroller.current?.getBoundingClientRect();
      const inView = (id: string) => {
        const r = cardEls.current.get(id)?.getBoundingClientRect();
        return !!r && !!sr && r.left >= sr.left - 4 && r.right <= sr.right + 4;
      };
      const pick = cands.find((c) => inView(c.id)) ?? cands[0];
      if (!pick) return;
      const idx = STAGES.findIndex((s) => s.id === pick.stage);
      const to = STAGES[idx + 1]?.id;
      const rect = cardEls.current.get(pick.id)?.getBoundingClientRect();
      if (!to || !rect) return;
      const wr = node.getBoundingClientRect();
      setGhost({ x: rect.left - wr.left + rect.width * 0.5, y: rect.top - wr.top + 36 });
      timers.push(
        window.setTimeout(() => {
          if (interacted.current) {
            setGhost(null);
            return;
          }
          played.current = true;
          try {
            window.sessionStorage.setItem(HINT_KEY, "1");
          } catch {
            // Ignore blocked storage.
          }
          latest.current.doMove(pick.id, to, "drag");
          timers.push(window.setTimeout(() => setGhost(null), 1600));
        }, 1800),
      );
    }

    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      timers.push(window.setTimeout(run, 8000));
    });
    io.observe(node);
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [reduced]);

  function markInteracted() {
    if (interacted.current) return;
    interacted.current = true;
    setGhost(null);
  }

  function onDrop(e: React.DragEvent, stage: StageId) {
    e.preventDefault();
    const id = dragId ?? e.dataTransfer.getData("text/plain");
    setDragId(null);
    setOverStage(null);
    if (id) doMove(id, stage, "drag");
  }

  function onBoardDragOver(e: React.DragEvent) {
    if (dragId === null) return;
    const el = scroller.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const zone = 80;
    if (e.clientX < r.left + zone) el.scrollLeft -= 24;
    else if (e.clientX > r.right - zone) el.scrollLeft += 24;
  }

  function scrollToStage(id: StageId) {
    columns.current[id]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      inline: "start",
      block: "nearest",
    });
  }

  function scrollByPage(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
  }

  const arrowStyle = {
    backgroundColor: "#fff",
    border: "1px solid var(--sys-border)",
    boxShadow: "0 8px 22px rgba(20, 33, 61, 0.2)",
    color: "var(--sys-navy)",
  } as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3
          className="min-w-0 break-words text-2xl font-bold tracking-[-0.01em]"
          style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
        >
          {active ? "Your pipeline" : "Pipeline"}
        </h3>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: "rgba(20, 167, 154, 0.1)",
            border: "1px solid rgba(20, 167, 154, 0.2)",
            color: "var(--sys-teal)",
          }}
        >
          {active ? "Built from your business details" : EXAMPLE_LABEL}
        </span>
        <span
          className="min-w-0 break-words text-sm font-medium"
          style={{ color: "var(--sys-body)" }}
        >
          {businessName(brief)}
        </span>
      </div>

      {/* Summary: at risk strip plus stat tiles */}
      <div className="sys-stagger grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div
          className="flex min-w-0 items-center gap-3 rounded-[16px] px-4 py-3 md:col-span-2 lg:col-span-1"
          style={
            atRisk.count > 0
              ? {
                  backgroundColor: AMBER.bg,
                  border: `1px solid ${AMBER.border}`,
                  color: AMBER.text,
                }
              : {
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  color: "var(--sys-green-text)",
                }
          }
        >
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
          {atRisk.count > 0 ? (
            <p className="min-w-0 break-words text-sm">
              <span className="text-lg font-bold" style={{ fontFamily: HEADING_FONT }}>
                {formatMoney(atRisk.value)}
              </span>{" "}
              at risk. <strong>{atRisk.count}</strong> {atRisk.count === 1 ? "deal" : "deals"}{" "}
              waiting on a reply.
            </p>
          ) : (
            <p className="text-sm font-semibold">Nothing is stuck. Every deal is moving.</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 md:col-span-2 lg:col-span-3">
          <StatTile
            label="Open deals value"
            value={stats.openValue}
            format={(n) => formatMoney(Math.round(n))}
            reduced={reduced}
          />
          <StatTile
            label="Deals won this month"
            value={stats.won}
            format={(n) => String(Math.round(n))}
            reduced={reduced}
          />
          <StatTile
            label="Average days in stage"
            value={stats.avg}
            format={(n) => n.toFixed(1)}
            reduced={reduced}
          />
        </div>
      </div>

      {/* Board */}
      <div
        ref={boardWrap}
        className="relative"
        onPointerDownCapture={markInteracted}
        onKeyDownCapture={markInteracted}
        onDragStartCapture={markInteracted}
        onTouchStartCapture={markInteracted}
        onWheelCapture={markInteracted}
      >
        {/* Stage map */}
        <div
          role="group"
          aria-label="Stage map. Choose a stage to scroll to it."
          className="sticky top-2 z-20 mb-3 flex gap-2 overflow-x-auto rounded-[16px] p-2"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.94)",
            border: "1px solid var(--sys-border)",
            boxShadow: "var(--sys-card-shadow)",
          }}
        >
          {STAGES.map((s, i) => {
            const n = byStage.get(s.id)?.length ?? 0;
            const on = i === activeIdx;
            const label = stageLabel(s.id, brief);
            return (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to ${label}, ${n} ${n === 1 ? "deal" : "deals"}`}
                aria-current={on ? "true" : undefined}
                onClick={() => scrollToStage(s.id)}
                className={`sys-crm-motion flex min-h-11 min-w-[112px] flex-1 shrink-0 flex-col justify-center rounded-[12px] px-3 py-1.5 text-left active:scale-[0.98] ${FOCUS}`}
                style={{
                  backgroundColor: on ? "rgba(30, 136, 229, 0.08)" : "transparent",
                  border: `1px solid ${on ? "var(--sys-blue)" : "transparent"}`,
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: STAGE_COLOURS[s.id] }}
                  />
                  <span
                    className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                    style={{ color: "var(--sys-navy)" }}
                  >
                    {label}
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: "var(--sys-navy)" }}
                  >
                    {n}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1.5 block h-[3px] overflow-hidden rounded-full"
                  style={{ backgroundColor: "rgba(20, 33, 61, 0.08)" }}
                >
                  <span
                    className="block h-full w-full origin-left rounded-full"
                    style={{
                      backgroundColor: STAGE_COLOURS[s.id],
                      transform: `scaleX(${n / maxCount})`,
                      transition: reduced ? "none" : "transform 300ms ease",
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          {edges.left ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8"
              style={{ background: "linear-gradient(to right, #fff, rgba(255,255,255,0))" }}
            />
          ) : null}
          {edges.right ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
              style={{ background: "linear-gradient(to left, #fff, rgba(255,255,255,0))" }}
            />
          ) : null}
          {edges.left ? (
            <button
              type="button"
              aria-label="Scroll the board left"
              onClick={() => scrollByPage(-1)}
              className={`sys-crm-motion absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full hover:opacity-90 active:scale-95 sm:flex ${FOCUS}`}
              style={arrowStyle}
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
          ) : null}
          {edges.right ? (
            <button
              type="button"
              aria-label="Scroll the board right"
              onClick={() => scrollByPage(1)}
              className={`sys-crm-motion absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full hover:opacity-90 active:scale-95 sm:flex ${FOCUS}`}
              style={arrowStyle}
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          ) : null}

          <div
            ref={scroller}
            onScroll={updateScroll}
            onDragOver={onBoardDragOver}
            className={`relative flex gap-4 overflow-x-auto px-1 pb-4 pt-1 ${FOCUS}`}
            role="region"
            aria-label="Pipeline board, scrolls sideways"
            tabIndex={0}
            style={{
              scrollSnapType: dragId !== null ? "none" : "x mandatory",
              scrollPaddingInline: "4px",
            }}
          >
            {STAGES.map((s) => {
              const list = byStage.get(s.id) ?? [];
              const total = list.reduce((n, c) => n + c.value, 0);
              const over = overStage === s.id && dragId !== null;
              const label = stageLabel(s.id, brief);
              return (
                <section
                  key={s.id}
                  ref={(el) => {
                    columns.current[s.id] = el;
                  }}
                  role="group"
                  aria-label={`${label}, ${list.length} ${list.length === 1 ? "deal" : "deals"}, ${formatMoney(total)}`}
                  onDragOver={(e) => {
                    if (dragId === null) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (overStage !== s.id) setOverStage(s.id);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                      setOverStage(null);
                  }}
                  onDrop={(e) => onDrop(e, s.id)}
                  className="flex min-h-[320px] w-[85vw] min-w-0 shrink-0 snap-start flex-col rounded-[16px] p-3 sm:w-[290px]"
                  style={{
                    backgroundColor: over ? "rgba(30, 136, 229, 0.08)" : "rgba(20, 33, 61, 0.035)",
                    outline: over ? "2px solid var(--sys-blue)" : "2px solid transparent",
                    outlineOffset: "-2px",
                  }}
                >
                  <header className="px-1 pb-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: STAGE_COLOURS[s.id] }}
                      />
                      <h4
                        className="min-w-0 flex-1 truncate text-base font-bold"
                        title={label}
                        style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
                      >
                        {label}
                      </h4>
                      <span
                        key={list.length}
                        className={`inline-flex min-w-6 items-center justify-center rounded-full bg-white px-2 text-sm font-bold tabular-nums ${
                          reduced ? "" : "sys-pop"
                        }`}
                        style={{
                          border: "1px solid var(--sys-border)",
                          color: "var(--sys-navy)",
                        }}
                      >
                        {list.length}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 pl-[18px] text-sm font-medium tabular-nums"
                      style={{ color: "var(--sys-muted)" }}
                    >
                      {total > 0 ? formatMoney(total) : "No value yet"}
                    </p>
                  </header>
                  {over ? (
                    <p
                      className="mb-3 rounded-[10px] px-2 py-2 text-center text-sm font-bold"
                      style={{ backgroundColor: "var(--sys-blue)", color: "#fff" }}
                    >
                      Drop to move to {label}
                    </p>
                  ) : null}
                  <ul className="flex flex-1 flex-col gap-3">
                    {list.map((c) => (
                      <DealCard
                        key={c.id}
                        contact={c}
                        index={contacts.indexOf(c)}
                        isDragging={dragId === c.id}
                        onDragStart={setDragId}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverStage(null);
                        }}
                        onMove={(id, to) => doMove(id, to, "button")}
                        refocusKey={movedId === c.id ? 1 : 0}
                        flash={flashId === c.id}
                        reduced={reduced}
                        register={register}
                      />
                    ))}
                    {list.length === 0 ? (
                      <li
                        className="flex flex-1 items-center justify-center rounded-[16px] px-3 py-10 text-center text-sm"
                        style={{
                          border: "1px dashed var(--sys-border)",
                          color: "var(--sys-muted)",
                        }}
                      >
                        Drop a job here
                      </li>
                    ) : null}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        {ghost ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-30 flex items-start gap-1 sys-pop"
            style={{ left: ghost.x, top: ghost.y }}
          >
            <MousePointer2
              className="h-6 w-6 shrink-0"
              style={{ color: "var(--sys-navy)", fill: "#fff" }}
            />
            <span
              className="mt-4 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--sys-navy)", boxShadow: "var(--sys-card-shadow)" }}
            >
              Try dragging a card
            </span>
          </div>
        ) : null}
      </div>

      {/* What the system just did */}
      <div
        aria-live="polite"
        className="rounded-[16px] px-4 py-3"
        style={{
          backgroundColor: "#fff",
          border: "1px solid var(--sys-border)",
          boxShadow: "var(--sys-card-shadow)",
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: "var(--sys-muted)" }}
        >
          What the system just did
        </p>
        <p className="mt-1 break-words text-sm" style={{ color: "var(--sys-navy)" }}>
          {last
            ? `${last.name} moved to ${stageLabel(last.stage, brief)}. ${stageById(last.stage).systemNext}`
            : "Move a card to a new stage and the automatic steps appear here."}
        </p>
      </div>

      <StageAutomations />

      <section aria-labelledby="watch-a-day-run" className="space-y-3">
        <h3
          id="watch-a-day-run"
          className="text-2xl font-bold tracking-[-0.01em]"
          style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
        >
          Watch a day run
        </h3>
        <DayRun />
      </section>

      {/* Reset */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            reset();
            setLast(null);
            setMovedId(null);
            setFlashId(null);
          }}
          className={`sys-crm-motion inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold hover:bg-slate-50 ${FOCUS}`}
          style={{
            border: "1px solid var(--sys-border)",
            color: "var(--sys-navy)",
            backgroundColor: "#fff",
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset demo data
        </button>
        <p className="min-w-0 text-xs" style={{ color: "var(--sys-muted)" }}>
          Your changes are saved in this browser for 24 hours.
        </p>
      </div>
    </div>
  );
}
