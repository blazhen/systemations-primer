import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock, Maximize2, Receipt, RefreshCw } from "lucide-react";
import { Card, IconTile } from "./explore-ui";
import {
  AwaitingBadge,
  EnlargeModal,
  Pair,
  StepIndicator,
  XeroConceptWorkspace,
  type WorkspaceData,
} from "./explore-xero-shared";

// Bills and receipts illustrative walkthrough (3 steps).
// Australian English. No em dash or en dash characters anywhere in this file.
// Fictional supplier Harbour Trade Supplies, customer Coastal Services.
// All data is fictional sample data. This preview does not process
// documents, connect to Xero, send financial records or make payments.

const BILLS_JOB = {
  supplier: "Harbour Trade Supplies",
  customer: "Coastal Services",
  ref: "SUP-1042",
  date: "22 Oct 2026",
  due: "5 Nov 2026",
  currency: "AUD",
  description: "Fixings and consumables",
  qty: 1,
  rate: 200,
  tax: 20,
  total: 220,
};

export function BillsReceiptsDemo() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [desc, setDesc] = useState(BILLS_JOB.description);
  const [jobRef, setJobRef] = useState("");
  const [enlarged, setEnlarged] = useState(false);

  const reset = () => {
    setStep(1);
    setDesc(BILLS_JOB.description);
    setJobRef("");
  };

  const workspaceData: WorkspaceData = {
    kind: "bill",
    partyName: BILLS_JOB.supplier,
    ref: BILLS_JOB.ref,
    date: BILLS_JOB.date,
    due: BILLS_JOB.due,
    currency: BILLS_JOB.currency,
    description: desc,
    qty: BILLS_JOB.qty,
    rate: BILLS_JOB.rate,
    tax: BILLS_JOB.tax,
    total: BILLS_JOB.total,
    documentName: "supplier-invoice-sample.pdf · sample attachment",
    reviewerNote: "Draft prepared - bookkeeper review next",
  };

  return (
    <div className="space-y-4">
      <StepIndicator steps={["Paperwork", "Review", "Draft bill"]} current={step} />

      {/* Step 1: Paperwork */}
      {step === 1 && (
        <Card className="p-5">
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
                Paperwork
              </h4>
              <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
                A supplier invoice arrives for your business
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div
              className="min-w-0 rounded-[14px] p-4"
              style={{ border: "1px solid var(--sys-border)", backgroundColor: "#F8FAFC" }}
            >
              <div
                className="flex items-center gap-2 border-b pb-2"
                style={{ borderColor: "var(--sys-border)" }}
              >
                <Receipt className="h-4 w-4" style={{ color: "var(--sys-blue)" }} strokeWidth={2} />
                <span className="text-xs font-bold" style={{ color: "var(--sys-navy)" }}>
                  Supplier invoice
                </span>
              </div>
              <dl className="mt-3 space-y-2 text-xs">
                <Pair label="Supplier" value={BILLS_JOB.supplier} />
                <Pair label="Reference" value={BILLS_JOB.ref} />
                <Pair label="Date" value={BILLS_JOB.date} />
                <Pair label="Description" value={BILLS_JOB.description} />
                <div
                  className="flex justify-between border-t pt-2"
                  style={{ borderColor: "var(--sys-border)" }}
                >
                  <dt style={{ color: "var(--sys-muted)" }}>Total</dt>
                  <dd className="font-bold" style={{ color: "var(--sys-green)" }}>
                    {BILLS_JOB.currency} {BILLS_JOB.total.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>

            <div
              className="min-w-0 rounded-[14px] p-4"
              style={{
                border: "1px solid rgba(30, 136, 229, 0.2)",
                backgroundColor: "rgba(30, 136, 229, 0.04)",
              }}
            >
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: "rgba(30, 136, 229, 0.1)",
                  color: "var(--sys-blue-dark)",
                  border: "1px solid rgba(30, 136, 229, 0.2)",
                }}
              >
                Sample extraction
              </span>
              <h5
                className="mt-2 text-sm font-bold"
                style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Prepared for review
              </h5>
              <dl className="mt-3 space-y-2 text-xs">
                <Pair label="Supplier" value={BILLS_JOB.supplier} />
                <Pair label="Reference" value={BILLS_JOB.ref} />
                <Pair label="Date" value={BILLS_JOB.date} />
                <Pair label="Due" value={BILLS_JOB.due} />
                <Pair label="Description" value={BILLS_JOB.description} />
                <Pair
                  label="Amount ex GST"
                  value={`${BILLS_JOB.currency} ${BILLS_JOB.rate.toFixed(2)}`}
                />
                <Pair label="GST" value={`${BILLS_JOB.currency} ${BILLS_JOB.tax.toFixed(2)}`} />
                <div
                  className="flex justify-between border-t pt-2"
                  style={{ borderColor: "var(--sys-border)" }}
                >
                  <dt className="font-bold" style={{ color: "var(--sys-navy)" }}>
                    Total
                  </dt>
                  <dd className="font-bold" style={{ color: "var(--sys-green)" }}>
                    {BILLS_JOB.currency} {BILLS_JOB.total.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="sys-gradient-fill inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
            >
              Review the prepared details
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <Card className="p-5">
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
            style={{ borderColor: "var(--sys-border)" }}
          >
            <div className="flex items-center gap-3">
              <IconTile icon={Check} color="var(--sys-violet)" />
              <div>
                <h4
                  className="text-base font-bold"
                  style={{
                    color: "var(--sys-navy)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Review
                </h4>
                <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
                  {BILLS_JOB.ref} - {BILLS_JOB.supplier}
                </p>
              </div>
            </div>
            <AwaitingBadge />
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div
              className="min-w-0 rounded-[14px] p-3"
              style={{ border: "1px solid var(--sys-border)", backgroundColor: "#F8FAFC" }}
            >
              <div
                className="flex items-center gap-2 border-b pb-2"
                style={{ borderColor: "var(--sys-border)" }}
              >
                <Receipt
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--sys-blue)" }}
                  strokeWidth={2}
                />
                <span className="text-[11px] font-bold" style={{ color: "var(--sys-navy)" }}>
                  Source document
                </span>
              </div>
              <dl className="mt-2 space-y-1.5 text-xs">
                <Pair label="Supplier" value={BILLS_JOB.supplier} />
                <Pair label="Reference" value={BILLS_JOB.ref} />
                <Pair label="Date" value={BILLS_JOB.date} />
                <Pair label="Due" value={BILLS_JOB.due} />
              </dl>
            </div>

            <div
              className="min-w-0 rounded-[14px] p-3"
              style={{ border: "1px solid var(--sys-border)" }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--sys-blue-dark)" }}
              >
                Monetary summary
              </div>
              <dl className="mt-2 space-y-1.5 text-xs">
                <Pair
                  label="Amount ex GST"
                  value={`${BILLS_JOB.currency} ${BILLS_JOB.rate.toFixed(2)}`}
                />
                <Pair label="GST" value={`${BILLS_JOB.currency} ${BILLS_JOB.tax.toFixed(2)}`} />
                <div
                  className="flex justify-between border-t pt-1.5"
                  style={{ borderColor: "var(--sys-border)" }}
                >
                  <dt className="font-bold" style={{ color: "var(--sys-navy)" }}>
                    Total
                  </dt>
                  <dd className="font-bold" style={{ color: "var(--sys-green)" }}>
                    {BILLS_JOB.currency} {BILLS_JOB.total.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-4">
            <label
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--sys-blue-dark)" }}
              htmlFor="bills-desc"
            >
              Description (editable sample)
            </label>
            <textarea
              id="bills-desc"
              value={desc}
              maxLength={120}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="mt-2 w-full resize-none rounded-[12px] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-300/30"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            />
          </div>

          <div
            className="mt-4 rounded-[12px] p-3"
            style={{
              backgroundColor: "rgba(20, 167, 154, 0.06)",
              border: "1px solid rgba(20, 167, 154, 0.15)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold" style={{ color: "var(--sys-navy)" }}>
                Category: Materials & supplies
              </span>
              <span className="text-[10px] font-semibold" style={{ color: "var(--sys-teal)" }}>
                Suggestion - confirm with your bookkeeper
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              "Supplier and reference checked",
              "Amount and GST to review",
              "Original document retained",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-xs"
                style={{ color: "var(--sys-body)" }}
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(16, 185, 129, 0.12)" }}
                >
                  <Check
                    className="h-2.5 w-2.5"
                    style={{ color: "var(--sys-green-text)" }}
                    strokeWidth={2.6}
                  />
                </span>
                {item}
              </div>
            ))}
          </div>

          <div
            className="mt-4 rounded-[12px] p-3"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.15)",
            }}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" style={{ color: "#92400E" }} strokeWidth={2.4} />
              <span className="text-xs font-bold" style={{ color: "#92400E" }}>
                Missing job reference - needs review
              </span>
            </div>
            <p className="mt-1 text-[11px]" style={{ color: "var(--sys-body)" }}>
              Add a job reference so this bill can be matched to a job. A person checks coding and
              tax before approval.
            </p>
            <label
              className="mt-2 block text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--sys-blue-dark)" }}
              htmlFor="bills-job-ref"
            >
              Job reference (optional sample)
            </label>
            <input
              id="bills-job-ref"
              type="text"
              value={jobRef}
              maxLength={40}
              onChange={(e) => setJobRef(e.target.value)}
              placeholder="Optional job reference (sample)"
              className="mt-2 w-full rounded-[10px] bg-white px-3 py-2 text-xs outline-none focus:ring-4 focus:ring-blue-300/30"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] bg-white px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="sys-gradient-fill inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
            >
              Preview draft bill
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Draft bill */}
      {step === 3 && (
        <Card className="p-5">
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
                  Draft bill
                </h4>
                <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
                  {BILLS_JOB.ref} - {BILLS_JOB.supplier}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnlarged(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              Enlarge preview
            </button>
          </div>

          <div
            className="mt-3 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            Example of the record in Xero
          </div>

          <div className="mt-2">
            <XeroConceptWorkspace data={workspaceData} />
          </div>

          <div
            className="mt-4 rounded-[14px] p-4"
            style={{ border: "1px solid var(--sys-border)", backgroundColor: "#F8FAFC" }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--sys-blue-dark)" }}
            >
              Systemations workflow record (sample)
            </div>
            <div className="mt-3 space-y-2">
              {(
                [
                  { text: "Source document received", done: true },
                  { text: "Review owner assigned", done: true },
                  jobRef.trim()
                    ? { text: `Job reference: ${jobRef.trim()} - resolved`, done: true }
                    : { text: "Missing job reference - needs review", done: false },
                  { text: "Draft prepared", done: true },
                ] as { text: string; done: boolean }[]
              ).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "var(--sys-navy)" }}
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: item.done
                        ? "rgba(16, 185, 129, 0.12)"
                        : "rgba(245, 158, 11, 0.12)",
                    }}
                  >
                    {item.done ? (
                      <Check
                        className="h-2.5 w-2.5"
                        style={{ color: "var(--sys-green-text)" }}
                        strokeWidth={2.6}
                      />
                    ) : (
                      <Clock
                        className="h-2.5 w-2.5"
                        style={{ color: "#92400E" }}
                        strokeWidth={2.6}
                      />
                    )}
                  </span>
                  {item.text}
                  <span className="text-[10px] font-medium" style={{ color: "var(--sys-muted)" }}>
                    (sample)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-4 rounded-[14px] p-4"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.15)",
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: "var(--sys-body)" }}>
              <strong style={{ color: "var(--sys-navy)" }}>Illustration only</strong> - no data has
              been sent or posted to Xero or any other accounting software. This shows how a draft
              bill could look. In a real build, a bookkeeper would review it before anything is
              posted.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] bg-white px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
              Back
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] bg-white px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2.4} />
              Start again
            </button>
          </div>
        </Card>
      )}

      <EnlargeModal open={enlarged} onClose={() => setEnlarged(false)}>
        <XeroConceptWorkspace data={workspaceData} />
      </EnlargeModal>
    </div>
  );
}
