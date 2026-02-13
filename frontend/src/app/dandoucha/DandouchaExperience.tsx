"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { ServerMessage } from "@/hooks/useSocket";
import RitualUnlock from "@/components/RitualUnlock/RitualUnlock";
import DreamIntro from "@/components/DreamIntro/DreamIntro";
import Heart from "@/components/Heart/Heart";
import StatusCard from "@/components/StatusCard/StatusCard";
import TogetherState from "@/components/TogetherState/TogetherState";
import WhisperBox from "@/components/WhisperBox/WhisperBox";
import FloatingDecorations from "@/components/FloatingDecorations/FloatingDecorations";
import styles from "./DandouchaExperience.module.css";

type Phase = "ritual" | "dreamIntro" | "mainExperience";

// Realistic heartbeat: lub-dub pattern (S1 ~120ms, gap ~100ms, S2 ~80ms)
// S1 is stronger/longer, S2 shorter—matching real heart sounds
const HEARTBEAT_SOLO = [120, 100, 80] as const; // calm ~75 bpm
const HEARTBEAT_TOGETHER = [110, 90, 75] as const; // slightly faster when connected ~90 bpm

function startContinuousVibration(
  intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
  isTogether: boolean
) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  stopContinuousVibration(intervalRef);
  const pattern = isTogether ? HEARTBEAT_TOGETHER : HEARTBEAT_SOLO;
  const intervalMs = isTogether ? 667 : 800; // ~90 bpm together, ~75 bpm solo
  navigator.vibrate([...pattern]);
  intervalRef.current = setInterval(() => {
    navigator.vibrate([...pattern]);
  }, intervalMs);
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
  const [statusMessage, setStatusMessage] = useState("في انتظار دندوش...");
  const vibrateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "PARTNER_CONNECTED":
        setStatusMessage("ضعي إصبعكِ على القلب.. ليشعر دندوشك بنبضات قلبكِ");
        break;
      case "PARTNER_DISCONNECTED":
        setStatusMessage("انقطع الاتصال بدندوشك...");
        stopContinuousVibration(vibrateIntervalRef);
        break;
      case "HEART_START":
        if (msg.role === "dandouch") {
          setPartnerHolding(true);
          setStatusMessage("دندوشك يلامس قلبك الآن!");
          startContinuousVibration(vibrateIntervalRef, false);
        }
        break;
      case "HEART_STOP":
        if (msg.role === "dandouch") {
          setPartnerHolding(false);
          setStatusMessage("دندوشك أزال يده...");
          stopContinuousVibration(vibrateIntervalRef);
        }
        break;
      case "TOGETHER":
        setTogether(msg.active ?? false);
        if (msg.active) {
          setStatusMessage("أرواحكما تلاقت!");
          startContinuousVibration(vibrateIntervalRef, true);
        } else {
          setStatusMessage("انفصلت أرواحكما...");
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
          <StatusCard title="حالة دندوش" message={statusMessage} />

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
