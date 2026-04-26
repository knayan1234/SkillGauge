"use client";

/**
 * Web Speech API speech-to-text hook.
 *
 * Wraps the browser's `SpeechRecognition` (or webkit-prefixed variant) into a
 * predictable React surface: `start()` / `stop()` plus `isListening`, `transcript`,
 * and `isSupported`. Free to use, no API key, no server roundtrip — the browser does
 * all the recognition.
 *
 * Browser support:
 *   - Chrome / Edge: full support, both prefixed and unprefixed.
 *   - Safari 14.1+: webkit-prefixed, decent quality.
 *   - Firefox: NOT supported (returns `isSupported: false`). The mic button hides
 *     itself in unsupported browsers — the user can always type.
 *
 * Continuous mode is OFF by default — recognition stops on a natural silence so we
 * don't capture ambient noise after the user finishes speaking. Caller can re-start
 * to keep dictating.
 *
 * Why a hook (not a Zustand store / context): there's at most one active dictation
 * at a time per page. A local hook keeps state co-located with the input that owns
 * the mic. If a future feature needs cross-component coordination, lift then.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// `useSyncExternalStore` requires a subscribe function. Browser-API support detection
// has no real subscription target — the answer doesn't change during page life — so we
// pass a noop. Hoisted to module scope so the reference is stable across renders.
const SUBSCRIBE_NOOP = () => () => {};

// The Web Speech types live on `Window` in dom.d.ts only when `lib.dom.d.ts` ships
// them. To stay portable across TS configs we declare a structural minimum here.
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface SpeechRecognitionEvent extends Event {
  readonly results: ArrayLike<SpeechRecognitionResult>;
  readonly resultIndex: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  // Reset transcript to empty. Useful for the AnswerInput pattern where each
  // dictation session writes into a fresh buffer.
  reset: () => void;
  start: () => void;
  stop: () => void;
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // SSR-safe browser-API support detection. `useSyncExternalStore` is the React-
  // recommended primitive for this — server snapshot returns false, client snapshot
  // probes for the constructor. No effect, no setState dance, no hydration mismatch.
  const isSupported = useSyncExternalStore(
    SUBSCRIBE_NOOP,
    () => getSpeechRecognitionCtor() !== null,
    () => false,
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    // If a previous session is still running, abort first so we don't get a
    // "recognition already started" error.
    recognitionRef.current?.abort();

    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      // Walk the results array and assemble the latest transcript. interimResults
      // gives us live partials; we replace state on each event so the textarea reads
      // as one continuously-growing string (no duplicates).
      let next = "";
      for (let i = 0; i < event.results.length; i++) {
        next += event.results[i][0].transcript;
      }
      setTranscript(next.trim());
    };

    rec.onerror = () => {
      // Most errors here are mic permission denied or network-fetch failures on the
      // recognition service. Silently stop; the user sees the button flip back to
      // "ready" and can retry.
      setIsListening(false);
    };

    rec.onend = () => {
      // Recognition naturally ends on silence. Mark ourselves not-listening so the
      // mic button shows the right icon.
      setIsListening(false);
    };

    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
  }, []);

  // Cleanup on unmount — a dangling recognition session would keep the mic icon
  // active in the browser tab indicator after navigation.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => setTranscript(""), []);

  return { isListening, isSupported, transcript, reset, start, stop };
}
