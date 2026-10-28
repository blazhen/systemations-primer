import { useCallback, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
} from "lucide-react";
import {
  AI_AGENT_PROFILE,
  EXPLORE_CONFIG,
  PHONE_TURNS,
  BTS_STAGES,
  blankEnquiry,
  type EnquiryState,
  type TimelineEvent,
} from "./explore-data";
import { AgentAvatar, Card, GuidedBadge } from "./explore-ui";
import { EnquiryCard, NextActionTimeline, TeamViewLabel, WidgetFrame } from "./explore-demo-shared";
import { buildSpokenBrief, type BusinessBrief, CopyButton } from "./explore-business-brief";
import { ScreenshotViewer } from "./explore-screenshot-viewer";

// ---------------------------------------------------------------------------
// Phone demo: prospect voice demo widget + guided example turns
// ---------------------------------------------------------------------------
function VoiceWidget({
  demoMode,
  brief,
}: {
  demoMode?: "example" | "business" | undefined;
  brief?: BusinessBrief | null | undefined;
}) {
  const widget = EXPLORE_CONFIG.voiceWidget;
  // The loader snippet is placed inside a dedicated iframe (see WidgetFrame)
  // so the provider widget can only append within its own frame. The iframe
  // is removed on unmount, which fully cleans up the provider DOM and
  // prevents duplicate voice controls across tab remounts. No auto-call and
  // no microphone prompt until the visitor initiates.

  if (!widget) {
    return (
      <Card className="p-4 sm:p-5">
        <p className="text-sm leading-relaxed" style={{ color: "var(--sys-body)" }}>
          Explore the example here. We can show the live phone agent on your call.
        </p>
      </Card>
    );
  }

  const isBusiness = demoMode === "business" && brief;
  const canPersonalise = Boolean(EXPLORE_CONFIG.personalisedVoiceWidget);
  const spoken = isBusiness && canPersonalise ? buildSpokenBrief(brief!) : "";

  return (
    <Card className="p-4 sm:p-5">
      <div
        className="mb-3 flex items-center gap-2 border-b pb-3"
        style={{ borderColor: "var(--sys-border)" }}
      >
        <AgentAvatar profile={AI_AGENT_PROFILE} />
        <div className="flex-1">
          <div
            className="text-sm font-bold"
            style={{
              color: "var(--sys-navy)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Talk to Erin
          </div>
          <div className="text-[13px] sm:text-[11px]" style={{ color: "var(--sys-muted)" }}>
            A short voice preview, up to 3 minutes
          </div>
        </div>
      </div>

      {isBusiness ? (
        canPersonalise ? (
          <>
            <p
              className="mb-3 text-[13px] sm:text-xs leading-relaxed"
              style={{ color: "var(--sys-body)" }}
            >
              Say "Demo my business", then read this short brief to the assistant. It will confirm
              the details before starting the example.
            </p>
            <div
              className="mb-3 rounded-[12px] p-3 text-[13px] sm:text-xs leading-relaxed"
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid var(--sys-border)",
                color: "var(--sys-navy)",
              }}
            >
              {spoken}
            </div>
            <div className="mb-3">
              <CopyButton text={spoken} label="Copy spoken brief" copiedLabel="Brief copied" />
            </div>
            <p className="mb-3 text-[13px] sm:text-[11px]" style={{ color: "var(--sys-muted)" }}>
              Your brief is not passed to the assistant automatically. You read it to the assistant
              to set up the example.
            </p>
          </>
        ) : (
          <p
            className="mb-3 text-[13px] sm:text-xs leading-relaxed"
            style={{ color: "var(--sys-body)" }}
          >
            A personalised voice trial for your business is being prepared. We can show it on your
            call.
          </p>
        )
      ) : (
        <>
          <p
            className="mb-3 text-[13px] sm:text-xs leading-relaxed"
            style={{ color: "var(--sys-body)" }}
          >
            Press Start voice trial, then ask Erin a question.
          </p>
          <p className="mb-3 text-[13px] sm:text-[11px]" style={{ color: "var(--sys-muted)" }}>
            AI demo · no real bookings
          </p>
        </>
      )}

      <div
        className="relative w-full overflow-hidden rounded-[14px]"
        style={{ border: "1px solid var(--sys-border)", backgroundColor: "#F8FAFC" }}
      >
        <WidgetFrame
          title="Live Systemations voice assistant"
          widget={widget}
          allow="microphone"
          className="h-[260px] sm:h-[220px]"
          fallbackText="The voice assistant could not load right now. Try again, or we can show you the live phone agent on your call."
        />
      </div>
    </Card>
  );
}

