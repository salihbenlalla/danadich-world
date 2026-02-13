"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { ServerMessage } from "@/hooks/useSocket";
import Heart from "@/components/Heart/Heart";
import WhisperBox from "@/components/WhisperBox/WhisperBox";
import TogetherState from "@/components/TogetherState/TogetherState";
import FloatingDecorations from "@/components/FloatingDecorations/FloatingDecorations";
import styles from "./DandouchDashboard.module.css";

type StatusKey =
  | "waiting"
  | "connected"
  | "ritual"
  | "dreamIntro"
  | "mainExperience"
  | "heartTouch"
  | "heartRelease"
  | "disconnected";

const STATUS_MESSAGES: Record<StatusKey, string> = {
  waiting: "في انتظار دندوشة...",
  connected: "دندوشة قد وصلت...",
  ritual: "دندوشة تفتح أبواب عالمنا...",
  dreamIntro: "دندوشة تبحر في كلماتك...",
  mainExperience: "دندوشة دخلت فضاء القلب...",
  heartTouch: "دندوشة تلامس قلبك الآن!",
  heartRelease: "دندوشة أزالت يدها...",
  disconnected: "انقطع الاتصال بدندوشة...",
};

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

export default function DandouchDashboard() {
  const [status, setStatus] = useState<StatusKey>("waiting");
  const [partnerHolding, setPartnerHolding] = useState(false);
  const [together, setTogether] = useState(false);
  const [lastWhisper, setLastWhisper] = useState<string | null>(null);
  const [lastWhisperFrom, setLastWhisperFrom] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<string[]>([]);
  const vibrateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const addToHistory = useCallback((msg: string) => {
    setStatusHistory((prev) => [msg, ...prev].slice(0, 5));
  }, []);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "PARTNER_CONNECTED":
          setStatus("connected");
          addToHistory("دندوشة قد وصلت...");
          break;
        case "PARTNER_DISCONNECTED":
          setStatus("disconnected");
          addToHistory("انقطع الاتصال بدندوشة...");
          stopContinuousVibration(vibrateIntervalRef);
          break;
        case "STAGE_SYNC": {
          const stage = msg.stage as StatusKey;
          if (stage && STATUS_MESSAGES[stage]) {
            setStatus(stage);
            addToHistory(STATUS_MESSAGES[stage]);
          }
          break;
        }
        case "HEART_START":
          if (msg.role === "dandoucha") {
            setPartnerHolding(true);
            setStatus("heartTouch");
            addToHistory("دندوشة تلامس قلبك الآن!");
            startContinuousVibration(vibrateIntervalRef, false);
          }
          break;
        case "HEART_STOP":
          if (msg.role === "dandoucha") {
            setPartnerHolding(false);
            setStatus("heartRelease");
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
    },
    [addToHistory]
  );

  const { send, isConnected } = useSocket("dandouch", { onMessage: handleMessage });

  // Cleanup vibration on unmount
  useEffect(() => {
    return () => stopContinuousVibration(vibrateIntervalRef);
  }, []);

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
    <div className={styles.dashboard}>
      <FloatingDecorations />

      {/* Connection indicator */}
      <div
        className={`${styles.connectionDot} ${isConnected ? styles.connected : ""}`}
      />

      <div className={styles.content}>
        {/* Status card */}
        <div className={styles.statusCard}>
          <h2 className={styles.statusTitle}>حالة دندوشة</h2>
          <p className={styles.currentStatus}>{STATUS_MESSAGES[status]}</p>

          {/* Status history */}
          {statusHistory.length > 0 && (
            <div className={styles.history}>
              {statusHistory.map((msg, i) => (
                <p
                  key={`${msg}-${i}`}
                  className={styles.historyItem}
                  style={{ opacity: 1 - i * 0.18 }}
                >
                  {msg}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Heart */}
        <div className={styles.heartArea}>
          <Heart
            onHoldStart={handleHeartStart}
            onHoldEnd={handleHeartStop}
            partnerHolding={partnerHolding}
            together={together}
          />
        </div>

        <TogetherState active={together} />

        {/* Whisper box */}
        <div className={styles.whisperArea}>
          <WhisperBox
            onSend={handleWhisperSend}
            lastWhisper={lastWhisper}
            lastWhisperFrom={lastWhisperFrom}
            placeholder="اهمس لها بشيء..."
          />
        </div>
      </div>
    </div>
  );
}
