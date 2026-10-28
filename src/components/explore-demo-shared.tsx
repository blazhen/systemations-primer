import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, RefreshCw, Users } from "lucide-react";
import type { EnquiryState, TimelineEvent } from "./explore-data";
import { Card } from "./explore-ui";

// Shared demo primitives used by the text, phone and behind-the-scenes demos.

// ---------------------------------------------------------------------------
// Isolated widget frame. The loader snippet lives in a dedicated iframe
// srcDoc. Attribute values are escaped, the script reports a genuine load
// error to the parent, and the parent shows a loading state and a visible
// fallback with a retry. iframe onError does not fire for srcDoc content, so
// the script's own onerror posts a message instead.
// ---------------------------------------------------------------------------
const WIDGET_ERROR_MESSAGE = "sys-widget-error";

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function WidgetFrame({
  title,
  widget,
  allow,
  className,
  height,
  fallbackText,
}: {
  title: string;
  widget: { loaderUrl: string; resourcesUrl: string; widgetId: string };
  allow?: string | undefined;
  className?: string | undefined;
  height?: number | undefined;
  fallbackText: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Mount the iframe only once the panel is near the viewport (200px margin).
  useEffect(() => {
    const box = boxRef.current;
    if (!box || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(box);
    return () => io.disconnect();
  }, [inView]);

  const srcDoc = useMemo(
    () =>
      "<!DOCTYPE html>\n" +
      '<html lang="en">\n' +
      "<head>\n" +
      '<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      "<title>" +
      escapeAttr(title) +
      "</title>\n" +
      "<style>html,body{margin:0;padding:0;background:#F8FAFC;height:100%;font-family:Inter,system-ui,sans-serif}body{display:flex;align-items:center;justify-content:center;flex-direction:column}</style>\n" +
      "</head>\n" +
      "<body>\n" +
      '<script src="' +
      escapeAttr(widget.loaderUrl) +
      '" data-resources-url="' +
      escapeAttr(widget.resourcesUrl) +
      '" data-widget-id="' +
      escapeAttr(widget.widgetId) +
      '" onerror="parent.postMessage(\'' +
      WIDGET_ERROR_MESSAGE +
      "','*')\"></script>\n" +
      "</body>\n" +
      "</html>",
    [title, widget.loaderUrl, widget.resourcesUrl, widget.widgetId],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data === WIDGET_ERROR_MESSAGE && e.source === frameRef.current?.contentWindow) {
        setFailed(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // With server rendering the iframe can finish loading before React attaches onLoad, so the
  // loading text would never clear. Check the frame on mount, and always clear it after 4s.
  useEffect(() => {
    if (!inView || loaded || failed) return;
    const frame = frameRef.current;
    if (frame?.contentDocument?.readyState === "complete") setLoaded(true);
    const t = window.setTimeout(() => setLoaded(true), 4000);
    return () => window.clearTimeout(t);
  }, [attempt, loaded, failed, inView]);

  return (
    <div
      ref={boxRef}
      className={`relative w-full overflow-hidden ${className ?? ""}`}
      style={{ backgroundColor: "#F8FAFC", ...(height ? { height } : {}) }}
    >
      {inView && (
        <iframe
          key={attempt}
          ref={frameRef}
          title={title}
          srcDoc={srcDoc}
          loading="lazy"
          {...(allow ? { allow } : {})}
          onLoad={() => setLoaded(true)}
          className="h-full w-full"
          style={{ border: "none", display: "block", background: "#F8FAFC" }}
        />
      )}
      {!loaded && !failed && (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-[13px] sm:text-xs font-medium"
          style={{ color: "var(--sys-muted)" }}
          role="status"
        >
          <span className="h-3 w-3/5 max-w-[220px] rounded-full bg-slate-200 motion-safe:animate-pulse" />
          <span className="h-3 w-2/5 max-w-[150px] rounded-full bg-slate-200 motion-safe:animate-pulse" />
          <span>Loading...</span>
        </div>
      )}
      {failed && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
          style={{ backgroundColor: "#F8FAFC" }}
          role="alert"
        >
          <p
            className="text-[13px] sm:text-xs leading-relaxed"
            style={{ color: "var(--sys-body)" }}
          >
            {fallbackText}
          </p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setLoaded(false);
              setAttempt((a) => a + 1);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] sm:text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          >
            <RefreshCw className="h-3 w-3" strokeWidth={2} />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
      style={{
        backgroundColor: active ? "var(--sys-navy)" : "white",
        color: active ? "#fff" : "var(--sys-navy)",
        border: `1px solid ${active ? "var(--sys-navy)" : "var(--sys-border)"}`,
        boxShadow: active
          ? "0 8px 20px rgba(16, 32, 51, 0.18)"
          : "0 2px 6px rgba(20, 33, 61, 0.03)",
      }}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}

export function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto flex h-[min(460px,65dvh)] max-w-[420px] flex-col rounded-[28px] bg-white p-3 sm:h-[460px]"
      style={{
        border: "1px solid var(--sys-border)",
        boxShadow: "var(--sys-card-shadow)",
      }}
    >
      {children}
    </div>
  );
}

export function EnquiryCard({ enquiry }: { enquiry: EnquiryState }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h4
          className="text-sm font-bold"
          style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Captured enquiry
        </h4>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] sm:text-[11px] font-semibold"
          style={{ backgroundColor: "rgba(30, 136, 229, 0.1)", color: "var(--sys-blue-dark)" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--sys-blue)" }}
          />
          {enquiry.status}
        </span>
      </div>
      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label="Customer" value={enquiry.name} />
        <Row label="Business" value={enquiry.business} />
        {enquiry.service ? <Row label="Service" value={enquiry.service} /> : null}
        {enquiry.suburb ? <Row label="Suburb" value={enquiry.suburb} /> : null}
        {enquiry.callback ? <Row label="Callback" value={enquiry.callback} /> : null}
        {enquiry.booking ? <Row label="Booking" value={enquiry.booking} /> : null}
      </dl>
    </Card>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[13px] sm:text-xs font-medium" style={{ color: "var(--sys-muted)" }}>
        {label}
      </dt>
      <dd
        className="min-w-0 break-words text-right text-sm font-semibold"
        style={{ color: "var(--sys-navy)" }}
      >
        {value}
      </dd>
    </div>
  );
}

export function NextActionTimeline({ events }: { events: TimelineEvent[] }) {
  // On phones only the latest action shows its detail; the rest are collapsed.
  const [toggled, setToggled] = useState<Record<number, boolean>>({});
  const last = events.length - 1;
  return (
    <Card className="mt-4 p-4 sm:p-5">
      <h4
        className="mb-3 text-sm font-bold"
        style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        Next actions
      </h4>
      {events.length === 0 ? (
        <p className="text-sm leading-relaxed" style={{ color: "var(--sys-muted)" }}>
          Follow the suggested replies to see how actions appear here automatically.
        </p>
      ) : (
        <ol className="space-y-1 sm:space-y-3">
          {events.map((ev, i) => {
            const isOpen = toggled[i] ?? i === last;
            return (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-3 flex h-6 w-6 shrink-0 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[13px] sm:text-[10px] font-bold text-white sm:mt-0.5"
                  style={{ background: "linear-gradient(to right, #1E6FB8, #174A78)" }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setToggled((t) => ({ ...t, [i]: !isOpen }))}
                    className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 sm:pointer-events-none sm:min-h-0 sm:text-xs"
                    style={{ color: "var(--sys-navy)" }}
                  >
                    {ev.label}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 sm:hidden ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`${isOpen ? "block" : "hidden"} pb-2 text-sm leading-snug sm:block sm:pb-0 sm:text-xs`}
                    style={{ color: "var(--sys-body)" }}
                  >
                    {ev.detail}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export function TeamViewLabel() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] sm:text-[11px] font-semibold"
        style={{ backgroundColor: "rgba(30, 136, 229, 0.1)", color: "var(--sys-blue-dark)" }}
      >
        <Users className="h-3 w-3" strokeWidth={2} />
        Your team's view
      </span>
    </div>
  );
}

export { Check };
