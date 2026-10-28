import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  Inbox,
  Kanban,
  MessageSquare,
  Phone,
  Receipt,
  UserRound,
  Workflow,
} from "lucide-react";
import { loadDemoValue, saveDemoValue, DEMO_KEYS } from "../lib/demo-storage";
import { CrmProvider, CrmToast } from "./explore-crm-state";
import { PipelineDemo } from "./explore-demo-pipeline";
import { ContactDemo } from "./explore-demo-contact";
import { QuoteDemo } from "./explore-demo-quote";
import { type TextScenarioId } from "./explore-data";
import { IconTile, SectionHeader } from "./explore-ui";
import { Reveal } from "./explore-motion";
import { BehindDemo, PhoneDemo } from "./explore-demo-extra";
import { LiveChatWidget } from "./explore-live-chat";
import { XeroDemo } from "./explore-demo-xero";
import { InboxDemo } from "./explore-demo-inbox";
import { BusinessBriefPanel, useBusinessBrief, type BusinessBrief } from "./explore-business-brief";
import { TextDemo } from "./explore-demo";

// ---------------------------------------------------------------------------
// Interactive demo section (section 5)
// ---------------------------------------------------------------------------
type DemoTab = "text" | "phone" | "behind" | "pipeline" | "contact" | "quote" | "xero" | "inbox";

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;

type DemoBadgeKind = "live" | "guided";

interface DemoCardDef {
  id: DemoTab;
  label: string;
  icon: IconType;
  description: string;
  badge: string;
  badgeKind: DemoBadgeKind;
}

const DEMO_CARDS: DemoCardDef[] = [
  {
    id: "phone",
    label: "Talk to Erin",
    icon: Phone,
    description: "Ask about a job.",
    badge: "Live voice",
    badgeKind: "live",
  },
  {
    id: "text",
    label: "Try a text chat",
    icon: MessageSquare,
    description: "Send Erin a message.",
    badge: "Live chat",
    badgeKind: "live",
  },
  {
    id: "behind",
    label: "See the system",
    icon: Workflow,
    description: "View leads and jobs.",
    badge: "Demo screens",
    badgeKind: "guided",
  },
  {
    id: "pipeline",
    label: "Your pipeline",
    icon: Kanban,
    description: "Drag jobs between stages.",
    badge: "Interactive",
    badgeKind: "guided",
  },
  {
    id: "contact",
    label: "One customer",
    icon: UserRound,
    description: "Every message in one place.",
    badge: "Interactive",
    badgeKind: "guided",
  },
  {
    id: "quote",
    label: "Quote builder",
    icon: FileText,
    description: "Build and send a quote.",
    badge: "Interactive",
    badgeKind: "guided",
  },
  {
    id: "xero",
    label: "Bookkeeping",
    icon: Receipt,
    description: "See a bill prepared.",
    badge: "Example",
    badgeKind: "guided",
  },
  {
    id: "inbox",
    label: "Inbox & reports",
    icon: Inbox,
    description: "See what needs attention.",
    badge: "Example",
    badgeKind: "guided",
  },
];

type TextMode = "live" | "guided";

