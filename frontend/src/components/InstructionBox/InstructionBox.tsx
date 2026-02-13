"use client";

import { useEffect, useState } from "react";
import styles from "./InstructionBox.module.css";

interface InstructionBoxProps {
  text: string;
  fadeAfterMs?: number;
}

export default function InstructionBox({
  text,
  fadeAfterMs = 8000,
}: InstructionBoxProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, fadeAfterMs);
    return () => clearTimeout(timer);
  }, [fadeAfterMs]);

  if (!visible) return null;

  return (
    <div className={`${styles.box} ${!visible ? styles.fadeOut : ""}`}>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
