import { MessageSquare, RefreshCw, Kanban, FileText, Zap, LineChart } from "lucide-react";
import { SOUND_FAMILIAR_QUOTES, WHAT_YOU_GET_ITEMS, FEATURE_PILLS } from "./landing-data";
import { SectionHeader, Divider } from "./LandingUi";

const ICONS = {
  chat: MessageSquare,
  refresh: RefreshCw,
  kanban: Kanban,
  document: FileText,
  lightning: Zap,
  chart: LineChart,
};

export function MiddleFeaturesSections() {
  return (
    <>
      {/* 2. Sound familiar? */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeader
          pill="Sound familiar?"
          navyTitle="If you're the one holding it all together,"
          gradientTitle="this is for you"
          sub="These are the things owners tell us on nearly every first call."
        />

        <div className="mx-auto mt-12 grid max-w-[820px] gap-5 sm:grid-cols-2">
          {SOUND_FAMILIAR_QUOTES.map((quote) => (
            <div
              key={quote}
              className="relative rounded-[20px] bg-white p-[26px]"
              style={{
                border: "1px solid var(--sys-border)",
                boxShadow: "var(--sys-card-shadow)",
              }}
            >
              <span
                className="sys-gradient-text block text-4xl font-black leading-none select-none"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                &ldquo;
              </span>
              <p
                className="mt-2 text-[19px] font-semibold leading-snug"
                style={{
                  color: "var(--sys-navy)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {quote}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-[820px] text-center">
          <p className="text-base leading-relaxed sm:text-lg" style={{ color: "var(--sys-body)" }}>
            <strong style={{ color: "var(--sys-navy)" }}>
              You're not short of work. You're short of a system.
            </strong>{" "}
            Everything runs through you, so you can't take a week off without it stalling, and you
            can't grow past your own hours.
          </p>
        </div>
      </section>

      <Divider />

      {/* 3. What you get */}
      <section className="sys-section-tinted px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeader
          pill="What you get"
          navyTitle="One system that runs the business,"
          gradientTitle="so you stop being the bottleneck"
          sub="We take what lives in your head, your phone and six disconnected tools, and rebuild it as one system. Repetitive work goes to automation. The work that needs a person gets the right information in front of that person at the right moment."
        />

        <div className="mx-auto mt-12 grid max-w-[1120px] gap-6 md:grid-cols-2 lg:grid-cols-3">
          {WHAT_YOU_GET_ITEMS.map((card) => {
            const Icon = ICONS[card.iconName as keyof typeof ICONS];
            return (
              <div
                key={card.title}
                className="rounded-[20px] bg-white p-[26px]"
                style={{
                  border: "1px solid var(--sys-border)",
                  boxShadow: "var(--sys-card-shadow)",
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white"
                  style={{
                    border: "1px solid var(--sys-border)",
                    color: card.color,
                    boxShadow: "0 2px 8px rgba(20, 33, 61, 0.04)",
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3
                  className="mt-5 text-lg font-bold tracking-tight"
                  style={{
                    color: "var(--sys-navy)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--sys-body)" }}>
                  {card.line}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 flex max-w-[900px] flex-wrap items-center justify-center gap-2.5">
          {FEATURE_PILLS.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium"
              style={{
                border: "1px solid var(--sys-border)",
                color: "var(--sys-navy)",
                boxShadow: "0 2px 6px rgba(20, 33, 61, 0.03)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--sys-teal)" }}
              />
              {tag}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
