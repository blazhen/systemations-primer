import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Building2, Check, ClipboardCheck, Copy, Download, Pencil, Trash2 } from "lucide-react";
import { Card } from "./explore-ui";
import {
  clearDemoValue,
  DEMO_KEYS,
  DEMO_TTL_LABEL,
  loadDemoValue,
  saveDemoValue,
} from "../lib/demo-storage";

// Business brief: context, form, review and message builders.
// Australian English. No em dashes or en dashes anywhere in this file.
// The brief is kept in this browser (localStorage) for 24 hours so a refresh
// does not lose it, and can be cleared at any time. It is never sent anywhere. No CRM submission is made. No website scanning or
// import is claimed. Business input is rendered as text only, never as
// unsafe HTML.

export type HelpWithOption = "enquiry-handling" | "quote-questions" | "appointment-enquiries";

export interface BusinessBrief {
  businessName: string;
  services: string;
  serviceArea: string;
  helpWith: HelpWithOption;
  instructions: string;
  website: string;
}

export const HELP_WITH_OPTIONS: { id: HelpWithOption; label: string }[] = [
  { id: "enquiry-handling", label: "Enquiry handling" },
  { id: "quote-questions", label: "Quote questions" },
  { id: "appointment-enquiries", label: "Appointment enquiries" },
];

const STORAGE_KEY = DEMO_KEYS.brief;

