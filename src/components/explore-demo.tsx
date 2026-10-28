import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, MessageSquare, RefreshCw, Users } from "lucide-react";
import {
  PRIORITY_OPTIONS,
  TEXT_SCENARIOS,
  blankEnquiry,
  type EnquiryState,
  type PriorityId,
  type TextReply,
  type TextScenarioId,
  type TimelineEvent,
} from "./explore-data";
import { Card, GuidedBadge, IconTile, SectionHeader } from "./explore-ui";
import { EnquiryCard, NextActionTimeline, PhoneMockup, TeamViewLabel } from "./explore-demo-shared";
import { LiveChatWidget } from "./explore-live-chat";
import { type BusinessBrief } from "./explore-business-brief";

// ---------------------------------------------------------------------------
// Priority selector (section 4)
// ---------------------------------------------------------------------------
export function PrioritySelector({
  selected,
  onSelect,
}: {
  selected: PriorityId | null;
  onSelect: (id: PriorityId) => void;
}) {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeader
        pill="Where to start"
        navyTitle="Where would you like a hand?"
        sub="Pick the area that matters most right now."
      />
      <div className="mx-auto mt-8 grid max-w-[1120px] gap-4 md:grid-cols-3">
        {PRIORITY_OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(opt.id)}
              className="group flex flex-col items-start gap-3 rounded-[20px] bg-white p-6 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
              style={{
                border: `1px solid ${active ? "var(--sys-blue)" : "var(--sys-border)"}`,
                boxShadow: active
                  ? "0 16px 36px rgba(30, 136, 229, 0.16)"
                  : "var(--sys-card-shadow)",
              }}
            >
              <div className="flex w-full items-center justify-between">
                <IconTile
                  icon={
                    opt.id === "answering"
                      ? MessageSquare
                      : opt.id === "following-up"
                        ? RefreshCw
                        : Users
                  }
                  color={active ? "var(--sys-blue)" : "var(--sys-violet)"}
                />
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{
                    background: active
                      ? "linear-gradient(to right, #1E6FB8, #174A78)"
                      : "rgba(20, 33, 61, 0.06)",
                    color: active ? "#fff" : "var(--sys-muted)",
                  }}
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </span>
              </div>
              <div>
                <h3
                  className="text-base font-bold tracking-tight"
                  style={{
                    color: "var(--sys-navy)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {opt.label}
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--sys-body)" }}>
                  {opt.blurb}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Text demo
// ---------------------------------------------------------------------------
// The prospect plays the CUSTOMER. Assistant messages appear on the left.
// The selected customer reply appears on the right, then the next assistant
// response is appended. Both sides stay visible in the transcript.
type TextMode = "live" | "guided";

type TextMessage = {
  id: string;
  side: "assistant" | "customer";
  text: string;
};

export function TextDemo({
  scenario: scenarioId,
  onScenario,
  mode,
  onModeChange,
  brief,
  demoMode,
}: {
  scenario: TextScenarioId;
  onScenario: (id: TextScenarioId) => void;
  mode: TextMode;
  onModeChange: (m: TextMode) => void;
  brief: BusinessBrief | null;
  demoMode: "example" | "business";
}) {
  const scenario = TEXT_SCENARIOS[scenarioId];
  const [history, setHistory] = useState<string[]>([scenario.startNode]);
  const [messages, setMessages] = useState<TextMessage[]>([]);
  const [enquiry, setEnquiry] = useState<EnquiryState>({ ...blankEnquiry });
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [finished, setFinished] = useState(false);

  const reset = useCallback(
    (id: TextScenarioId = scenarioId) => {
      const sc = TEXT_SCENARIOS[id];
      setHistory([sc.startNode]);
      setEnquiry({ ...blankEnquiry });
      setTimeline([]);
      setFinished(false);
      const startNode = sc.nodes[sc.startNode];
      setMessages(
        startNode
          ? [{ id: `${sc.startNode}-a`, side: "assistant", text: startNode.assistant }]
          : [],
      );
    },
    [scenarioId],
  );

  useEffect(() => {
    reset(scenarioId);
  }, [scenarioId, reset]);

  const lastNodeId = history[history.length - 1];
  const currentNode = lastNodeId ? scenario.nodes[lastNodeId] : undefined;

  const chooseReply = useCallback(
    (reply: TextReply) => {
      // append the customer message on the right
      setMessages((m) => [...m, { id: `${lastNodeId}-c`, side: "customer", text: reply.label }]);
      // apply the state captured by this customer reply
      if (reply.enquiry) setEnquiry((e) => ({ ...e, ...reply.enquiry }));
      if (reply.timeline) {
        const added = reply.timeline;
        setTimeline((t) => [...t, ...added]);
      }
      if (!reply.to) {
        setFinished(true);
        return;
      }
      const nextId = reply.to;
      const node = scenario.nodes[nextId];
      if (!node) return;
      setHistory((h) => [...h, nextId]);
      // append the assistant response on the left
      setMessages((m) => [...m, { id: `${nextId}-a`, side: "assistant", text: node.assistant }]);
    },
    [lastNodeId, scenario],
  );

  return (
    <div className="space-y-5">
      {mode === "live" ? (
        demoMode === "business" ? (
          brief ? (
            <LiveChatWidget brief={brief} onSwitchToGuided={() => onModeChange("guided")} />
          ) : (
            <Card className="p-5">
              <p className="text-sm leading-relaxed" style={{ color: "var(--sys-body)" }}>
                Add your business details above to try a personalised conversation.
              </p>
            </Card>
          )
        ) : (
          <>
            <LiveChatWidget onSwitchToGuided={() => onModeChange("guided")} />
            {brief && (
              <p className="text-center text-xs" style={{ color: "var(--sys-muted)" }}>
                Send restart in the chat to begin another example.
              </p>
            )}
          </>
        )
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <GuidedBadge />
                <div className="flex flex-wrap gap-2">
                  {(["new-enquiry", "quote-followup", "booking-reminder"] as TextScenarioId[]).map(
                    (id) => {
                      const active = scenarioId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onScenario(id)}
                          className="inline-flex min-h-11 items-center rounded-full px-3.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
                          style={{
                            backgroundColor: active ? "var(--sys-blue)" : "white",
                            color: active ? "#fff" : "var(--sys-navy)",
                            border: `1px solid ${active ? "var(--sys-blue)" : "var(--sys-border)"}`,
                          }}
                        >
                          {TEXT_SCENARIOS[id].label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <PhoneMockup>
                <div
                  className="flex items-center gap-2 border-b pb-3"
                  style={{ borderColor: "var(--sys-border)" }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #1E6FB8, #174A78)" }}
                  >
                    CS
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--sys-navy)" }}>
                      Coastal Services
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--sys-green-text)" }}>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: "var(--sys-green)" }}
                        />
                        Sample business
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex-1 space-y-3 overflow-y-auto py-4"
                  role="log"
                  aria-label="Sample conversation"
                >
                  <div
                    className="text-center text-[10px] font-medium uppercase tracking-wider"
                    style={{ color: "var(--sys-muted)" }}
                  >
                    Sample conversation
                  </div>
                  {messages.map((msg, i) => {
                    const isAssistant = msg.side === "assistant";
                    return (
                      <div
                        key={`${msg.id}-${i}`}
                        className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug"
                          style={{
                            backgroundColor: isAssistant ? "#F1F5F9" : "var(--sys-blue)",
                            color: isAssistant ? "var(--sys-navy)" : "#fff",
                          }}
                        >
                          <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
                            {isAssistant ? "Coastal Services" : "You"}
                          </div>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-3" style={{ borderColor: "var(--sys-border)" }}>
                  <div
                    className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--sys-muted)" }}
                  >
                    {finished
                      ? "Sample conversation finished. Press Reset to replay."
                      : "You are the customer"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(finished ? [] : (currentNode?.replies ?? [])).map((reply, i) => {
                      const done = reply.to === null;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => chooseReply(reply)}
                          className="flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
                          style={{
                            backgroundColor: done ? "rgba(16, 185, 129, 0.1)" : "white",
                            color: done ? "var(--sys-green-text)" : "var(--sys-blue-dark)",
                            border: `1px solid ${done ? "rgba(16, 185, 129, 0.3)" : "var(--sys-border)"}`,
                          }}
                        >
                          {done && <Check className="h-3 w-3" strokeWidth={2.6} />}
                          {reply.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </PhoneMockup>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs" style={{ color: "var(--sys-muted)" }}>
                  Sample data only. No real messages are sent.
                </p>
                <button
                  type="button"
                  onClick={() => reset()}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
                  style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
                >
                  <RefreshCw className="h-3 w-3" strokeWidth={2} />
                  Reset
                </button>
              </div>
            </div>

            <div>
              <TeamViewLabel />
              <EnquiryCard enquiry={enquiry} />
              <NextActionTimeline events={timeline} />
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => onModeChange("live")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
              style={{
                backgroundColor: "white",
                color: "var(--sys-navy)",
                border: "1px solid var(--sys-border)",
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
              Back to live chat
            </button>
          </div>
        </>
      )}
    </div>
  );
}