export function InteractiveDemo({ demoRef }: { demoRef: React.RefObject<HTMLDivElement | null> }) {
  const [tab, setTab] = useState<DemoTab>("phone");
  const [textScenario, setTextScenario] = useState<TextScenarioId>("new-enquiry");
  const [textMode, setTextMode] = useState<TextMode>("live");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { brief } = useBusinessBrief();
  const [demoMode, setDemoMode] = useState<"example" | "business">("example");
  const cardsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const uiLoaded = useRef(false);
  // The panel on screen trails the chosen tab by one short fade-out so the change reads.
  const [shownTab, setShownTab] = useState<DemoTab>("phone");
  const [leaving, setLeaving] = useState(false);
  // Position of the sliding gradient frame behind the active card (null until measured).
  const [frame, setFrame] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    if (tab === shownTab) {
      setLeaving(false);
      return;
    }
    setLeaving(true);
    const t = window.setTimeout(() => {
      setShownTab(tab);
      setLeaving(false);
    }, 130);
    return () => window.clearTimeout(t);
  }, [tab, shownTab]);

  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[DEMO_CARDS.findIndex((c) => c.id === tab)];
      if (!el) return;
      setFrame((prev) => {
        const next = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
        return prev &&
          prev.x === next.x &&
          prev.y === next.y &&
          prev.w === next.w &&
          prev.h === next.h
          ? prev
          : next;
      });
    };
    measure();
    const host = cardsRef.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [tab]);

  // Soft spotlight that follows a mouse pointer over a card (fine pointers only).
  const onCardPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  // Remember the chosen tab and mode across a refresh (24 hours), loaded after mount.
  useEffect(() => {
    const ui = loadDemoValue<{ tab?: DemoTab; demoMode?: "example" | "business" }>(DEMO_KEYS.ui);
    if (ui) {
      if (ui.tab && DEMO_CARDS.some((c) => c.id === ui.tab)) setTab(ui.tab);
      if (ui.demoMode === "business" || ui.demoMode === "example") setDemoMode(ui.demoMode);
    }
    // A link like /explore-your-options?demo=pipeline opens that tab (and scrolls to it).
    const wanted =
      new URLSearchParams(window.location.search).get("demo") ??
      window.location.hash.replace(/^#/, "");
    const match = DEMO_CARDS.find((c) => c.id === wanted);
    if (match) {
      setTab(match.id);
      window.setTimeout(
        () => document.getElementById("demo-panel-" + match.id)?.scrollIntoView({ block: "start" }),
        400,
      );
    }
    uiLoaded.current = true;
  }, []);

  useEffect(() => {
    if (uiLoaded.current) saveDemoValue(DEMO_KEYS.ui, { tab, demoMode });
  }, [tab, demoMode]);

  // Opening a card from the board moves focus to the Contact panel so keyboard users keep their place.
  const openContactTab = useCallback(() => {
    setTab("contact");
    window.setTimeout(() => {
      const panel = document.getElementById("demo-panel-contact");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, 260);
  }, []);

  const focusTab = useCallback((idx: number) => {
    tabRefs.current[idx]?.focus();
  }, []);

  const onTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusTab((idx + 1) % DEMO_CARDS.length);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusTab((idx - 1 + DEMO_CARDS.length) % DEMO_CARDS.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusTab(DEMO_CARDS.length - 1);
    }
  };

  const handleCardSelect = useCallback((id: DemoTab) => {
    setTab(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  }, []);

  const scrollToCards = useCallback(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardsRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const activeCard = DEMO_CARDS.find((c) => c.id === tab);

  return (
    <CrmProvider onOpenContact={openContactTab}>
      <section ref={demoRef} className="sys-section-tinted px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeader navyTitle="Try it for yourself." sub="Choose a demo below." />

        <div ref={cardsRef} className="mx-auto mt-10 max-w-[1120px] scroll-mt-24">
          <Reveal
            stagger
            role="tablist"
            aria-label="Choose a demo"
            className="relative grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {DEMO_CARDS.map((c, idx) => {
              const active = tab === c.id;
              const Icon = c.icon;
              const isLast = DEMO_CARDS.length % 2 === 1 && idx === DEMO_CARDS.length - 1;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    tabRefs.current[idx] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`demo-tab-${c.id}`}
                  aria-selected={active}
                  aria-controls={`demo-panel-${c.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => handleCardSelect(c.id)}
                  onKeyDown={(e) => onTabKeyDown(e, idx)}
                  onPointerMove={onCardPointerMove}
                  className={`sys-demo-card focus-visible:ring-4 focus-visible:ring-blue-300/50 ${
                    isLast ? "col-span-2 sm:col-span-1" : ""
                  }`}
                  style={{
                    border: `1px solid ${active ? "var(--sys-blue)" : "var(--sys-border)"}`,
                    boxShadow: active
                      ? "0 12px 28px rgba(30, 136, 229, 0.16)"
                      : "var(--sys-card-shadow)",
                  }}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <IconTile
                      icon={Icon}
                      color={active ? "var(--sys-blue)" : "var(--sys-violet)"}
                    />
                    <span
                      className={`sys-demo-card-badge min-w-0 ${
                        c.badgeKind === "live"
                          ? "sys-demo-card-badge-live"
                          : "sys-demo-card-badge-guided"
                      }`}
                    >
                      {(c.badgeKind === "live" || c.badge === "Interactive") && (
                        <span
                          className="sys-pulse-dot h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              c.badgeKind === "live" ? "var(--sys-green)" : "var(--sys-teal)",
                          }}
                        />
                      )}
                      {c.badge}
                    </span>
                  </div>
                  <div>
                    <h3
                      className="text-sm font-bold leading-tight"
                      style={{
                        color: "var(--sys-navy)",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {c.label}
                    </h3>
                    <p className="mt-1 text-xs leading-snug" style={{ color: "var(--sys-body)" }}>
                      {c.description}
                    </p>
                  </div>
                </button>
              );
            })}
            <span
              className="sys-tab-frame"
              aria-hidden="true"
              data-ready={frame ? "true" : "false"}
              style={
                frame
                  ? { translate: `${frame.x}px ${frame.y}px`, width: frame.w, height: frame.h }
                  : undefined
              }
            />
          </Reveal>
        </div>

        <div className="sys-seg mx-auto mt-8 grid max-w-[520px] grid-cols-2">
          <span
            className="sys-seg-pill"
            aria-hidden="true"
            data-pos={demoMode === "business" ? "1" : "0"}
          />
          <button
            type="button"
            aria-pressed={demoMode === "example"}
            onClick={() => setDemoMode("example")}
            className="sys-press relative z-10 inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
            style={{ color: demoMode === "example" ? "#fff" : "var(--sys-navy)" }}
          >
            Try an example
          </button>
          <button
            type="button"
            aria-pressed={demoMode === "business"}
            onClick={() => setDemoMode("business")}
            className="sys-press relative z-10 inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
            style={{ color: demoMode === "business" ? "#fff" : "var(--sys-navy)" }}
          >
            Use my business
          </button>
        </div>

        {demoMode === "business" && (
          <div className="mx-auto mt-6 max-w-[820px]">
            <BusinessBriefPanel />
          </div>
        )}

        <div ref={panelRef} className="mx-auto mt-10 max-w-[1120px] scroll-mt-24">
          <div className="mb-4 flex items-center justify-between gap-3 sm:hidden">
            <h3
              className="text-base font-bold"
              style={{
                color: "var(--sys-navy)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {activeCard?.label}
            </h3>
            <button
              type="button"
              onClick={scrollToCards}
              className="sys-press inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
              style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
            >
              <ArrowRight className="h-3 w-3 rotate-180" strokeWidth={2.4} />
              Change demo
            </button>
          </div>

          <div key={shownTab} className={leaving ? "sys-panel-out" : "sys-panel-in"}>
            {shownTab === "text" && (
              <div
                role="tabpanel"
                id="demo-panel-text"
                aria-labelledby="demo-tab-text"
                tabIndex={0}
              >
                <TextDemo
                  scenario={textScenario}
                  onScenario={setTextScenario}
                  mode={textMode}
                  onModeChange={setTextMode}
                  brief={brief}
                  demoMode={demoMode}
                />
              </div>
            )}
            {shownTab === "phone" && (
              <div
                role="tabpanel"
                id="demo-panel-phone"
                aria-labelledby="demo-tab-phone"
                tabIndex={0}
              >
                <PhoneDemo brief={brief} demoMode={demoMode} />
              </div>
            )}
            {shownTab === "behind" && (
              <div
                role="tabpanel"
                id="demo-panel-behind"
                aria-labelledby="demo-tab-behind"
                tabIndex={0}
              >
                <BehindDemo />
              </div>
            )}
            {shownTab === "pipeline" && (
              <div
                role="tabpanel"
                id="demo-panel-pipeline"
                aria-labelledby="demo-tab-pipeline"
                tabIndex={0}
              >
                <PipelineDemo />
              </div>
            )}
            {shownTab === "contact" && (
              <div
                role="tabpanel"
                id="demo-panel-contact"
                aria-labelledby="demo-tab-contact"
                tabIndex={0}
              >
                <ContactDemo />
              </div>
            )}
            {shownTab === "quote" && (
              <div
                role="tabpanel"
                id="demo-panel-quote"
                aria-labelledby="demo-tab-quote"
                tabIndex={0}
              >
                <QuoteDemo />
              </div>
            )}
            {shownTab === "xero" && (
              <div
                role="tabpanel"
                id="demo-panel-xero"
                aria-labelledby="demo-tab-xero"
                tabIndex={0}
              >
                <XeroDemo />
              </div>
            )}
            {shownTab === "inbox" && (
              <div
                role="tabpanel"
                id="demo-panel-inbox"
                aria-labelledby="demo-tab-inbox"
                tabIndex={0}
              >
                <InboxDemo />
              </div>
            )}
          </div>
        </div>
        <CrmToast />
      </section>
    </CrmProvider>
  );
}
