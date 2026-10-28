import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Reveal, usePrefersReducedMotion } from "./explore-motion";
import { Card, Pill } from "./explore-ui";

// ---------------------------------------------------------------------------
// OperationsRoom: a soft tilted floor (depth only, no text on it) with five
// upright standees that face the viewer. Three customer jobs run in parallel
// on one 18 second loop, so every station is busy every 6 seconds. A live
// feed is generated from the same timeline. All text is flat HTML at scale 1
// (active station 1.12, phone-size carousel 1.1 x 1.12 = 1.23 at most), never
// skewed or shrunk. Only transform and opacity animate. SSR-safe: nothing
// here touches window or document during render.
// ---------------------------------------------------------------------------

const STEP_MS = 3600; // 5 steps, 18 seconds per loop
const TRAVEL_MS = 1100;
const LOOP_MS = STEP_MS * 5;
const OFFS = [0, 6000, 12000]; // three jobs, staggered on the loop
const OW = 264; // object width
const OH = 300; // object height
const SLOT_H = 470; // leaves a free gutter between rows for connectors and nodes
const PAD_TOP = 72; // headroom for the active scale-up and float
const PAD_BOT = 64; // room for the name tags under the bottom ports
const BOX_H = OH + 80; // object, shadow, title chip and underline bar
const SLIDE = (OW - 24) / 2 + 8; // distance between the two board columns
const TRAIL_LAGS = [130, 260];
const FEED_ROWS = 6;

interface StationDef {
  accent: string;
  badge: string;
  glyph: GlyphKind;
  title: string;
  say: string;
  detail: string;
  result: string;
}

const STATIONS: StationDef[] = [
  {
    accent: "var(--sys-blue)",
    badge: "#3b82f6",
    glyph: "phone",
    title: "Inbox",
    say: "A customer texts at 8:02am",
    detail:
      "Calls, texts, emails and web forms all land in one shared inbox, so no enquiry is stuck on someone's personal phone.",
    result: "New enquiry logged, 8:02am",
  },
  {
    accent: "var(--sys-violet)",
    badge: "#7c3aed",
    glyph: "chat",
    title: "Instant reply",
    say: "An instant reply goes out in 12 seconds",
    detail:
      "The customer gets a friendly text straight away, even after hours, so they do not go and ring your competitor.",
    result: "Reply sent in 12 seconds",
  },
  {
    accent: "var(--sys-teal)",
    badge: "#0d9488",
    glyph: "board",
    title: "Pipeline board",
    say: "A card is created and a task assigned",
    detail:
      "The job appears as a card on your board and someone on the team is given the next task. Nothing relies on memory.",
    result: "Card created, task assigned",
  },
  {
    accent: "var(--sys-navy)",
    badge: "#475569",
    glyph: "doc",
    title: "Quote desk",
    say: "A quote is sent and the follow-up timer starts",
    detail:
      "The quote goes out from a template. If there is no reply, the system nudges the customer for you on a timer.",
    result: "Quote sent, follow-up in 3 days",
  },
  {
    accent: "var(--sys-green)",
    badge: "#16a34a",
    glyph: "calendar",
    title: "Calendar",
    say: "They book a time and a review request is queued",
    detail:
      "The customer picks a slot, it lands in the diary, and once the job is done a review request is sent automatically.",
    result: "Booked, review request queued",
  },
];

interface Customer {
  name: string;
  first: string;
  snip: string;
  time: string;
  color: string;
  items: [string, number][];
  slot: { c: number; r: number; label: string };
  times: string[];
}

const CUSTOMERS: Customer[] = [
  {
    name: "Priya N.",
    first: "Priya",
    snip: "Hi, can I get a quote for a kitchen renovation?",
    time: "8:02am",
    color: "#2563eb",
    items: [
      ["Strip out and prep", 1100],
      ["Cabinets and fit", 1300],
      ["Benchtop supply", 500],
    ],
    slot: { c: 1, r: 1, label: "Tue 10:00am" },
    times: ["8:02am", "8:02am", "8:03am", "10:30am", "4:10pm"],
  },
  {
    name: "Josh T.",
    first: "Josh",
    snip: "My gutters are overflowing, can you quote a clean?",
    time: "9:15am",
    color: "#0d9488",
    items: [
      ["Gutter clean", 600],
      ["Downpipe repair", 450],
      ["Leaf guards", 250],
    ],
    slot: { c: 2, r: 0, label: "Wed 9:00am" },
    times: ["9:15am", "9:15am", "9:16am", "11:40am", "3:00pm"],
  },
  {
    name: "Maria L.",
    first: "Maria",
    snip: "Hello, do you do bathroom retiling in Brunswick?",
    time: "12:40pm",
    color: "#db2777",
    items: [
      ["Remove old tiles", 1800],
      ["Waterproof and tile", 1500],
      ["Fixtures and trim", 700],
    ],
    slot: { c: 3, r: 2, label: "Thu 11:00am" },
    times: ["12:40pm", "12:40pm", "12:41pm", "2:05pm", "4:30pm"],
  },
];

const WITHOUT_SAY = "Enquiries wait until someone notices";
const WITHOUT_DETAIL =
  "Messages sit in different places. The first waits, then the next, and by the time anyone replies the customer has gone cold.";

const DESCRIPTION =
  "An illustration of five stations on a soft floor, joined by a glowing path, with three customer jobs moving through at once. A customer text arrives in the inbox, an instant reply goes out within twelve seconds, a card is created on the pipeline board with a task assigned, a quote is sent and a follow-up timer starts, and the customer books a site visit on the calendar and a review request is queued. A live activity feed lists events such as Priya N. sent a text, Reply sent in 12 seconds, Task: call Priya back, Quote Q-1050 sent, and Maria L. booked a site visit, with counters for enquiries today, replies sent, quotes out and booked. The example uses fictional data.";

function at(i: number): StationDef {
  return STATIONS[i] as StationDef;
}
function cust(i: number): Customer {
  return CUSTOMERS[i] as Customer;
}

