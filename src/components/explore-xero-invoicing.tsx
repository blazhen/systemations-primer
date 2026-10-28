import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Maximize2,
  Plus,
  Receipt,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Card, IconTile } from "./explore-ui";
import {
  ApprovedBadge,
  AwaitingBadge,
  EnlargeModal,
  Pair,
  StepIndicator,
  XeroConceptWorkspace,
  type WorkspaceData,
} from "./explore-xero-shared";

// Customer invoicing illustrative walkthrough (4 steps).
// Australian English. No em dash or en dash characters anywhere in this file.
// Fictional customers, business Coastal Services.
// All data is fictional sample data. This preview does not send records or
// connect to Xero. "Approve" only changes state in this browser tab.
// Money is worked in whole cents so subtotal, GST (10%) and total always add up.

type SampleJob = {
  id: string;
  ref: string;
  customer: string;
  suburb: string;
  service: string;
  lines: { description: string; qty: string; rate: string }[];
};

const BUSINESS = "Coastal Services";
const CURRENCY = "AUD";
const MAX_LINES = 5;

const SAMPLE_JOBS: SampleJob[] = [
  {
    id: "a",
    ref: "CS-DEMO-001",
    customer: "Alex",
    suburb: "Maroochydore",
    service: "Service visit",
    lines: [
      {
        description: "Routine maintenance call and safety check for the rear air unit.",
        qty: "1",
        rate: "250.00",
      },
    ],
  },
  {
    id: "b",
    ref: "CS-DEMO-002",
    customer: "Priya",
    suburb: "Buderim",
    service: "Filter replacement",
    lines: [
      { description: "Replacement filters", qty: "2", rate: "45.00" },
      { description: "Labour (hours)", qty: "1.5", rate: "110.00" },
    ],
  },
  {
    id: "c",
    ref: "CS-DEMO-003",
    customer: "Sam",
    suburb: "Mooloolaba",
    service: "Split system install",
    lines: [
      { description: "Split system supply and install", qty: "1", rate: "1890.00" },
      { description: "Pipe and fittings", qty: "1", rate: "235.40" },
    ],
  },
];

type EditLine = { key: number; description: string; qty: string; rate: string };

function parseQty(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n <= 9999 ? n : null;
}

function parseRate(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 1000000 ? n : null;
}

function toEditLines(j: SampleJob): EditLine[] {
  return j.lines.map((l, i) => ({ key: i, ...l }));
}

const money = (cents: number) => (cents / 100).toFixed(2);

const primaryBtn =
  "sys-gradient-fill inline-flex min-h-[44px] items-center max-sm:w-full max-sm:justify-center gap-1.5 rounded-[14px] px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100";
const ghostBtn =
  "inline-flex min-h-[44px] items-center max-sm:w-full max-sm:justify-center gap-1.5 rounded-[14px] bg-white px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50";
const inputCls =
  "mt-1 min-h-[44px] w-full rounded-[10px] bg-white px-3 py-2 text-base outline-none sm:text-sm focus:ring-4 focus:ring-blue-300/30";
const labelCls =
  "text-[13px] font-bold tracking-normal sm:text-[10px] sm:uppercase sm:tracking-wider";