export function PhoneDemo({
  brief,
  demoMode,
}: {
  brief?: BusinessBrief | null | undefined;
  demoMode?: "example" | "business" | undefined;
}) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [enquiry, setEnquiry] = useState<EnquiryState>({ ...blankEnquiry });
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [showSample, setShowSample] = useState(false);

  const reset = useCallback(() => {
    setTurnIndex(0);
    setEnquiry({ ...blankEnquiry });
    setTimeline([]);
  }, []);

  const goTo = useCallback((target: number) => {
    const next = Math.max(0, Math.min(target, PHONE_TURNS.length - 1));
    const en: EnquiryState = { ...blankEnquiry };
    const tl: TimelineEvent[] = [];
    for (let i = 0; i <= next; i++) {
      const t = PHONE_TURNS[i];
      if (!t) continue;
      if (t.enquiry) Object.assign(en, t.enquiry);
      if (t.timeline) tl.push(t.timeline);
    }
    setTurnIndex(next);
    setEnquiry(en);
    setTimeline(tl);
  }, []);
  const advance = useCallback(() => goTo(turnIndex + 1), [goTo, turnIndex]);
  const back = useCallback(() => goTo(turnIndex - 1), [goTo, turnIndex]);

  const isLast = turnIndex === PHONE_TURNS.length - 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      <VoiceWidget demoMode={demoMode} brief={brief} />
      <div
        className="overflow-hidden rounded-[16px] bg-white"
        style={{
          border: "1px solid var(--sys-border)",
          boxShadow: "0 2px 8px rgba(20, 33, 61, 0.03)",
        }}
      >
        <button
          type="button"
          onClick={() => setShowSample((v) => !v)}
          aria-expanded={showSample}
          className="flex min-h-11 w-full items-center justify-between gap-4 p-4 text-left sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
        >
          <span
            className="text-base font-bold"
            style={{
              color: "var(--sys-navy)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            See a sample call instead
          </span>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${showSample ? "rotate-180" : ""}`}
            style={{ backgroundColor: "rgba(30, 136, 229, 0.08)", color: "var(--sys-blue)" }}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>
        {showSample && (
          <div
            className="border-t px-4 pb-4 pt-4 sm:px-5 sm:pb-5"
            style={{ borderColor: "var(--sys-border)" }}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <GuidedBadge />
                  <span
                    className="text-[13px] sm:text-xs font-medium"
                    style={{ color: "var(--sys-muted)" }}
                  >
                    Turn {turnIndex + 1} of {PHONE_TURNS.length}
                  </span>
                </div>

                <Card className="p-4 sm:p-5">
                  <div
                    className="flex items-center gap-2 border-b pb-3"
                    style={{ borderColor: "var(--sys-border)" }}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: "rgba(30, 136, 229, 0.1)",
                        color: "var(--sys-blue)",
                      }}
                    >
                      <Phone className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--sys-navy)" }}>
                        Inbound call
                      </div>
                      <div
                        className="text-[13px] sm:text-[11px]"
                        style={{ color: "var(--sys-muted)" }}
                      >
                        Sample call flow
                      </div>
                    </div>
                  </div>

                  <div
                    className="max-h-[50dvh] space-y-3 overflow-y-auto overscroll-contain py-3 sm:max-h-none sm:overflow-visible sm:py-4"
                    role="log"
                    aria-label="Sample call transcript"
                  >
                    {PHONE_TURNS.slice(0, turnIndex + 1).map((turn) => (
                      <div
                        key={turn.id}
                        className={`flex ${turn.speaker === "customer" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className="max-w-[90%] rounded-2xl sm:max-w-[85%] px-3.5 py-2.5 text-sm leading-snug"
                          style={{
                            backgroundColor:
                              turn.speaker === "customer" ? "#F1F5F9" : "var(--sys-blue)",
                            color: turn.speaker === "customer" ? "var(--sys-navy)" : "#fff",
                          }}
                        >
                          <div className="mb-0.5 text-[13px] sm:text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {turn.speaker === "customer" ? "Customer" : "Phone agent"}
                          </div>
                          {turn.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: "var(--sys-border)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] sm:text-xs" style={{ color: "var(--sys-muted)" }}>
                        {isLast
                          ? "Human handoff complete. No microphone used for this example."
                          : "Click through each turn to see the enquiry build up."}
                      </p>
                      <div className="flex gap-2">
                        {turnIndex > 0 && (
                          <button
                            type="button"
                            onClick={back}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] sm:text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
                            style={{
                              border: "1px solid var(--sys-border)",
                              color: "var(--sys-navy)",
                            }}
                          >
                            Back
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={reset}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] sm:text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
                          style={{
                            border: "1px solid var(--sys-border)",
                            color: "var(--sys-navy)",
                          }}
                        >
                          <RefreshCw className="h-3 w-3" strokeWidth={2} />
                          Reset
                        </button>
                        {!isLast && (
                          <button
                            type="button"
                            onClick={advance}
                            className="sys-gradient-fill inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] sm:text-xs font-semibold transition-transform hover:scale-[1.03] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
                          >
                            Next turn
                            <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <p
                  className="mt-4 text-[13px] sm:text-xs leading-relaxed"
                  style={{ color: "var(--sys-muted)" }}
                >
                  Explore the example here. We can show the live phone agent on your call.
                </p>
              </div>

              <div>
                <TeamViewLabel />
                <EnquiryCard enquiry={enquiry} />
                <NextActionTimeline events={timeline} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Behind the scenes demo (real screenshots first, then a guided workflow)
// ---------------------------------------------------------------------------
export function BehindDemo() {
  const [activeId, setActiveId] = useState<string>(BTS_STAGES[0]?.id ?? "");
  const [showWorkflow, setShowWorkflow] = useState(false);
  const stage = BTS_STAGES.find((s) => s.id === activeId);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Real-screen walkthrough comes first. This replaces the old
          miniature recreated CRM preview so there is only one CRM
          representation on the page. */}
      <ScreenshotViewer
        heading="Inside a trades business on Systemations"
        explanation="Demo account. Fictional data."
      />

      {/* Secondary guided workflow walkthrough, wrapped in a closed
          disclosure so it does not compete with the real screenshots. Keeps
          the existing five-step illustrative enquiry timeline and its real
          working actions. The old fake miniature CRM card has been removed. */}
      <div
        className="overflow-hidden rounded-[16px] bg-white"
        style={{
          border: "1px solid var(--sys-border)",
          boxShadow: "0 2px 8px rgba(20, 33, 61, 0.03)",
        }}
      >
        <button
          type="button"
          onClick={() => setShowWorkflow((v) => !v)}
          aria-expanded={showWorkflow}
          className="flex min-h-11 w-full items-center justify-between gap-4 p-4 text-left sm:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
        >
          <span
            className="text-base font-bold"
            style={{ color: "var(--sys-navy)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Walk through an example
          </span>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${showWorkflow ? "rotate-180" : ""}`}
            style={{ backgroundColor: "rgba(30, 136, 229, 0.08)", color: "var(--sys-blue)" }}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>
        {showWorkflow && (
          <div
            className="border-t px-4 pb-4 pt-4 sm:px-5 sm:pb-5"
            style={{ borderColor: "var(--sys-border)" }}
          >
            <div className="mb-4 flex items-center gap-3">
              <GuidedBadge />
            </div>
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="-mx-4 flex snap-x flex-row gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible lg:pb-0">
                {BTS_STAGES.map((s, i) => {
                  const active = s.id === activeId;
                  const done = BTS_STAGES.findIndex((x) => x.id === activeId) > i;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveId(s.id)}
                      aria-pressed={active}
                      className="group flex min-h-11 shrink-0 snap-start items-center gap-3 rounded-[14px] bg-white p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50 lg:w-full"
                      style={{
                        border: `1px solid ${active ? "var(--sys-blue)" : "var(--sys-border)"}`,
                        boxShadow: active
                          ? "0 8px 20px rgba(30, 136, 229, 0.12)"
                          : "0 2px 6px rgba(20, 33, 61, 0.03)",
                      }}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] sm:text-xs font-bold transition-colors"
                        style={{
                          background:
                            active || done
                              ? "linear-gradient(to right, #1E6FB8, #174A78)"
                              : "#F1F5F9",
                          color: active || done ? "#fff" : "var(--sys-muted)",
                        }}
                      >
                        {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.6} /> : i + 1}
                      </span>
                      <span
                        className="text-[13px] sm:text-xs font-bold leading-tight"
                        style={{
                          color: "var(--sys-navy)",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {stage && (
                  <Card className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4
                          className="text-base font-bold tracking-tight"
                          style={{
                            color: "var(--sys-navy)",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          {stage.label}
                        </h4>
                        <p
                          className="mt-1 text-sm leading-relaxed"
                          style={{ color: "var(--sys-body)" }}
                        >
                          {stage.summary}
                        </p>
                      </div>
                    </div>

                    <div
                      className="mt-4 rounded-[14px] p-3 sm:p-4"
                      style={{
                        backgroundColor: "rgba(30, 136, 229, 0.05)",
                        border: "1px solid var(--sys-border)",
                      }}
                    >
                      <div
                        className="text-[13px] sm:text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--sys-blue-dark)" }}
                      >
                        What changes for you
                      </div>
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: "var(--sys-navy)" }}
                      >
                        {stage.ownerNote}
                      </p>
                    </div>

                    <div className="mt-4">
                      <PreviewBlock stage={stage} />
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewBlock({
  stage,
}: {
  stage: { preview: { kind: string; title: string; body: string; awaitingApproval?: boolean } };
}) {
  const p = stage.preview;
  const iconMap: Record<
    string,
    React.ComponentType<{ className?: string; strokeWidth?: number }>
  > = {
    message: MessageSquare,
    task: Check,
    "email-draft": Mail,
    quote: Mail,
    invoice: Mail,
  };
  const Icon = iconMap[p.kind] || Mail;

  return (
    <div
      className="rounded-[14px] bg-white p-3 sm:p-4"
      style={{
        border: "1px solid var(--sys-border)",
        boxShadow: "0 2px 8px rgba(20, 33, 61, 0.04)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(30, 106, 180, 0.1)", color: "var(--sys-violet)" }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
          <span className="text-[13px] sm:text-xs font-bold" style={{ color: "var(--sys-navy)" }}>
            {p.title}
          </span>
        </div>
        {p.awaitingApproval && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] sm:text-[10px] font-bold"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              color: "#92400E",
              border: "1px solid rgba(245, 158, 11, 0.25)",
            }}
          >
            <Clock className="h-2.5 w-2.5" strokeWidth={2.4} />
            Awaiting your approval
          </span>
        )}
      </div>
      <p
        className="mt-2 text-[13px] sm:text-xs leading-relaxed"
        style={{ color: "var(--sys-body)" }}
      >
        {p.body}
      </p>
    </div>
  );
}
