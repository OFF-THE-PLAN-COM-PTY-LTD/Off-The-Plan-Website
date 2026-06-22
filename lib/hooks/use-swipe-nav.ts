"use client";

import { useEffect, useRef } from "react";

/**
 * Attach touch + trackpad swipe navigation to a DOM ref.
 *
 * Client ask (Tim, 15 Jun PDF p.4): "UX fix for image galleries the ability
 * to swipe left and right on touch screens. And double finger mouse for
 * example ie as well as just clicking the arrows." This hook covers both:
 *
 *  - **Pointer events** for touch (and mouse drag) — measures horizontal
 *    travel from pointerdown to pointerup; if > SWIPE_PX and X is dominant
 *    over Y, fires onPrev/onNext (positive deltaX = swipe right → prev).
 *  - **Wheel events** for trackpad two-finger horizontal scroll — when the
 *    accumulated deltaX crosses WHEEL_PX, fires onPrev/onNext. A short
 *    cooldown prevents one continuous swipe from firing repeatedly. Vertical
 *    wheel/mouse-scroll is ignored so page scrolling is unaffected.
 *
 * Designed to coexist with existing click handlers — callers should still
 * stopPropagation on overlay buttons. The hook only listens on the ref'd
 * element; nothing global.
 *
 * Pass `enabled: false` (e.g. when in a zoomed state) to no-op safely.
 */
export function useSwipeNav<T extends HTMLElement>(
  ref: React.RefObject<T>,
  opts: {
    onPrev: () => void;
    onNext: () => void;
    enabled?: boolean;
    /** Minimum X travel (px) for a pointer swipe to count. Default 40. */
    swipePx?: number;
    /** Trackpad horizontal scroll accumulation (px) per nav. Default 70. */
    wheelPx?: number;
  },
): void {
  const { onPrev, onNext, enabled = true, swipePx = 40, wheelPx = 70 } = opts;

  // Keep handlers in a ref so the listeners stay stable across renders
  // (no re-attaching every time the parent state changes).
  const onPrevRef = useRef(onPrev);
  const onNextRef = useRef(onNext);
  useEffect(() => { onPrevRef.current = onPrev; }, [onPrev]);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    // ── Pointer (touch / drag) ─────────────────────────────────────────
    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onPointerDown = (e: PointerEvent) => {
      // Only track primary touches / left mouse drags.
      if (e.button !== undefined && e.button !== 0) return;
      tracking = true;
      startX = e.clientX;
      startY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // Require horizontal-dominant travel; reject vertical swipes so the
      // user can still scroll the page over the carousel.
      if (Math.abs(dx) < swipePx) return;
      if (Math.abs(dy) > Math.abs(dx)) return;
      if (dx > 0) onPrevRef.current();
      else onNextRef.current();
    };

    const onPointerCancel = () => { tracking = false; };

    // ── Wheel (trackpad two-finger horizontal scroll) ──────────────────
    let wheelAccum = 0;
    let cooldown = false;

    const onWheel = (e: WheelEvent) => {
      // Ignore vertical scrolls and tiny noise so the page keeps scrolling
      // when the cursor is over the carousel.
      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);
      if (ax <= ay) return;
      if (ax < 4) return;
      // Two-finger horizontal swipe — consume it so the page doesn't scroll
      // sideways while we're advancing the carousel.
      e.preventDefault();
      if (cooldown) return;
      wheelAccum += e.deltaX;
      if (Math.abs(wheelAccum) < wheelPx) return;
      if (wheelAccum > 0) onNextRef.current();
      else onPrevRef.current();
      wheelAccum = 0;
      cooldown = true;
      setTimeout(() => { cooldown = false; }, 320);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    // passive:false so we can preventDefault on horizontal wheel.
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("wheel", onWheel);
    };
  }, [ref, enabled, swipePx, wheelPx]);
}
