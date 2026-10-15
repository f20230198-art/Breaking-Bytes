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
  /** Extra styles per layer id (e.g. a clip-path reveal), merged with the parallax transform. */
  layerStyle?: Record<string, CSSProperties>;
};

/**
 * Stacks a scene's full-canvas layers so they line up 1:1, scaled to cover the viewport
 * (like object-fit: cover). Mouse movement drives a subtle parallax via CSS variables.
 */
export function SceneCanvas({ scene, hide = [], children, priority, className = "", layerStyle = {} }: Props) {
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
    <div ref={ref} className={`absolute inset-0 overflow-hidden bg-ink ${className}`}>
      {/* cover box: always fills the viewport while keeping the art's aspect ratio */}
      <div
        data-canvas
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: `max(100vw, ${100 * ratio}vh)`, height: `max(100vh, ${100 / ratio}vw)` }}
      >
        <div className="absolute inset-0 scale-[1.06]">
          <img src={a.plate} alt="" className="absolute inset-0 h-full w-full select-none" draggable={false} />
          {a.layers
            .filter((l) => !hide.includes(l.id))
            .map((l) => (
              <img
                key={l.id}
                src={l.src}
                alt=""
                data-layer={l.id}
                draggable={false}
                fetchPriority={priority ? "high" : "auto"}
                className="absolute inset-0 h-full w-full select-none will-change-transform"
                style={{
                  ...layerStyle[l.id],
                  transform: `translate3d(calc(var(--mx, 0) * ${-(depths[l.id] ?? 0.3) * 18}px), calc(var(--my, 0) * ${-(depths[l.id] ?? 0.3) * 10}px), 0)`,
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
