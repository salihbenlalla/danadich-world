"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { ServerMessage } from "@/hooks/useSocket";
import RitualUnlock from "@/components/RitualUnlock/RitualUnlock";
import DreamIntro from "@/components/DreamIntro/DreamIntro";
import Heart from "@/components/Heart/Heart";
import InstructionBox from "@/components/InstructionBox/InstructionBox";
import TogetherState from "@/components/TogetherState/TogetherState";
import WhisperBox from "@/components/WhisperBox/WhisperBox";
import FloatingDecorations from "@/components/FloatingDecorations/FloatingDecorations";
import styles from "./DandouchaExperience.module.css";

type Phase = "ritual" | "dreamIntro" | "mainExperience";

function startContinuousVibration(
  intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
  isTogether: boolean
) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  stopContinuousVibration(intervalRef);
  navigator.vibrate(isTogether ? [100, 50, 100, 50, 100] : [200, 100, 200]);
  intervalRef.current = setInterval(
    () => {
      navigator.vibrate(
        isTogether ? [100, 50, 100, 50, 100] : [200, 100, 200]
      );
    },
    isTogether ? 400 : 800
  );
}

function stopContinuousVibration(
  intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
) {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    // Only cancel vibration if we had an active interval (user already interacted)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }
  }
}

export default function DandouchaExperience() {
  const [phase, setPhase] = useState<Phase>("ritual");
  const [partnerHolding, setPartnerHolding] = useState(false);
  const [together, setTogether] = useState(false);
  const [lastWhisper, setLastWhisper] = useState<string | null>(null);
  const [lastWhisperFrom, setLastWhisperFrom] = useState<string | null>(null);
  const vibrateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "HEART_START":
        if (msg.role === "dandouch") {
          setPartnerHolding(true);
          startContinuousVibration(vibrateIntervalRef, false);
        }
        break;
      case "HEART_STOP":
        if (msg.role === "dandouch") {
          setPartnerHolding(false);
          stopContinuousVibration(vibrateIntervalRef);
        }
        break;
      case "TOGETHER":
        setTogether(msg.active ?? false);
        if (msg.active) {
          startContinuousVibration(vibrateIntervalRef, true);
        }
        break;
      case "NEW_WHISPER":
        setLastWhisper(msg.text ?? null);
        setLastWhisperFrom(msg.from ?? null);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
        break;
    }
  }, []);

  const { send, isConnected } = useSocket("dandoucha", {
    onMessage: handleMessage,
  });

  // Cleanup vibration on unmount
  useEffect(() => {
    return () => stopContinuousVibration(vibrateIntervalRef);
  }, []);

  const handleRitualUnlock = useCallback(() => {
    setPhase("dreamIntro");
    send({ type: "STAGE_SYNC", stage: "ritual" });
  }, [send]);

  const handleDreamComplete = useCallback(() => {
    setPhase("mainExperience");
    send({ type: "STAGE_SYNC", stage: "dreamIntro" });
  }, [send]);

  // Sync main experience stage
  useEffect(() => {
    if (phase === "mainExperience") {
      send({ type: "STAGE_SYNC", stage: "mainExperience" });
    }
  }, [phase, send]);

  const handleHeartStart = useCallback(() => {
    send({ type: "HEART_START" });
  }, [send]);

  const handleHeartStop = useCallback(() => {
    send({ type: "HEART_STOP" });
  }, [send]);

  const handleWhisperSend = useCallback(
    (text: string) => {
      send({ type: "NEW_WHISPER", text });
    },
    [send]
  );

  return (
    <div className={styles.experience}>
      <FloatingDecorations />

      {/* Connection indicator */}
      <div
        className={`${styles.connectionDot} ${isConnected ? styles.connected : ""}`}
      />

      {phase === "ritual" && (
        <RitualUnlock role="dandoucha" onUnlock={handleRitualUnlock} />
      )}

      {phase === "dreamIntro" && (
        <DreamIntro onComplete={handleDreamComplete} />
      )}

      {phase === "mainExperience" && (
        <div className={styles.mainContainer}>
          <InstructionBox text="ضعي إصبعكِ على القلب.. دعي نبضكِ يلمس روح دندوش، واستشعري قُربه." />

          <div className={styles.heartArea}>
            <Heart
              onHoldStart={handleHeartStart}
              onHoldEnd={handleHeartStop}
              partnerHolding={partnerHolding}
              together={together}
            />
          </div>

          <TogetherState active={together} />

          <div className={styles.whisperArea}>
            <WhisperBox
              onSend={handleWhisperSend}
              lastWhisper={lastWhisper}
              lastWhisperFrom={lastWhisperFrom}
              placeholder="اهمسي لي بشيء..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
