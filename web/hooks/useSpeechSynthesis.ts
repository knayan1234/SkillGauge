"use client";

/**
 * Web Speech API text-to-speech hook.
 *
 * Exposes `speak(text)` / `stop()` plus `isSpeaking` and `isSupported`. The browser
 * picks a default voice based on the page's lang; we don't override unless a future
 * settings UI wires that in.
 *
 * Browser support: Chrome / Edge / Safari / Firefox all ship `speechSynthesis`. Quality
 * varies — Edge ships better-sounding voices on Windows than the open-source flavours.
 * Acceptable for a "voice-along" UX in a personal app; cloud TTS would be a future
 * upgrade.
 *
 * `speak()` cancels any in-flight utterance before queueing the new one. Without that
 * a fast double-click would queue both and the user would hear the question twice.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const SUBSCRIBE_NOOP = () => () => {};

interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  stop: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // SSR-safe support detection via `useSyncExternalStore` — server snapshot returns
  // false, client snapshot probes `speechSynthesis`. No effect / setState dance, no
  // hydration mismatch.
  const isSupported = useSyncExternalStore(
    SUBSCRIBE_NOOP,
    () => "speechSynthesis" in window,
    () => false,
  );

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!text.trim()) return;

    const synth = window.speechSynthesis;
    // Cancel any in-flight utterance — double-clicks shouldn't queue two readings.
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    // Slightly slower than default reads more naturally for interview content.
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synth.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount — leaving a queued utterance running while the user
  // navigates is jarring.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  return { isSpeaking, isSupported, speak, stop };
}
