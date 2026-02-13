"use client";

import { useCallback, useState } from "react";
import styles from "./RitualUnlock.module.css";

interface RitualUnlockProps {
  role: "dandouch" | "dandoucha";
  onUnlock: () => void;
}

export default function RitualUnlock({ role, onUnlock }: RitualUnlockProps) {
  const [unlocking, setUnlocking] = useState(false);

  const message =
    role === "dandoucha"
      ? "دندوشتي، المِسي هذه الرسالة لتفتحي أبواب عالمنا..."
      : "دندوش، المِس هذه الرسالة لتفتح أبواب عالمنا...";

  const handleUnlock = useCallback(() => {
    if (unlocking) return;
    setUnlocking(true);

    // Request fullscreen
    try {
      document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen not supported or denied, continue anyway
    }

    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Transition after animation
    setTimeout(() => {
      onUnlock();
    }, 800);
  }, [unlocking, onUnlock]);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.card} ${unlocking ? styles.unlocking : ""}`}
        onClick={handleUnlock}
        role="button"
        tabIndex={0}
      >
        <div className={styles.shimmer} />
        <p className={styles.message}>{message}</p>
        <div className={styles.touchIcon}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill="var(--text-secondary)"
              opacity="0.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
