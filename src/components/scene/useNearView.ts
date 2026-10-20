"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True while the element is on screen or within `margin` of it. Off-screen scenes use it to go to sleep: no pointer
 * parallax, no GPU layers held, and (through `data-idle`) their CSS animations paused.
 */
export function useNearView(ref: RefObject<Element | null>, margin = "50%") {
  const [near, setNear] = useState(true); // start awake so the first paint matches the server render
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: `${margin} 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return near;
}
