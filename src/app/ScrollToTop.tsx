import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Starts each newly opened page at the top. A change of tab, filter or table page keeps its place, because the path
 * stays the same. Back and forward are left to the browser, which returns to where the reader was.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const shownPath = useRef(pathname);

  // Before paint, so the new page is never seen part of the way down.
  useLayoutEffect(() => {
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    if (navigationType !== "POP") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, navigationType]);

  return null;
}
