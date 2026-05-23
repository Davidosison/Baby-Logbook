import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getSupabase, initSupabaseWithJWT, clearSession, hasValidSession,
  supabase, toEvent, type Event, type EventRow,
} from "./supabase";
import { getGoals } from "@/hooks/use-goals";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return hasValidSession();
}

export function getGetAuthStatusQueryKey() {
  return ["auth-status"] as const;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Safe insert: if the DB is missing logged_by column, retry without it
async function safeInsert(table: string, payload: Record<string, unknown>) {
  const { data, error } = await getSupabase().from(table).insert(payload).select().single();
  if (error) {
    if ((error.code === "42703" || error.message?.includes("logged_by")) && "logged_by" in payload) {
      const { logged_by: _lb, ...rest } = payload;
      const { data: d2, error: e2 } = await getSupabase().from(table).insert(rest).select().single();
      if (e2) throw e2;
      return d2;
    }
    throw error;
  }
  return data;
}

export function useGetAuthStatus(options?: {
  query?: Partial<UseQueryOptions<{ authenticated: boolean; babyName: string; babyBirthDate: string }>>;
}) {
  return useQuery({
    queryKey: getGetAuthStatusQueryKey(),
    queryFn: () => ({
      authenticated: isAuthenticated(),
      babyName: (import.meta.env.VITE_BABY_NAME as string) || "אדם",
      babyBirthDate: (import.meta.env.VITE_BABY_BIRTH_DATE as string) || "2026-05-05",
    }),
    staleTime: Infinity,
    ...options?.query,
  });
}

export function useVerifyPin(options?: {
  mutation?: UseMutationOptions<{ success: boolean }, Error, { data: { pin: string } }>;
}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async ({ data: { pin } }: { data: { pin: string } }) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/verify-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ pin }),
      });

      if (res.status === 429) throw new Error("too_many_attempts");
      if (!res.ok) throw new Error("network_error");

      const result: { success: boolean; token?: string } = await res.json();
      if (result.success && result.token) {
        initSupabaseWithJWT(result.token);
      }
      return { success: result.success };
    },
    onSuccess: (data, vars, ctx) => {
      queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

export function useLogout(options?: { mutation?: UseMutationOptions<void, Error, void> }) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async () => {
      clearSession();
    },
    onSuccess: (data, vars, ctx) => {
      queryClient.invalidateQueries({ queryKey: getGetAuthStatusQueryKey() });
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export function getListEventsQueryKey(params?: { date?: string; limit?: number }) {
  return ["events", params?.date ?? "all", params?.limit ?? "nolimit"] as const;
}

export function getGetRecentActivityQueryKey() {
  return ["recent-activity"] as const;
}

export function getGetDailySummaryQueryKey(params?: { date?: string }) {
  return params?.date ? (["daily-summary", params.date] as const) : (["daily-summary"] as const);
}

export function getGetActiveSleepQueryKey() {
  return ["active-sleep"] as const;
}

export function getListEventsRangeQueryKey(params: { startDate: string; endDate: string }) {
  return ["events-range", params.startDate, params.endDate] as const;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useListEvents(
  params: { date?: string; limit?: number },
  options?: { query?: Partial<UseQueryOptions<Event[]>> },
) {
  const { queryKey: _userKey, ...restOpts } = options?.query ?? {};
  return useQuery({
    queryKey: getListEventsQueryKey(params),
    queryFn: async () => {
      let q = getSupabase()
        .from("events")
        .select("*")
        .order("started_at", { ascending: false });

      if (params.date) {
        const start = new Date(params.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(params.date);
        end.setHours(23, 59, 59, 999);
        q = q.gte("started_at", start.toISOString()).lte("started_at", end.toISOString());
      }

      if (params.limit) q = q.limit(params.limit);

      const { data, error } = await q;
      if (error) throw error;
      return (data as EventRow[]).map(toEvent);
    },
    ...restOpts,
  });
}

export function useGetRecentActivity(options?: { query?: Partial<UseQueryOptions<{
  lastFeedingMinutesAgo: number | null;
  lastSleepMinutesAgo: number | null;
  lastDiaperMinutesAgo: number | null;
}>> }) {
  const { queryKey: _userKey, ...restOpts } = options?.query ?? {};
  return useQuery({
    queryKey: getGetRecentActivityQueryKey(),
    queryFn: async () => {
      const now = new Date();
      const { data, error } = await supabase
        .from("events")
        .select("type, started_at")
        .in("type", ["feeding", "sleep", "diaper"])
        .order("started_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      const rows = data as Array<{ type: string; started_at: string }>;
      const minutesAgo = (type: string) => {
        const last = rows.find((e) => e.type === type);
        return last ? Math.round((now.getTime() - new Date(last.started_at).getTime()) / 60000) : null;
      };
      return {
        lastFeedingMinutesAgo: minutesAgo("feeding"),
        lastSleepMinutesAgo: minutesAgo("sleep"),
        lastDiaperMinutesAgo: minutesAgo("diaper"),
      };
    },
    ...restOpts,
  });
}

export function useGetDailySummary(
  params: { date: string },
  options?: { query?: Partial<UseQueryOptions<{
    feedingCount: number;
    totalFeedingMl: number;
    totalFeedingMinutes: number;
    sleepCount: number;
    totalSleepMinutes: number;
    diaperCount: number;
    peeDiapers: number;
    poopDiapers: number;
    feedingGoalMin: number;
    feedingGoalMax: number;
    sleepGoalMinutes: number;
  }>> },
) {
  const { queryKey: _userKey, ...restOpts } = options?.query ?? {};
  return useQuery({
    queryKey: getGetDailySummaryQueryKey({ date: params.date }),
    queryFn: async () => {
      const start = new Date(params.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(params.date);
      end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("started_at", start.toISOString())
        .lte("started_at", end.toISOString());
      if (error) throw error;
      const events = (data as EventRow[]).map(toEvent);
      const feedings = events.filter((e) => e.type === "feeding");
      const sleeps = events.filter((e) => e.type === "sleep");
      const diapers = events.filter((e) => e.type === "diaper");
      return {
        feedingCount: feedings.length,
        totalFeedingMl: feedings.reduce((s, e) => s + (e.amountMl ?? 0), 0),
        totalFeedingMinutes: feedings.reduce((s, e) => s + (e.durationMinutes ?? 0), 0),
        sleepCount: sleeps.length,
        totalSleepMinutes: sleeps.reduce((s, e) => s + (e.durationMinutes ?? 0), 0),
        diaperCount: diapers.length,
        peeDiapers: diapers.filter((e) => e.diaperType === "pee").length,
        poopDiapers: diapers.filter((e) => e.diaperType === "poop" || e.diaperType === "both").length,
        feedingGoalMin: getGoals().feedingGoalMin,
        feedingGoalMax: getGoals().feedingGoalMax,
        sleepGoalMinutes: getGoals().sleepGoalHours * 60,
      };
    },
    ...restOpts,
  });
}

export function useGetActiveSleep(options?: { query?: Partial<UseQueryOptions<Event | null>> }) {
  const { queryKey: _userKey, ...restOpts } = options?.query ?? {};
  return useQuery({
    queryKey: getGetActiveSleepQueryKey(),
    refetchInterval: 15_000, // poll every 15s so all users stay in sync
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "sleep")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? toEvent(data as EventRow) : null;
    },
    ...restOpts,
  });
}

export function useListEventsRange(
  params: { startDate: string; endDate: string },
  options?: { query?: Partial<UseQueryOptions<Event[]>> },
) {
  const { queryKey: _userKey, ...restOpts } = options?.query ?? {};
  return useQuery({
    queryKey: getListEventsRangeQueryKey(params),
    queryFn: async () => {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("started_at", start.toISOString())
        .lte("started_at", end.toISOString())
        .order("started_at", { ascending: true });
      if (error) throw error;
      return (data as EventRow[]).map(toEvent);
    },
    ...restOpts,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

function invalidateEventCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["events"] });
  queryClient.invalidateQueries({ queryKey: ["events-range"] });
  queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
  queryClient.invalidateQueries({ queryKey: ["daily-summary"] });
}

type FeedingInput = { startedAt: string; endedAt?: string | null; durationMinutes?: number | null; amountMl?: number | null; notes?: string | null; loggedBy?: string | null };

export function useLogFeeding(options?: {
  mutation?: UseMutationOptions<Event, Error, { data: FeedingInput }>;
}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async ({ data }: { data: FeedingInput }) => {
      const row = await safeInsert("events", {
        type: "feeding",
        started_at: data.startedAt,
        ended_at: data.endedAt ?? null,
        duration_minutes: data.durationMinutes ?? null,
        amount_ml: data.amountMl ?? null,
        notes: data.notes ?? null,
        is_active: false,
        logged_by: data.loggedBy ?? null,
      });
      return toEvent(row as EventRow);
    },
    onSuccess: (data, vars, ctx) => {
      invalidateEventCaches(queryClient);
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

type SleepInput = { startedAt: string; endedAt?: string | null; durationMinutes?: number | null; notes?: string | null; loggedBy?: string | null };

export function useLogSleep(options?: {
  mutation?: UseMutationOptions<Event, Error, { data: SleepInput }>;
}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async ({ data }: { data: SleepInput }) => {
      const startedAt = new Date(data.startedAt);
      const endedAt = data.endedAt ? new Date(data.endedAt) : null;
      const durationMinutes =
        data.durationMinutes ??
        (endedAt ? Math.round((endedAt.getTime() - startedAt.getTime()) / 60000) : null);
      const row = await safeInsert("events", {
        type: "sleep",
        started_at: data.startedAt,
        ended_at: data.endedAt ?? null,
        duration_minutes: durationMinutes,
        notes: data.notes ?? null,
        is_active: false,
        logged_by: data.loggedBy ?? null,
      });
      return toEvent(row as EventRow);
    },
    onSuccess: (data, vars, ctx) => {
      invalidateEventCaches(queryClient);
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

export function useStartSleep(options?: { mutation?: UseMutationOptions<Event, Error, { loggedBy?: string | null }> }) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async ({ loggedBy }: { loggedBy?: string | null } = {}) => {
      await getSupabase().from("events").update({ is_active: false }).eq("type", "sleep").eq("is_active", true);
      const row = await safeInsert("events", {
        type: "sleep",
        started_at: new Date().toISOString(),
        is_active: true,
        logged_by: loggedBy ?? null,
      });
      return toEvent(row as EventRow);
    },
    onSuccess: (data, vars, ctx) => {
      invalidateEventCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: getGetActiveSleepQueryKey() });
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

export function useStopSleep(options?: { mutation?: UseMutationOptions<Event, Error, void> }) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async () => {
      const { data: active, error: findErr } = await supabase
        .from("events")
        .select("*")
        .eq("type", "sleep")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!active) throw new Error("No active sleep session");
      const endedAt = new Date().toISOString();
      const durationMinutes = Math.round(
        (new Date(endedAt).getTime() - new Date(active.started_at).getTime()) / 60000,
      );
      const { data: row, error } = await supabase
        .from("events")
        .update({ is_active: false, ended_at: endedAt, duration_minutes: durationMinutes })
        .eq("id", active.id)
        .select()
        .single();
      if (error) throw error;
      return toEvent(row as EventRow);
    },
    onSuccess: (data, vars, ctx) => {
      invalidateEventCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: getGetActiveSleepQueryKey() });
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

type DiaperInput = { diaperType: "pee" | "poop" | "both"; notes?: string | null; startedAt?: string; loggedBy?: string | null };

export function useLogDiaper(options?: {
  mutation?: UseMutationOptions<Event, Error, { data: DiaperInput }>;
}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async ({ data }: { data: DiaperInput }) => {
      const row = await safeInsert("events", {
        type: "diaper",
        started_at: data.startedAt ?? new Date().toISOString(),
        diaper_type: data.diaperType,
        notes: data.notes ?? null,
        is_active: false,
        logged_by: data.loggedBy ?? null,
      });
      return toEvent(row as EventRow);
    },
    onSuccess: (data, vars, ctx) => {
      invalidateEventCaches(queryClient);
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

type BathInput = { notes?: string | null; startedAt?: string; loggedBy?: string | null };

export function useLogBath(options?: {
  mutation?: UseMutationOptions<Event, Error, { data: BathInput }>;
}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async ({ data }: { data: BathInput }) => {
      const row = await safeInsert("events", {
        type: "bath",
        started_at: data.startedAt ?? new Date().toISOString(),
        notes: data.notes ?? null,
        is_active: false,
        logged_by: data.loggedBy ?? null,
      });
      return toEvent(row as EventRow);
    },
    onSuccess: (data, vars, ctx) => {
      invalidateEventCaches(queryClient);
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

export function useUpdateEvent(options?: {
  mutation?: UseMutationOptions<Event, Error, { id: number; data: Record<string, unknown> }>;
}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const update: Record<string, unknown> = {};
      if ("startedAt" in data) update.started_at = data.startedAt;
      if ("endedAt" in data) update.ended_at = data.endedAt;
      if ("durationMinutes" in data) update.duration_minutes = data.durationMinutes;
      if ("amountMl" in data) update.amount_ml = data.amountMl;
      if ("diaperType" in data) update.diaper_type = data.diaperType;
      if ("notes" in data) update.notes = data.notes;
      if ("isActive" in data) update.is_active = data.isActive;
      const { data: row, error } = await supabase
        .from("events")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toEvent(row as EventRow);
    },
    onSuccess: (data, vars, ctx) => {
      invalidateEventCaches(queryClient);
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}

export function useDeleteEvent(options?: {
  mutation?: UseMutationOptions<void, Error, { id: number }>;
}) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOpts } = options?.mutation ?? {};
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const { error } = await getSupabase().from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (data, vars, ctx) => {
      invalidateEventCaches(queryClient);
      userOnSuccess?.(data, vars, ctx);
    },
    ...restOpts,
  });
}
