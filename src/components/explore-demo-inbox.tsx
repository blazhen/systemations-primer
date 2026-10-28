import { useEffect, useState } from "react";
import { BellOff, Check, ChevronDown, Clock, RefreshCw, Undo2 } from "lucide-react";
import { Card } from "./explore-ui";
import { ScreenshotViewer } from "./explore-screenshot-viewer";
import { DEMO_SCREENSHOTS } from "./explore-data";

// Inbox & reporting illustrative demo.
// Australian English. No em dashes or en dashes anywhere in this file.
// All data is fictional sample data for Coastal Services and customer Alex.

function AwaitingBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        color: "#92400E",
        border: "1px solid rgba(245, 158, 11, 0.25)",
      }}
    >
      <Clock className="h-2.5 w-2.5" strokeWidth={2.4} />
      Awaiting your approval
    </span>
  );
}

function ApprovedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        color: "var(--sys-green-text)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
      }}
    >
      <Check className="h-2.5 w-2.5" strokeWidth={2.4} />
      Sample approved
    </span>
  );
}

type InboxView = "inbox" | "priorities" | "report";
type Status = "open" | "done" | "snoozed";

interface SampleRecord {
  id: string;
  type: string;
  from: string;
  business: string;
  subject: string;
  body: string;
  classification: string;
  owner: string;
  draft: string;
  priority: "Urgent" | "High" | "Medium";
  stage: "New" | "Following up" | "Draft" | "Booked";
}

const INBOX_RECORDS: SampleRecord[] = [
  {
    id: "r1",
    type: "New job request",
    from: "Alex",
    business: "Coastal Services",
    subject: "Service visit enquiry",
    body: "Hi, we need someone out to look at the rear air unit this week. Are you available?",
    classification: "New enquiry",
    owner: "Front desk",
    draft:
      "Thanks for reaching out. What day would you prefer for a service visit? We will check availability before confirming.",
    priority: "Urgent",
    stage: "New",
  },
  {
    id: "r2",
    type: "Quote question",
    from: "Alex",
    business: "Coastal Services",
    subject: "Question about CS-DEMO-001",
    body: "Hi, I have a question about the quote you sent. Can someone call me about the service visit line?",
    classification: "Quote follow-up",
    owner: "Owner",
    draft:
      "Hi Alex, happy to help. I will get the owner to call you directly about the service visit line on your quote.",
    priority: "High",
    stage: "Following up",
  },
  {
    id: "r3",
    type: "Draft invoice",
    from: "Alex",
    business: "Coastal Services",
    subject: "Invoice CS-DEMO-001",
    body: "Service visit, Maroochydore. AUD 250 plus GST 25, total 275.",
    classification: "Draft invoice",
    owner: "Owner",
    draft: "Invoice CS-DEMO-001 prepared and ready for your review before sending.",
    priority: "Medium",
    stage: "Draft",
  },
  {
    id: "r4",
    type: "Booking confirmed",
    from: "Alex",
    business: "Coastal Services",
    subject: "Booking confirmed",
    body: "Service visit booked for Tuesday afternoon. Callback confirmed.",
    classification: "Booked",
    owner: "Team",
    draft: "Hi Alex, your service visit is booked for Tuesday afternoon. We will see you then.",
    priority: "Medium",
    stage: "Booked",
  },
];

const INBOX_VIEW_TABS: { id: InboxView; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "priorities", label: "Today's priorities" },
  { id: "report", label: "Sample report" },
];

const PRIORITY_STYLES: Record<SampleRecord["priority"], { bg: string; color: string }> = {
  Urgent: { bg: "rgba(239, 68, 68, 0.1)", color: "#DC2626" },
  High: { bg: "rgba(245, 158, 11, 0.1)", color: "#92400E" },
  Medium: { bg: "rgba(30, 136, 229, 0.1)", color: "var(--sys-blue)" },
};

const NEXT_ACTION: Record<string, string> = {
  r1: "Reply with a day to suggest, then book the visit once Alex confirms.",
  r2: "Approve the reply so the owner calls Alex about the service visit line.",
  r3: "Check the amounts, then approve the invoice for sending.",
  r4: "Nothing to do. The booking is confirmed.",
};

