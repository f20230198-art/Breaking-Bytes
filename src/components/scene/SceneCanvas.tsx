"use client";
/* eslint-disable @next/next/no-img-element -- scene layers are pre-optimised WebP that must stack pixel-exact */

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { DEPTHS, sceneAssets, type SceneId } from "@/scenes/config";

type Props = {
  scene: SceneId;
  /** Layer ids to leave out of the default stack (e.g. variants rendered by the parent). */
  hide?: string[];
  /** Rendered inside the canvas, in canvas coordinates (percentages line up with the art). */
  children?: ReactNode;
  priority?: boolean;
  className?: string;
  /** Extra styles per layer id (e.g. a clip-path reveal). A `transform` here replaces the parallax. */
  layerStyle?: Record<string, CSSProperties>;
  /** Extra scale so parallax never shows an edge. Keep small: every bit of it is zoom. */
  overscan?: number;
  /** Background shown wherever layers move off the canvas. */
  bg?: string;
  /** Skip the inpainted plate when an opaque full-canvas layer (e.g. a sky) already fills the back. */
  plate?: boolean;
  /** Layers that can arrive after first paint (hover reveals, small props). */
  deferred?: string[];
  /** Which part of the art stays in view when the window is wider/narrower than the art: 0 = top edge, 0.5 = centre, 1 = bottom edge. */
  anchorY?: number;
};

/**
 * Stacks a scene's full-canvas layers so they line up 1:1, scaled to cover the viewport
 * (like object-fit: cover). Mouse movement drives a subtle parallax via CSS variables.
 */
export function SceneCanvas({ scene, hide = [], children, priority, className = "", layerStyle = {}, overscan = 1.06, bg = "bg-ink", plate = true, deferred = [], anchorY = 0.5 }: Props) {
  const a = sceneAssets(scene);
  const depths = DEPTHS[scene];
  const ref = useRef<HTMLDivElement>(null);
  const ratio = a.width / a.height;

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${bg} ${className}`}>
      {/* cover box: always fills the viewport while keeping the art's aspect ratio */}
      <div
        data-canvas
        className="absolute left-1/2"
        style={{ top: `${anchorY * 100}%`, transform: `translate(-50%, -${anchorY * 100}%)`, width: `max(100vw, ${100 * ratio}vh)`, height: `max(100vh, ${100 / ratio}vw)` }}
      >
        <div className="absolute inset-0" style={{ scale: overscan }}>
          {plate && <img src={a.plate} alt="" className="absolute inset-0 h-full w-full select-none" draggable={false} />}
          {a.layers
            .filter((l) => !hide.includes(l.id))
            .map((l) => (
              <img
                key={l.id}
                src={l.src}
                alt=""
                data-layer={l.id}
                draggable={false}
                srcSet={l.srcset}
                sizes={`(min-aspect-ratio: ${a.width}/${a.height}) 100vw, ${(100 * ratio).toFixed(1)}vh`}
                decoding="async"
                fetchPriority={deferred.includes(l.id) ? "low" : priority ? "high" : "auto"}
                className="absolute inset-0 h-full w-full select-none will-change-transform"
                style={{
                  transform: `translate3d(calc(var(--mx, 0) * ${-(depths[l.id] ?? 0.3) * 18}px), calc(var(--my, 0) * ${-(depths[l.id] ?? 0.3) * 10}px), 0)`,
                  ...layerStyle[l.id],
                }}
              />
            ))}
          {children}
        </div>
      </div>
    </div>
  );
}

/** Position helper: place children at a layer's bbox (fractions of the canvas). */
export function bboxStyle(bbox: number[]) {
  const [x0, y0, x1, y1] = bbox;
  return { left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` };
}
