import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Clipboard,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
} from "lucide-react";
import { Card, Wordmark } from "./explore-ui";
import { Reveal } from "./explore-motion";
import { useBusinessBrief, helpWithLabel } from "./explore-business-brief";
import { clearDemoValue, DEMO_KEYS, loadDemoValue, saveDemoValue } from "../lib/demo-storage";

// ---------------------------------------------------------------------------
// Ending section: one short line, priority shortcuts, two closed disclosures
// ---------------------------------------------------------------------------

const INTEREST_OPTIONS = [
  "Answering enquiries",
  "Following up leads and quotes",
  "Keeping admin organised",
  "Phone handling",
  "Email and drafts",
  "Quotes and invoices",
  "Calendars and reminders",
  "Reporting",
  "Bookkeeping",
  "Inbox and daily priorities",
];

const STORAGE_KEY = DEMO_KEYS.notes;

export function EndingSection() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-[820px] space-y-8">
        <Reveal>
          <p
            className="text-center text-lg font-semibold sm:text-xl"
            style={{
              color: "var(--sys-navy)",
              fontFamily: "var(--sys-font-display)",
            }}
          >
            Bring your questions to your Explore Your Options call.
          </p>
        </Reveal>

        <div className="space-y-4">
          <Reveal delay={80}>
            <CallNotesDisclosure />
          </Reveal>
          <Reveal delay={160}>
            <AboutCallDisclosure />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Call notes disclosure (local notes, save, copy, download)