export const EMPTY_BRIEF: BusinessBrief = {
  businessName: "",
  services: "",
  serviceArea: "",
  helpWith: "enquiry-handling",
  instructions: "",
  website: "",
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface BriefContextValue {
  brief: BusinessBrief | null;
  setBrief: (brief: BusinessBrief | null) => void;
}

const BriefContext = createContext<BriefContextValue | null>(null);

export function BusinessBriefProvider({ children }: { children: React.ReactNode }) {
  const [brief, setBriefState] = useState<BusinessBrief | null>(null);

  // Loaded after mount so the server and browser render the same first frame.
  // Kept for DEMO_TTL_LABEL so a refresh does not wipe it; "Clear my business" removes it.
  useEffect(() => {
    const saved = loadDemoValue<BusinessBrief>(STORAGE_KEY);
    if (saved && typeof saved.businessName === "string") {
      setBriefState({ ...EMPTY_BRIEF, ...saved });
    }
  }, []);

  const setBrief = useCallback((b: BusinessBrief | null) => {
    setBriefState(b);
    if (b) {
      saveDemoValue(STORAGE_KEY, b);
    } else {
      clearDemoValue(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(() => ({ brief, setBrief }), [brief, setBrief]);

  return <BriefContext.Provider value={value}>{children}</BriefContext.Provider>;
}

export function useBusinessBrief() {
  const ctx = useContext(BriefContext);
  if (!ctx) {
    throw new Error("useBusinessBrief must be used within BusinessBriefProvider");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

export function helpWithLabel(id: HelpWithOption): string {
  return HELP_WITH_OPTIONS.find((o) => o.id === id)?.label ?? "Enquiry handling";
}

export function buildSetupMessage(brief: BusinessBrief): string {
  const lines: string[] = [];
  lines.push(`You are role-playing as the receptionist for ${brief.businessName}.`);
  lines.push("");
  lines.push("Use only the facts below. Do not invent services, prices, availability or promises.");
  lines.push("");
  lines.push(`Services: ${brief.services}`);
  if (brief.serviceArea.trim()) {
    lines.push(`Service area: ${brief.serviceArea}`);
  }
  lines.push(`What to help with: ${helpWithLabel(brief.helpWith)}`);
  if (brief.instructions.trim()) {
    lines.push(`Important instructions: ${brief.instructions}`);
  }
  lines.push("");
  lines.push(
    "Greet the customer using the business name and ask how you can help. Ask one question at a time. Do not claim to book a real appointment, send SMS or email, create an invoice, transfer a call or change an account.",
  );
  if (brief.website.trim()) {
    lines.push("");
    lines.push(
      `Website: ${brief.website} - this is provided as reference only. Do not claim you have read or opened it.`,
    );
  }
  return lines.join("\n");
}

export function buildSpokenBrief(brief: BusinessBrief): string {
  const parts: string[] = [];
  parts.push(`Business name: ${brief.businessName}.`);
  parts.push(`Main services: ${brief.services}.`);
  if (brief.serviceArea.trim()) {
    parts.push(`Service area: ${brief.serviceArea}.`);
  }
  parts.push(`Goal: ${helpWithLabel(brief.helpWith)}.`);
  if (brief.instructions.trim()) {
    parts.push(`Instructions: ${brief.instructions}.`);
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Copy button with clipboard fallback
// ---------------------------------------------------------------------------
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "fallback">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("fallback");
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "systemations-demo-brief.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="sys-gradient-fill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
        >
          {state === "copied" ? (
            <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={2.4} />
          )}
          {state === "copied" ? copiedLabel : label}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
          style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
          Download
        </button>
      </div>
      {state === "fallback" && (
        <div className="space-y-1">
          <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
            Could not copy automatically. Select the text below to copy it.
          </p>
          <pre
            className="select-all whitespace-pre-wrap rounded-[10px] p-3 text-xs"
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid var(--sys-border)",
              color: "var(--sys-navy)",
            }}
          >
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------
function isValidUrl(url: string): boolean {
  if (!url.trim()) return true;
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function BusinessBriefForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: BusinessBrief;
  onSave: (brief: BusinessBrief) => void;
  onCancel?: (() => void) | undefined;
}) {
  const [form, setForm] = useState<BusinessBrief>({ ...initial });
  type FormErrors = { businessName?: string; services?: string; website?: string };
  const [errors, setErrors] = useState<FormErrors>({});

  const update = <K extends keyof BusinessBrief>(key: K, value: BusinessBrief[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.businessName.trim()) {
      errs.businessName = "Please enter your business name.";
    }
    if (!form.services.trim()) {
      errs.services = "Please describe the services you provide.";
    }
    if (form.website.trim() && !isValidUrl(form.website)) {
      errs.website = "Enter a valid web address starting with http:// or https://.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(form);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div
        className="mb-4 flex items-center gap-3 border-b pb-4"
        style={{ borderColor: "var(--sys-border)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: "rgba(30, 136, 229, 0.1)", color: "var(--sys-blue)" }}
        >
          <Building2 className="h-4 w-4" strokeWidth={2} />
        </div>
        <div>
          <h4
            className="text-sm font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Use my business
          </h4>
          <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
            This preview uses the details you enter. Use public business information.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="bb-name"
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            Business name <span style={{ color: "var(--sys-green)" }}>*</span>
          </label>
          <input
            id="bb-name"
            type="text"
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value.slice(0, 80))}
            maxLength={80}
            required
            aria-invalid={Boolean(errors.businessName)}
            aria-describedby={errors.businessName ? "bb-name-err" : undefined}
            className="mt-2 w-full rounded-[12px] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-300/30"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            placeholder="Your business name"
          />
          {errors.businessName && (
            <p id="bb-name-err" role="alert" className="mt-1 text-xs" style={{ color: "#DC2626" }}>
              {errors.businessName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="bb-services"
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            What services do you provide? <span style={{ color: "var(--sys-green)" }}>*</span>
          </label>
          <textarea
            id="bb-services"
            value={form.services}
            onChange={(e) => update("services", e.target.value.slice(0, 600))}
            maxLength={600}
            required
            rows={3}
            aria-invalid={Boolean(errors.services)}
            aria-describedby={errors.services ? "bb-services-err" : undefined}
            className="mt-2 w-full resize-none rounded-[12px] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-300/30"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            placeholder="The services you offer"
          />
          {errors.services && (
            <p
              id="bb-services-err"
              role="alert"
              className="mt-1 text-xs"
              style={{ color: "#DC2626" }}
            >
              {errors.services}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="bb-area"
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            Service area (optional)
          </label>
          <input
            id="bb-area"
            type="text"
            value={form.serviceArea}
            onChange={(e) => update("serviceArea", e.target.value.slice(0, 200))}
            maxLength={200}
            className="mt-2 w-full rounded-[12px] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-300/30"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            placeholder="Where you work"
          />
        </div>

        <div>
          <label
            htmlFor="bb-help"
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            What should the assistant help with?
          </label>
          <select
            id="bb-help"
            value={form.helpWith}
            onChange={(e) => update("helpWith", e.target.value as HelpWithOption)}
            className="mt-2 w-full rounded-[12px] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-300/30"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          >
            {HELP_WITH_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="bb-instructions"
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            Important instructions (optional)
          </label>
          <textarea
            id="bb-instructions"
            value={form.instructions}
            onChange={(e) => update("instructions", e.target.value.slice(0, 500))}
            maxLength={500}
            rows={2}
            className="mt-2 w-full resize-none rounded-[12px] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-300/30"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            placeholder="Opening hours, or when a person should help"
          />
        </div>

        <div>
          <label
            htmlFor="bb-website"
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            Website (optional)
          </label>
          <input
            id="bb-website"
            type="url"
            value={form.website}
            onChange={(e) => update("website", e.target.value.slice(0, 300))}
            maxLength={300}
            aria-invalid={Boolean(errors.website)}
            aria-describedby={errors.website ? "bb-website-err" : undefined}
            className="mt-2 w-full rounded-[12px] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-300/30"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            placeholder="https://yourbusiness.com.au"
          />
          {errors.website && (
            <p
              id="bb-website-err"
              role="alert"
              className="mt-1 text-xs"
              style={{ color: "#DC2626" }}
            >
              {errors.website}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="submit"
            className="sys-gradient-fill inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
          >
            <Check className="h-4 w-4" strokeWidth={2.4} />
            Review my demo brief
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-white px-5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "var(--sys-muted)" }}>
          Your brief stays in this browser for {DEMO_TTL_LABEL} so a refresh does not lose it.
          Nothing is sent anywhere.
        </p>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-medium" style={{ color: "var(--sys-muted)" }}>
        {label}
      </dt>
      <dd
        className="max-w-[60%] text-right text-sm font-semibold"
        style={{ color: "var(--sys-navy)" }}
      >
        {value}
      </dd>
    </div>
  );
}

export function BusinessBriefReview({
  brief,
  onEdit,
  onClear,
}: {
  brief: BusinessBrief;
  onEdit: () => void;
  onClear: () => void;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div
        className="mb-4 flex items-center justify-between gap-3 border-b pb-4"
        style={{ borderColor: "var(--sys-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--sys-green)" }}
          >
            <Check className="h-4 w-4" strokeWidth={2.4} />
          </div>
          <div>
            <h4
              className="text-sm font-bold"
              style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Your demo brief
            </h4>
            <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
              {brief.businessName}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            color: "var(--sys-green-text)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--sys-green)" }}
          />
          Ready
        </span>
      </div>

      <dl className="space-y-2.5 text-sm">
        <ReviewRow label="Business name" value={brief.businessName} />
        <ReviewRow label="Services" value={brief.services} />
        {brief.serviceArea.trim() && <ReviewRow label="Service area" value={brief.serviceArea} />}
        <ReviewRow label="Help with" value={helpWithLabel(brief.helpWith)} />
        {brief.instructions.trim() && <ReviewRow label="Instructions" value={brief.instructions} />}
        {brief.website.trim() && <ReviewRow label="Website" value={brief.website} />}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[14px] bg-white px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
          style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2.4} />
          Edit details
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[14px] bg-white px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
          style={{ border: "1px solid var(--sys-border)", color: "#DC2626" }}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          Clear my business
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--sys-muted)" }}>
        Your brief stays in this browser for {DEMO_TTL_LABEL} so a refresh does not lose it. Nothing
        is sent anywhere. Use "Clear my business" to remove it now.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Panel (manages form and review flow)
// ---------------------------------------------------------------------------
export function BusinessBriefPanel() {
  const { brief, setBrief } = useBusinessBrief();
  const [editing, setEditing] = useState(false);

  if (brief && !editing) {
    return (
      <BusinessBriefReview
        brief={brief}
        onEdit={() => setEditing(true)}
        onClear={() => {
          setBrief(null);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <BusinessBriefForm
      initial={brief ?? EMPTY_BRIEF}
      onSave={(b) => {
        setBrief(b);
        setEditing(false);
      }}
      onCancel={brief ? () => setEditing(false) : undefined}
    />
  );
}
