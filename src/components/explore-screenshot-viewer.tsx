import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Maximize2, Minimize2, X } from "lucide-react";
import { DEMO_SCREENSHOTS, type DemoScreenshot } from "./explore-data";
import { Card } from "./explore-ui";

// Reusable real-screenshot viewer with an accessible lightbox.
// Australian English. No em dashes or en dashes anywhere in this file.
// Screenshots are genuine Systemations platform screens from the fictional
// Brightline Insulation demonstration account. All names, jobs, messages and
// figures are fictional sample data. Clicks do not operate a live CRM, send
// messages or alter records.

function ActualScreensBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] sm:text-[11px] font-semibold"
      style={{
        backgroundColor: "rgba(30, 136, 229, 0.1)",
        border: "1px solid rgba(30, 136, 229, 0.2)",
        color: "var(--sys-blue-dark)",
      }}
    >
      <Check className="h-3 w-3" strokeWidth={2.4} />
      Actual demo screens
    </span>
  );
}

export function ScreenshotViewer({
  heading = "Inside a trades business on Systemations",
  explanation = "Screenshots from our Brightline Insulation demonstration account. All names, jobs, messages and figures are fictional sample data. Your setup is designed around your agreed workflow.",
  initialId,
  screens,
}: {
  heading?: string;
  explanation?: string;
  initialId?: string;
  screens?: DemoScreenshot[];
}) {
  const availableScreens = screens ?? DEMO_SCREENSHOTS;
  const initial =
    availableScreens.find((s) => s.id === initialId) ?? availableScreens[0] ?? DEMO_SCREENSHOTS[0]!;
  const [selectedId, setSelectedId] = useState<string>(initial.id);
  const [open, setOpen] = useState(false);
  const [fullSize, setFullSize] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const imgRef = useRef<HTMLImageElement>(null);
  const enlargeBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  // Capture the element that opened the lightbox so focus can be restored
  // to that exact trigger after close (not to the document body).
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const selected = availableScreens.find((s) => s.id === selectedId) ?? initial;
  const isFailed = Boolean(failed[selected.id]);

  const openLightbox = useCallback(() => {
    if (isFailed) return;
    // Capture the currently focused element as the trigger to restore later.
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      triggerRef.current = document.activeElement;
    }
    setOpen(true);
    setFullSize(false);
  }, [isFailed]);

  const closeLightbox = useCallback(() => {
    setOpen(false);
    setFullSize(false);
    // Restore focus to the trigger that opened the lightbox, if still
    // connected to the document. Falls back gracefully if it is gone.
    const trigger = triggerRef.current;
    if (trigger && trigger.isConnected) {
      requestAnimationFrame(() => trigger.focus());
    }
    triggerRef.current = null;
  }, []);

  // Escape to close, focus trap on the lightbox.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "Tab") {
        // keep focus cycling inside the lightbox controls
        const items = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>("button, [tabindex='0']") ?? [],
        );
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        const current = document.activeElement;
        if (!dialogRef.current?.contains(current)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && current === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeLightbox]);

  // Move focus to the close button on open, and stop the page scrolling behind.
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset failure state when the selected screenshot changes.
  useEffect(() => {
    setFailed((f) => (f[selected.id] ? { ...f, [selected.id]: false } : f));
  }, [selected.id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3
          className="text-lg font-bold tracking-tight sm:text-xl"
          style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {heading}
        </h3>
        <ActualScreensBadge />
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--sys-body)" }}>
        {explanation}
      </p>

      {/* Selectable thumbnail / label choices. Only shown when more than one
          screen is available, so a single dashboard view stays focused. */}
      {availableScreens.length > 1 && (
        <div
          role="group"
          aria-label="Choose a demo screen"
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {availableScreens.map((s) => {
            const active = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(s.id)}
                className="group flex w-[77%] shrink-0 snap-start flex-col gap-2 rounded-[14px] bg-white p-2.5 text-left sm:w-auto sm:p-3 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
                style={{
                  border: `1px solid ${active ? "var(--sys-blue)" : "var(--sys-border)"}`,
                  boxShadow: active
                    ? "0 8px 20px rgba(30, 136, 229, 0.12)"
                    : "0 2px 6px rgba(20, 33, 61, 0.03)",
                }}
              >
                <div
                  className="relative aspect-video w-full overflow-hidden rounded-[10px]"
                  style={{ backgroundColor: "#F1F5F9", border: "1px solid var(--sys-border)" }}
                >
                  <img
                    src={s.url}
                    alt=""
                    width={1512}
                    height={770}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                </div>
                <span
                  className="text-[13px] sm:text-xs font-bold leading-tight"
                  style={{
                    color: active ? "var(--sys-blue-dark)" : "var(--sys-navy)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Large screenshot with aspect ratio preserved */}
      <Card className="overflow-hidden p-0">
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-2 sm:px-5 sm:py-3"
          style={{ borderColor: "var(--sys-border)" }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {selected.label}
          </span>
          <button
            ref={enlargeBtnRef}
            type="button"
            onClick={openLightbox}
            disabled={isFailed}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] sm:text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 disabled:opacity-50"
            style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.2} />
            Enlarge
          </button>
        </div>

        <div className="p-3 sm:p-4">
          {isFailed ? (
            <div
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-[14px] text-center"
              style={{ backgroundColor: "#F8FAFC", border: "1px solid var(--sys-border)" }}
            >
              <p className="text-sm" style={{ color: "var(--sys-muted)" }}>
                This screen could not load right now.
              </p>
              <button
                type="button"
                onClick={() => setFailed((f) => ({ ...f, [selected.id]: false }))}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] sm:text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
                style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
              >
                Try again
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openLightbox}
              className="block w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50 rounded-[14px]"
              aria-label={`Enlarge ${selected.label} screen`}
            >
              <img
                ref={imgRef}
                src={selected.url}
                alt={selected.alt}
                width={1512}
                height={770}
                loading="lazy"
                decoding="async"
                onError={() => setFailed((f) => ({ ...f, [selected.id]: true }))}
                className="h-auto w-full rounded-[14px] object-contain"
                style={{ border: "1px solid var(--sys-border)" }}
              />
            </button>
          )}
          <p
            className="mt-3 text-[13px] sm:text-xs leading-relaxed"
            style={{ color: "var(--sys-muted)" }}
          >
            {selected.caption}
          </p>
        </div>
      </Card>

      {open && !isFailed && (
        <Lightbox
          shot={selected}
          fullSize={fullSize}
          onToggleSize={() => setFullSize((v) => !v)}
          onClose={closeLightbox}
          closeRef={closeBtnRef}
          dialogRef={dialogRef}
        />
      )}
    </div>
  );
}

function Lightbox({
  shot,
  fullSize,
  onToggleSize,
  onClose,
  closeRef,
  dialogRef,
}: {
  shot: DemoScreenshot;
  fullSize: boolean;
  onToggleSize: () => void;
  onClose: () => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  dialogRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[200] flex items-stretch justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${shot.label} screen, enlarged`}
    >
      <div
        className="absolute inset-0 sm:backdrop-blur-[6px]"
        style={{ backgroundColor: "rgba(7, 14, 27, 0.82)" }}
        onClick={onClose}
      />
      <div className="relative flex h-full max-h-full w-full max-w-[1100px] flex-col overflow-hidden bg-white sm:h-auto sm:rounded-[20px] sm:shadow-[0_30px_70px_-20px_rgba(7,14,27,0.6)]">
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: "var(--sys-border)" }}
        >
          <div className="min-w-0">
            <h3
              className="truncate text-sm font-bold sm:text-base"
              style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {shot.label}
            </h3>
            <p className="truncate text-[13px] sm:text-xs" style={{ color: "var(--sys-muted)" }}>
              Actual demo screen. Fictional sample data.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleSize}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] sm:text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              {fullSize ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Fit to screen
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Full size
                </>
              )}
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-full text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-muted)" }}
              aria-label="Close enlarged screen"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        </div>
        <div
          className="min-h-0 flex-1 overflow-auto overscroll-contain"
          style={{ backgroundColor: "#0B1322", touchAction: "pan-x pan-y pinch-zoom" }}
          tabIndex={0}
          role="region"
          aria-label="Enlarged screen, scrollable"
        >
          <img
            src={shot.url}
            alt={shot.alt}
            width={1512}
            height={770}
            decoding="async"
            className="block"
            style={
              fullSize
                ? { width: "1512px", maxWidth: "none", height: "auto" }
                : { width: "100%", height: "auto", objectFit: "contain" }
            }
          />
        </div>
      </div>
    </div>
  );
}