function money(n: number) {
  return `$${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
function totals(c: Customer) {
  const sub = c.items.reduce((a, it) => a + it[1], 0);
  const gst = Math.round(sub * 0.1);
  return { gst, total: sub + gst };
}

// ---------------------------------------------------------------------------
// Layout (px, from the measured stage width). Text is never scaled to fit:
// columns change instead.
// ---------------------------------------------------------------------------

interface Pt {
  x: number;
  y: number;
}

interface Layout {
  mode: "wide" | "mid" | "stack" | "car";
  h: number;
  bs: number;
  slots: { fx: number; top: number }[];
}

function layoutFor(w: number, reduced: boolean): Layout {
  const mk = (fx: number[], tops: number[], mode: Layout["mode"], h: number, bs = 1): Layout => ({
    mode,
    h,
    bs,
    slots: fx.map((f, i) => ({ fx: f, top: tops[i] as number })),
  });
  const r0 = PAD_TOP;
  const r1 = r0 + SLOT_H;
  const r2 = r1 + SLOT_H;
  if (w >= 1040) {
    return mk([0.48, 0.8, 0.8, 0.5, 0.2], [r0, r0, r1, r1, r1], "wide", r1 + BOX_H + PAD_BOT);
  }
  if (w >= 760) {
    return mk([0.27, 0.73, 0.73, 0.27, 0.27], [r0, r0, r1, r1, r2], "mid", r2 + BOX_H + PAD_BOT);
  }
  if (reduced) {
    const tops = [0, 1, 2, 3, 4].map((i) => r0 + i * SLOT_H);
    return mk([0.5, 0.5, 0.5, 0.5, 0.5], tops, "stack", r0 + 4 * SLOT_H + BOX_H + PAD_BOT);
  }
  return mk([0.5, 0.5, 0.5, 0.5, 0.5], [60, 60, 60, 60, 60], "car", 570, w >= 420 ? 1.1 : 1);
}

// ---------------------------------------------------------------------------
// Connector route: orthogonal elbows with rounded corners that only run through
// the gutters (below each title chip, between rows and beside columns), ending
// at a port dot under each chip. The drawn path and the token positions both
// come from the same dense point list, so tokens follow the line exactly.
// ---------------------------------------------------------------------------

const PORT_DY = OH + 88; // port dot, 14px below the title chip underline
const LANE_DY = OH + 104; // horizontal lane in the gutter under a row
const GUTTER = 173; // vertical lane distance from a column centre

interface Leg {
  pts: Pt[];
  cum: number[];
  len: number;
}

interface Route {
  ports: Pt[];
  legs: Leg[];
  verts: Pt[][];
  d: string;
}

function roundPoly(input: Pt[], r: number): Pt[] {
  const v = input.filter(
    (p, k) => k === 0 || Math.hypot(p.x - input[k - 1]!.x, p.y - input[k - 1]!.y) > 0.5,
  );
  const out: Pt[] = [v[0] as Pt];
  for (let k = 1; k < v.length - 1; k++) {
    const a = v[k - 1] as Pt;
    const b = v[k] as Pt;
    const c = v[k + 1] as Pt;
    const lin = Math.hypot(b.x - a.x, b.y - a.y);
    const lout = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(r, lin / 2, lout / 2);
    const p1 = { x: b.x - ((b.x - a.x) / lin) * rr, y: b.y - ((b.y - a.y) / lin) * rr };
    const p2 = { x: b.x + ((c.x - b.x) / lout) * rr, y: b.y + ((c.y - b.y) / lout) * rr };
    out.push(p1);
    for (let s = 1; s < 6; s++) {
      const t = s / 6;
      const u = 1 - t;
      out.push({
        x: u * u * p1.x + 2 * u * t * b.x + t * t * p2.x,
        y: u * u * p1.y + 2 * u * t * b.y + t * t * p2.y,
      });
    }
    out.push(p2);
  }
  out.push(v[v.length - 1] as Pt);
  return out;
}

function buildRoute(lay: Layout, w: number): Route {
  const cx = (i: number) => (lay.slots[i] as { fx: number }).fx * w;
  const tp = (i: number) => (lay.slots[i] as { top: number }).top;
  const P = (i: number): Pt => ({ x: cx(i), y: tp(i) + PORT_DY });
  const L = (i: number) => tp(i) + LANE_DY;
  const ports = lay.slots.map((_, i) => P(i));
  const verts: Pt[][] = [];
  for (let a = 0; a < 4; a++) {
    const b = a + 1;
    if (tp(a) === tp(b)) {
      verts.push([P(a), { x: cx(a), y: L(a) }, { x: cx(b), y: L(a) }, P(b)]);
    } else {
      const xs = Math.max(14, Math.min(w - 14, cx(a) + (a % 2 === 1 ? 1 : -1) * GUTTER));
      verts.push([
        P(a),
        { x: cx(a), y: L(a) },
        { x: xs, y: L(a) },
        { x: xs, y: L(b) },
        { x: cx(b), y: L(b) },
        P(b),
      ]);
    }
  }
  const legs: Leg[] = verts.map((vs) => {
    const pts = roundPoly(vs, 12);
    const cum = [0];
    for (let k = 1; k < pts.length; k++) {
      const p = pts[k] as Pt;
      const q = pts[k - 1] as Pt;
      cum.push((cum[k - 1] as number) + Math.hypot(p.x - q.x, p.y - q.y));
    }
    return { pts, cum, len: cum[cum.length - 1] as number };
  });
  const d = legs
    .map((l) =>
      l.pts.map((p, k) => `${k === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(""),
    )
    .join("");
  return { ports, legs, verts, d };
}

function ease(p: number) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

function along(leg: Leg, dist: number): Pt {
  let k = 1;
  while (k < leg.cum.length - 1 && (leg.cum[k] as number) < dist) k++;
  const c0 = leg.cum[k - 1] as number;
  const c1 = leg.cum[k] as number;
  const f = c1 > c0 ? (dist - c0) / (c1 - c0) : 0;
  const a = leg.pts[k - 1] as Pt;
  const b = leg.pts[k] as Pt;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

function posAt(t: number, rt: Route): Pt {
  const c = Math.max(0, Math.min(LOOP_MS - 1, t));
  const i = Math.floor(c / STEP_MS);
  const local = c - i * STEP_MS;
  const s = rt.ports[i] as Pt;
  if (i === 0 || local >= TRAVEL_MS) return s;
  const leg = rt.legs[i - 1] as Leg;
  return along(leg, ease(local / TRAVEL_MS) * leg.len);
}

function stepAt(t: number) {
  const c = Math.max(0, Math.min(LOOP_MS - 1, t));
  const i = Math.floor(c / STEP_MS);
  const local = c - i * STEP_MS;
  return i > 0 && local < TRAVEL_MS * 0.9 ? i - 1 : i;
}

const jobT = (t: number, j: number) => (t + (OFFS[j] as number)) % LOOP_MS;

// ---------------------------------------------------------------------------
// Live feed model
// ---------------------------------------------------------------------------

type GlyphKind =
  | "phone"
  | "chat"
  | "board"
  | "doc"
  | "calendar"
  | "check"
  | "clock"
  | "bell"
  | "mail"
  | "star"
  | "bolt";

interface FeedEvent {
  id: number;
  time: string;
  text: string;
  kind: GlyphKind;
  amber?: boolean;
}

const SEED_FEED: FeedEvent[] = [
  { id: -1, time: "4:10pm", text: "Maria L. booked a site visit", kind: "calendar" },
  { id: -2, time: "3:00pm", text: "Follow-up drafted for Josh T.", kind: "bell" },
  { id: -3, time: "10:30am", text: "Quote Q-1050 sent, $3,190", kind: "doc" },
  { id: -4, time: "8:03am", text: "Task: call Priya back", kind: "check" },
  { id: -5, time: "8:02am", text: "Reply sent in 12 seconds", kind: "bolt" },
  { id: -6, time: "8:02am", text: "Priya N. sent a text", kind: "chat" },
];

const WITHOUT_FEED: FeedEvent[] = [
  { id: -11, time: "4:12am", text: "No reply yet, waiting 4h", kind: "clock", amber: true },
  { id: -12, time: "4:12am", text: "Aisha K. sent a text", kind: "chat" },
  { id: -13, time: "5:30am", text: "No reply yet, waiting 3h", kind: "clock", amber: true },
  { id: -14, time: "5:30am", text: "Marco L. sent a text", kind: "chat" },
  { id: -15, time: "6:58am", text: "No reply yet, waiting 2h", kind: "clock", amber: true },
  { id: -16, time: "6:58am", text: "Web form: gutter clean quote", kind: "mail" },
];

// Background "action nodes": a pool of 8 pills that drift near busy stations.
const NODE_POOL = 8;
const NODE_TEXT: [string, string][][] = [
  [
    ["Owner notified", "#f59e0b"],
    ["Contact saved", "#0ea5e9"],
  ],
  [
    ["Text sent", "#7c3aed"],
    ["Reminder set", "#0ea5e9"],
  ],
  [
    ["Task created", "#0d9488"],
    ["Team alerted", "#f59e0b"],
  ],
  [
    ["Invoice drafted", "#475569"],
    ["Quote opened", "#2563eb"],
    ["Follow-up queued", "#0ea5e9"],
  ],
  [
    ["Review requested", "#f59e0b"],
    ["Reminder set", "#0ea5e9"],
    ["Calendar synced", "#16a34a"],
  ],
];

interface AmbNode {
  st: number;
  i: number;
  k: number;
  x: number;
  y: number;
}

interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

// Forbidden rectangles: every standee (16px clearance, lift and scale) and the feed panel.
function blockers(lay: Layout, w: number): Rect[] {
  const r = lay.slots.map((s) => {
    const cx = s.fx * w;
    const hw = (OW / 2) * 1.05 + 16;
    return { x0: cx - hw, x1: cx + hw, y0: s.top - 24, y1: s.top + BOX_H + 16 };
  });
  if (lay.mode === "wide") r.push({ x0: 0, x1: 340, y0: 0, y1: 366 });
  const rt = buildRoute(lay, w);
  for (const vs of rt.verts) {
    for (let k = 1; k < vs.length; k++) {
      const a = vs[k - 1] as Pt;
      const b = vs[k] as Pt;
      r.push({
        x0: Math.min(a.x, b.x) - 16,
        x1: Math.max(a.x, b.x) + 16,
        y0: Math.min(a.y, b.y) - 16,
        y1: Math.max(a.y, b.y) + 16,
      });
    }
  }
  // Name tags hang under the ports
  for (const p of rt.ports) r.push({ x0: p.x - 70, x1: p.x + 70, y0: p.y - 16, y1: p.y + 40 });
  return r;
}

// Nearest free spot (in a gutter or margin) to a station, for a pill with this label.
function pickSpot(
  st: number,
  label: string,
  lay: Layout,
  w: number,
  rank: number,
  taken: Pt[],
): Pt | null {
  const pw = label.length * 7.6 + 40;
  const bl = blockers(lay, w);
  const slot = lay.slots[st] as { fx: number; top: number };
  const cx = slot.fx * w;
  const cy = slot.top + OH / 2;
  const out: { x: number; y: number; d: number }[] = [];
  for (let y = 30; y <= lay.h - 30; y += 14) {
    for (let x = pw / 2 + 24; x <= w - pw / 2 - 24; x += 20) {
      const x0 = x - pw / 2;
      const x1 = x + pw / 2;
      const y0 = y - 14;
      const y1 = y + 14;
      if (bl.some((b) => x0 < b.x1 && x1 > b.x0 && y0 < b.y1 && y1 > b.y0)) continue;
      if (taken.some((t) => Math.abs(t.x - x) < pw + 12 && Math.abs(t.y - y) < 36)) continue;
      out.push({ x, y, d: Math.hypot(x - cx, y - cy) });
    }
  }
  out.sort((a, b) => a.d - b.d);
  return out.length ? (out[Math.min(rank, out.length - 1)] as Pt) : null;
}

const STATIC_SPEC: [number, number][] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 1],
  [4, 0],
  [2, 1],
];

