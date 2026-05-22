import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

export type EventRow = {
  id: number;
  type: "feeding" | "sleep" | "diaper";
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  amount_ml: number | null;
  diaper_type: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type Event = {
  id: number;
  type: "feeding" | "sleep" | "diaper";
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  amountMl: number | null;
  diaperType: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
};

export function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    type: row.type,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: row.duration_minutes,
    amountMl: row.amount_ml,
    diaperType: row.diaper_type,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}
