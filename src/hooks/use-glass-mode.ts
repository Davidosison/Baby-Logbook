import { useState, useEffect } from "react";

const GLASS_KEY = "baby-logbook-glass";
const CHANGE_EVENT = "glass-mode-change";

function applyGlassClass(enabled: boolean) {
  if (enabled) {
    document.documentElement.classList.add("glass");
  } else {
    document.documentElement.classList.remove("glass");
  }
}

/**
 * Call once at module level (synchronous, before first render) to apply
 * the saved preference immediately — no flash of wrong theme.
 */
export function initGlassMode() {
  const stored = localStorage.getItem(GLASS_KEY);
  applyGlassClass(stored !== "false"); // default: glass ON
}

/** Use inside any React component to read/toggle glass mode. */
export function useGlassMode() {
  const [glassMode, setGlassModeState] = useState(
    () => localStorage.getItem(GLASS_KEY) !== "false",
  );

  // Keep state in sync if another component changes it
  useEffect(() => {
    const handler = () => {
      setGlassModeState(document.documentElement.classList.contains("glass"));
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const setGlassMode = (enabled: boolean) => {
    localStorage.setItem(GLASS_KEY, String(enabled));
    applyGlassClass(enabled);
    setGlassModeState(enabled);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return { glassMode, setGlassMode };
}