function buildNodes(lay: Layout, w: number): (AmbNode | null)[] {
  const taken: Pt[] = [];
  const res: (AmbNode | null)[] = STATIC_SPEC.map(([st, i]) => {
    const label = (NODE_TEXT[st] as [string, string][])[i]?.[0] ?? "";
    const p = pickSpot(st, label, lay, w, 0, taken);
    if (!p) return null;
    taken.push(p);
    return { st, i, k: 0, x: p.x, y: p.y };
  });
  while (res.length < NODE_POOL) res.push(null);
  return res;
}

const COUNTER_LABELS = ["Enquiries today", "Replies sent", "Quotes out", "Booked"];
const COUNTER_OF = [0, 1, -1, 2, 3];
const COUNTS_START = [12, 12, 7, 4];
const COUNTS_WITHOUT = [5, 0, 0, 0];

function makeEvent(st: number, j: number, id: number): FeedEvent {
  const c = cust(j);
  const time = c.times[st] as string;
  switch (st) {
    case 0:
      return { id, time, text: `${c.name} sent a text`, kind: "chat" };
    case 1:
      return { id, time, text: "Reply sent in 12 seconds", kind: "bolt" };
    case 2:
      return { id, time, text: `Task: call ${c.first} back`, kind: "check" };
    case 3:
      return { id, time, text: `Quote Q-${1050 + j} sent, ${money(totals(c).total)}`, kind: "doc" };
    default:
      return { id, time, text: `${c.name} booked a site visit`, kind: "calendar" };
  }
}

// ---------------------------------------------------------------------------
// 3D raised badges (inline SVG glyphs filled with a shared gradient)
// ---------------------------------------------------------------------------

const GLYPHS: Record<GlyphKind, string> = {
  phone:
    "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  chat: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  board: "M3 4h5.5v16H3zM9.75 4h4.5v10h-4.5zM15.5 4H21v13h-5.5z",
  doc: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  calendar:
    "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h4v4H7z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  clock:
    "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z",
  bell: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
  mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  bolt: "M7 2v11h3v9l7-12h-4l4-8z",
};