const APPROVE_LABEL: Record<string, string> = {
  r1: "Approve reply",
  r2: "Approve reply",
  r3: "Approve invoice",
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useCountUp(target: number, ms = 700) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setValue(Math.round(target * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduced]);
  return value;
}

function DetailPanel({
  record,
  status,
  draft,
  notice,
  idSuffix,
  onDraft,
  onApprove,
  onSnooze,
  onRestore,
}: {
  record: SampleRecord;
  status: Status;
  draft: string;
  notice: string;
  idSuffix: string;
  onDraft: (v: string) => void;
  onApprove: () => void;
  onSnooze: () => void;
  onRestore: () => void;
}) {
  const done = status === "done";
  const textId = `draft-${record.id}-${idSuffix}`;
  const btn =
    "inline-flex min-h-11 items-center gap-1.5 rounded-[12px] px-4 py-2 text-xs font-semibold motion-safe:transition-transform motion-safe:hover:scale-[1.02] motion-safe:active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50";
  return (
    <Card className="sys-crm-motion sys-pop p-5">
      <div
        className="flex items-center justify-between gap-2 border-b pb-3"
        style={{ borderColor: "var(--sys-border)" }}
      >
        <div>
          <h4
            className="text-sm font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {record.type}
          </h4>
          <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
            {record.from}, {record.business} · {record.owner}
          </p>
        </div>
        {done ? <ApprovedBadge /> : <AwaitingBadge />}
      </div>
      <div className="mt-3">
        <div
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--sys-muted)" }}
        >
          {record.stage === "Draft" ? "Draft" : "Customer message"}
        </div>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--sys-body)" }}>
          {record.body}
        </p>
      </div>
      <div
        className="mt-3 rounded-[12px] p-3"
        style={{
          backgroundColor: "rgba(30, 136, 229, 0.05)",
          border: "1px solid var(--sys-border)",
        }}
      >
        <div
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--sys-blue-dark)" }}
        >
          Suggested next action
        </div>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--sys-navy)" }}>
          {NEXT_ACTION[record.id]}
        </p>
      </div>
      <div className="mt-3">
        <label
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--sys-blue-dark)" }}
          htmlFor={textId}
        >
          Draft response (editable sample)
        </label>
        <textarea
          id={textId}
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          rows={3}
          disabled={done}
          className="mt-2 w-full resize-none rounded-[12px] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-300/30 disabled:opacity-60"
          style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {status === "open" ? (
          <>
            <button type="button" onClick={onApprove} className={`${btn} sys-gradient-fill`}>
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              {APPROVE_LABEL[record.id] ?? "Approve reply"}
            </button>
            <button
              type="button"
              onClick={onSnooze}
              className={`${btn} bg-white`}
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <BellOff className="h-3.5 w-3.5" strokeWidth={2.2} />
              Snooze to tomorrow
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onRestore}
            className={`${btn} bg-white`}
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          >
            <Undo2 className="h-3.5 w-3.5" strokeWidth={2.2} />
            Move back to today
          </button>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 min-h-4 text-xs"
        style={{ color: "var(--sys-green-text)" }}
      >
        {notice}
      </p>
    </Card>
  );
}

function ItemCard({
  record,
  status,
  selected,
  showPriority,
  onSelect,
}: {
  record: SampleRecord;
  status: Status;
  selected: boolean;
  showPriority: boolean;
  onSelect: () => void;
}) {
  const ps = PRIORITY_STYLES[record.priority];
  const done = status === "done";
  return (
    <button
      type="button"
      aria-expanded={selected}
      aria-pressed={selected}
      onClick={onSelect}
      className={`sys-crm-motion sys-lift group flex min-h-11 w-full items-center justify-between gap-3 rounded-[14px] bg-white p-4 text-left motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${status === "snoozed" ? "opacity-60" : ""}`}
      style={{
        border: `1px solid ${selected ? "var(--sys-blue)" : "var(--sys-border)"}`,
        boxShadow: selected
          ? "0 8px 20px rgba(30, 136, 229, 0.14)"
          : "0 2px 6px rgba(20, 33, 61, 0.04)",
        backgroundColor: selected ? "rgba(30, 136, 229, 0.04)" : "white",
      }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold"
          style={
            done
              ? { backgroundColor: "rgba(16, 185, 129, 0.14)", color: "var(--sys-green-text)" }
              : { backgroundColor: ps.bg, color: ps.color }
          }
        >
          {done ? (
            <Check className="h-4 w-4" strokeWidth={2.6} />
          ) : record.priority === "Medium" ? (
            record.type.charAt(0)
          ) : (
            "!"
          )}
        </span>
        <span className="min-w-0">
          <span
            className="block text-sm font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {record.type}
          </span>
          <span className="block truncate text-xs" style={{ color: "var(--sys-muted)" }}>
            {record.from}, {record.business} · {record.subject}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {done ? (
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-green-text)" }}
          >
            Done
          </span>
        ) : status === "snoozed" ? (
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-muted)" }}
          >
            Tomorrow
          </span>
        ) : showPriority ? (
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: ps.color }}
          >
            {record.priority}
          </span>
        ) : null}
        <ChevronDown
          className={`h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 ${selected ? "rotate-180" : ""}`}
          style={{ color: "var(--sys-muted)" }}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

