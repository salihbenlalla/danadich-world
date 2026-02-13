"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Heart.module.css";

interface HeartProps {
  onHoldStart: () => void;
  onHoldEnd: () => void;
  partnerHolding: boolean;
  together: boolean;
}

export default function Heart({
  onHoldStart,
  onHoldEnd,
  partnerHolding,
  together,
}: HeartProps) {
  const isHoldingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [holding, setHolding] = useState(false);

  const handleStart = useCallback(() => {
    if (isHoldingRef.current) return;
    isHoldingRef.current = true;
    setHolding(true);
    onHoldStart();
  }, [onHoldStart]);

  const handleEnd = useCallback(() => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    setHolding(false);
    onHoldEnd();
  }, [onHoldEnd]);

  // Touch listeners must use { passive: false } for preventDefault to work.
  // React's synthetic touch events are passive, causing "Unable to preventDefault" warnings.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      handleStart();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      handleEnd();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [handleStart, handleEnd]);

  const heartClass = [
    styles.heartContainer,
    holding || partnerHolding ? styles.active : "",
    together ? styles.together : "",
    partnerHolding && !together ? styles.partnerPulse : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={containerRef}
      className={heartClass}
      onMouseDown={(e) => {
        e.preventDefault();
        handleStart();
      }}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div className={styles.glowOrb} />
      <svg
        className={styles.heartSvg}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient
            id="mainHeartGrad"
            cx="50%"
            cy="35%"
            r="65%"
            fx="50%"
            fy="35%"
          >
            <stop offset="0%" stopColor="#ff8fba" />
            <stop offset="50%" stopColor="var(--rose)" />
            <stop offset="100%" stopColor="var(--rose-deep)" />
          </radialGradient>
          <radialGradient
            id="togetherGrad"
            cx="50%"
            cy="35%"
            r="65%"
            fx="50%"
            fy="35%"
          >
            <stop offset="0%" stopColor="var(--gold)" />
            <stop offset="50%" stopColor="#ffb300" />
            <stop offset="100%" stopColor="var(--rose)" />
          </radialGradient>
          <filter id="mainHeartGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={together ? "url(#togetherGrad)" : "url(#mainHeartGrad)"}
          filter="url(#mainHeartGlow)"
        />
      </svg>
    </div>
  );
}
