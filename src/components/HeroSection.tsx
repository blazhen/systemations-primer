import { useState } from "react";
import { Clock, Check, Play } from "lucide-react";
import { Pill } from "./LandingUi";
import { EXPLORE_CONFIG } from "./explore-data";

export function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  // One place to switch the video on: EXPLORE_CONFIG.welcomeVideoUrl in explore-data.ts.
  const welcomeVideoUrl = EXPLORE_CONFIG.welcomeVideoUrl;

  return (
    <section className="sys-hero-pattern relative -mt-16 px-4 pt-28 pb-20 sm:px-6 sm:pt-32 sm:pb-24">
      <div className="mx-auto max-w-[820px] text-center">
        <Pill variant="violet">Before your call</Pill>
        <h1
          className="mt-6 text-balance text-[38px] font-bold tracking-[-0.02em] sm:text-[68px]"
          style={{
            fontFamily: "var(--sys-font-display)",
            lineHeight: 1.04,
            color: "var(--sys-navy)",
          }}
        >
          Watch this before
          <br />
          <span className="sys-gradient-text">we speak</span>
        </h1>
        <p
          className="mx-auto mt-6 max-w-[700px] text-lg leading-relaxed sm:text-[20px]"
          style={{ color: "var(--sys-body)" }}
        >
          A short message from Dan, our founder. It's the only thing we ask you to do before your
          call, so we spend the time on your business, not the basics.
        </p>
      </div>

      <div className="relative mx-auto mt-10 max-w-[940px] sm:mt-12">
        {/* Top-right floating chip */}
        <div
          className="absolute -top-5 right-4 z-20 hidden items-center gap-3 rounded-[16px] bg-white px-4 py-2.5 sm:flex"
          style={{
            border: "1px solid var(--sys-border)",
            boxShadow: "0 10px 25px rgba(20, 33, 61, 0.08)",
          }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "var(--sys-green)",
            }}
          >
            <Check className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="text-left">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "var(--sys-muted)" }}
            >
              THE ONLY PREP
            </div>
            <div className="text-xs font-bold leading-tight" style={{ color: "var(--sys-navy)" }}>
              we ask of you
            </div>
          </div>
        </div>

        {/* Dark device frame */}
        <div
          className="relative overflow-visible rounded-[18px] p-[7px] sm:rounded-[30px] sm:p-[12px]"
          style={{
            backgroundColor: "#1B2433",
            boxShadow:
              "0 25px 60px -15px rgba(16, 32, 51, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          }}
        >
          <div
            className="relative aspect-video w-full overflow-hidden rounded-[14px] sm:rounded-[20px]"
            style={{
              backgroundColor: "#070E1B",
              backgroundImage:
                "radial-gradient(circle at center, rgba(30, 136, 229, 0.28) 0%, rgba(98, 49, 189, 0.22) 50%, transparent 80%)",
            }}
          >
            {!welcomeVideoUrl ? (
              <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
                <p className="text-sm font-medium leading-relaxed text-white/80 sm:text-base">
                  Dan's video is coming soon.
                </p>
              </div>
            ) : isPlaying ? (
              <iframe
                src={welcomeVideoUrl}
                title="A message from Dan, founder of Systemations"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : (
              <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  className="sys-gradient-fill group flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 sm:h-[84px] sm:w-[84px]"
                  aria-label="Play video from Dan"
                >
                  <Play
                    className="ml-1 h-7 w-7 text-white transition-transform group-hover:scale-110 sm:h-9 sm:w-9"
                    fill="white"
                  />
                </button>
                <div className="mt-4 text-xs font-medium tracking-wide text-white/70 sm:text-sm">
                  Press play to watch
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom-left floating runtime chip */}
        <div className="relative mt-4 flex items-center justify-center sm:absolute sm:-bottom-5 sm:left-4 sm:z-20 sm:mt-0 sm:justify-start">
          <div
            className="flex items-center gap-3 rounded-[16px] bg-white px-4 py-2.5"
            style={{
              border: "1px solid var(--sys-border)",
              boxShadow: "0 10px 25px rgba(20, 33, 61, 0.08)",
            }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "rgba(30, 136, 229, 0.1)",
                color: "var(--sys-blue)",
              }}
            >
              <Clock className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="text-left">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--sys-muted)" }}
              >
                RUNTIME
              </div>
              <div className="text-xs font-bold leading-tight" style={{ color: "var(--sys-navy)" }}>
                About 7 minutes
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm sm:mt-8" style={{ color: "var(--sys-muted)" }}>
          Grab a coffee and watch it through. It's worth the seven minutes.
        </p>
      </div>
    </section>
  );
}
