import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const JWT_KEY = "baby-logbook-jwt";

// ── Authenticated client singleton ────────────────────────────────────────────
let _client: SupabaseClient = createClient(url, anonKey);

/** Returns the current Supabase client (authenticated if JWT is set). */
export function getSupabase(): SupabaseClient {
  return _client;
}

/** Store JWT and reinitialise the client with it. */
export function initSupabaseWithJWT(jwt: string): void {
  localStorage.setItem(JWT_KEY, jwt);
  _client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * On page load: check localStorage for a valid, non-expired JWT.
 * Returns true if session was restored, false if re-login needed.
 */
export function restoreSession(): boolean {
  const jwt = localStorage.getItem(JWT_KEY);
  if (!jwt) return false;
  try {
    const [, b64] = jwt.split(".");
    const payload = JSON.parse(atob(b64!.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem(JWT_KEY);
      return false;
    }
    _client = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return true;
  } catch {
    localStorage.removeItem(JWT_KEY);
    return false;
  }
}

/** Check (without side effects) whether a valid JWT is stored. */
export function hasValidSession(): boolean {
  const jwt = localStorage.getItem(JWT_KEY);
  if (!jwt) return false;
  try {
    const [, b64] = jwt.split(".");
    const payload = JSON.parse(atob(b64!.replace(/-/g, "+").replace(/_/g, "/")));
    return !(payload.exp && payload.exp < Date.now() / 1000);
  } catch {
    return false;
  }
}

/** Clear the JWT and reset to unauthenticated client. */
export function clearSession(): void {
  localStorage.removeItem(JWT_KEY);
  _client = createClient(url, anonKey);
}

// Backward-compat alias (used in dashboard page-header etc.)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const val = (_client as any)[prop];
    return typeof val === "function" ? val.bind(_client) : val;
  },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type EventRow = {
  id: number;
  type: "feeding" | "sleep" | "diaper" | "bath";
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  amount_ml: number | null;
  diaper_type: string | null;
  notes: string | null;
  is_active: boolean;
  logged_by: string | null;
  created_at: string;
};

export type Event = {
  id: number;
  type: "feeding" | "sleep" | "diaper" | "bath";
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  amountMl: number | null;
  diaperType: string | null;
  notes: string | null;
  isActive: boolean;
  loggedBy: string | null;
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
    loggedBy: (row as any).logged_by ?? null,
    createdAt: row.created_at,
  };
}
