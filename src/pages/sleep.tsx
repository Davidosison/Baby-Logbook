import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useGetActiveSleep, getGetActiveSleepQueryKey,
  useStartSleep, useStopSleep, useLogSleep,
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
import { Moon, StopCircle, PlayCircle, X } from "lucide-react";

// If the entered clock-time is later in the day than right now, it hasn't happened yet
// today — it must refer to yesterday (e.g. logging a 21:00 start at 3am the next morning).
function resolveBaseDate(timeStr: string, now: Date): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const entryMinutes = h! * 60 + m!;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const base = new Date(now);
  if (entryMinutes > nowMinutes) base.setDate(base.getDate() - 1);
  return base;
}

function timeToISO(timeStr: string, baseDate: Date, refTimeStr?: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h!, m!, 0, 0);
  // If this time is before the reference time it means it crossed midnight → next day
  if (refTimeStr) {
    const [rh, rm] = refTimeStr.split(":").map(Number);
    if (h! * 60 + m! < rh! * 60 + rm!) d.setDate(d.getDate() + 1);
  }
  return d.toISOString();
}

function computeMinutes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh! * 60 + em!) - (sh! * 60 + sm!);
  if (diff < 0) diff += 24 * 60; // crosses midnight
  return diff > 0 ? diff : null;
}

export default function SleepPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const today = format(new Date(), "yyyy-MM-dd");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [retroStart, setRetroStart] = useState(""); // retroactive start for live timer

  const { data: activeSleep, isLoading } = useGetActiveSleep({
    query: { queryKey: getGetActiveSleepQueryKey() },
  });

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (activeSleep?.startedAt) {
      const start = new Date(activeSleep.startedAt).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [activeSleep]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetActiveSleepQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
  };

  const startSleep = useStartSleep({
    mutation: { onSuccess: () => { invalidateAll(); } },
  });

  const stopSleep = useStopSleep({
    mutation: { onSuccess: () => { invalidateAll(); setLocation("/"); } },
  });

  const logSleep = useLogSleep({
    mutation: { onSuccess: () => { invalidateAll(); setLocation("/"); } },
  });

  const isSleeping = !!activeSleep;
  const autoDuration = computeMinutes(startTime, endTime);

  const handleSave = () => {
    if (!startTime || !endTime) return;
    const base = resolveBaseDate(startTime, new Date());
    logSleep.mutate({
      data: {
        startedAt: timeToISO(startTime, base),
        endedAt: timeToISO(endTime, base, startTime), // pass startTime so we detect midnight crossing
        notes: notes || undefined,
        loggedBy: name ?? null,
      },
    });
  };

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="שינה" russianTitle="Сон" showBack />

      <div className="p-4 max-w-md mx-auto space-y-5">

        {/* Start live sleep button — shown when not sleeping */}
        {!isSleeping && !isLoading && (
          <div className="bg-indigo-500/10 border-2 border-indigo-400/40 rounded-3xl p-5 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Moon className="w-10 h-10 text-indigo-400" />
            </div>

            {/* Optional retroactive start time */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-indigo-400/80 mb-1.5 text-center">
                {tr("sleepStartFrom", lang)}
              </label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={retroStart}
                  onChange={(e) => setRetroStart(e.target.value)}
                  placeholder="עכשיו"
                  className="flex-1 h-11 text-base border-indigo-400/30 bg-indigo-500/5 text-center"
                />
                {retroStart && (
                  <button onClick={() => setRetroStart("")} className="h-11 w-11 rounded-xl border border-indigo-400/30 bg-indigo-500/5 flex items-center justify-center text-indigo-400 active:scale-95 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {retroStart && (
                <p className="text-[10px] text-indigo-400/60 text-center mt-1">
                  {lang === "he" ? `הטיימר יתחיל מ-${retroStart}` : `Таймер начнётся с ${retroStart}`}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                const startedAt = retroStart ? timeToISO(retroStart, resolveBaseDate(retroStart, new Date())) : undefined;
                startSleep.mutate({ loggedBy: name ?? null, startedAt });
                setRetroStart("");
              }}
              disabled={startSleep.isPending}
              className="w-full h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <PlayCircle className="w-5 h-5" />
              {tr("tapToStart", lang)}
            </button>
          </div>
        )}

        {/* Active sleep banner */}
        {isSleeping && (
          <div className="bg-indigo-500/10 border-2 border-indigo-400/60 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {tr("activeSleepBanner", lang)}
                </span>
              </div>
              <span className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatElapsed(elapsed)}
              </span>
            </div>
            <Button
              onClick={() => stopSleep.mutate()}
              disabled={stopSleep.isPending || isLoading}
              data-testid="button-stop-sleep"
              className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-base flex items-center justify-center gap-2"
            >
              <StopCircle className="w-5 h-5" />
              {tr("stopSleepNow", lang)}
            </Button>
          </div>
        )}

        {/* Manual entry form */}
        <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <p className="text-sm font-semibold text-muted-foreground">{tr("manualEntry", lang)}</p>

          {/* Start / End time row */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                {tr("startTime", lang)}
              </label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 h-12 text-base border-border bg-background"
                  data-testid="input-sleep-start"
                />
                {startTime && (
                  <button onClick={() => setStartTime("")} className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                {tr("endTime", lang)}
              </label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 h-12 text-base border-border bg-background"
                  data-testid="input-sleep-end"
                />
                {endTime && (
                  <button onClick={() => setEndTime("")} className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Auto duration display */}
          {autoDuration !== null && (
            <div className="text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-xl py-2">
              {tr("autoDuration", lang, autoDuration)}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">{tr("notesOptional", lang)}</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tr("exNotes", lang)}
            className="resize-none h-24 bg-card border-border"
            data-testid="input-sleep-notes"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={logSleep.isPending || !startTime || !endTime}
          data-testid="button-save-sleep"
          className="w-full h-16 text-lg font-bold rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform"
        >
          {tr("saveSleep", lang)}
        </Button>
      </div>
    </div>
  );
}
