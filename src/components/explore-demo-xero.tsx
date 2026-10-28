import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BillsReceiptsDemo } from "./explore-xero-bills";
import { CustomerInvoicingDemo } from "./explore-xero-invoicing";

// Xero and bookkeeping illustrative walkthrough.
// Australian English. No em dash or en dash characters anywhere in this file.
// All data is fictional sample data. This is a browser-local concept
// preview, not a live Xero connection or deployed AI integration. It does
// not process documents, connect to Xero, send financial records or make
// payments.

type XeroScenario = "bills" | "invoicing";

export function XeroDemo() {
  const [scenario, setScenario] = useState<XeroScenario>("bills");

  return (
    <div className="mx-auto max-w-[820px] space-y-4">
      <div className="text-center">
        <h3
          className="text-lg font-bold tracking-tight sm:text-xl"
          style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Bookkeeping
        </h3>
        <p className="mt-2 text-xs" style={{ color: "var(--sys-muted)" }}>
          Shown in Xero. We can explore QuickBooks and other accounting software on your call.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold" style={{ color: "var(--sys-muted)" }}>
          Example only · fictional data · Nothing is sent or posted to Xero.
        </span>
      </div>

      {/* Scenario selectors */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          aria-pressed={scenario === "bills"}
          onClick={() => setScenario("bills")}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
          style={{
            backgroundColor: scenario === "bills" ? "var(--sys-navy)" : "white",
            color: scenario === "bills" ? "#fff" : "var(--sys-navy)",
            border: `1px solid ${scenario === "bills" ? "var(--sys-navy)" : "var(--sys-border)"}`,
          }}
        >
          Bills & receipts
        </button>
        <button
          type="button"
          aria-pressed={scenario === "invoicing"}
          onClick={() => setScenario("invoicing")}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
          style={{
            backgroundColor: scenario === "invoicing" ? "var(--sys-navy)" : "white",
            color: scenario === "invoicing" ? "#fff" : "var(--sys-navy)",
            border: `1px solid ${scenario === "invoicing" ? "var(--sys-navy)" : "var(--sys-border)"}`,
          }}
        >
          Customer invoicing
        </button>
      </div>

      {scenario === "bills" ? <BillsReceiptsDemo /> : <CustomerInvoicingDemo />}

      <div
        className="overflow-hidden rounded-[16px] bg-white"
        style={{
          border: "1px solid var(--sys-border)",
          boxShadow: "0 2px 8px rgba(20, 33, 61, 0.03)",
        }}
      >
        <details>
          <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50">
            <span
              className="text-base font-bold"
              style={{
                color: "var(--sys-navy)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              How this could work for your business
            </span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(30, 136, 229, 0.08)", color: "var(--sys-blue)" }}
            >
              <ChevronDown className="h-4 w-4" />
            </span>
          </summary>
          <div
            className="space-y-3 border-t px-5 pb-5 pt-4"
            style={{ borderColor: "var(--sys-border)" }}
          >
            <p className="text-xs leading-relaxed" style={{ color: "var(--sys-body)" }}>
              <strong style={{ color: "var(--sys-navy)" }}>Built around your setup:</strong> Xero's
              capture tools can prepare documents; Systemations can coordinate collection, follow-up
              and approvals. Custom steps and accounting mappings are agreed and tested for your
              build.
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--sys-muted)" }}>
              Bank reconciliation depends on Xero's own tools and plan. This preview does not
              reconcile bank feeds or make payments.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
