import { useState } from "react";

export type QuickActionId = "pee" | "vitamins" | "gel" | "feeding" | "sleep" | "solids" | "bath";

export const QUICK_ACTIONS: { id: QuickActionId; emoji: string; he: string; ru: string }[] = [
  { id: "pee", emoji: "💧", he: "פיפי", ru: "Пи-пи" },
  { id: "vitamins", emoji: "💊", he: "ויטמינים", ru: "Витамины" },
  { id: "gel", emoji: "🌿", he: "ג'ל", ru: "Гель" },
  { id: "feeding", emoji: "🍼", he: "האכלה", ru: "Корм." },
  { id: "sleep", emoji: "😴", he: "שינה", ru: "Сон" },
  { id: "solids", emoji: "🥄", he: "טעימה", ru: "Прикорм" },
  { id: "bath", emoji: "🛁", he: "מקלחת", ru: "Купание" },
];

export const QUICK_ACTIONS_MIN = 3;
export const QUICK_ACTIONS_MAX = 5;

const KEY = "quick-actions";
const DEFAULT: QuickActionId[] = ["pee", "vitamins", "gel", "feeding", "sleep"];

function load(): QuickActionId[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as QuickActionId[] | null;
    const valid = saved?.filter((id) => QUICK_ACTIONS.some((a) => a.id === id));
    return valid && valid.length >= QUICK_ACTIONS_MIN ? valid : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Which buttons show in the home screen's quick-action row, saved per device. */
export function useQuickActions() {
  const [enabled, setEnabled] = useState<QuickActionId[]>(load);

  const toggle = (id: QuickActionId) => {
    setEnabled((cur) => {
      const on = cur.includes(id);
      if (on && cur.length <= QUICK_ACTIONS_MIN) return cur;
      if (!on && cur.length >= QUICK_ACTIONS_MAX) return cur;
      // Keep the catalog order so the row layout stays predictable.
      const next = QUICK_ACTIONS.map((a) => a.id).filter((a) => (a === id ? !on : cur.includes(a)));
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  return { enabled, toggle };
}
