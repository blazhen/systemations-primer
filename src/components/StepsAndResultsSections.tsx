import { Check, Users } from "lucide-react";
import {
  HOW_IT_RUNS_STEPS,
  BUILT_FOR_YOU_POINTS,
  STAT_STRIP_ITEMS,
  CALL_STEPS,
} from "./landing-data";
import { Pill, SectionHeader, Divider } from "./LandingUi";

export function StepsAndResultsSections() {
  return (
    <>
      {/* 4. How it runs */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] items-stretch gap-10 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <div>
              <Pill variant="blue">How it runs</Pill>
              <h2
                className="mt-4 text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: "var(--sys-navy)",
                }}
              >
                Built in about 90 days.{" "}
                <span className="sys-gradient-text">Proven by go-live.</span>
              </h2>
            </div>

            <div className="mt-8 space-y-6">
              {HOW_IT_RUNS_STEPS.map((item) => (
                <div key={item.num} className="flex items-start gap-4">
                  <div
                    className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      color: "var(--sys-teal)",
                      backgroundColor: "rgba(20, 167, 154, 0.1)",
                      border: "1px solid var(--sys-teal)",
                    }}
                  >
                    {item.num}
                  </div>
                  <div>
                    <h3
                      className="text-base font-bold"
                      style={{
                        color: "var(--sys-navy)",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "var(--sys-body)" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-[28px] p-8 sm:p-10"
            style={{
              backgroundColor: "var(--sys-dark-ink)",
              backgroundImage:
                "radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.28) 0%, transparent 50%), radial-gradient(circle at 15% 85%, rgba(30, 136, 229, 0.22) 0%, transparent 50%)",
              boxShadow: "0 25px 50px -12px rgba(7, 14, 27, 0.4)",
            }}
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white/90"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--sys-green)" }}
              />
              BUILT FOR YOU
            </div>

            <h3
              className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Built around how you work
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
              Not a generic package. We fix the engine before we open the tap.
            </p>

            <ul className="mt-8 space-y-4">
              {BUILT_FOR_YOU_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: "var(--sys-green)" }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium text-white/90">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Divider />

      {/* 5. Results */}
      <section className="sys-section-tinted px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeader
          pill="Results"
          navyTitle="Owners like you,"
          gradientTitle="a few months on"
          sub="Builders, trades, inspection and service businesses. Real owners, real numbers."
        />

        <div className="mx-auto mt-12 grid max-w-[1120px] gap-6 md:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-[20px] bg-white p-[26px]"
              style={{
                border: "1px solid var(--sys-border)",
                boxShadow: "var(--sys-card-shadow)",
              }}
            >
              <div>
                <div
                  className="text-4xl font-extrabold tracking-tight"
                  style={{
                    color: "var(--sys-green)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  [NUMBER]
                </div>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--sys-navy)" }}>
                  [CLIENT QUOTE]
                </p>
              </div>

              <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--sys-border)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500"
                    style={{ border: "1px solid var(--sys-border)" }}
                    aria-label={`CLIENT_${idx}_PHOTO`}
                  >
                    C{idx}
                  </div>
                  <div>
                    <div
                      className="text-xs font-bold leading-tight"
                      style={{ color: "var(--sys-navy)" }}
                    >
                      [NAME]
                    </div>
                    <div
                      className="text-[11px] leading-tight"
                      style={{ color: "var(--sys-muted)" }}
                    >
                      [BUSINESS]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mx-auto mt-8 grid max-w-[1120px] rounded-[20px] bg-white p-6 sm:grid-cols-3 sm:p-8"
          style={{
            border: "1px solid var(--sys-border)",
            boxShadow: "var(--sys-card-shadow)",
          }}
        >
          {STAT_STRIP_ITEMS.map((stat, i) => (
            <div
              key={stat.label}
              className={`py-4 text-center sm:px-6 sm:py-2 ${
                i > 0 ? "border-t sm:border-t-0 sm:border-l" : ""
              }`}
              style={{ borderColor: "var(--sys-border)" }}
            >
              <div
                className="sys-gradient-text text-4xl font-extrabold tracking-tight sm:text-5xl"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {stat.num}
              </div>
              <div className="mt-2 text-sm leading-snug" style={{ color: "var(--sys-muted)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* 6. Your call */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeader
          pill="Your call"
          pillVariant="blue"
          navyTitle="One call."
          gradientTitle="Your business, running."
          sub="It isn't a slide deck. It's a screen share of the system running, mapped to your business."
        />

        <div className="mx-auto mt-12 grid max-w-[1120px] gap-6 md:grid-cols-3">
          {CALL_STEPS.map((step) => (
            <div
              key={step.num}
              className="rounded-[20px] bg-white p-[26px]"
              style={{
                border: "1px solid var(--sys-border)",
                boxShadow: "var(--sys-card-shadow)",
              }}
            >
              <div className="sys-gradient-fill flex h-11 w-11 items-center justify-center rounded-[12px] text-lg font-bold text-white">
                {step.num}
              </div>
              <h3
                className="mt-5 text-lg font-bold tracking-tight"
                style={{
                  color: "var(--sys-navy)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--sys-body)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div
          className="mx-auto mt-8 flex max-w-[1120px] items-center gap-4 rounded-[20px] p-6 sm:p-7"
          style={{
            backgroundColor: "rgba(30, 136, 229, 0.05)",
            border: "1px solid var(--sys-blue)",
          }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white"
            style={{
              border: "1px solid var(--sys-border)",
              color: "var(--sys-blue)",
              boxShadow: "0 2px 8px rgba(20, 33, 61, 0.04)",
            }}
          >
            <Users className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--sys-navy)" }}>
            <strong>Bring whoever else decides.</strong> If a partner, co-director or someone in the
            office has a say, get them on the call too, so you're not repeating it all back second
            hand.
          </p>
        </div>
      </section>
    </>
  );
}
