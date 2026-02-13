"use client";

import { useState, useCallback } from "react";
import styles from "./WhisperBox.module.css";

interface WhisperBoxProps {
  onSend: (text: string) => void;
  lastWhisper: string | null;
  lastWhisperFrom: string | null;
  placeholder?: string;
}

export default function WhisperBox({
  onSend,
  lastWhisper,
  lastWhisperFrom,
  placeholder = "اهمسي لي بشيء...",
}: WhisperBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed) {
      onSend(trimmed);
      setText("");
    }
    setIsEditing(false);
  }, [text, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  if (isEditing) {
    return (
      <div className={styles.box}>
        <input
          className={styles.input}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          placeholder={placeholder}
          autoFocus
          dir="rtl"
        />
      </div>
    );
  }

  return (
    <div
      className={styles.box}
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
    >
      <p className={styles.whisperText}>
        {lastWhisper ? (
          <>
            <span className={styles.from}>
              {lastWhisperFrom === "dandouch" ? "دندوش" : "دندوشة"}:
            </span>{" "}
            {lastWhisper}
          </>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
      </p>
    </div>
  );
}