export function CustomerInvoicingDemo() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [jobId, setJobId] = useState(SAMPLE_JOBS[0]!.id);
  const [lines, setLines] = useState<EditLine[]>(() => toEditLines(SAMPLE_JOBS[0]!));
  const [nextKey, setNextKey] = useState(100);
  const [enlarged, setEnlarged] = useState(false);

  const job = SAMPLE_JOBS.find((j) => j.id === jobId) ?? SAMPLE_JOBS[0]!;

  const parsed = lines.map((l) => {
    const qty = parseQty(l.qty);
    const rate = parseRate(l.rate);
    const descOk = l.description.trim() !== "";
    return {
      qty,
      rate,
      descOk,
      valid: qty !== null && rate !== null && descOk,
      cents: qty !== null && rate !== null ? Math.round(qty * rate * 100) : 0,
    };
  });
  const allValid = lines.length > 0 && parsed.every((p) => p.valid);
  const subtotalCents = parsed.reduce((sum, p) => sum + p.cents, 0);
  const gstCents = Math.round(subtotalCents * 0.1);
  const totalCents = subtotalCents + gstCents;

  const pickJob = (id: string) => {
    const j = SAMPLE_JOBS.find((x) => x.id === id);
    if (!j) return;
    setJobId(id);
    setLines(toEditLines(j));
  };

  const updateLine = (key: number, patch: Partial<EditLine>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const addLine = () => {
    if (lines.length >= MAX_LINES) return;
    setLines((ls) => [...ls, { key: nextKey, description: "", qty: "1", rate: "0.00" }]);
    setNextKey((k) => k + 1);
  };

  const removeLine = (key: number) =>
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));

  const reset = () => {
    setStep(1);
    setJobId(SAMPLE_JOBS[0]!.id);
    setLines(toEditLines(SAMPLE_JOBS[0]!));
    setNextKey(100);
    setEnlarged(false);
  };

  const invoiceWorkspaceData: WorkspaceData = {
    kind: "invoice",
    partyName: job.customer,
    party2Name: BUSINESS,
    ref: job.ref,
    date: "22 Oct 2026",
    due: "5 Nov 2026",
    currency: CURRENCY,
    description: lines[0]?.description ?? "",
    qty: parsed[0]?.qty ?? 0,
    rate: parsed[0]?.rate ?? 0,
    lines: lines.map((l, i) => ({
      description: l.description.trim() || "(no description)",
      qty: parsed[i]?.qty ?? 0,
      rate: parsed[i]?.rate ?? 0,
    })),
    tax: gstCents / 100,
    total: totalCents / 100,
    statusLabel: step === 4 ? "Sent (example only)" : "Draft",
  };

  const totalsBlock = (
    <dl className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-[13px] font-medium sm:text-xs" style={{ color: "var(--sys-muted)" }}>
          Subtotal (ex GST)
        </dt>
        <dd className="font-semibold" style={{ color: "var(--sys-navy)" }}>
          {CURRENCY} {money(subtotalCents)}
        </dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-[13px] font-medium sm:text-xs" style={{ color: "var(--sys-muted)" }}>
          GST (10%)
        </dt>
        <dd className="font-semibold" style={{ color: "var(--sys-navy)" }}>
          {CURRENCY} {money(gstCents)}
        </dd>
      </div>
      <div
        className="flex items-center justify-between border-t pt-2"
        style={{ borderColor: "var(--sys-border)" }}
      >
        <dt className="text-[13px] font-bold sm:text-xs" style={{ color: "var(--sys-navy)" }}>
          Total
        </dt>
        <dd className="text-base font-bold" style={{ color: "var(--sys-green)" }}>
          {CURRENCY} {money(totalCents)}
        </dd>
      </div>
    </dl>
  );

  return (
    <div className="space-y-4">
      <StepIndicator steps={["Pick job", "Edit", "Approve", "Sent"]} current={step} />

      {/* Step 1: Pick a sample job */}
      {step === 1 && (
        <Card className="!p-4 sm:!p-5">
          <div
            className="flex items-center gap-3 border-b pb-4"
            style={{ borderColor: "var(--sys-border)" }}
          >
            <IconTile icon={Receipt} color="var(--sys-blue)" />
            <div>
              <h4
                className="text-base font-bold"
                style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Pick a sample job
              </h4>
              <p className="text-[13px] sm:text-xs" style={{ color: "var(--sys-muted)" }}>
                Fictional jobs for {BUSINESS}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2" role="group" aria-label="Sample jobs">
            {SAMPLE_JOBS.map((j) => {
              const selected = j.id === jobId;
              return (
                <button
                  key={j.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pickJob(j.id)}
                  className="flex min-h-[44px] w-full min-w-0 items-center justify-between gap-3 rounded-[12px] px-4 py-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
                  style={{
                    border: `1px solid ${selected ? "var(--sys-blue)" : "var(--sys-border)"}`,
                    backgroundColor: selected ? "rgba(30, 136, 229, 0.06)" : "white",
                    color: "var(--sys-navy)",
                  }}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{j.service}</span>
                    <span
                      className="block text-[13px] sm:text-xs"
                      style={{ color: "var(--sys-muted)" }}
                    >
                      {j.customer}, {j.suburb} · {j.ref}
                    </span>
                  </span>
                  {selected && (
                    <Check
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--sys-blue)" }}
                      strokeWidth={2.6}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Pair label="Customer" value={job.customer} />
            <Pair label="Business" value={BUSINESS} />
            <Pair label="Suburb" value={job.suburb} />
            <Pair label="Service" value={job.service} />
          </dl>
          <div className="mt-5 flex flex-col sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setStep(2)} className={primaryBtn}>
              Continue
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </Card>
      )}

      {/* Step 2: Edit lines */}
      {step === 2 && (
        <Card className="!p-4 sm:!p-5">
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
            style={{ borderColor: "var(--sys-border)" }}
          >
            <div className="flex items-center gap-3">
              <IconTile icon={FileText} color="var(--sys-violet)" />
              <div>
                <h4
                  className="text-base font-bold"
                  style={{
                    color: "var(--sys-navy)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Edit sample draft
                </h4>
                <p className="text-[13px] sm:text-xs" style={{ color: "var(--sys-muted)" }}>
                  {job.ref} · amounts are before GST
                </p>
              </div>
            </div>
            <AwaitingBadge />
          </div>

          <div className="mt-4 space-y-3">
            {lines.map((l, i) => {
              const p = parsed[i]!;
              return (
                <div
                  key={l.key}
                  className="min-w-0 rounded-[12px] p-3"
                  style={{ border: "1px solid var(--sys-border)", backgroundColor: "#F8FAFC" }}
                >
                  <label
                    className={labelCls}
                    style={{ color: "var(--sys-blue-dark)" }}
                    htmlFor={`inv-desc-${l.key}`}
                  >
                    Line {i + 1} description
                  </label>
                  <input
                    id={`inv-desc-${l.key}`}
                    type="text"
                    value={l.description}
                    maxLength={120}
                    aria-invalid={!p.descOk}
                    onChange={(e) => updateLine(l.key, { description: e.target.value })}
                    className={inputCls}
                    style={{
                      border: `1px solid ${p.descOk ? "var(--sys-border)" : "#B45309"}`,
                      color: "var(--sys-navy)",
                    }}
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <div className="min-w-0">
                      <label
                        className={labelCls}
                        style={{ color: "var(--sys-blue-dark)" }}
                        htmlFor={`inv-qty-${l.key}`}
                      >
                        Qty
                      </label>
                      <input
                        id={`inv-qty-${l.key}`}
                        type="text"
                        inputMode="decimal"
                        value={l.qty}
                        maxLength={7}
                        aria-invalid={p.qty === null}
                        onChange={(e) => updateLine(l.key, { qty: e.target.value })}
                        className={inputCls}
                        style={{
                          border: `1px solid ${p.qty !== null ? "var(--sys-border)" : "#B45309"}`,
                          color: "var(--sys-navy)",
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <label
                        className={labelCls}
                        style={{ color: "var(--sys-blue-dark)" }}
                        htmlFor={`inv-rate-${l.key}`}
                      >
                        Unit price (ex GST)
                      </label>
                      <input
                        id={`inv-rate-${l.key}`}
                        type="text"
                        inputMode="decimal"
                        value={l.rate}
                        maxLength={10}
                        aria-invalid={p.rate === null}
                        onChange={(e) => updateLine(l.key, { rate: e.target.value })}
                        className={inputCls}
                        style={{
                          border: `1px solid ${p.rate !== null ? "var(--sys-border)" : "#B45309"}`,
                          color: "var(--sys-navy)",
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className={labelCls} style={{ color: "var(--sys-blue-dark)" }}>
                        Line total
                      </div>
                      <div
                        className="mt-1 flex min-h-[44px] items-center text-sm font-semibold"
                        style={{ color: "var(--sys-navy)" }}
                      >
                        {CURRENCY} {money(p.cents)}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeLine(l.key)}
                        disabled={lines.length <= 1}
                        aria-label={`Remove line ${i + 1}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ border: "1px solid var(--sys-border)", color: "var(--sys-muted)" }}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addLine}
              disabled={lines.length >= MAX_LINES}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 disabled:cursor-not-allowed disabled:opacity-50 max-sm:w-full max-sm:justify-center"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Add line
            </button>
          </div>

          <div
            className="mt-4 rounded-[12px] p-4"
            style={{ border: "1px solid var(--sys-border)" }}
            aria-live="polite"
          >
            {totalsBlock}
          </div>
          {!allValid && (
            <p
              className="mt-2 text-[13px] font-medium sm:text-xs"
              style={{ color: "#92400E" }}
              role="alert"
            >
              Check the highlighted fields: each line needs a description, a quantity above 0 (up to
              9999) and a unit price of 0 or more.
            </p>
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={ghostBtn}
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
              Back
            </button>
            <button
              type="button"
              disabled={!allValid}
              onClick={() => setStep(3)}
              className={primaryBtn}
            >
              Continue to approval
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Approve */}
      {step === 3 && (
        <Card className="!p-4 sm:!p-5">
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
            style={{ borderColor: "var(--sys-border)" }}
          >
            <div className="flex items-center gap-3">
              <IconTile icon={Check} color="var(--sys-green)" />
              <div>
                <h4
                  className="text-base font-bold"
                  style={{
                    color: "var(--sys-navy)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Approve the sample draft
                </h4>
                <p className="text-[13px] sm:text-xs" style={{ color: "var(--sys-muted)" }}>
                  {job.ref} · {job.customer}
                </p>
              </div>
            </div>
            <AwaitingBadge />
          </div>
          <div
            className="mt-4 rounded-[12px] p-4"
            style={{ border: "1px solid var(--sys-border)" }}
          >
            {totalsBlock}
          </div>
          <div
            className="mt-4 rounded-[14px] p-4"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.15)",
            }}
          >
            <p
              className="text-[13px] leading-relaxed sm:text-xs"
              style={{ color: "var(--sys-body)" }}
            >
              <strong style={{ color: "var(--sys-navy)" }}>Example only.</strong> Approving here
              only changes what you see on this page. Nothing is sent to a customer and nothing is
              posted to any accounting software. In a real build, nothing goes out until a person
              approves it.
            </p>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className={ghostBtn}
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
              Back
            </button>
            <button type="button" onClick={() => setStep(4)} className={primaryBtn}>
              <Check className="h-4 w-4" strokeWidth={2.4} />
              Approve (example)
            </button>
          </div>
        </Card>
      )}

      {/* Step 4: Sent state (simulated) */}
      {step === 4 && (
        <Card className="!p-4 sm:!p-5">
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
            style={{ borderColor: "var(--sys-border)" }}
          >
            <div className="flex items-center gap-3">
              <IconTile icon={Receipt} color="var(--sys-blue)" />
              <div>
                <h4
                  className="text-base font-bold"
                  style={{
                    color: "var(--sys-navy)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Marked as sent (example)
                </h4>
                <p className="text-[13px] sm:text-xs" style={{ color: "var(--sys-muted)" }}>
                  Side by side, sample data
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnlarged(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold transition-colors max-sm:w-full max-sm:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              Enlarge preview
            </button>
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Systemations record (left) */}
            <div
              className="min-w-0 rounded-[14px] p-4"
              style={{ border: "1px solid var(--sys-border)", backgroundColor: "#F8FAFC" }}
            >
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--sys-blue-dark)" }}
              >
                Systemations record
              </div>
              <dl className="mt-3 min-w-0 space-y-2 text-[13px] sm:text-xs">
                <Pair label="Customer" value={job.customer} />
                <Pair label="Business" value={BUSINESS} />
                <Pair label="Reference" value={job.ref} />
                {lines.map((l, i) => (
                  <Pair
                    key={l.key}
                    label={`Line ${i + 1}`}
                    value={`${l.description.trim()} (${parsed[i]!.qty} x ${CURRENCY} ${(parsed[i]!.rate ?? 0).toFixed(2)})`}
                  />
                ))}
                <Pair label="Subtotal" value={`${CURRENCY} ${money(subtotalCents)}`} />
                <Pair label="GST (10%)" value={`${CURRENCY} ${money(gstCents)}`} />
                <div
                  className="flex justify-between border-t pt-2"
                  style={{ borderColor: "var(--sys-border)" }}
                >
                  <dt className="font-bold" style={{ color: "var(--sys-navy)" }}>
                    Total
                  </dt>
                  <dd className="font-bold" style={{ color: "var(--sys-green)" }}>
                    {CURRENCY} {money(totalCents)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3">
                <ApprovedBadge />
              </div>
            </div>

            {/* Concept sales invoice (right) */}
            <div className="min-w-0">
              <div
                className="mb-1.5 text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--sys-violet-dark)" }}
              >
                Example of the record in Xero
              </div>
              <XeroConceptWorkspace data={invoiceWorkspaceData} />
            </div>
          </div>

          <div
            className="mt-4 rounded-[14px] p-4"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.15)",
            }}
          >
            <p
              className="text-[13px] leading-relaxed sm:text-xs"
              style={{ color: "var(--sys-body)" }}
            >
              <strong style={{ color: "var(--sys-navy)" }}>Illustration only.</strong> The "sent"
              status is simulated in this page. No invoice was sent to anyone and nothing was posted
              to Xero or any other accounting software.
            </p>
          </div>

          <div
            className="mt-3 rounded-[14px] p-4"
            style={{
              backgroundColor: "rgba(30, 136, 229, 0.05)",
              border: "1px solid var(--sys-border)",
            }}
          >
            <p
              className="text-[13px] leading-relaxed sm:text-xs"
              style={{ color: "var(--sys-body)" }}
            >
              In a real build, any link between Systemations and your accounting software is agreed,
              set up and tested for your business first. Scope and mapping are confirmed in your
              build. This is not a blanket two-way sync.
            </p>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className={ghostBtn}
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
              Back
            </button>
            <button
              type="button"
              onClick={reset}
              className={ghostBtn}
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2.4} />
              Start again
            </button>
          </div>
        </Card>
      )}

      <EnlargeModal open={enlarged} onClose={() => setEnlarged(false)}>
        <XeroConceptWorkspace data={invoiceWorkspaceData} />
      </EnlargeModal>
    </div>
  );
}
