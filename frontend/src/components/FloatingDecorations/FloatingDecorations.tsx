"use client";

import { useMemo } from "react";
import styles from "./FloatingDecorations.module.css";

interface DecorationItem {
  id: number;
  type: "heart" | "rose";
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
}

function MiniHeart({ size, uniqueId }: { size: number; uniqueId: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id={`heartGrad-${uniqueId}`}
          cx="50%"
          cy="40%"
          r="60%"
        >
          <stop offset="0%" stopColor="#f8bbd0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f06292" stopOpacity="0.25" />
        </radialGradient>
        <filter id={`heartGlow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={`url(#heartGrad-${uniqueId})`}
        filter={`url(#heartGlow-${uniqueId})`}
      />
    </svg>
  );
}

function MiniRose({ size, uniqueId }: { size: number; uniqueId: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          id={`roseGrad-${uniqueId}`}
          cx="50%"
          cy="40%"
          r="60%"
        >
          <stop offset="0%" stopColor="#f8bbd0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f06292" stopOpacity="0.2" />
        </radialGradient>
        <filter id={`roseGlow-${uniqueId}`}>
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Rose petals */}
      <ellipse
        cx="16"
        cy="12"
        rx="5"
        ry="7"
        fill={`url(#roseGrad-${uniqueId})`}
        filter={`url(#roseGlow-${uniqueId})`}
        transform="rotate(-15, 16, 12)"
      />
      <ellipse
        cx="16"
        cy="12"
        rx="5"
        ry="7"
        fill={`url(#roseGrad-${uniqueId})`}
        filter={`url(#roseGlow-${uniqueId})`}
        transform="rotate(15, 16, 12)"
      />
      <ellipse
        cx="16"
        cy="13"
        rx="4"
        ry="5.5"
        fill={`url(#roseGrad-${uniqueId})`}
        filter={`url(#roseGlow-${uniqueId})`}
      />
      {/* Stem */}
      <line
        x1="16"
        y1="18"
        x2="16"
        y2="28"
        stroke="rgba(129, 199, 132, 0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Leaf */}
      <ellipse
        cx="19"
        cy="23"
        rx="3"
        ry="1.5"
        fill="rgba(129, 199, 132, 0.22)"
        transform="rotate(-30, 19, 23)"
      />
    </svg>
  );
}

export default function FloatingDecorations() {
  const decorations = useMemo<DecorationItem[]>(() => {
    const items: DecorationItem[] = [];
    for (let i = 0; i < 14; i++) {
      items.push({
        id: i,
        type: i % 3 === 0 ? "rose" : "heart",
        top: `${5 + Math.random() * 85}%`,
        left: `${3 + Math.random() * 90}%`,
        size: 20 + Math.random() * 30,
        delay: `${Math.random() * -20}s`,
        duration: `${15 + Math.random() * 15}s`,
        opacity: 0.2 + Math.random() * 0.4,
      });
    }
    return items;
  }, []);

  return (
    <div className={styles.container} aria-hidden="true">
      {decorations.map((item) => (
        <div
          key={item.id}
          className={styles.decoration}
          style={{
            top: item.top,
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
            opacity: item.opacity,
          }}
        >
          {item.type === "heart" ? (
            <MiniHeart size={item.size} uniqueId={item.id} />
          ) : (
            <MiniRose size={item.size} uniqueId={item.id} />
          )}
        </div>
      ))}
    </div>
  );
}
