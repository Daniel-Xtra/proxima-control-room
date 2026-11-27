import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Keeps a figure on one line and whole: it shrinks only when it is wider than the space it has.
 * An amount must never be cut off, because what is left still reads as a smaller, real amount.
 */
export function FitText({ children }: { children: ReactNode }) {
  const box = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const outer = box.current;
    const inner = text.current;
    if (!outer || !inner) return;
    // Measured at full size each time, so the figure grows back when there is room again.
    inner.style.fontSize = "";
    const ratio = outer.clientWidth / inner.offsetWidth;
    // Rounded down to a tenth of a percent, so rounding can never leave it a fraction too wide.
    if (ratio < 1) inner.style.fontSize = `${Math.floor(ratio * 1000) / 10}%`;
  }, []);

  // After every render, since the figure itself may have changed.
  useLayoutEffect(fit);

  useEffect(() => {
    // The web font arrives after the first measurement and is a different width.
    void document.fonts?.ready.then(fit);
    if (!box.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [fit]);

  return (
    <span ref={box} className="block">
      <span ref={text} className="inline-block whitespace-nowrap">
        {children}
      </span>
    </span>
  );
}
