import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DAN_PHOTO_URL, FAQ_ITEMS } from "./landing-data";
import { Pill, Divider } from "./LandingUi";
import { LOGO_URL } from "./explore-data";

export function BottomSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <Divider />

      {/* 7. Meet Dan */}
      <section className="sys-section-tinted px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 lg:grid-cols-[300px_1fr]">
          <div className="mx-auto w-full max-w-[300px]">
            {/* DAN_HEADSHOT: 4:5, 28px radius, 6px white border */}
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-white p-1.5"
              style={{
                boxShadow: "0 20px 40px -10px rgba(20, 33, 61, 0.15)",
              }}
            >
              <img
                src={DAN_PHOTO_URL}
                alt="Dan O'Sullivan, founder of Systemations"
                className="h-full w-full rounded-[22px] object-cover"
              />
            </div>
          </div>

          <div>
            <Pill variant="violet">Who you're dealing with</Pill>
            <h2
              className="mt-4 text-balance text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "var(--sys-navy)",
              }}
            >
              Built by an operator, <span className="sys-gradient-text">for operators</span>
            </h2>

            <div
              className="mt-6 space-y-4 text-base leading-relaxed sm:text-lg"
              style={{ color: "var(--sys-body)" }}
            >
              <p>
                I started Systemations because I kept meeting good operators stuck doing admin at
                night. They didn't need another tool or another agency selling them more leads. They
                needed the engine fixed before anyone opened the tap.
              </p>
              <p>
                We own the strategy and we build it. And every system we sell is one we run our own
                business on: our pipeline, our follow-up, our onboarding and our reporting. I'm not
                selling a theory, I'm selling the thing that runs my week.
              </p>
            </div>

            <div className="mt-8 border-t pt-5" style={{ borderColor: "var(--sys-border)" }}>
              <div
                className="text-base font-bold"
                style={{
                  color: "var(--sys-navy)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Dan O'Sullivan
              </div>
              <div className="text-xs" style={{ color: "var(--sys-muted)" }}>
                Founder, Systemations
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* 8. FAQ */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[820px] text-center">
          <Pill variant="violet">Questions</Pill>
          <h2
            className="mt-4 text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: "var(--sys-navy)",
            }}
          >
            Before you ask
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-[820px] space-y-3">
          {FAQ_ITEMS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-[16px] bg-white transition-colors"
                style={{
                  border: "1px solid var(--sys-border)",
                  boxShadow: "0 2px 8px rgba(20, 33, 61, 0.03)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-base font-bold sm:p-6"
                  style={{
                    color: "var(--sys-navy)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    style={{
                      backgroundColor: "rgba(30, 136, 229, 0.08)",
                      color: "var(--sys-blue)",
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
                {isOpen && (
                  <div
                    className="border-t px-5 pb-6 pt-3 text-sm leading-relaxed sm:px-6 sm:text-base"
                    style={{
                      borderColor: "var(--sys-border)",
                      color: "var(--sys-body)",
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* 9. Promise */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div
          className="mx-auto max-w-[1120px] rounded-[32px] p-8 text-center sm:p-14"
          style={{
            backgroundColor: "var(--sys-dark-ink)",
            backgroundImage:
              "radial-gradient(circle at 10% 20%, rgba(30, 136, 229, 0.28) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.28) 0%, transparent 45%)",
            boxShadow: "0 25px 60px -15px rgba(7, 14, 27, 0.45)",
          }}
        >
          <span
            className="inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.15)",
              color: "#C4B5FD",
              border: "1px solid rgba(139, 92, 246, 0.3)",
            }}
          >
            Our standard
          </span>

          <h2
            className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            If we take it on, it pays for itself.
          </h2>

          <p className="mx-auto mt-6 max-w-[680px] text-base leading-relaxed text-white/80 sm:text-lg">
            We only take a build on if we're confident it pays for itself. On the call we'll show
            you where the time and the money come back in your business. See you then.
          </p>
        </div>
      </section>

      {/* 10. Footer */}
      <footer
        className="border-t px-4 py-12 text-center sm:px-6"
        style={{ borderColor: "var(--sys-border)" }}
      >
        <div className="mx-auto max-w-[600px] space-y-4">
          <div className="flex justify-center">
            <img
              src={LOGO_URL}
              alt="Systemations"
              style={{ height: 24, width: "auto", display: "block" }}
              className="shrink-0"
            />
          </div>

          <p className="text-xs font-medium" style={{ color: "var(--sys-muted)" }}>
            Systemations Pty Ltd
          </p>
        </div>
      </footer>
    </>
  );
}
