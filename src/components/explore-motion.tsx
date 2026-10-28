import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// ---------------------------------------------------------------------------
// Small motion helpers. SSR-safe: nothing touches window or document during
// render, and the hidden start state only exists after mount, so content is
// never hidden when JS has not run.
// ---------------------------------------------------------------------------

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(REDUCE_QUERY);
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

type RevealPhase = "idle" | "hidden" | "shown";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay in ms before the lift starts. */
  delay?: number;
  /** Reveal the direct children one after another (60ms apart) instead of the wrapper. */
  stagger?: boolean;
}

export function Reveal({
  delay = 0,
  stagger = false,
  className = "",
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<RevealPhase>("idle");

  // Layout effect so the hidden start state lands before the first paint (no flash).
  // Reduced motion no longer opts out here: the css turns the rise into a plain fade.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    // Scrolled well past (page reloaded part-way down): leave it visible.
    if (rect.bottom < 0) return;
    setPhase("hidden");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("shown");
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const phaseClass =
    phase === "idle" ? "" : phase === "hidden" ? "sys-reveal-hidden" : "sys-reveal-shown";
  const merged = [className, stagger ? "sys-reveal-group" : "", phaseClass]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={merged}
      style={{ ...style, ["--d" as string]: `${delay}ms` }}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Parallax drift: writes --py (px) on the element from page scroll. Transform
 * only, rAF throttled, off under reduced motion. Children read the variable
 * with their own multiplier.
 */
export function useScrollDrift(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia(REDUCE_QUERY).matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      el.style.setProperty("--py", `${Math.min(window.scrollY, 900)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}

/** True after mount, from a layout effect, so SSR text is visible and the entrance starts unflashed. */
export function useArmed(): boolean {
  const [armed, setArmed] = useState(false);
  useIsoLayoutEffect(() => setArmed(true), []);
  return armed;
}

function formatNumber(n: number, decimals: number): string {
  return n.toLocaleString("en-AU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1200,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Starts at the final value so server HTML, no-JS and reduced motion all read correctly.
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia(REDUCE_QUERY).matches || typeof IntersectionObserver === "undefined") {
      setShown(value);
      return;
    }
    let raf = 0;
    setShown(0);
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(value * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(shown, decimals)}
      {suffix}
    </span>
  );
}