// ---------------------------------------------------------------------------
function CallNotesDisclosure() {
  const [open, setOpen] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const { brief } = useBusinessBrief();

  const [loaded, setLoaded] = useState(false);

  // Load on page load (not only when the box is opened) so a refresh keeps the notes.
  useEffect(() => {
    const parsed = loadDemoValue<{ interests?: string[]; note?: string }>(STORAGE_KEY);
    if (parsed) {
      if (Array.isArray(parsed.interests)) setInterests(parsed.interests);
      if (typeof parsed.note === "string") setNote(parsed.note);
      setSaved(true);
    }
    setLoaded(true);
  }, []);

  // Save automatically a moment after typing stops. Kept for DEMO_TTL_LABEL.
  useEffect(() => {
    if (!loaded) return;
    const t = window.setTimeout(() => {
      if (!interests.length && !note) {
        clearDemoValue(STORAGE_KEY);
        return;
      }
      saveDemoValue(STORAGE_KEY, { interests, note });
      setSaved(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [interests, note, loaded]);

  const toggleInterest = (label: string) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
    setSaved(false);
  };

  const handleSave = () => {
    saveDemoValue(STORAGE_KEY, { interests, note });
    setSaved(true);
  };

  const handleClear = () => {
    clearDemoValue(STORAGE_KEY);
    setInterests([]);
    setNote("");
    setSaved(false);
  };

  const summaryText = useMemo(() => {
    const lines = ["My Explore Your Options call notes", ""];
    if (interests.length) {
      lines.push("What I'd like to explore:");
      interests.forEach((l) => lines.push(`- ${l}`));
      lines.push("");
    }
    if (brief) {
      lines.push("My business demo brief:");
      lines.push(`Business name: ${brief.businessName}`);
      lines.push(`Services: ${brief.services}`);
      if (brief.serviceArea.trim()) lines.push(`Service area: ${brief.serviceArea}`);
      lines.push(`Help with: ${helpWithLabel(brief.helpWith)}`);
      if (brief.instructions.trim()) lines.push(`Instructions: ${brief.instructions}`);
      if (brief.website.trim()) lines.push(`Website: ${brief.website}`);
      lines.push("");
    }
    if (note.trim()) {
      lines.push("Notes:");
      lines.push(note.trim());
    }
    return lines.join("\n");
  }, [interests, note, brief]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard failed, leave the text selectable below
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "explore-your-options-notes.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <Disclosure
      summary="Save a question for your call"
      open={open}
      onToggle={() => setOpen((v) => !v)}
    >
      <Card className="p-6 sm:p-7">
        <div
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--sys-blue-dark)" }}
        >
          Your interests
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((label) => {
            const active = interests.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleInterest(label)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sys-press focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
                style={{
                  backgroundColor: active ? "var(--sys-blue)" : "white",
                  color: active ? "#fff" : "var(--sys-navy)",
                  border: `1px solid ${active ? "var(--sys-blue)" : "var(--sys-border)"}`,
                }}
              >
                {active && <Check className="h-3 w-3" strokeWidth={2.6} />}
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <label
            htmlFor="prep-note"
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            A short note (optional)
          </label>
          <textarea
            id="prep-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            rows={3}
            placeholder="What would you like us to improve or show on the call?"
            className="mt-2 w-full resize-none rounded-[14px] bg-white p-4 text-sm leading-relaxed outline-none transition-colors focus:ring-4 focus:ring-blue-300/30"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="sys-gradient-fill inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold sys-press focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
          >
            {saved ? (
              <ClipboardCheck className="h-4 w-4" strokeWidth={2.4} />
            ) : (
              <Clipboard className="h-4 w-4" strokeWidth={2.4} />
            )}
            {saved ? "Saved on this device" : "Save my notes on this device"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-11 items-center justify-center gap-2 sys-press rounded-[14px] bg-white px-5 text-sm font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          >
            {copied ? (
              <ClipboardCheck className="h-4 w-4" strokeWidth={2.4} />
            ) : (
              <Copy className="h-4 w-4" strokeWidth={2.4} />
            )}
            {copied ? "Copied" : "Copy my call notes"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex h-11 items-center justify-center gap-2 sys-press rounded-[14px] bg-white px-5 text-sm font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          >
            <Download className="h-4 w-4" strokeWidth={2.4} />
            Download
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-11 items-center justify-center gap-2 sys-press rounded-[14px] bg-white px-5 text-sm font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
            style={{ border: "1px solid var(--sys-border)", color: "#B91C1C" }}
          >
            Reset notes
          </button>
        </div>

        <div
          className="mt-4 rounded-[14px] p-4"
          style={{
            backgroundColor: "rgba(20, 167, 154, 0.06)",
            border: "1px solid rgba(20, 167, 154, 0.15)",
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: "var(--sys-body)" }}>
            {saved ? (
              <>
                <strong style={{ color: "var(--sys-navy)" }}>Saved on this device.</strong> Copy
                these notes into your booking reply to share them with our team.
              </>
            ) : (
              <>
                <strong style={{ color: "var(--sys-navy)" }}>Notes stay on this device.</strong>{" "}
                Copy these notes into your booking reply to share them with our team.
              </>
            )}
          </p>
        </div>

        <details className="mt-3">
          <summary
            className="cursor-pointer text-xs font-semibold"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            Show my notes as text
          </summary>
          <pre
            className="mt-2 whitespace-pre-wrap rounded-[12px] p-3 text-xs"
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid var(--sys-border)",
              color: "var(--sys-navy)",
            }}
          >
            {summaryText}
          </pre>
        </details>
      </Card>
    </Disclosure>
  );
}

// ---------------------------------------------------------------------------
// About your call disclosure (short answers)
// ---------------------------------------------------------------------------
function AboutCallDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <Disclosure summary="About your call" open={open} onToggle={() => setOpen((v) => !v)}>
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--sys-body)" }}>
        <p>
          <strong style={{ color: "var(--sys-navy)" }}>
            Your call is with Dan or someone from our team.
          </strong>{" "}
          We'll explore what fits your business.
        </p>
        <p>
          <strong style={{ color: "var(--sys-navy)" }}>
            Your build includes only the features we agree with you.
          </strong>
        </p>
        <p>
          <strong style={{ color: "var(--sys-navy)" }}>Need to move your call?</strong> Reply to
          your booking text or email.
        </p>
      </div>
    </Disclosure>
  );
}

// ---------------------------------------------------------------------------
// Reusable disclosure (accessible, closed by default)
// ---------------------------------------------------------------------------
function Disclosure({
  summary,
  open,
  onToggle,
  children,
}: {
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sys-surface">
      <div
        className="overflow-hidden rounded-[16px] bg-white"
        style={{
          border: "1px solid var(--sys-border)",
          boxShadow: "0 2px 8px rgba(20, 33, 61, 0.03)",
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
        >
          <span
            className="text-base font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: "var(--sys-font-display)" }}
          >
            {summary}
          </span>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            style={{ backgroundColor: "rgba(30, 136, 229, 0.08)", color: "var(--sys-blue)" }}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>
        {open && (
          <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: "var(--sys-border)" }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer (section 10)
// ---------------------------------------------------------------------------
export function Footer() {
  return (
    <footer
      className="px-4 py-12 text-center sm:px-6"
      style={{
        backgroundColor: "#101f33",
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(30, 136, 229, 0.16), transparent 32%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <Reveal stagger className="mx-auto max-w-[600px] space-y-4">
        <div className="flex justify-center">
          <Wordmark small />
        </div>
        <div
          className="flex flex-col items-center gap-2 text-xs"
          style={{ color: "rgba(255, 255, 255, 0.6)" }}
        >
          <p className="font-medium" style={{ color: "rgba(255, 255, 255, 0.82)" }}>
            Systemations Pty Ltd
          </p>
          <a
            href="https://www.systemations.ai/privacy"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Privacy policy (opens in a new tab)"
            className="inline-flex min-h-11 items-center gap-1 font-semibold transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            Privacy
            <ExternalLink className="h-3 w-3" strokeWidth={2} />
          </a>
        </div>
      </Reveal>
    </footer>
  );
}
