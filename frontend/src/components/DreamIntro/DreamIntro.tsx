"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./DreamIntro.module.css";

interface DreamIntroProps {
  onComplete: () => void;
}

const MESSAGES = [
  "منذ ١٥ سبتمبر ٢٠٢٥، والقَدَر يكتب لنا حكاية لم يعرفها قلبي من قبل.",
  "كنتِ حلمًا يملأ شاشتي يا دندوشة، واليوم أنتِ النبض الذي يملأ حياتي.",
  "أيامٌ قليلة، وسينتهي هذا البعد.. لنقف معًا تحت سماءٍ واحدة.",
  "صنعتُ لكِ هذا الفضاء لتلمسي روحي، حتى تشعرين بي معكِ في كل لحظة.",
  "كل رجفة تشعرين بها في يدكِ الآن، هي نبضة قلبٍ يهمس باسمكِ.",
];

const MESSAGE_INTERVAL = 3500;
const COMPLETION_DELAY = 3000;

interface ParticleStyle {
  offsetX: string;
  offsetY: string;
  rotation: string;
  floatDuration: string;
}

export default function DreamIntro({ onComplete }: DreamIntroProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [fading, setFading] = useState(false);

  // Generate random particle positions
  const particleStyles = useMemo<ParticleStyle[]>(() => {
    return MESSAGES.map(() => ({
      offsetX: `${-30 + Math.random() * 60}px`,
      offsetY: `${-20 + Math.random() * 40}px`,
      rotation: `${-4 + Math.random() * 8}deg`,
      floatDuration: `${8 + Math.random() * 6}s`,
    }));
  }, []);

  // Show messages one by one
  useEffect(() => {
    if (visibleCount < MESSAGES.length) {
      const timer = setTimeout(() => {
        setVisibleCount((c) => c + 1);
        // Haptic for each message
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(100);
        }
      }, MESSAGE_INTERVAL);
      return () => clearTimeout(timer);
    } else {
      // All messages shown, begin transition
      const completionTimer = setTimeout(() => {
        setFading(true);
        setTimeout(onComplete, 1000);
      }, COMPLETION_DELAY);
      return () => clearTimeout(completionTimer);
    }
  }, [visibleCount, onComplete]);

  return (
    <div className={`${styles.container} ${fading ? styles.fading : ""}`}>
      <div className={styles.particles}>
        {MESSAGES.map((msg, i) => (
          <div
            key={i}
            className={`${styles.particle} ${i < visibleCount ? styles.visible : ""}`}
            style={
              {
                "--offsetX": particleStyles[i].offsetX,
                "--offsetY": particleStyles[i].offsetY,
                "--rotation": particleStyles[i].rotation,
                "--floatDuration": particleStyles[i].floatDuration,
                animationDelay: `${i * 0.5}s`,
              } as React.CSSProperties
            }
          >
            <div className={styles.glassCard}>
              <p className={styles.text}>{msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
