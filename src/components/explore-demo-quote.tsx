import { useEffect, useId, useRef, useState } from "react";
import { Check, FileText, Plus, Send, Trash2 } from "lucide-react";
import { Card, IconTile } from "./explore-ui";
import { BUSINESS_NAME, EXAMPLE_LABEL, firstName, useCrm } from "./explore-crm-state";

// ---------------------------------------------------------------------------
// Quote builder demo: line items, optional upgrades, discount, GST, deposit and
// a live customer view with a simulated Accept. All data is fictional. Money is
// worked out in whole cents so totals always add up. Australian English.
// ---------------------------------------------------------------------------

const HEADING_FONT = "'Plus Jakarta Sans', sans-serif";
const FOCUS_RING = "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50";
const MOTION = "sys-crm-motion transition-[transform,opacity,background-color,border-color,color]";
const INPUT_CLASS = `${FOCUS_RING} mt-1 min-h-11 w-full min-w-0 rounded-[12px] bg-white px-3 text-sm`;
const INPUT_STYLE: React.CSSProperties = {
  border: "1px solid var(--sys-border)",
  color: "var(--sys-navy)",
};
const LABEL_CLASS = "block text-xs font-semibold";
const MAX_NUMBER = 1_000_000;
const FIRST_REF = 1050;
const GST_RATE_PERCENT = 10;
const DEPOSIT_PERCENT = 20;

interface Line {
  id: number;
  description: string;
  quantity: string;
  unit: string;
  price: string; // dollars ex GST, as typed
}

interface Upgrade {
  id: string;
  label: string;
  cents: number;
}

const UPGRADES: Upgrade[] = [
  { id: "priority", label: "Priority scheduling", cents: 18000 },
  { id: "cover", label: "Extended 12 month workmanship cover", cents: 25000 },
  { id: "cleanup", label: "Site clean-up and removal", cents: 15000 },
];

const INITIAL_LINES: Line[] = [
  {
    id: 1,
    description: "Labour (per hour)",
    quantity: "12",
    unit: "hours",
    price: "95.00",
  },
  {
    id: 2,
    description: "Materials and supplies",
    quantity: "1",
    unit: "lot",
    price: "640.00",
  },
  {
    id: 3,
    description: "Site visit and call-out fee",
    quantity: "1",
    unit: "job",
    price: "120.00",
  },
];

// Quick-add suggestions for the line items.
const SUGGESTIONS: Omit<Line, "id">[] = [
  { description: "Project management", quantity: "1", unit: "item", price: "200" },
  { description: "Travel", quantity: "1", unit: "trip", price: "60" },
  { description: "Permit and compliance fee", quantity: "1", unit: "item", price: "150" },
];

