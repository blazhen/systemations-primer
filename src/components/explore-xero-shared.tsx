import { useEffect, useRef, useState } from "react";
import { Check, Clock, FileText, Maximize2, Paperclip, Receipt, X } from "lucide-react";

// Xero and bookkeeping shared primitives.
// Australian English. No em dash or en dash characters anywhere in this file.
// All data is fictional sample data. This is a browser-local concept
// preview, not a live Xero connection or deployed AI integration.

// True when the viewport is at least `px` wide. Null until mounted, so the server
// and first browser render agree (callers then rely on CSS breakpoints).
export function useMinWidth(px: number): boolean | null {
  const [wide, setWide] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [px]);
  return wide;
}

export function ConceptBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: "rgba(30, 136, 229, 0.1)",
        border: "1px solid rgba(30, 136, 229, 0.2)",
        color: "var(--sys-blue-dark)",
      }}
    >
      <FileText className="h-3 w-3" strokeWidth={2.4} />
      Example only
    </span>
  );
}

export function AwaitingBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
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

export function ApprovedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
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

export function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-2">
      <dt className="shrink-0" style={{ color: "var(--sys-muted)" }}>
        {label}
      </dt>
      <dd
        className="min-w-0 break-words text-right font-semibold"
        style={{ color: "var(--sys-navy)" }}
      >
        {value}
      </dd>
    </div>
  );
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-start gap-1.5" aria-label="Steps">
      {steps.map((label, i) => {
        const s = i + 1;
        const done = current > s;
        const active = current === s;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex min-w-0 flex-1 list-none flex-col items-center gap-1"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-7 sm:w-7"
              style={{
                background:
                  active || done ? "linear-gradient(to right, #1E6FB8, #174A78)" : "#F1F5F9",
                color: active || done ? "#fff" : "var(--sys-muted)",
              }}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : s}
            </div>
            <span
              className={`text-center text-[13px] font-semibold leading-tight sm:text-[10px] ${active ? "" : "max-sm:sr-only"}`}
              style={{ color: active ? "var(--sys-navy)" : "var(--sys-muted)" }}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Xero concept workspace (HTML and CSS, not a screenshot)
// ---------------------------------------------------------------------------
export interface WorkspaceData {
  kind: "bill" | "invoice";
  partyName: string;
  party2Name?: string;
  ref: string;
  date: string;
  due: string;
  currency: string;
  description: string;
  qty: number;
  rate: number;
  /** Optional multiple lines. When absent, one line is built from description, qty and rate. */
  lines?: { description: string; qty: number; rate: number }[];
  tax: number;
  total: number;
  /** Status pill text. Defaults to "Draft". */
  statusLabel?: string;
  documentName?: string;
  reviewerNote?: string;
}

export function XeroConceptWorkspace({ data }: { data: WorkspaceData }) {
  const lines = data.lines ?? [{ description: data.description, qty: data.qty, rate: data.rate }];
  const subtotal = lines.reduce((sum, l) => sum + Math.round(l.qty * l.rate * 100) / 100, 0);
  return (
    <div
      className="min-w-0 overflow-hidden rounded-[16px] max-sm:!shadow-none"
      style={{
        border: "1px solid var(--sys-border)",
        boxShadow: "0 8px 24px rgba(20, 33, 61, 0.08)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(to right, #1E6FB8, #174A78)" }}
      >
        <span
          className="text-sm font-bold text-white"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Xero · example only
        </span>
        <span className="text-xs font-medium text-white/70">
          {data.kind === "bill" ? "Purchases / Bills" : "Sales / Invoices"}
        </span>
      </div>

      <div className="min-w-0 bg-white p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(30, 136, 229, 0.1)",
                color: "var(--sys-blue-dark)",
                border: "1px solid rgba(30, 136, 229, 0.2)",
              }}
            >
              {data.statusLabel ?? "Draft"}
            </span>
            <h4
              className="mt-2 text-base font-bold sm:text-lg"
              style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {data.partyName}
            </h4>
            {data.party2Name && (
              <p className="text-[13px]" style={{ color: "var(--sys-muted)" }}>
                {data.party2Name}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4 sm:text-xs">
          <div>
            <dt className="font-medium" style={{ color: "var(--sys-muted)" }}>
              Reference
            </dt>
            <dd className="mt-0.5 font-semibold" style={{ color: "var(--sys-navy)" }}>
              {data.ref}
            </dd>
          </div>
          <div>
            <dt className="font-medium" style={{ color: "var(--sys-muted)" }}>
              Date
            </dt>
            <dd className="mt-0.5 font-semibold" style={{ color: "var(--sys-navy)" }}>
              {data.date}
            </dd>
          </div>
          <div>
            <dt className="font-medium" style={{ color: "var(--sys-muted)" }}>
              Due
            </dt>
            <dd className="mt-0.5 font-semibold" style={{ color: "var(--sys-navy)" }}>
              {data.due}
            </dd>
          </div>
          <div>
            <dt className="font-medium" style={{ color: "var(--sys-muted)" }}>
              Currency
            </dt>
            <dd className="mt-0.5 font-semibold" style={{ color: "var(--sys-navy)" }}>
              {data.currency}
            </dd>
          </div>
        </dl>

        <div
          className="mt-4 min-w-0 overflow-x-auto rounded-[10px]"
          style={{ border: "1px solid var(--sys-border)" }}
        >
          <table className="w-full text-[13px] sm:min-w-[420px] sm:text-xs">
            <thead className="max-sm:hidden">
              <tr
                style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid var(--sys-border)" }}
              >
                <th
                  className="px-3 py-2 text-left font-semibold"
                  style={{ color: "var(--sys-muted)" }}
                >
                  Description
                </th>
                <th
                  className="px-3 py-2 text-right font-semibold"
                  style={{ color: "var(--sys-muted)" }}
                >
                  Qty
                </th>
                <th
                  className="px-3 py-2 text-right font-semibold"
                  style={{ color: "var(--sys-muted)" }}
                >
                  Unit amount
                </th>
                <th
                  className="px-3 py-2 text-right font-semibold"
                  style={{ color: "var(--sys-muted)" }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="max-sm:block">
              {lines.map((l, idx) => (
                <tr
                  key={idx}
                  className="max-sm:block max-sm:px-3 max-sm:py-2"
                  style={{ borderBottom: "1px solid var(--sys-border)" }}
                >
                  <td
                    className="break-words px-3 py-2.5 max-sm:block max-sm:px-0 max-sm:py-0.5 max-sm:font-semibold"
                    style={{ color: "var(--sys-navy)" }}
                  >
                    {l.description}
                  </td>
                  <td
                    data-label="Qty"
                    className="px-3 py-2.5 text-right max-sm:flex max-sm:justify-between max-sm:px-0 max-sm:py-0.5 max-sm:before:content-[attr(data-label)]"
                    style={{ color: "var(--sys-navy)" }}
                  >
                    {l.qty}
                  </td>
                  <td
                    data-label="Unit amount"
                    className="px-3 py-2.5 text-right max-sm:flex max-sm:justify-between max-sm:px-0 max-sm:py-0.5 max-sm:before:content-[attr(data-label)]"
                    style={{ color: "var(--sys-navy)" }}
                  >
                    {data.currency} {l.rate.toFixed(2)}
                  </td>
                  <td
                    data-label="Amount"
                    className="px-3 py-2.5 text-right font-semibold max-sm:flex max-sm:justify-between max-sm:px-0 max-sm:py-0.5 max-sm:before:content-[attr(data-label)]"
                    style={{ color: "var(--sys-navy)" }}
                  >
                    {data.currency} {(Math.round(l.qty * l.rate * 100) / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex justify-end">
          <dl className="w-full max-w-[200px] space-y-1.5 text-[13px] max-sm:max-w-none sm:text-xs">
            <Pair label="Subtotal" value={`${data.currency} ${subtotal.toFixed(2)}`} />
            <Pair label="GST (10%)" value={`${data.currency} ${data.tax.toFixed(2)}`} />
            <div
              className="flex justify-between border-t pt-1.5"
              style={{ borderColor: "var(--sys-border)" }}
            >
              <dt className="font-bold" style={{ color: "var(--sys-navy)" }}>
                Total
              </dt>
              <dd className="font-bold" style={{ color: "var(--sys-green)" }}>
                {data.currency} {data.total.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        {data.documentName && (
          <div
            className="mt-4 flex items-center gap-2 rounded-[10px] px-3 py-2.5"
            style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--sys-border)" }}
          >
            <Paperclip
              className="h-4 w-4 shrink-0"
              style={{ color: "var(--sys-muted)" }}
              strokeWidth={2}
            />
            <span
              className="min-w-0 break-words text-xs font-medium"
              style={{ color: "var(--sys-navy)" }}
            >
              {data.documentName}
            </span>
            <span
              className="ml-auto text-[13px] font-semibold sm:text-[10px]"
              style={{ color: "var(--sys-muted)" }}
            >
              Sample attachment
            </span>
          </div>
        )}

        {data.reviewerNote && (
          <div
            className="mt-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium sm:text-xs"
            style={{
              backgroundColor: "rgba(30, 136, 229, 0.06)",
              border: "1px solid rgba(30, 136, 229, 0.15)",
              color: "var(--sys-navy)",
            }}
          >
            {data.reviewerNote}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enlarge modal (accessible, focus restoration, Escape, body scroll lock)
// ---------------------------------------------------------------------------
export function EnlargeModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      triggerRef.current = document.activeElement;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (!first || !last) {
          e.preventDefault();
          return;
        }
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || active === dialog) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || active === dialog) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
      const trigger = triggerRef.current;
      if (trigger && trigger.isConnected) {
        requestAnimationFrame(() => trigger.focus());
      }
      triggerRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center sm:p-6">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(7, 14, 27, 0.82)" }}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-full sm:max-w-[900px] sm:rounded-[20px] sm:shadow-[0_30px_70px_-20px_rgba(7,14,27,0.6)]"
        role="dialog"
        aria-modal="true"
        aria-label="Enlarged example preview, nothing is sent"
        tabIndex={-1}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3"
          style={{ borderColor: "var(--sys-border)" }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Example preview
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            aria-label="Close enlarged preview"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
            <span className="sm:sr-only">Close</span>
          </button>
        </div>
        <div
          className="flex-1 overflow-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
          style={{ backgroundColor: "#F8FAFC" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Re-export for convenience so the main module can import icons it needs.
export { Receipt, Maximize2 };
