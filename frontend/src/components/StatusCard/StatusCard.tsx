"use client";

import styles from "./StatusCard.module.css";

interface StatusCardProps {
  title: string;
  message: string;
}

export default function StatusCard({ title, message }: StatusCardProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