// Rises or falls to the new value over ~350ms. The last step is always the exact
// target, so the final figure equals the computed cents. Instant under reduced motion.
function useAnimatedNumber(target: number, ms = 350): number {
  const [value, setValue] = useState(target);
  const shown = useRef(target);
  useEffect(() => {
    const from = shown.current;
    if (from === target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      shown.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const v = p >= 1 ? target : Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      shown.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

// Slides or fades its children in when it mounts (only when `animate`). Starting
// classes are motion-safe, so reduced motion never hides anything.
function Enter({
  animate,
  from,
  className = "",
  children,
}: {
  animate: boolean;
  from: string;
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
      className={`sys-crm-motion motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-out ${on ? "" : from} ${className}`}
    >
      {children}
    </div>
  );
}

// A tick that draws itself in (a tiny stroke-offset animation).
function DrawCheck({ className = "" }: { className?: string }) {
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
      style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1 }}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
    </svg>
  );
}

// A customer-view row that flashes whenever its content changes (and when it appears
// after the page has loaded).
function PreviewRow({
  signature,
  late,
  children,
}: {
  signature: string;
  late: boolean;
  children: React.ReactNode;
}) {
  const [n, setN] = useState(late ? 1 : 0);
  const prev = useRef(signature);
  useEffect(() => {
    if (prev.current !== signature) {
      prev.current = signature;
      setN((x) => x + 1);
    }
  }, [signature]);
  return (
    <li>
      <div
        key={n}
        className={`sys-crm-motion flex items-start justify-between gap-3 rounded-[8px] py-2 ${n > 0 ? "sys-flash" : ""}`}
      >
        {children}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Maths (whole cents)
// ---------------------------------------------------------------------------
function parseNumber(s: string): number {
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_NUMBER);
}

// Accepts only digits and one decimal point, and clamps to the maximum.
function cleanNumberInput(raw: string, previous: string, decimals: number, max: number): string {
  if (raw === "") return "";
  const re = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
  if (!re.test(raw)) return previous;
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return raw === "." ? "0." : previous;
  return n > max ? String(max) : raw;
}

function lineCents(l: Line): number {
  return Math.round(parseNumber(l.quantity) * Math.round(parseNumber(l.price) * 100));
}

interface QuoteTotals {
  subtotal: number;
  discount: number;
  net: number;
  gst: number;
  total: number;
  deposit: number;
}

function computeTotals(lines: Line[], upgradeCents: number, discountPercent: number): QuoteTotals {
  const subtotal = lines.reduce((n, l) => n + lineCents(l), 0) + upgradeCents;
  const basisPoints = Math.round(Math.min(Math.max(discountPercent, 0), 50) * 100);
  const discount = Math.round((subtotal * basisPoints) / 10000);
  const net = subtotal - discount;
  const gst = Math.round((net * GST_RATE_PERCENT) / 100);
  const total = net + gst;
  const deposit = Math.round((total * DEPOSIT_PERCENT) / 100);
  return { subtotal, discount, net, gst, total, deposit };
}

const AUD = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
function money(cents: number): string {
  return AUD.format(cents / 100);
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
function PanelTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h4
      id={id}
      className="text-base font-bold tracking-[-0.01em]"
      style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
    >
      {children}
    </h4>
  );
}

// `shown` is the animating figure (hidden from screen readers); `cents` is the exact
// final value, which is what gets announced.
function TotalRow({
  label,
  shown,
  cents,
  negative = false,
  strong = false,
}: {
  label: string;
  shown: number;
  cents: number;
  negative?: boolean;
  strong?: boolean;
}) {
  const sign = negative ? "-" : "";
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt
        className={`min-w-0 break-words ${strong ? "text-base font-bold" : "text-sm"}`}
        style={{ color: strong ? "var(--sys-navy)" : "var(--sys-body)" }}
      >
        {label}
      </dt>
      <dd
        className={`shrink-0 tabular-nums ${strong ? "text-lg font-bold" : "text-sm font-semibold"}`}
        style={{ color: "var(--sys-navy)" }}
      >
        <span aria-hidden="true">
          {sign}
          {money(shown)}
        </span>
        <span className="sr-only">
          {sign}
          {money(cents)}
        </span>
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function QuoteDemo() {
  const { contacts, selected, select, sendQuote } = useCrm();
  const uid = useId();

  const [lines, setLines] = useState<Line[]>(INITIAL_LINES);
  const nextId = useRef(INITIAL_LINES.length + 1);
  const [picked, setPicked] = useState<string[]>([]);
  const [discount, setDiscount] = useState("");
  const [refCount, setRefCount] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [sent, setSent] = useState<{ contactId: string; name: string; ref: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [late, setLate] = useState(false);
  const [freshLines, setFreshLines] = useState<number[]>([]);
  const sendTimer = useRef(0);
  useEffect(() => {
    setLate(true);
    return () => window.clearTimeout(sendTimer.current);
  }, []);

  const ref = `Q-${FIRST_REF + refCount}`;
  const upgradeCents = UPGRADES.filter((u) => picked.includes(u.id)).reduce(
    (n, u) => n + u.cents,
    0,
  );
  const discountPercent = parseNumber(discount);
  const t = computeTotals(lines, upgradeCents, discountPercent);
  const chosenUpgrades = UPGRADES.filter((u) => picked.includes(u.id));
  const filledLines = lines.filter((l) => l.description.trim() || lineCents(l) > 0);
  const canSend = t.total > 0;
  const first = firstName(selected.name);

  const shownSubtotal = useAnimatedNumber(t.subtotal);
  const shownDiscount = useAnimatedNumber(t.discount);
  const shownGst = useAnimatedNumber(t.gst);
  const shownTotal = useAnimatedNumber(t.total);
  const shownDeposit = useAnimatedNumber(t.deposit);
  const totalRows = (
    <>
      <TotalRow label="Subtotal" shown={shownSubtotal} cents={t.subtotal} />
      {t.discount > 0 ? (
        <TotalRow
          label={`Discount (${discountPercent}%)`}
          shown={shownDiscount}
          cents={t.discount}
          negative
        />
      ) : null}
      <TotalRow label={`GST (${GST_RATE_PERCENT}%)`} shown={shownGst} cents={t.gst} />
      <TotalRow label="Total inc GST" shown={shownTotal} cents={t.total} strong />
      <TotalRow
        label={`Deposit to book (${DEPOSIT_PERCENT}%)`}
        shown={shownDeposit}
        cents={t.deposit}
      />
    </>
  );

  function patchLine(id: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLine(preset?: Omit<Line, "id">) {
    const id = nextId.current++;
    setLines((ls) => [
      ...ls,
      { id, description: "", quantity: "1", unit: "item", price: "", ...preset },
    ]);
    setFreshLines((f) => [...f, id]);
  }

  function toggleUpgrade(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function onSend() {
    if (!canSend || sending) return;
    const job = { id: selected.id, name: first, ref, total: t.total / 100 };
    setSending(true);
    sendTimer.current = window.setTimeout(() => {
      sendQuote(job.id, job.total, job.ref);
      setSent({ contactId: job.id, name: job.name, ref: job.ref });
      setRefCount((n) => n + 1);
      setAccepted(false);
      setSending(false);
    }, 400);
  }

  const sentHere = sent && sent.contactId === selected.id ? sent : null;
  const hintId = `${uid}-send-hint`;

  return (
    <div className="space-y-6">
      {/* Heading and picker */}
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3
            className="text-xl font-bold tracking-[-0.01em] sm:text-2xl"
            style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
          >
            Quote builder
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
          Build a quote for {BUSINESS_NAME}, watch the customer view update, then send it. The deal
          moves to Quote sent and the follow-up starts by itself.
        </p>
        <div className="mt-4 max-w-[360px]">
          <label
            htmlFor={`${uid}-for`}
            className="block text-sm font-semibold"
            style={{ color: "var(--sys-navy)" }}
          >
            Quote for
          </label>
          <select
            id={`${uid}-for`}
            value={selected.id}
            onChange={(e) => select(e.target.value)}
            className={`${FOCUS_RING} mt-1.5 min-h-11 w-full min-w-0 rounded-[12px] bg-white px-3 text-sm`}
            style={INPUT_STYLE}
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? `, ${c.company}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="min-w-0 space-y-5">
          <Card className="min-w-0 !p-5">
            <section aria-labelledby={`${uid}-lines`}>
              <div className="flex items-center gap-3">
                <IconTile icon={FileText} color="var(--sys-blue)" />
                <PanelTitle id={`${uid}-lines`}>Line items</PanelTitle>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--sys-muted)" }}>
                Prices are before GST.
              </p>
              <ul className="mt-3 space-y-3">
                {lines.map((l, i) => {
                  const name = l.description.trim() || `line ${i + 1}`;
                  return (
                    <li key={l.id}>
                      <Enter
                        animate={freshLines.includes(l.id)}
                        from="motion-safe:-translate-y-2 motion-safe:opacity-0"
                      >
                        <fieldset
                          className="min-w-0 rounded-[14px] p-3"
                          style={{
                            border: "1px solid var(--sys-border)",
                            backgroundColor: "#F9FAFC",
                          }}
                        >
                          <legend
                            className="px-1 text-xs font-bold"
                            style={{ color: "var(--sys-muted)" }}
                          >
                            Line {i + 1}
                          </legend>
                          <div className="min-w-0">
                            <label
                              htmlFor={`${uid}-d-${l.id}`}
                              className={LABEL_CLASS}
                              style={{ color: "var(--sys-navy)" }}
                            >
                              Description
                            </label>
                            <input
                              id={`${uid}-d-${l.id}`}
                              type="text"
                              value={l.description}
                              maxLength={80}
                              autoComplete="off"
                              onChange={(e) => patchLine(l.id, { description: e.target.value })}
                              className={INPUT_CLASS}
                              style={INPUT_STYLE}
                            />
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                            <div className="min-w-0">
                              <label
                                htmlFor={`${uid}-q-${l.id}`}
                                className={LABEL_CLASS}
                                style={{ color: "var(--sys-navy)" }}
                              >
                                Quantity
                              </label>
                              <input
                                id={`${uid}-q-${l.id}`}
                                type="text"
                                inputMode="decimal"
                                value={l.quantity}
                                autoComplete="off"
                                onChange={(e) =>
                                  patchLine(l.id, {
                                    quantity: cleanNumberInput(
                                      e.target.value,
                                      l.quantity,
                                      2,
                                      MAX_NUMBER,
                                    ),
                                  })
                                }
                                className={`${INPUT_CLASS} tabular-nums`}
                                style={INPUT_STYLE}
                              />
                            </div>
                            <div className="min-w-0">
                              <label
                                htmlFor={`${uid}-u-${l.id}`}
                                className={LABEL_CLASS}
                                style={{ color: "var(--sys-navy)" }}
                              >
                                Unit
                              </label>
                              <input
                                id={`${uid}-u-${l.id}`}
                                type="text"
                                value={l.unit}
                                maxLength={12}
                                autoComplete="off"
                                onChange={(e) => patchLine(l.id, { unit: e.target.value })}
                                className={INPUT_CLASS}
                                style={INPUT_STYLE}
                              />
                            </div>
                            <div className="col-span-2 min-w-0 sm:col-span-1">
                              <label
                                htmlFor={`${uid}-p-${l.id}`}
                                className={LABEL_CLASS}
                                style={{ color: "var(--sys-navy)" }}
                              >
                                Unit price ex GST ($)
                              </label>
                              <input
                                id={`${uid}-p-${l.id}`}
                                type="text"
                                inputMode="decimal"
                                value={l.price}
                                autoComplete="off"
                                onChange={(e) =>
                                  patchLine(l.id, {
                                    price: cleanNumberInput(e.target.value, l.price, 2, MAX_NUMBER),
                                  })
                                }
                                className={`${INPUT_CLASS} tabular-nums`}
                                style={INPUT_STYLE}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}
                              aria-label={`Remove ${name}`}
                              className={`${MOTION} ${FOCUS_RING} col-span-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-white px-3 text-sm font-semibold hover:bg-slate-50 sm:col-span-1`}
                              style={{
                                border: "1px solid var(--sys-border)",
                                color: "var(--sys-body)",
                              }}
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                              <span className="sm:sr-only">Remove</span>
                            </button>
                          </div>
                          <p
                            className="mt-2 text-right text-xs tabular-nums"
                            style={{ color: "var(--sys-muted)" }}
                          >
                            Line total {money(lineCents(l))}
                          </p>
                        </fieldset>
                      </Enter>
                    </li>
                  );
                })}
              </ul>
              {lines.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "var(--sys-muted)" }}>
                  No lines yet. Add one to start the quote.
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => addLine()}
                disabled={lines.length >= 20}
                className={`${MOTION} ${FOCUS_RING} mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60`}
                style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
              >
                <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                Add line
              </button>
              <div role="group" aria-label="Quick add a line" className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.description}
                    type="button"
                    onClick={() => addLine(s)}
                    disabled={lines.length >= 20}
                    className={`${MOTION} ${FOCUS_RING} inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold hover:-translate-y-px hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60`}
                    style={{ border: "1px solid var(--sys-border)", color: "var(--sys-body)" }}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                    <span className="min-w-0 break-words">{s.description}</span>
                  </button>
                ))}
              </div>
            </section>
          </Card>

          <Card className="min-w-0 !p-5">
            <fieldset className="min-w-0">
              <legend
                className="text-base font-bold tracking-[-0.01em]"
                style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
              >
                Optional upgrades
              </legend>
              <ul className="mt-3 space-y-2">
                {UPGRADES.map((u) => {
                  const id = `${uid}-up-${u.id}`;
                  return (
                    <li key={u.id}>
                      <label
                        htmlFor={id}
                        className={`${MOTION} flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] p-2.5 hover:-translate-y-px hover:bg-slate-50 hover:shadow-sm has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-blue-300/50`}
                        style={{ border: "1px solid var(--sys-border)" }}
                      >
                        <input
                          id={id}
                          type="checkbox"
                          checked={picked.includes(u.id)}
                          onChange={() => toggleUpgrade(u.id)}
                          className="h-5 w-5 shrink-0 cursor-pointer rounded accent-[#1E6FB8] focus:outline-none"
                        />
                        <span
                          className="min-w-0 flex-1 break-words text-sm font-semibold"
                          style={{ color: "var(--sys-navy)" }}
                        >
                          {u.label}
                        </span>
                        <span
                          className="shrink-0 text-sm tabular-nums"
                          style={{ color: "var(--sys-body)" }}
                        >
                          {money(u.cents)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </Card>

          <Card className="min-w-0 !p-5">
            <section aria-labelledby={`${uid}-totals`}>
              <PanelTitle id={`${uid}-totals`}>Totals</PanelTitle>
              <div className="mt-3 max-w-[200px]">
                <label
                  htmlFor={`${uid}-disc`}
                  className={LABEL_CLASS}
                  style={{ color: "var(--sys-navy)" }}
                >
                  Discount percent (0 to 50, optional)
                </label>
                <input
                  id={`${uid}-disc`}
                  type="text"
                  inputMode="decimal"
                  value={discount}
                  autoComplete="off"
                  onChange={(e) => setDiscount(cleanNumberInput(e.target.value, discount, 2, 50))}
                  className={`${INPUT_CLASS} tabular-nums`}
                  style={INPUT_STYLE}
                />
              </div>
              <dl
                className="mt-3 divide-y"
                aria-live="polite"
                style={{ borderColor: "var(--sys-border)" }}
              >
                {totalRows}
              </dl>
            </section>
          </Card>

          <div>
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend || sending}
              aria-busy={sending}
              aria-describedby={canSend ? undefined : hintId}
              className={`${MOTION} ${FOCUS_RING} inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold text-white hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto`}
              style={{
                background: "linear-gradient(to right, #1E6FB8, #174A78)",
                boxShadow: "0 6px 16px rgba(30, 111, 184, 0.28)",
              }}
            >
              <Send className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {sending ? "Sending..." : `Send quote to ${first}`}
            </button>
            {!canSend ? (
              <p id={hintId} className="mt-2 text-xs" style={{ color: "var(--sys-muted)" }}>
                Add a line with a price to send the quote.
              </p>
            ) : null}
            <div role="status" aria-live="polite">
              {sentHere ? (
                <Enter
                  key={sentHere.ref}
                  animate
                  from="motion-safe:translate-y-2 motion-safe:scale-95 motion-safe:opacity-0"
                  className="mt-3"
                >
                  <div
                    className="flex items-start gap-3 rounded-[14px] p-3.5 text-sm font-medium"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      color: "var(--sys-green-text)",
                    }}
                  >
                    <DrawCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="min-w-0 break-words">
                      Quote sent. {sentHere.name} moved to Quote sent. A follow-up starts in 3 days.
                      <span className="mt-1 block text-xs font-normal">
                        See it on the board: open the Pipeline tab. Nothing is really sent in this
                        demo.
                      </span>
                    </span>
                  </div>
                </Enter>
              ) : null}
            </div>
          </div>
        </div>

        {/* Customer view */}
        <div className="min-w-0">
          <p
            className="mb-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-muted)" }}
          >
            What your customer sees
          </p>
          <Card className="min-w-0 !p-5 lg:sticky lg:top-24">
            <section aria-label="Customer view of the quote">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className="break-words text-lg font-bold leading-tight"
                    style={{ color: "var(--sys-navy)", fontFamily: HEADING_FONT }}
                  >
                    {BUSINESS_NAME}
                  </p>
                  <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
                    Quote {ref}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ backgroundColor: "#EEF2F7", color: "var(--sys-body)" }}
                >
                  Valid for 14 days
                </span>
              </div>
              <p className="mt-3 break-words text-sm" style={{ color: "var(--sys-body)" }}>
                Prepared for{" "}
                <span className="font-semibold" style={{ color: "var(--sys-navy)" }}>
                  {selected.name}
                </span>
                {selected.company ? `, ${selected.company}` : ""}
              </p>

              <ul
                className="mt-3 divide-y"
                style={{
                  borderTop: "1px solid var(--sys-border)",
                  borderColor: "var(--sys-border)",
                }}
              >
                {filledLines.map((l) => (
                  <PreviewRow
                    key={l.id}
                    late={late}
                    signature={`${l.description}|${l.quantity}|${l.unit}|${l.price}`}
                  >
                    <span
                      className="min-w-0 break-words text-sm"
                      style={{ color: "var(--sys-navy)" }}
                    >
                      {l.description.trim() || "Item"}
                      <span className="block text-xs" style={{ color: "var(--sys-muted)" }}>
                        {parseNumber(l.quantity)} {l.unit.trim()} at{" "}
                        {money(Math.round(parseNumber(l.price) * 100))}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-sm font-semibold tabular-nums"
                      style={{ color: "var(--sys-navy)" }}
                    >
                      {money(lineCents(l))}
                    </span>
                  </PreviewRow>
                ))}
                {chosenUpgrades.map((u) => (
                  <PreviewRow key={u.id} late={late} signature={`${u.id}|${u.cents}`}>
                    <span
                      className="min-w-0 break-words text-sm"
                      style={{ color: "var(--sys-navy)" }}
                    >
                      {u.label}
                      <span className="block text-xs" style={{ color: "var(--sys-muted)" }}>
                        Upgrade
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-sm font-semibold tabular-nums"
                      style={{ color: "var(--sys-navy)" }}
                    >
                      {money(u.cents)}
                    </span>
                  </PreviewRow>
                ))}
                {filledLines.length === 0 && chosenUpgrades.length === 0 ? (
                  <li className="py-3 text-sm" style={{ color: "var(--sys-muted)" }}>
                    Nothing on the quote yet.
                  </li>
                ) : null}
              </ul>

              <dl
                className="mt-2 divide-y"
                aria-live="polite"
                style={{
                  borderTop: "1px solid var(--sys-border)",
                  borderColor: "var(--sys-border)",
                }}
              >
                {totalRows}
              </dl>

              <button
                type="button"
                onClick={() => setAccepted((a) => !a)}
                aria-pressed={accepted}
                disabled={!canSend}
                className={`${MOTION} ${FOCUS_RING} relative mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold text-white hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0`}
                style={{ background: "linear-gradient(to right, #1E6FB8, #174A78)" }}
              >
                <span
                  aria-hidden="true"
                  className={`sys-crm-motion pointer-events-none absolute inset-0 origin-left motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out ${
                    accepted ? "scale-x-100" : "scale-x-0"
                  }`}
                  style={{ background: "linear-gradient(to right, #10B981, #0E9F6E)" }}
                />
                <span className="relative inline-flex items-center gap-2">
                  {accepted ? (
                    <DrawCheck className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                  )}
                  {accepted ? "Quote accepted" : "Accept quote"}
                </span>
              </button>
              <p className="mt-2 text-xs" style={{ color: "var(--sys-muted)" }}>
                Accepting here is a simulation.
              </p>
              <div role="status" aria-live="polite">
                {accepted ? (
                  <Enter
                    animate
                    from="motion-safe:-translate-y-1 motion-safe:opacity-0"
                    className="mt-2"
                  >
                    <p
                      className="break-words rounded-[12px] p-3 text-sm font-semibold"
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        color: "var(--sys-green-text)",
                      }}
                    >
                      Thanks {first}. The {money(t.deposit)} deposit would book your job.
                    </p>
                  </Enter>
                ) : null}
              </div>
            </section>
          </Card>
        </div>
      </div>
    </div>
  );
}
