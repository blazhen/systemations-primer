import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { BrandBar, VideoHero } from "./explore-ui";
import { StatsStrip } from "./explore-visual-sections";
import { EndingSection, Footer } from "./explore-sections";
import { BusinessBriefProvider } from "./explore-business-brief";

// Heavy below-the-fold sections load as separate chunks, only when the visitor nears them.
const OperationsRoom = lazy(() =>
  import("./explore-room3d").then((m) => ({ default: m.OperationsRoom })),
);
const JourneySection = lazy(() =>
  import("./explore-visual-sections").then((m) => ({ default: m.JourneySection })),
);
const BeforeAfterSection = lazy(() =>
  import("./explore-visual-sections").then((m) => ({ default: m.BeforeAfterSection })),
);
const InteractiveDemo = lazy(() =>
  import("./explore-interactive-demo").then((m) => ({ default: m.InteractiveDemo })),
);

// Mounts its children once it is within 400px of the screen (or at once when `eager`).
// Until then it renders an empty box of the expected height, so nothing shifts. The server
// renders the placeholder only. `contain` turns on content-visibility for light sections.
function LazyOnView({
  children,
  height,
  eager = false,
  contain = false,
  label,
}: {
  children: ReactNode;
  /** Expected height in px, used for the placeholder and the off-screen size estimate. */
  height: number;
  eager?: boolean;
  contain?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const show = seen || eager;

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  const style = { ["--sys-cv" as string]: `${height}px` } as CSSProperties;
  return (
    <div
      ref={ref}
      className={contain && show ? "sys-cv-auto" : undefined}
      style={show ? style : { ...style, minHeight: height }}
    >
      {show ? (
        <Suspense fallback={<div aria-hidden="true" style={{ minHeight: height }} />}>
          {children}
        </Suspense>
      ) : (
        <div aria-hidden="true" data-placeholder={label} />
      )}
    </div>
  );
}

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
  // A link like ?demo=pipeline or #quote must find its section, so mount everything at once.
  const [deepLink, setDeepLink] = useState(false);
  useEffect(() => {
    const hasDemoQuery = new URLSearchParams(window.location.search).has("demo");
    if (hasDemoQuery || window.location.hash.length > 1) setDeepLink(true);
  }, []);

  return (
    <BusinessBriefProvider>
      <div
        className="sys-explore-scope min-h-screen text-[16px] leading-relaxed antialiased"
        style={{
          backgroundColor: "var(--sys-bg)",
          color: "var(--sys-body)",
          fontFamily: "var(--sys-font-body)",
        }}
      >
        <a href="#main" className="sys-skip-link">
          Skip to main content
        </a>
        <ScrollProgress />
        <BrandBar />
        <main id="main" tabIndex={-1}>
          <VideoHero />
          <StatsStrip />
          <LazyOnView label="room" height={900} eager={deepLink} contain>
            <OperationsRoom />
          </LazyOnView>
          <LazyOnView label="journey" height={1100} eager={deepLink} contain>
            <JourneySection />
          </LazyOnView>
          <LazyOnView label="before-after" height={800} eager={deepLink} contain>
            <BeforeAfterSection />
          </LazyOnView>
          <LazyOnView label="demo" height={1300} eager={deepLink}>
            <InteractiveDemo demoRef={demoRef} />
          </LazyOnView>
          <EndingSection />
          <Footer />
        </main>
      </div>
    </BusinessBriefProvider>
  );
}
