"use client";

import styles from "./TogetherState.module.css";

interface TogetherStateProps {
  active: boolean;
}

export default function TogetherState({ active }: TogetherStateProps) {
  if (!active) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.goldenGlow} />
      <p className={styles.message}>تلاقت أرواحنا منذ 15.09.2025</p>
    </div>
  );
}