function GroupLabel({ text }: { text: string }) {
  return (
    <div
      className="px-1 pt-1 text-[10px] font-bold uppercase tracking-wider"
      style={{ color: "var(--sys-muted)" }}
    >
      {text}
    </div>
  );
}

const GROUP_TEXT: Record<Status, string> = {
  open: "Needs you",
  snoozed: "Snoozed until tomorrow",
  done: "Done today",
};

function TriageView({
  records,
  grouped,
  statuses,
  drafts,
  notices,
  selectedId,
  setSelectedId,
  setStatus,
  setDraft,
  onReset,
}: {
  records: SampleRecord[];
  grouped: boolean;
  statuses: Record<string, Status>;
  drafts: Record<string, string>;
  notices: Record<string, string>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setStatus: (id: string, s: Status) => void;
  setDraft: (id: string, v: string) => void;
  onReset: () => void;
}) {
  const st = (id: string): Status => statuses[id] ?? "open";
  const open = records.filter((r) => st(r.id) === "open");
  const snoozed = records.filter((r) => st(r.id) === "snoozed");
  const done = records.filter((r) => st(r.id) === "done");
  const ordered = grouped ? [...open, ...snoozed, ...done] : records;
  const selected = records.find((r) => r.id === selectedId) ?? null;

  const panelFor = (r: SampleRecord, suffix: string) => (
    <DetailPanel
      record={r}
      status={st(r.id)}
      draft={drafts[r.id] ?? r.draft}
      notice={notices[r.id] ?? ""}
      idSuffix={suffix}
      onDraft={(v) => setDraft(r.id, v)}
      onApprove={() => setStatus(r.id, "done")}
      onSnooze={() => setStatus(r.id, "snoozed")}
      onRestore={() => setStatus(r.id, "open")}
    />
  );

  return (
    <div className="space-y-3">
      {grouped && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            key={`${open.length}-${done.length}`}
            className="sys-crm-motion sys-pop text-sm font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            aria-live="polite"
          >
            {open.length} {open.length === 1 ? "thing needs" : "things need"} you, {done.length}{" "}
            done
          </p>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          >
            <RefreshCw className="h-3 w-3" strokeWidth={2} />
            Reset
          </button>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {ordered.map((r, i) => {
            const prev = ordered[i - 1];
            const showLabel = grouped && (!prev || st(prev.id) !== st(r.id));
            return (
              <div key={r.id} className="space-y-2">
                {showLabel && <GroupLabel text={GROUP_TEXT[st(r.id)]} />}
                <ItemCard
                  record={r}
                  status={st(r.id)}
                  selected={selectedId === r.id}
                  showPriority={grouped}
                  onSelect={() => setSelectedId(selectedId === r.id ? null : r.id)}
                />
                {selectedId === r.id && (
                  <div id={`panel-${r.id}`} className="lg:hidden">
                    {panelFor(r, "inline")}
                  </div>
                )}
              </div>
            );
          })}
          {grouped && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--sys-muted)" }}>
              Sample figures showing how your pipeline can be viewed. Nothing is sent.
            </p>
          )}
        </div>
        <div className="hidden lg:block">
          {selected ? (
            <div id={`panel-${selected.id}-side`} key={selected.id}>
              {panelFor(selected, "side")}
            </div>
          ) : (
            <Card className="p-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--sys-muted)" }}>
                Choose an item to see the message and suggested reply.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportFigures({ statuses }: { statuses: Record<string, Status> }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const stages: SampleRecord["stage"][] = ["New", "Following up", "Draft", "Booked"];
  const rows = stages.map((s) => ({
    stage: s,
    count: INBOX_RECORDS.filter((r) => r.stage === s).length,
  }));
  const max = Math.max(...rows.map((r) => r.count), 1);
  const approved = ["r1", "r2", "r3"].filter((id) => statuses[id] === "done").length;
  const total = useCountUp(INBOX_RECORDS.length);
  const invoice = useCountUp(275);
  const doneCount = useCountUp(approved, 400);
  const tiles = [
    { label: "Sample items", value: String(total) },
    { label: "Approved today", value: String(doneCount) },
    { label: "Sample invoice (AUD)", value: String(invoice) },
  ];
  return (
    <Card className="p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-[12px] p-3"
            style={{
              backgroundColor: "rgba(30, 136, 229, 0.05)",
              border: "1px solid var(--sys-border)",
            }}
          >
            <div
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t.value}
            </div>
            <div className="text-[11px]" style={{ color: "var(--sys-muted)" }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <div
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--sys-muted)" }}
        >
          Sample pipeline by stage
        </div>
        {rows.map((r, i) => (
          <div key={r.stage}>
            <div className="mb-1 flex justify-between text-xs">
              <span style={{ color: "var(--sys-navy)" }}>{r.stage}</span>
              <span className="font-semibold tabular-nums" style={{ color: "var(--sys-navy)" }}>
                {r.count}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: "#EEF2F7" }}
            >
              <div
                className="sys-crm-motion h-full origin-left rounded-full motion-safe:transition-transform motion-safe:duration-700"
                style={{
                  width: `${(r.count / max) * 100}%`,
                  background: "linear-gradient(to right, var(--sys-blue), var(--sys-teal))",
                  transform: shown || reduced ? "scaleX(1)" : "scaleX(0)",
                  transitionDelay: reduced ? "0ms" : `${i * 90}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function InboxDemo() {
  const [view, setView] = useState<InboxView>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [notices, setNotices] = useState<Record<string, string>>({});

  const inboxRecords = INBOX_RECORDS.filter((r) => r.id === "r1" || r.id === "r2");
  const priorityRecords = INBOX_RECORDS.filter(
    (r) => r.id === "r1" || r.id === "r2" || r.id === "r3",
  );

  const setStatus = (id: string, s: Status) => {
    setStatuses((p) => ({ ...p, [id]: s }));
    setNotices((p) => ({
      ...p,
      [id]:
        s === "done"
          ? "Done. Sample only, nothing was sent."
          : s === "snoozed"
            ? "Snoozed to tomorrow. Sample only."
            : "Moved back to today.",
    }));
  };
  const setDraft = (id: string, v: string) => setDrafts((d) => ({ ...d, [id]: v }));
  const reset = () => {
    setStatuses({});
    setNotices({});
    setDrafts({});
    setSelectedId(null);
  };

  return (
    <div className="mx-auto max-w-[820px] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold" style={{ color: "var(--sys-muted)" }}>
          Demo account · fictional data
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {INBOX_VIEW_TABS.map((t) => {
          const active = view === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setView(t.id);
                setSelectedId(null);
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
              style={{
                backgroundColor: active ? "var(--sys-navy)" : "white",
                color: active ? "#fff" : "var(--sys-navy)",
                border: `1px solid ${active ? "var(--sys-navy)" : "var(--sys-border)"}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {view !== "report" && (
        <TriageView
          key={view}
          records={view === "inbox" ? inboxRecords : priorityRecords}
          grouped={view === "priorities"}
          statuses={statuses}
          drafts={drafts}
          notices={notices}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          setStatus={setStatus}
          setDraft={setDraft}
          onReset={reset}
        />
      )}

      {view === "report" && (
        <div className="space-y-4">
          <ReportFigures statuses={statuses} />
          <ScreenshotViewer
            heading="Actual demo dashboard"
            explanation="A real owner dashboard from our Brightline Insulation demonstration account. All names, jobs, messages and figures are fictional sample data. Your setup is designed around your agreed workflow."
            initialId="owner-dashboard"
            screens={DEMO_SCREENSHOTS.filter((s) => s.id === "owner-dashboard")}
          />
        </div>
      )}
    </div>
  );
}
