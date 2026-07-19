// ---------------------------------------------------------------------------
// Text-to-speech via the browser's built-in SpeechSynthesis API. Free, no keys,
// works offline on iOS Safari + Chrome. Prefers a male English voice.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

// Voice names that are male across common platforms (iOS, macOS, Android, Win).
const MALE_HINTS = [
  'daniel',
  'aaron',
  'alex',
  'fred',
  'arthur',
  'oliver',
  'rishi',
  'google uk english male',
  'google us english',
  'microsoft david',
  'microsoft mark',
  'microsoft guy',
  'male',
];

function pickMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const pool = en.length ? en : voices;
  // Prefer an explicit male-named voice.
  for (const hint of MALE_HINTS) {
    const match = pool.find((v) => v.name.toLowerCase().includes(hint));
    if (match) return match;
  }
  // Otherwise the first English voice, else the first available.
  return pool[0] ?? null;
}

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const supported = speechSupported();

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) voiceRef.current = pickMaleVoice(voices);
    };
    load();
    // Voices load asynchronously on some browsers.
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      // Cancel anything in progress first (also acts as a toggle-off elsewhere).
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.lang = voiceRef.current?.lang || 'en-US';
      u.rate = 0.96; // a touch slower — calmer, clearer
      u.pitch = 0.92; // slightly lower — warmer, more masculine
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  return { speak, stop, speaking, supported };
}
