import { useState } from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import { AI_AGENT_PROFILE, EXPLORE_CONFIG } from "./explore-data";
import { AgentAvatar, Card } from "./explore-ui";
import { WidgetFrame } from "./explore-demo-shared";
import { buildSetupMessage, type BusinessBrief, CopyButton } from "./explore-business-brief";

// ---------------------------------------------------------------------------
// Live AI chat widget: genuine text chat in an isolated iframe.
// Australian English. No em dashes or en dashes anywhere in this file.
// The exact official loader snippet is placed inside a dedicated iframe
// srcDoc so the provider widget can only append within its own frame. The
// iframe is removed on unmount, which fully cleans up the provider DOM and
// prevents duplicate chat controls across tab remounts. No proxy or backend,
// no fake generated replies. The native dedicated conversation agent is
// being routed in the provider now. The native widget manages its own
// loading UI, so we do not infer failure from elapsed time or a script
// onload signal.
//
// When a business brief is supplied, a two-step handoff is shown above the
// iframe: the visitor copies the setup message, pastes it into the chat and
// sends it, then plays one of their own customers. The brief is never
// silently injected using private provider DOM or SDK methods.
// ---------------------------------------------------------------------------

export function LiveChatWidget({
  onSwitchToGuided,
  brief,
}: {
  onSwitchToGuided: () => void;
  brief?: BusinessBrief | null;
}) {
  const widget = EXPLORE_CONFIG.textChatWidget;
  const [reloadKey, setReloadKey] = useState(0);

  if (!widget) {
    return (
      <Card className="p-5">
        <p className="text-sm leading-relaxed" style={{ color: "var(--sys-body)" }}>
          The live AI chat is being prepared. You can explore the guided examples below.
        </p>
        <button
          type="button"
          onClick={onSwitchToGuided}
          className="sys-gradient-fill mt-4 inline-flex items-center gap-1.5 rounded-[14px] px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/50"
        >
          <MessageSquare className="h-4 w-4" strokeWidth={2.4} />
          Switch to guided examples
        </button>
      </Card>
    );
  }

  const hasBrief = Boolean(brief);
  const setupMessage = hasBrief ? buildSetupMessage(brief!) : "";

  return (
    <Card className="p-5">
      <div
        className="mb-3 flex items-center gap-2 border-b pb-3"
        style={{ borderColor: "var(--sys-border)" }}
      >
        <AgentAvatar profile={AI_AGENT_PROFILE} />
        <div className="flex-1">
          <div
            className="text-base font-bold"
            style={{
              color: "var(--sys-navy)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Chat with Erin
          </div>
          <div className="text-[11px]" style={{ color: "var(--sys-muted)" }}>
            {hasBrief ? "Personalised with your brief" : "AI demo assistant"}
          </div>
          <div className="text-[11px]" style={{ color: "var(--sys-muted)" }}>
            A short text preview, up to 8 AI replies
          </div>
        </div>
      </div>

      {hasBrief ? (
        <div
          className="mb-4 rounded-[14px] p-4"
          style={{
            backgroundColor: "rgba(30, 136, 229, 0.05)",
            border: "1px solid var(--sys-border)",
          }}
        >
          <div
            className="mb-2 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--sys-blue-dark)" }}
          >
            Two steps to start
          </div>
          <ol className="space-y-1.5 text-xs leading-relaxed" style={{ color: "var(--sys-body)" }}>
            <li>
              <strong style={{ color: "var(--sys-navy)" }}>1.</strong> Copy your demo brief.
            </li>
            <li>
              <strong style={{ color: "var(--sys-navy)" }}>2.</strong> Paste it into the chat and
              send. Then play one of your customers.
            </li>
          </ol>
          <div className="mt-3">
            <CopyButton
              text={setupMessage}
              label="Copy your demo brief"
              copiedLabel="Brief copied"
            />
          </div>
          <p className="mt-2 text-[11px]" style={{ color: "var(--sys-muted)" }}>
            You paste the brief to apply it. The assistant uses only the details you provide.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--sys-body)" }}>
            Type your own questions. Use made-up details.
          </p>
          <p className="mb-4 text-[11px]" style={{ color: "var(--sys-muted)" }}>
            AI demo · no real bookings
          </p>
        </>
      )}

      <div
        className="w-full overflow-hidden rounded-[14px]"
        style={{ border: "1px solid var(--sys-border)", backgroundColor: "#F8FAFC" }}
      >
        <WidgetFrame
          key={reloadKey}
          title="Live Systemations AI text demo"
          widget={widget}
          className="h-[520px] sm:h-[620px]"
          fallbackText="The live chat could not load right now. Try again, or see a sample chat instead."
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
          style={{ border: "1px solid var(--sys-border)", color: "var(--sys-navy)" }}
        >
          <RefreshCw className="h-3 w-3" strokeWidth={2} />
          Reload chat
        </button>
        <button
          type="button"
          onClick={onSwitchToGuided}
          className="sys-gradient-fill inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/50"
        >
          See a sample chat instead
        </button>
      </div>
    </Card>
  );
}
