import { HeroSection } from "./HeroSection";
import { MiddleFeaturesSections } from "./MiddleFeaturesSections";
import { StepsAndResultsSections } from "./StepsAndResultsSections";
import { BottomSections } from "./BottomSections";
import { LOGO_URL } from "./explore-data";

export function WatchBeforeYourCallPage() {
  return (
    <div
      className="min-h-screen text-[16px] leading-relaxed antialiased"
      style={{
        backgroundColor: "var(--sys-bg)",
        color: "var(--sys-body)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 0. Top bar */}
      <header className="sticky top-3 z-50 px-4 sm:px-6">
        <div
          className="mx-auto flex h-14 w-full max-w-[1120px] items-center justify-between px-5 sm:px-6"
          style={{
            borderRadius: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.72)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid var(--sys-border)",
            boxShadow: "0 8px 24px rgba(20, 33, 61, 0.06)",
          }}
        >
          {/* LOGO: about 28px tall */}
          <div className="flex items-center gap-2">
            <img
              src={LOGO_URL}
              alt="Systemations"
              style={{ height: 28, width: "auto", display: "block" }}
              className="shrink-0"
            />
          </div>

          {/* Green status pill */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold"
            style={{
              color: "var(--sys-green-text)",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: "var(--sys-green)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--sys-green)" }}
              />
            </span>
            <span>Your call is booked</span>
          </div>
        </div>
      </header>

      <main>
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Sound familiar? & 3. What you get */}
        <MiddleFeaturesSections />

        {/* 4. How it runs, 5. Results & 6. Your call */}
        <StepsAndResultsSections />

        {/* 7. Meet Dan, 8. FAQ, 9. Promise & 10. Footer */}
        <BottomSections />
      </main>
    </div>
  );
}