function Badge({ k, c, z = 28 }: { k: GlyphKind; c: string; z?: number }) {
  return (
    <span
      className="rm-bd"
      aria-hidden="true"
      style={{ ["--bc" as string]: c, ["--bz" as string]: `${z}px` }}
    >
      <svg viewBox="0 0 24 24">
        <path d={GLYPHS[k]} fill="url(#rm-gl)" />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const EX = Array.from(
  { length: 10 },
  (_, k) => `${k + 1}px ${k + 1}px 0 hsl(228 28% ${84 - k * 3.2}%)`,
).join(",");
const EXD = Array.from(
  { length: 10 },
  (_, k) => `${k + 1}px ${k + 1}px 0 hsl(222 30% ${20 - k * 1.2}%)`,
).join(",");
const BDX = (n: number) =>
  Array.from(
    { length: n },
    (_, k) => `0 ${k + 1}px 0 color-mix(in srgb,var(--bc) ${70 - k * 6}%,#000)`,
  ).join(",");

const CSS = `
.rm-root{font-family:'Plus Jakarta Sans',sans-serif}
.rm-room{position:relative;width:100%;max-width:1280px;min-height:560px;margin:0 auto;border-radius:24px;
  background:radial-gradient(120% 90% at 50% 30%,#fff 0%,#eef1fb 55%,#e3e8f7 100%);border:1px solid var(--sys-border);box-shadow:var(--sys-card-shadow);touch-action:pan-y}
.rm-tilt{position:relative;width:100%;transform-style:preserve-3d;transform:perspective(1400px)}
.rm-floorw{position:absolute;inset:0;perspective:1200px;overflow:hidden;border-radius:24px}
.rm-floor{position:absolute;left:-12%;right:-12%;top:-30%;bottom:-8%;transform-origin:50% 100%;transform:rotateX(55deg);
  background-image:linear-gradient(rgba(79,70,229,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,.1) 1px,transparent 1px),linear-gradient(180deg,#f4f6fe,#e1e7f8);
  background-size:48px 48px,48px 48px,100% 100%;-webkit-mask-image:linear-gradient(to top,#000 40%,transparent);mask-image:linear-gradient(to top,#000 40%,transparent)}
.rm-path{position:absolute;left:0;top:0;width:100%;pointer-events:none;transform:translateZ(4px)}
.rm-amb{position:absolute;inset:0;pointer-events:none;transform:translateZ(8px);transition:opacity .3s}
.rm-amb[data-off=true]{opacity:0}
.rm-links{position:absolute;left:0;top:0;pointer-events:none}
.rm-ln{stroke:var(--sys-violet);stroke-width:2;stroke-linecap:round;stroke-dasharray:2 7;opacity:.45;animation:rm-lnk 6s linear both,rm-dash 1s linear infinite}
.rm-an{position:absolute;width:0;height:0;pointer-events:none}
.rm-ai{position:absolute;left:0;top:-14px;display:flex;align-items:center;gap:6px;white-space:nowrap;padding:4px 12px 4px 6px;border-radius:99px;font:600 13px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--sys-body);
  background:linear-gradient(180deg,rgba(255,255,255,.85),rgba(238,241,251,.7));box-shadow:inset 0 1px 0 #fff,0 2px 0 rgba(180,190,215,.7),0 6px 8px rgba(20,33,61,.1);opacity:.7;transform:translateX(-50%);animation:rm-node 6s ease-in-out both}
.rm-ai i{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#fff 0 12%,var(--bc) 45%,color-mix(in srgb,var(--bc) 70%,#000));box-shadow:0 2px 0 color-mix(in srgb,var(--bc) 60%,#000)}
.rm-tok{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none}
.rm-orb{position:absolute;left:-10px;top:-10px;width:20px;height:20px;border-radius:50%;
  background:radial-gradient(circle at 32% 26%,#fff 0 9%,color-mix(in srgb,var(--jc) 55%,#fff) 24%,var(--jc) 58%,color-mix(in srgb,var(--jc) 65%,#000) 100%);
  box-shadow:inset -2px -3px 4px rgba(0,0,0,.28),0 3px 5px rgba(20,33,61,.3),0 0 14px 3px color-mix(in srgb,var(--jc) 45%,transparent)}
.rm-halo{position:absolute;left:-24px;top:-24px;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--jc) 45%,transparent),transparent 70%)}
.rm-trail{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;background:var(--jc)}
.rm-toks{position:absolute;inset:0;pointer-events:none;transform:translateZ(90px)}
.rm-dash{animation:rm-flow 1.2s linear infinite}
.rm-jt{position:absolute;left:0;top:20px;transform:translateX(-50%);white-space:nowrap;padding:1px 9px;border-radius:99px;background:var(--jc);color:#fff;font:700 13px/1.45 'Plus Jakarta Sans',sans-serif;box-shadow:0 2px 0 color-mix(in srgb,var(--jc) 60%,#000),0 4px 6px rgba(20,33,61,.25)}
.rm-jt::before{content:"";position:absolute;left:50%;top:-5px;margin-left:-5px;border:5px solid transparent;border-top:0;border-bottom-color:var(--jc)}
.rm-pulse{position:absolute;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;pointer-events:none;border:3px solid var(--sys-violet);animation:rm-pulse .9s ease-out both}
.rm-still{animation:rm-fade .25s ease-out both}
.rm-st{position:absolute;width:${OW}px;height:${BOX_H}px;cursor:pointer;outline:none;border-radius:28px;-webkit-tap-highlight-color:transparent;
  transform-origin:50% 80%;transform:translateZ(28px) scale(var(--bs,1));opacity:.85;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .3s}
.rm-st[data-on=true]{opacity:1;transform:translateZ(60px) translateY(-8px) scale(calc(var(--bs,1) * 1.05))}
.rm-st[data-dim=true]{opacity:.35}
.rm-st[data-hide=true]{visibility:hidden;opacity:0;pointer-events:none}
.rm-st:focus-visible{outline:3px solid var(--sys-blue);outline-offset:4px}
.rm-glow{position:absolute;left:14px;top:14px;width:${OW - 28}px;height:${OH - 28}px;border-radius:30px;background:var(--ac);filter:blur(22px);opacity:0;transition:opacity .35s}
.rm-st[data-on=true] .rm-glow{opacity:.5}
.rm-ul{position:absolute;left:50%;top:${OH + 70}px;width:56px;height:4px;margin-left:-28px;border-radius:4px;background:var(--ac);opacity:0;transition:opacity .35s}
.rm-st[data-on=true] .rm-ul{opacity:1}
.rm-sh{position:absolute;left:6px;right:-6px;top:${OH - 10}px;height:30px;border-radius:50%;background:radial-gradient(closest-side,rgba(20,33,61,.34),transparent)}
.rm-sh2{position:absolute;left:30px;right:20px;top:${OH - 2}px;height:12px;border-radius:50%;background:radial-gradient(closest-side,rgba(20,33,61,.5),transparent)}
.rm-float{position:absolute;left:0;top:0;width:${OW}px;height:${OH}px;animation:rm-float 6s ease-in-out infinite;animation-delay:var(--fd,0s)}
.rm-obj{position:relative;width:100%;height:100%;color:var(--sys-navy);font:500 13px/1.25 'Plus Jakarta Sans',sans-serif}
.rm-tt{position:absolute;left:50%;top:${OH + 30}px;transform:translateX(-50%);white-space:nowrap;display:flex;align-items:center;gap:8px;padding:5px 16px 5px 6px;border-radius:99px;background:#fff;border:1px solid var(--sys-border);
  box-shadow:0 3px 0 #d5dbee,0 8px 12px rgba(20,33,61,.14);font:600 15px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--sys-navy)}

.rm-bd{position:relative;flex:none;display:inline-grid;place-items:center;width:var(--bz,28px);height:var(--bz,28px);border-radius:30%;color:#fff;font:700 13px/1 'Plus Jakarta Sans',sans-serif;
  background:linear-gradient(145deg,color-mix(in srgb,var(--bc) 62%,#fff),var(--bc) 55%,color-mix(in srgb,var(--bc) 78%,#000));
  box-shadow:inset 0 1.5px 0 rgba(255,255,255,.7),inset 0 -2px 3px rgba(0,0,0,.2),${BDX(4)},0 7px 7px rgba(20,33,61,.28);margin-bottom:4px}
.rm-bd::before{content:"";position:absolute;left:12%;right:12%;top:5%;height:38%;border-radius:40% 40% 60% 60%;background:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0))}
.rm-bd svg{position:relative;width:58%;height:58%;filter:drop-shadow(0 1.5px 0 rgba(0,0,0,.3))}
.rm-bd[data-round=true]{border-radius:50%}

.rm-card{position:absolute;inset:0;display:flex;flex-direction:column;border-radius:22px;background:linear-gradient(160deg,#fff,#f6f8fe);border:1px solid rgba(255,255,255,.9);
  box-shadow:inset 0 2px 0 #fff,${EX},12px 22px 24px rgba(20,33,61,.22),3px 6px 8px rgba(20,33,61,.14);overflow:hidden}
.rm-card{overflow:hidden}
.rm-bar{display:flex;align-items:center;gap:6px;padding:0 12px;height:36px;flex:none;background:linear-gradient(180deg,#f7f9fe,#e9edf8);border-bottom:1px solid rgba(20,33,61,.1);font-weight:700;font-size:14px}
.rm-bar i{width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#aab4cc)}
.rm-gloss{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit}
.rm-gloss::before{content:"";position:absolute;top:0;bottom:0;left:-60%;width:60%;background:linear-gradient(105deg,transparent,rgba(255,255,255,.42),transparent);animation:rm-sweep 7s ease-in-out infinite;animation-delay:var(--fd,0s)}
.rm-gloss::after{content:"";position:absolute;left:0;right:0;top:0;height:40%;background:linear-gradient(180deg,rgba(255,255,255,.3),transparent)}
.rm-pop{animation:rm-pop .45s cubic-bezier(.3,1.5,.5,1) var(--d,0s) both}
.rm-in{animation:rm-in .5s cubic-bezier(.2,.8,.2,1) var(--d,0s) both}

.rm-phone{position:absolute;left:12px;top:0;width:${OW - 24}px;height:${OH}px;border-radius:34px;background:linear-gradient(160deg,#334155,#0f172a);padding:8px;
  box-shadow:inset 0 2px 0 rgba(255,255,255,.25),${EXD},12px 22px 24px rgba(20,33,61,.3),3px 6px 8px rgba(20,33,61,.2);animation:rm-buzz .5s linear 1.1s both}
.rm-notch{position:absolute;left:50%;top:13px;width:64px;height:15px;margin-left:-32px;border-radius:99px;background:#0b1220;z-index:2;box-shadow:inset 0 1px 2px rgba(255,255,255,.2)}
.rm-scr{position:relative;height:100%;border-radius:27px;background:#fff;overflow:hidden;padding:32px 8px 0}
.rm-hd{display:flex;align-items:center;justify-content:space-between;height:26px;padding:0 2px;font-size:15px;font-weight:700}
.rm-new{padding:1px 8px;border-radius:99px;background:var(--sys-blue);color:#fff;font-size:13px;font-weight:600}
.rm-row{position:relative;display:flex;gap:7px;height:72px;padding:6px 4px;border-bottom:1px solid rgba(20,33,61,.07);overflow:hidden}
.rm-row[data-c=true]{height:40px;padding:3px 4px;align-items:center;background:#f1f5f9}
.rm-row .rm-bd{margin-top:2px}
.rm-row[data-c=true] .rm-bd{margin-top:0;filter:grayscale(1)}
.rm-rt{flex:1;min-width:0}
.rm-rn{display:flex;justify-content:space-between;gap:4px;font-weight:700;color:var(--sys-navy)}
.rm-rn span{font-weight:500;color:var(--sys-muted)}
.rm-rs{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;color:var(--sys-body)}
.rm-row[data-c=true] .rm-rs{display:block;white-space:nowrap}
.rm-amber{position:absolute;inset:0;background:#fde68a;opacity:0;animation:rm-amber 6s linear var(--d,0s) both}
.rm-badge{position:absolute;right:-8px;top:-12px;z-index:3;padding:3px 10px;border-radius:99px;background:#dc2626;color:#fff;font:700 13px/1.3 'Plus Jakarta Sans',sans-serif;box-shadow:0 3px 0 #991b1b,0 6px 10px rgba(220,38,38,.4)}

.rm-ch{display:flex;align-items:center;gap:8px;height:50px;flex:none;padding:0 12px;border-bottom:1px solid rgba(20,33,61,.08)}
.rm-cb{display:flex;flex-direction:column;gap:9px;flex:1;padding:12px 12px 14px}
.rm-b1{align-self:flex-start;max-width:90%;padding:8px 11px;border-radius:14px 14px 14px 4px;background:#eef1fb;font-size:14px;line-height:1.3;color:var(--sys-navy);box-shadow:0 2px 0 #d5dbee}
.rm-slot{position:relative;align-self:flex-end;max-width:92%}
.rm-b2{padding:8px 11px;border-radius:14px 14px 4px 14px;color:#fff;font-size:14px;font-weight:600;line-height:1.3;background:linear-gradient(135deg,var(--sys-violet),var(--sys-blue));transform-origin:100% 100%;box-shadow:0 3px 0 #4c1d95}
.rm-ty{position:absolute;right:0;top:0;display:flex;gap:5px;padding:12px 14px;border-radius:14px 14px 4px 14px;background:#e5e9f6;opacity:0;animation:rm-type 1.6s linear .5s both}
.rm-ty i{width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--sys-muted));animation:rm-dot .6s ease-in-out .5s 3}
.rm-ty i:nth-child(2){animation-delay:.65s}
.rm-ty i:nth-child(3){animation-delay:.8s}
.rm-tick{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;margin-top:auto;padding:3px 12px 3px 4px;border-radius:99px;background:#dcfce7;color:#166534;font-size:13px;font-weight:600;box-shadow:0 2px 0 #a7d9b5}

.rm-lanes{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px;padding:8px}
.rm-lane{position:relative;border-radius:10px;background:#eef1fb;box-shadow:inset 0 2px 3px rgba(20,33,61,.1);padding:5px;display:flex;flex-direction:column;gap:4px}
.rm-lh{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:700;color:var(--sys-navy)}
.rm-cnt{display:grid;place-items:center;min-width:20px;height:20px;border-radius:99px;background:var(--ac);color:#fff;font-size:13px;font-weight:700;animation:rm-bump .6s cubic-bezier(.3,1.5,.5,1) 1.5s both;box-shadow:0 2px 0 rgba(0,0,0,.2)}
.rm-pc{height:40px;padding:3px 6px;border-radius:7px;background:#fff;border-left:4px solid var(--ac);box-shadow:0 2px 0 #d5dbee,0 4px 6px rgba(20,33,61,.12);font-size:13px;line-height:16px;font-weight:600;color:var(--sys-navy)}
.rm-pc span{display:block;font-weight:500;color:var(--sys-body)}
.rm-pc[data-hot=true]{background:#f5f3ff;animation:rm-slide 1s cubic-bezier(.5,0,.2,1) .7s both}
.rm-sp{height:40px}

.rm-sheet{position:absolute;left:0;top:0;width:100%;height:${OH - 40}px;padding:14px 16px;border-radius:12px;background:linear-gradient(160deg,#fff,#f7f8fd);border:1px solid rgba(20,33,61,.1);
  box-shadow:inset 0 2px 0 #fff,${EX},12px 22px 24px rgba(20,33,61,.2),3px 6px 8px rgba(20,33,61,.14)}
.rm-sh1{display:flex;flex-direction:column;gap:1px;font-size:16px;font-weight:700;white-space:nowrap;padding-bottom:8px;border-bottom:2px solid var(--sys-navy)}
.rm-sh1 span{font-size:13px;font-weight:500;color:var(--sys-body)}
.rm-li{display:flex;justify-content:space-between;gap:6px;padding:6px 0;font-size:13px;border-bottom:1px dashed rgba(20,33,61,.15)}
.rm-li b{font-weight:600}
.rm-tot{display:flex;justify-content:space-between;padding-top:8px;font-size:16px;font-weight:800}
.rm-stamp{position:absolute;right:14px;top:14px;padding:1px 10px;border:3px solid var(--sys-green);border-radius:6px;color:var(--sys-green);font-size:18px;font-weight:800;letter-spacing:.08em;transform:rotate(-12deg);background:rgba(255,255,255,.7);animation:rm-stamp .7s cubic-bezier(.3,1.2,.4,1) .5s both}
.rm-timer{position:absolute;left:0;bottom:0;display:inline-flex;align-items:center;gap:8px;padding:4px 14px 4px 4px;border-radius:99px;background:var(--sys-navy);color:#fff;font-size:13px;font-weight:600;box-shadow:0 3px 0 #0b1222,0 8px 10px rgba(20,33,61,.25)}

.rm-cal{padding:12px;gap:8px;justify-content:space-between}
.rm-gr{display:grid;grid-template-columns:36px repeat(5,1fr);gap:4px;align-items:center}
.rm-gr span{font-size:13px;font-weight:600;color:var(--sys-muted);text-align:center}
.rm-cell{position:relative;height:34px;border-radius:6px;background:#eef1fb;box-shadow:inset 0 1px 2px rgba(20,33,61,.12)}
.rm-cell[data-b=true]{background:#ddd6fe}
.rm-fill{position:absolute;inset:0;border-radius:6px;background:linear-gradient(160deg,#4ade80,var(--sys-green));box-shadow:0 2px 0 #15803d;animation:rm-in .5s ease-out .6s both}
.rm-slotc{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;border-radius:12px;background:linear-gradient(160deg,#22c55e,#15803d);color:#fff;font-size:14px;font-weight:700;line-height:1.25;box-shadow:0 3px 0 #14532d}
.rm-slotc span{display:block;font-size:13px;font-weight:600}
.rm-rev{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;padding:3px 12px 3px 4px;border-radius:99px;background:#fef3c7;color:#92400e;font-size:13px;font-weight:600;box-shadow:0 2px 0 #e9cf8a}

.rm-feed{z-index:20;width:310px;padding:12px;border-radius:20px;background:rgba(255,255,255,.9);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.95);
  box-shadow:0 3px 0 #d5dbee,0 14px 28px rgba(20,33,61,.16);color:var(--sys-navy);font:500 13px/1.3 'Plus Jakarta Sans',sans-serif}
.rm-feed[data-v=panel]{position:absolute;left:14px;top:50px}
.rm-feed[data-v=block]{max-width:440px;width:100%;margin:0 auto 14px}
.rm-fh{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700}
.rm-live{position:relative;width:10px;height:10px;border-radius:50%;background:var(--sys-green)}
.rm-live::after{content:"";position:absolute;inset:0;border-radius:50%;background:var(--sys-green);animation:rm-pulse 1.6s ease-out infinite}
.rm-fc{display:grid;grid-template-columns:1fr 1fr;gap:2px 8px;margin:8px 0}
.rm-fc div{display:flex;align-items:baseline;gap:6px}
.rm-fc b{font-size:15px;font-weight:800;animation:rm-bump .5s cubic-bezier(.3,1.5,.5,1) both}
.rm-fc span{color:var(--sys-body)}
.rm-fl{height:calc(var(--n) * 30px);overflow:hidden}
.rm-fi{display:flex;flex-direction:column;animation:rm-shift .45s cubic-bezier(.2,.8,.2,1) both}
.rm-fr{display:flex;align-items:center;gap:6px;height:30px;white-space:nowrap}
.rm-fr time{flex:none;width:58px;color:var(--sys-muted);font-weight:600}
.rm-fr .rm-bd{margin-bottom:3px}
.rm-fr span{overflow:hidden;text-overflow:ellipsis;font-weight:600}
.rm-fr[data-a=true] span{color:#B45309}
.rm-fr[data-new=true]{animation:rm-in .45s ease-out both}
.rm-tick1{display:flex;align-items:center;gap:8px;max-width:100%;margin:0 0 12px;padding:8px 12px;border-radius:14px;background:rgba(255,255,255,.92);border:1px solid var(--sys-border);box-shadow:0 3px 0 #d5dbee;font:600 13px/1.3 'Plus Jakarta Sans',sans-serif;color:var(--sys-navy)}
.rm-tick1 .rm-fr{flex:1;min-width:0;height:28px}

.rm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;min-width:44px;padding:0 16px;border-radius:999px;border:1px solid var(--sys-border);background:#fff;color:var(--sys-navy);font:600 15px/1 'Plus Jakarta Sans',sans-serif;cursor:pointer;box-shadow:0 3px 0 #d5dbee}
.rm-btn:hover{border-color:var(--sys-blue)}
.rm-btn:focus-visible{outline:3px solid var(--sys-blue);outline-offset:2px}
.rm-btn[aria-current=step]{background:var(--sys-navy);color:#fff;border-color:var(--sys-navy);box-shadow:0 3px 0 #0b1222}
.rm-btn:disabled{opacity:.5;cursor:not-allowed}
.rm-sw{position:relative;width:44px;height:26px;border-radius:99px;background:#cbd5e1;flex:none;transition:background .25s}
.rm-sw::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .25s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.rm-btn[aria-checked=true] .rm-sw{background:#F59E0B}
.rm-btn[aria-checked=true] .rm-sw::after{transform:translateX(18px)}
.rm-btn .rm-bd{margin-bottom:3px}
.rm-result{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:99px;background:#dcfce7;color:#166534;font-size:15px;font-weight:700}
.rm-result[data-w=true]{background:#fffbeb;color:#92400e;border:1px solid #F59E0B}
.rm-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.rm-root[data-vis=false] .rm-float,.rm-root[data-vis=false] .rm-gloss::before,.rm-root[data-vis=false] .rm-live::after{animation-play-state:paused}
@keyframes rm-node{0%{opacity:0;transform:translate(-50%,10px)}15%,80%{opacity:.7}100%{opacity:0;transform:translate(calc(-50% + 12px),-16px)}}
@keyframes rm-lnk{0%{opacity:0}15%,80%{opacity:.45}100%{opacity:0}}
@keyframes rm-flow{to{stroke-dashoffset:-12}}
@keyframes rm-dash{to{stroke-dashoffset:-18}}
@keyframes rm-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes rm-sweep{0%,55%{transform:translateX(0)}100%{transform:translateX(320%)}}
@keyframes rm-pulse{from{opacity:.8;transform:scale(.3)}to{opacity:0;transform:scale(2.2)}}
@keyframes rm-fade{from{opacity:0}to{opacity:1}}
@keyframes rm-shift{from{transform:translateY(-30px)}to{transform:translateY(0)}}
@keyframes rm-pop{0%{opacity:0;transform:scale(.8) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes rm-in{0%{opacity:0;transform:translateY(-14px)}100%{opacity:1;transform:translateY(0)}}
@keyframes rm-buzz{0%,100%{transform:translateX(0) rotate(0)}15%{transform:translateX(-3px) rotate(-1.5deg)}30%{transform:translateX(3px) rotate(1.5deg)}45%{transform:translateX(-3px) rotate(-1deg)}60%{transform:translateX(2px) rotate(1deg)}80%{transform:translateX(-1px)}}
@keyframes rm-amber{0%{opacity:0}15%,35%{opacity:1}100%{opacity:0}}
@keyframes rm-type{0%{opacity:0}8%,86%{opacity:1}100%{opacity:0}}
@keyframes rm-dot{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes rm-bump{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
@keyframes rm-slide{0%{transform:translateX(-${SLIDE}px)}100%{transform:translateX(0)}}
@keyframes rm-stamp{0%{opacity:0;transform:rotate(-12deg) scale(1.3)}50%{opacity:1;transform:rotate(-12deg) scale(.94)}75%{transform:rotate(-12deg) scale(1.05)}100%{opacity:1;transform:rotate(-12deg) scale(1)}}
@media (max-width:639px){.rm-steplabel{display:none}}
@media (prefers-reduced-motion:reduce){.rm-root *{animation:none!important;transition-duration:.25s!important}}
.rm-root[data-reduced=true] *{animation:none!important;transition-duration:.25s!important}
`;

// ---------------------------------------------------------------------------
// Station objects (decorative; the standee button carries the label)
// ---------------------------------------------------------------------------

const ROW_GLYPH: GlyphKind[] = ["chat", "phone", "mail"];

function PhoneObj({ who, without }: { who: number; without: boolean }) {
  const order = [who, (who + 1) % 3, (who + 2) % 3];
  const waiting = [
    { n: "Priya N.", t: "8:02am", k: "chat" as GlyphKind },
    { n: "Dev S.", t: "7:41am", k: "phone" as GlyphKind },
    { n: "Web form", t: "6:58am", k: "mail" as GlyphKind },
    { n: "Marco L.", t: "5:30am", k: "chat" as GlyphKind },
    { n: "Aisha K.", t: "4:12am", k: "phone" as GlyphKind },
  ];
  return (
    <div className="rm-phone">
      {without && <span className="rm-badge">5 waiting</span>}
      <span className="rm-notch" />
      <div className="rm-scr">
        <div className="rm-hd">
          Inbox
          {!without && <span className="rm-new">3 new</span>}
        </div>
        {without
          ? waiting.map((r, i) => (
              <div
                key={r.n}
                className="rm-row"
                data-c="true"
                style={{ ["--d" as string]: `${i * 0.3}s` }}
              >
                <Badge k={r.k} c="#f59e0b" z={26} />
                <span className="rm-rt">
                  <span className="rm-rn">
                    {r.n}
                    <span>{r.t}</span>
                  </span>
                  <span className="rm-rs">No reply yet</span>
                </span>
                <i className="rm-amber" />
              </div>
            ))
          : order.map((ci, i) => {
              const c = cust(ci);
              return (
                <div
                  key={c.name}
                  className="rm-row rm-in"
                  style={{ ["--d" as string]: `${(2 - i) * 0.5 + (i === 0 ? 0.1 : 0)}s` }}
                >
                  <Badge k={ROW_GLYPH[ci] as GlyphKind} c={c.color} z={28} />
                  <span className="rm-rt">
                    <span className="rm-rn">
                      {c.name}
                      <span>{c.time}</span>
                    </span>
                    <span className="rm-rs">{c.snip}</span>
                  </span>
                </div>
              );
            })}
        <i className="rm-gloss" />
      </div>
    </div>
  );
}

function ChatObj({ who }: { who: number }) {
  const c = cust(who);
  return (
    <div className="rm-card">
      <div className="rm-ch">
        <span className="rm-bd" data-round="true" style={{ ["--bc" as string]: c.color }}>
          {c.first.slice(0, 1)}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
      </div>
      <div className="rm-cb">
        <div className="rm-b1 rm-in">{c.snip}</div>
        <div className="rm-slot">
          <div className="rm-ty">
            <i />
            <i />
            <i />
          </div>
          <div className="rm-b2 rm-pop" style={{ ["--d" as string]: "2s" }}>
            Thanks {c.first}, we have your enquiry and will call you within the hour.
          </div>
        </div>
        <span className="rm-tick rm-pop" style={{ ["--d" as string]: "2.4s" }}>
          <Badge k="check" c="#16a34a" z={22} />
          Sent automatically, 12 seconds
        </span>
      </div>
      <i className="rm-gloss" />
    </div>
  );
}

function BoardObj({ who }: { who: number }) {
  const c = cust(who);
  return (
    <div className="rm-card">
      <div className="rm-bar">
        <i />
        <i />
        <i />
        <span style={{ marginLeft: 6 }}>Pipeline</span>
      </div>
      <div className="rm-lanes">
        <div className="rm-lane">
          <div className="rm-lh">
            New<span className="rm-cnt">1</span>
          </div>
          <div className="rm-sp" />
          <div className="rm-pc">
            Sam W.<span>$450</span>
          </div>
        </div>
        <div className="rm-lane">
          <div className="rm-lh">
            Quote sent<span className="rm-cnt">1</span>
          </div>
          <div className="rm-pc" data-hot="true" style={{ borderLeftColor: c.color }}>
            {c.name}
            <span>{money(totals(c).total)}</span>
          </div>
        </div>
        <div className="rm-lane">
          <div className="rm-lh">
            Following up<span className="rm-cnt">1</span>
          </div>
          <div className="rm-pc">
            Dev S.<span>$850</span>
          </div>
        </div>
        <div className="rm-lane">
          <div className="rm-lh">
            Booked<span className="rm-cnt">1</span>
          </div>
          <div className="rm-pc">
            Mark T.<span>$2,400</span>
          </div>
        </div>
      </div>
      <i className="rm-gloss" />
    </div>
  );
}

function QuoteObj({ who }: { who: number }) {
  const c = cust(who);
  const { gst, total } = totals(c);
  return (
    <>
      <div className="rm-sheet">
        <div className="rm-sh1">
          Quote Q-{1050 + who}
          <span>Northside Home Services</span>
        </div>
        {c.items.map(([label, price]) => (
          <div key={label} className="rm-li">
            {label}
            <b>{money(price)}</b>
          </div>
        ))}
        <div className="rm-li" style={{ borderBottom: 0 }}>
          GST (10%)<b>{money(gst)}</b>
        </div>
        <div className="rm-tot">
          Total<span>{money(total)}</span>
        </div>
        <span className="rm-stamp">SENT</span>
        <i className="rm-gloss" />
      </div>
      <span className="rm-timer rm-pop" style={{ ["--d" as string]: "1.3s" }}>
        <Badge k="clock" c="#0ea5e9" z={24} />
        Follow-up in 3 days
      </span>
    </>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["9am", "10am", "11am"];
const BUSY = new Set(["0-0", "4-0", "0-2", "4-2", "2-1"]);

function CalObj({ who }: { who: number }) {
  const c = cust(who);
  return (
    <div className="rm-card rm-cal">
      <div style={{ fontWeight: 700, fontSize: 15 }}>This week</div>
      <div className="rm-gr">
        <span />
        {DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
        {HOURS.map((h, r) => (
          <Fragment key={h}>
            <span style={{ textAlign: "left" }}>{h}</span>
            {DAYS.map((d, ci) => (
              <div key={d} className="rm-cell" data-b={BUSY.has(`${ci}-${r}`)}>
                {ci === c.slot.c && r === c.slot.r && <i className="rm-fill" />}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
      <div className="rm-slotc rm-pop" style={{ ["--d" as string]: "1s" }}>
        <Badge k="calendar" c="#14532d" z={30} />
        <div>
          Site visit, {c.slot.label}
          <span>Booked</span>
        </div>
      </div>
      <span className="rm-rev rm-pop" style={{ ["--d" as string]: "1.6s" }}>
        <Badge k="star" c="#f59e0b" z={22} />
        Review request queued
      </span>
      <i className="rm-gloss" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live feed
// ---------------------------------------------------------------------------

function Feed({
  variant,
  rows,
  counts,
  rowCount,
}: {
  variant: "panel" | "block" | "ticker";
  rows: FeedEvent[];
  counts: number[];
  rowCount: number;
}) {
  const shown = rows.slice(0, rowCount);
  if (variant === "ticker") {
    const e = shown[0] as FeedEvent;
    return (
      <div className="rm-tick1" aria-hidden="true">
        <span className="rm-live" />
        <span style={{ fontWeight: 700 }}>Live</span>
        <div className="rm-fr" key={e.id} data-a={e.amber} data-new="true">
          <Badge k={e.kind} c={e.amber ? "#f59e0b" : "#4f46e5"} z={22} />
          <span>
            {e.time} {e.text}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="rm-feed" data-v={variant} aria-hidden="true">
      <div className="rm-fh">
        <span className="rm-live" />
        Live activity
      </div>
      <div className="rm-fc">
        {COUNTER_LABELS.map((l, k) => (
          <div key={l}>
            <b key={counts[k]}>{counts[k]}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="rm-fl" style={{ ["--n" as string]: rowCount }}>
        <div className="rm-fi" key={shown[0]?.id}>
          {shown.map((e, i) => (
            <div
              key={e.id}
              className="rm-fr"
              data-a={e.amber}
              data-new={i === 0 && e.id >= 0}
              style={{ opacity: [1, 0.92, 0.8, 0.65, 0.5, 0.38][i] }}
            >
              <time>{e.time}</time>
              <Badge k={e.kind} c={e.amber ? "#f59e0b" : "#4f46e5"} z={22} />
              <span>{e.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function OperationsRoom() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [without, setWithout] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [announce, setAnnounce] = useState("");
  const [W, setW] = useState(1120);
  const [keys, setKeys] = useState([0, 0, 0, 0, 0]);
  const [who, setWho] = useState([0, 1, 2, 2, 1]);
  const [feed, setFeed] = useState<FeedEvent[]>(SEED_FEED);
  const [counts, setCounts] = useState(COUNTS_START);

  const roomRef = useRef<HTMLDivElement>(null);
  const tokRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tRef = useRef(0);
  const activeRef = useRef(0);
  const routeRef = useRef<Route | null>(null);
  const stallRef = useRef(false);
  const lastRef = useRef<number[]>([0, 1, 3]);
  const idRef = useRef(1);
  const spawnRef = useRef(0);
  const [nodes, setNodes] = useState<(AmbNode | null)[]>(() =>
    buildNodes(layoutFor(1120, false), 1120),
  );

  const lay = useMemo(() => layoutFor(W, reduced), [W, reduced]);
  const route = useMemo(() => buildRoute(lay, W), [lay, W]);
  const pts = route.ports;
  const running = playing && visible && tabVisible && !reduced && !without;
  const showTok = !reduced && lay.mode !== "car";
  const feedVariant = lay.mode === "wide" ? "panel" : lay.mode === "mid" ? "block" : "ticker";

  const apply = useCallback((t: number) => {
    const pp = routeRef.current;
    if (!pp) return;
    const set = (el: HTMLElement | null, p: Pt) => {
      if (el) el.style.transform = `translate3d(${p.x}px,${p.y}px,0)`;
    };
    const base = pp.ports[0] as Pt;
    CUSTOMERS.forEach((_, j) => {
      const tj = jobT(t, j);
      const stall = (lag: number) => ({ x: base.x - 90 + j * 90 - lag * 0.1, y: base.y });
      set(tokRefs.current[j] ?? null, stallRef.current ? stall(0) : posAt(tj, pp));
      TRAIL_LAGS.forEach((lag, k) =>
        set(
          trailRefs.current[j * 2 + k] ?? null,
          stallRef.current ? stall(lag) : posAt(tj - lag, pp),
        ),
      );
    });
  }, []);

  useEffect(() => {
    routeRef.current = route;
    apply(tRef.current);
  }, [route, apply]);

  const syncLast = () => {
    lastRef.current = OFFS.map((_, j) => stepAt(jobT(tRef.current, j)));
  };

  // A job arrives at a station: new customer there, restart its animation,
  // add a feed line and bump the matching counter.
  const arrive = useCallback((st: number, j: number) => {
    const ev = makeEvent(st, j, idRef.current++);
    setFeed((f) => [ev, ...f].slice(0, FEED_ROWS));
    const ci = COUNTER_OF[st] as number;
    if (ci >= 0) setCounts((cs) => cs.map((v, k) => (k === ci ? v + 1 : v)));
    setWho((w) => w.map((v, k) => (k === st ? j : v)));
    setKeys((ks) => ks.map((v, k) => (k === st ? v + 1 : v)));
  }, []);

  const goTo = useCallback(
    (i: number) => {
      tRef.current = i * STEP_MS + TRAVEL_MS;
      activeRef.current = i;
      lastRef.current = OFFS.map((_, j) => stepAt(jobT(tRef.current, j)));
      apply(tRef.current);
      setActive(i);
      arrive(i, 0);
      setAnnounce(`Step ${i + 1} of 5, ${at(i).title}. ${at(i).say}.`);
    },
    [apply, arrive],
  );

  const selectStep = (i: number) => {
    if (without) return;
    setPlaying(false);
    goTo(i);
  };

  const replay = () => {
    if (without) {
      setWithout(false);
      stallRef.current = false;
      setCounts(COUNTS_START);
      setFeed(SEED_FEED);
    }
    tRef.current = 0;
    activeRef.current = 0;
    syncLast();
    apply(0);
    setActive(0);
    arrive(0, 0);
    setPlaying(!reduced);
    setAnnounce(`Replaying from step 1. ${at(0).say}.`);
  };

  const toggleWithout = () => {
    const next = !without;
    setWithout(next);
    stallRef.current = next;
    tRef.current = 0;
    activeRef.current = 0;
    syncLast();
    apply(0);
    setActive(0);
    if (next) {
      setFeed(WITHOUT_FEED);
      setCounts(COUNTS_WITHOUT);
    } else {
      setFeed(SEED_FEED);
      setCounts(COUNTS_START);
      setPlaying(!reduced);
    }
    setAnnounce(
      next ? `Without the system. ${WITHOUT_SAY}.` : "With the system. Replaying the tour.",
    );
  };

  // On screen + tab visibility
  useEffect(() => {
    const el = roomRef.current;
    if (!el) return;
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          setVisible(entries.some((e) => e.isIntersecting));
        },
        { threshold: 0.1 },
      );
      io.observe(el);
    } else {
      setVisible(true);
    }
    const onVis = () => setTabVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Measure the stage width, which drives the layout
  useEffect(() => {
    const el = roomRef.current;
    if (!el) return;
    const measure = () => setW(Math.max(280, Math.round(el.clientWidth)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Timeline: three jobs in parallel
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      tRef.current = (tRef.current + dt) % LOOP_MS;
      apply(tRef.current);
      CUSTOMERS.forEach((_, j) => {
        const s = stepAt(jobT(tRef.current, j));
        if (s !== lastRef.current[j]) {
          lastRef.current[j] = s;
          arrive(s, j);
        }
      });
      const a = stepAt(tRef.current);
      if (a !== activeRef.current) {
        activeRef.current = a;
        setActive(a);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, apply, arrive]);

  // Re-place the pool whenever the layout changes
  useEffect(() => {
    setNodes(buildNodes(lay, W));
  }, [lay, W]);

  // Ambient action nodes: one new node every 1.8s in a free gutter, 8 slots reused.
  // Paused while the tour is paused or a step is selected.
  useEffect(() => {
    if (reduced || without || !playing || !visible || !tabVisible || lay.mode === "car") return;
    const id = window.setInterval(() => {
      const c = spawnRef.current++;
      const st = (c * 2 + 1) % 5;
      const list = NODE_TEXT[st] as [string, string][];
      const i = Math.floor(c / 5) % list.length;
      setNodes((ns) => {
        const taken = ns.filter((n): n is AmbNode => !!n).map((n) => ({ x: n.x, y: n.y }));
        const p = pickSpot(st, (list[i] as [string, string])[0], lay, W, c % 4, taken);
        if (!p) return ns;
        const n: AmbNode = { st, i, k: c + 1, x: p.x, y: p.y };
        return ns.map((old, s) => (s === c % NODE_POOL ? n : old));
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, [reduced, without, playing, visible, tabVisible, lay, W]);

  const cur = at(active);
  const sayNow = without ? WITHOUT_SAY : cur.say;
  const detailNow = without ? WITHOUT_DETAIL : cur.detail;
  const resultNow = without ? "5 enquiries waiting, none answered" : cur.result;
  const rowCount = feedVariant === "panel" ? FEED_ROWS : 4;
  const feedEl = <Feed variant={feedVariant} rows={feed} counts={counts} rowCount={rowCount} />;

  return (
    <section
      className="mx-auto w-full max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="rm-heading"
    >
      <style>{CSS}</style>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="rm-gl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#d6e0ff" />
          </linearGradient>
        </defs>
      </svg>
      <Reveal className="mx-auto max-w-[820px] text-center">
        <Pill variant="blue">How it works</Pill>
        <h2
          id="rm-heading"
          className="mt-4 text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--sys-navy)" }}
        >
          See jobs travel through your business
        </h2>
        <p
          className="mt-4 text-base leading-relaxed sm:text-lg"
          style={{ color: "var(--sys-body)" }}
        >
          Three customers move through at once, every station busy, every message answered. Tap any
          station to pause and see what happens there.
        </p>
      </Reveal>

      <Reveal
        className="rm-root mt-10"
        data-without={without}
        data-vis={visible}
        data-reduced={reduced}
        delay={80}
      >
        {feedVariant !== "panel" && feedEl}
        <div
          ref={roomRef}
          className="rm-room"
          role="group"
          aria-label="Operations room illustration"
          aria-describedby="rm-desc"
          style={{ height: lay.h }}
        >
          <p id="rm-desc" className="rm-sr">
            {DESCRIPTION}
          </p>
          {feedVariant === "panel" && feedEl}

          <div className="rm-tilt" style={{ height: lay.h }}>
            <div className="rm-floorw" aria-hidden="true">
              <div className="rm-floor" />
            </div>

            {lay.mode !== "car" && (
              <svg
                className="rm-path"
                aria-hidden="true"
                width={W}
                height={lay.h}
                viewBox={`0 0 ${W} ${lay.h}`}
              >
                <path
                  d={route.d}
                  fill="none"
                  stroke="rgba(124,58,237,.16)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  className="rm-dash"
                  d={route.d}
                  fill="none"
                  stroke="var(--sys-violet)"
                  strokeOpacity=".75"
                  strokeWidth="3"
                  strokeDasharray="1 11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {route.ports.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="11" fill="rgba(124,58,237,.18)" />
                    <circle cx={p.x} cy={p.y} r="5" fill="var(--sys-violet)" />
                    <circle cx={p.x - 1.5} cy={p.y - 1.5} r="1.8" fill="#fff" />
                  </g>
                ))}
              </svg>
            )}

            {/* Ambient action nodes and their dotted links (background depth) */}
            {lay.mode !== "car" && !without && (
              <div className="rm-amb" data-off={!playing} aria-hidden="true">
                <svg className="rm-links" width={W} height={lay.h} viewBox={`0 0 ${W} ${lay.h}`}>
                  {nodes.map((n, s) => {
                    if (!n) return null;
                    const sl = lay.slots[n.st] as { fx: number; top: number };
                    return (
                      <line
                        key={`${s}-${n.k}`}
                        className="rm-ln"
                        x1={n.x}
                        y1={n.y}
                        x2={sl.fx * W}
                        y2={sl.top + OH * 0.55}
                      />
                    );
                  })}
                </svg>
                {nodes.map((n, s) => {
                  if (!n) return null;
                  const [label, col] = (NODE_TEXT[n.st] as [string, string][])[n.i] as [
                    string,
                    string,
                  ];
                  return (
                    <div
                      key={`${s}-${n.k}`}
                      className="rm-an"
                      style={{ left: n.x, top: n.y, ["--bc" as string]: col }}
                    >
                      <div className="rm-ai">
                        <i />
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Arrival pulses, one per station */}
            {showTok &&
              !without &&
              pts.map((p, i) => (
                <span
                  key={`${i}-${keys[i]}`}
                  className="rm-pulse"
                  aria-hidden="true"
                  style={{ left: p.x, top: p.y }}
                />
              ))}

            {STATIONS.map((s, i) => {
              const slot = lay.slots[i] as { fx: number; top: number };
              const on = without ? i === 0 : i === active;
              const hide = lay.mode === "car" && i !== active;
              const w = who[i] as number;
              const objects = [
                <PhoneObj key="o" who={w} without={without} />,
                <ChatObj key="o" who={w} />,
                <BoardObj key="o" who={w} />,
                <QuoteObj key="o" who={w} />,
                <CalObj key="o" who={w} />,
              ];
              return (
                <div
                  key={s.title}
                  className="rm-st"
                  role="button"
                  tabIndex={hide ? -1 : 0}
                  aria-label={`Step ${i + 1}, ${s.title}. ${s.say}`}
                  aria-pressed={!without && i === active && !playing}
                  aria-disabled={without}
                  data-on={on}
                  data-dim={without && i > 0}
                  data-hide={hide}
                  style={
                    {
                      left: `calc(${slot.fx * 100}% - ${OW / 2}px)`,
                      top: slot.top,
                      "--ac": s.accent,
                      "--bs": lay.bs,
                      "--fd": `${-i * 1.1}s`,
                    } as React.CSSProperties
                  }
                  onClick={() => selectStep(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectStep(i);
                    }
                  }}
                >
                  <span className="rm-sh" aria-hidden="true" />
                  <span className="rm-sh2" aria-hidden="true" />
                  <span className="rm-glow" aria-hidden="true" />
                  <span className="rm-ul" aria-hidden="true" />
                  <div className="rm-float" aria-hidden="true">
                    <div className="rm-obj" key={`${keys[i]}-${without && i === 0 ? "w" : "n"}`}>
                      {objects[i]}
                    </div>
                  </div>
                  <span className="rm-tt">
                    <Badge k={s.glyph} c={s.badge} z={30} />
                    {s.title}
                  </span>
                </div>
              );
            })}

            {/* Three glossy job tokens with trails, in their own top layer above every standee */}
            <div className="rm-toks" aria-hidden="true">
              {showTok &&
                CUSTOMERS.map((c, j) => {
                  const tj = jobT(0, j);
                  const p = posAt(tj, route);
                  const tr = `translate3d(${p.x}px,${p.y}px,0)`;
                  return (
                    <Fragment key={c.name}>
                      {TRAIL_LAGS.map((lag, k) => (
                        <div
                          key={lag}
                          ref={(el) => {
                            trailRefs.current[j * 2 + k] = el;
                          }}
                          className="rm-tok"
                          aria-hidden="true"
                          style={{
                            transform: tr,
                            opacity: 0.5 - k * 0.2,
                            ["--jc" as string]: c.color,
                          }}
                        >
                          <span className="rm-trail" />
                        </div>
                      ))}
                      <div
                        ref={(el) => {
                          tokRefs.current[j] = el;
                        }}
                        className="rm-tok"
                        aria-hidden="true"
                        style={{ transform: tr, ["--jc" as string]: c.color }}
                      >
                        <span className="rm-halo" />
                        <span className="rm-orb" />
                        <span className="rm-jt">{c.name}</span>
                      </div>
                    </Fragment>
                  );
                })}
              {reduced &&
                lay.mode !== "car" &&
                !without &&
                CUSTOMERS.map((c, j) => {
                  const p = posAt(jobT(active * STEP_MS + TRAVEL_MS, j), route);
                  return (
                    <div
                      key={`${c.name}-${active}`}
                      className="rm-tok rm-still"
                      aria-hidden="true"
                      style={{
                        transform: `translate3d(${p.x}px,${p.y}px,0)`,
                        ["--jc" as string]: c.color,
                      }}
                    >
                      <span className="rm-halo" />
                      <span className="rm-orb" />
                      <span className="rm-jt">{c.name}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Caption */}
        <Card className="mx-auto mt-5 max-w-[860px]" style={{ padding: 22 }}>
          <h3
            className="text-xl font-bold"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: without ? "#B45309" : "var(--sys-navy)",
            }}
          >
            {without ? "Without the system" : `Step ${active + 1} of 5: ${cur.title}`}
          </h3>
          <p className="mt-2 text-base font-semibold" style={{ color: "var(--sys-navy)" }}>
            {sayNow}
          </p>
          <p className="mt-1 text-base leading-relaxed" style={{ color: "var(--sys-body)" }}>
            {detailNow}
          </p>
          <p className="mt-3">
            <span className="rm-result" data-w={without}>
              {resultNow}
            </span>
          </p>
          <p className="mt-3 text-[13px]" style={{ color: "var(--sys-body)" }}>
            Example, fictional data.
          </p>
        </Card>

        {/* Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {!reduced && (
            <button
              type="button"
              className="rm-btn"
              disabled={without}
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause the tour" : "Play the tour"}
            >
              {playing ? (
                <Pause size={18} aria-hidden="true" />
              ) : (
                <Play size={18} aria-hidden="true" />
              )}
              {playing ? "Pause" : "Play"}
            </button>
          )}
          <button type="button" className="rm-btn" onClick={replay}>
            <RotateCcw size={18} aria-hidden="true" />
            Replay
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={without}
            className="rm-btn"
            onClick={toggleWithout}
          >
            <span className="rm-sw" aria-hidden="true" />
            Without the system
          </button>
        </div>

        <ol className="mx-auto mt-4 flex max-w-[860px] list-none flex-wrap items-center justify-center gap-2 p-0">
          {STATIONS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className="rm-btn"
                disabled={without}
                aria-current={!without && i === active ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${s.title}`}
                onClick={() => selectStep(i)}
              >
                <span
                  className="rm-bd"
                  data-round="true"
                  aria-hidden="true"
                  style={{ ["--bc" as string]: s.badge, ["--bz" as string]: "26px" }}
                >
                  {i + 1}
                </span>
                <span className="rm-steplabel" aria-hidden="true">
                  {s.title}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="rm-sr" role="status" aria-live="polite">
          {announce}
        </div>
      </Reveal>
    </section>
  );
}
