import { useEffect, useState } from "react";
import { usePerson } from "@/contexts/person-context";
import { usePersonQuickActions, useSavePersonQuickActions } from "@/lib/queries";

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

const DEFAULT: QuickActionId[] = ["pee", "vitamins", "gel", "feeding", "sleep"];
const personKey = (name: string) => `quick-actions:${name}`;

function sanitize(ids: unknown): QuickActionId[] | null {
  if (!Array.isArray(ids)) return null;
  const valid = ids.filter((id): id is QuickActionId => QUICK_ACTIONS.some((a) => a.id === id));
  return valid.length >= QUICK_ACTIONS_MIN ? valid : null;
}

function readCache(name: string | null): QuickActionId[] {
  try {
    return (name ? sanitize(JSON.parse(localStorage.getItem(personKey(name)) ?? "null")) : null) ?? DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Home quick buttons of the selected person: saved per name in the DB, cached locally for instant render. */
export function useQuickActions() {
  const { name } = usePerson();
  const [enabled, setEnabled] = useState<QuickActionId[]>(() => readCache(name));
  const { data: saved } = usePersonQuickActions(name);
  const save = useSavePersonQuickActions();

  useEffect(() => {
    setEnabled(readCache(name));
  }, [name]);

  useEffect(() => {
    const fromDb = sanitize(saved);
    if (!fromDb || !name) return;
    setEnabled(fromDb);
    localStorage.setItem(personKey(name), JSON.stringify(fromDb));
  }, [saved, name]);

  const toggle = (id: QuickActionId) => {
    const on = enabled.includes(id);
    if (on && enabled.length <= QUICK_ACTIONS_MIN) return;
    if (!on && enabled.length >= QUICK_ACTIONS_MAX) return;
    // Keep the catalog order so the row layout stays predictable.
    const next = QUICK_ACTIONS.map((a) => a.id).filter((a) => (a === id ? !on : enabled.includes(a)));
    setEnabled(next);
    if (name) {
      localStorage.setItem(personKey(name), JSON.stringify(next));
      save.mutate({ name, quickActions: next });
    }
  };

  return { enabled, toggle };
}
