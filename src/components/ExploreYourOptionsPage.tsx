import { useEffect, useRef } from "react";
import { BrandBar, VideoHero } from "./explore-ui";
import { BeforeAfterSection, JourneySection, StatsStrip } from "./explore-visual-sections";
import { OperationsRoom } from "./explore-room3d";
import { InteractiveDemo } from "./explore-interactive-demo";
import { EndingSection, Footer } from "./explore-sections";
import { BusinessBriefProvider } from "./explore-business-brief";

// Thin gradient progress bar at the very top. Scroll listener + rAF, transform only.
function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Shown for everyone: it is a position indicator, not decorative movement.
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={barRef} className="sys-scrollbar" aria-hidden="true" />;
}

export function ExploreYourOptionsPage() {
  const demoRef = useRef<HTMLDivElement>(null);

  return (
    <BusinessBriefProvider>
      <div
        className="sys-explore-scope min-h-screen text-[16px] leading-relaxed antialiased"
        style={{
          backgroundColor: "var(--sys-bg)",
          color: "var(--sys-body)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <ScrollProgress />
        <BrandBar />
        <main>
          <VideoHero />
          <StatsStrip />
          <OperationsRoom />
          <JourneySection />
          <BeforeAfterSection />
          <InteractiveDemo demoRef={demoRef} />
          <EndingSection />
          <Footer />
        </main>
      </div>
    </BusinessBriefProvider>
  );
}
