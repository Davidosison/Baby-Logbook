import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "wouter";
import {
  useLogFeeding, useUpdateEvent,
  useGetActiveFeeding, getGetActiveFeedingQueryKey,
  useStartFeeding, useStopFeeding,
  getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey,
} from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Timer, StopCircle, X } from "lucide-react";

function timeToTodayISO(timeStr: string, refTimeStr?: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h!, m!, 0, 0);
  // Handle midnight crossing: if this time is before the reference, it's the next day
  if (refTimeStr) {
    const [rh, rm] = refTimeStr.split(":").map(Number);
    if (h! * 60 + m! < rh! * 60 + rm!) d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

function computeAutoMinutes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh! * 60 + em!) - (sh! * 60 + sm!);
  if (diff < 0) diff += 24 * 60; // crosses midnight
  return diff > 0 ? diff : null;
}

export default function FeedingPage() {
  const [, setLocation] = useLocation();
  const [search] = useSearchParams();
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const [amountMl, setAmountMl] = useState("");
  const [startTime, setStartTime] = useState(() => search.get("start") ?? "");
  const [endTime, setEndTime] = useState(() => search.get("end") ?? "");
  const [notes, setNotes] = useState("");
  const [retroStart, setRetroStart] = useState(""); // optional past start time for timer
  // ID of the feeding record created by the timer (so we update it instead of inserting a new one).
  // Populated either by stopFeeding's onSuccess (stopped from this page) or from the
  // ?stoppedId= URL param (stopped via the dashboard's quick-toggle, which navigates here).
  const [stoppedFeedingId, setStoppedFeedingId] = useState<number | null>(() => {
    const id = search.get("stoppedId");
    return id ? Number(id) : null;
  });

  // ── DB-based timer (syncs across all devices) ────────────────────────────────
  const { data: activeFeeding } = useGetActiveFeeding({
    query: { queryKey: getGetActiveFeedingQueryKey(), refetchInterval: 10_000 },
  });

  const isTimerRunning = !!activeFeeding;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (activeFeeding?.startedAt) {
      const start = new Date(activeFeeding.startedAt).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
      const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
      setStartTime(format(new Date(activeFeeding.startedAt), "HH:mm"));
      return () => clearInterval(iv);
    }
    return undefined;
  }, [activeFeeding]);

  const startFeeding = useStartFeeding({
    mutation: { onSuccess: () => { setEndTime(""); setRetroStart(""); setStoppedFeedingId(null); } },
  });

  const stopFeeding = useStopFeeding({
    mutation: {
      onSuccess: (event) => {
        const endedAt = event.endedAt ? format(new Date(event.endedAt), "HH:mm") : format(new Date(), "HH:mm");
        setEndTime(endedAt);
        setStoppedFeedingId(event.id);
      },
    },
  });

  const invalidateAll = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
    queryClient.invalidateQueries({ queryKey: getGetActiveFeedingQueryKey() });
  };

  const logFeeding = useLogFeeding({
    mutation: { onSuccess: () => { invalidateAll(); setLocation("/"); } },
  });

  const updateEvent = useUpdateEvent({
    mutation: { onSuccess: () => { invalidateAll(); setLocation("/"); } },
  });

  const autoDuration = computeAutoMinutes(startTime, endTime);

  const formatTimerDisplay = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleSave = () => {
    if (stoppedFeedingId) {
      // Timer was used: update the existing DB record with amount & notes
      updateEvent.mutate({
        id: stoppedFeedingId,
        data: {
          amountMl: amountMl ? parseInt(amountMl) : null,
          notes: notes || null,
        },
      });
    } else {
      logFeeding.mutate({
        data: {
          amountMl: amountMl ? parseInt(amountMl) : undefined,
          durationMinutes: autoDuration ?? undefined,
          notes: notes || undefined,
          startedAt: startTime ? timeToTodayISO(startTime) : new Date().toISOString(),
          endedAt: endTime ? timeToTodayISO(endTime, startTime) : undefined,
          loggedBy: name ?? null,
        },
      });
    }
  };

  const isSaving = logFeeding.isPending || updateEvent.isPending;
  const canSave = !isSaving && (!!amountMl || !!startTime);

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="האכלה" russianTitle="Кормление" showBack />

      <div className="p-4 max-w-md mx-auto space-y-4">

        {/* Live Timer — DB-backed, syncs across all devices */}
        <div className="bg-sky-400/5 border border-sky-400/20 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              {tr("liveTimer", lang)}
            </span>
            {isTimerRunning && (
              <span className="text-2xl font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                {formatTimerDisplay(elapsed)}
              </span>
            )}
          </div>

          {/* Retroactive start — only show before timer starts */}
          {!isTimerRunning && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {tr("feedingStartFrom", lang)}
              </label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={retroStart}
                  onChange={(e) => setRetroStart(e.target.value)}
                  className="flex-1 h-10 text-sm border-border bg-background"
                  placeholder="--:--"
                />
                {retroStart && (
                  <button
                    onClick={() => setRetroStart("")}
                    className="h-10 w-10 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => isTimerRunning
              ? stopFeeding.mutate()
              : startFeeding.mutate({
                  loggedBy: name ?? null,
                  startedAt: retroStart ? timeToTodayISO(retroStart) : undefined,
                })
            }
            disabled={startFeeding.isPending || stopFeeding.isPending}
            data-testid="button-timer-toggle"
            className={[
              "w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50",
              isTimerRunning
                ? "bg-red-500/10 border-2 border-red-500 text-red-500"
                : "bg-sky-500 text-white",
            ].join(" ")}
          >
            {isTimerRunning
              ? <><StopCircle className="w-4 h-4" />{tr("tapToStop", lang)}</>
              : <><Timer className="w-4 h-4" />{tr("tapToStart", lang)}</>
            }
          </button>
        </div>

        {/* Start / End time */}
        <div className="bg-card border border-border rounded-3xl p-4 space-y-3">
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {tr("startTime", lang)}
              </label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 h-12 text-base border-border bg-background"
                  data-testid="input-start-time"
                />
                {startTime && (
                  <button onClick={() => setStartTime("")} className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {tr("endTime", lang)}
              </label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 h-12 text-base border-border bg-background"
                  data-testid="input-end-time"
                />
                {endTime && (
                  <button onClick={() => setEndTime("")} className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {autoDuration !== null && (
            <div className="text-center text-sm font-semibold text-sky-600 dark:text-sky-400 bg-sky-400/10 rounded-xl py-2">
              {tr("autoDuration", lang, autoDuration)}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="bg-card border border-border rounded-3xl p-4">
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            {tr("amountMl", lang)}
          </label>
          <Input
            type="number"
            pattern="[0-9]*"
            inputMode="numeric"
            value={amountMl}
            onChange={(e) => setAmountMl(e.target.value)}
            placeholder={tr("exAmount", lang)}
            className="h-12 text-base border-border bg-background"
            data-testid="input-amount-ml"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">{tr("notesOptional", lang)}</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tr("exNotes", lang)}
            className="resize-none h-24 bg-card border-border"
            data-testid="input-notes"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={!canSave}
          data-testid="button-save-feeding"
          className="w-full h-16 text-lg font-bold rounded-2xl bg-sky-500 hover:bg-sky-600 text-white shadow-xl shadow-sky-400/20 active:scale-95 transition-transform"
        >
          {tr("saveFeeding", lang)}
        </Button>
      </div>
    </div>
  );
}
