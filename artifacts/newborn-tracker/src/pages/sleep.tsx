import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  useGetActiveSleep, getGetActiveSleepQueryKey,
  useStopSleep, useLogSleep,
  getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey,
} from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Moon, StopCircle } from "lucide-react";

function timeToISO(timeStr: string, baseDate: Date): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h!, m!, 0, 0);
  return d.toISOString();
}

function computeMinutes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh! * 60 + em!) - (sh! * 60 + sm!);
  return diff > 0 ? diff : null;
}

export default function SleepPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const today = format(new Date(), "yyyy-MM-dd");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const { data: activeSleep, isLoading } = useGetActiveSleep({
    query: { queryKey: getGetActiveSleepQueryKey() },
  });

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (activeSleep?.event?.startedAt) {
      const start = new Date(activeSleep.event.startedAt).getTime();
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

  const stopSleep = useStopSleep({
    mutation: { onSuccess: () => { invalidateAll(); setLocation("/"); } },
  });

  const logSleep = useLogSleep({
    mutation: { onSuccess: () => { invalidateAll(); setLocation("/"); } },
  });

  const isSleeping = !!activeSleep?.event;
  const autoDuration = computeMinutes(startTime, endTime);

  const handleSave = () => {
    if (!startTime || !endTime) return;
    const base = new Date();
    logSleep.mutate({
      data: {
        startedAt: timeToISO(startTime, base),
        endedAt: timeToISO(endTime, base),
        notes: notes || undefined,
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
    <div className="min-h-[100dvh] bg-background pb-32" dir={dir}>
      <PageHeader hebrewTitle="שינה" russianTitle="Сон" showBack />

      <div className="p-4 max-w-md mx-auto space-y-5">

        {/* Active sleep banner */}
        {isSleeping && (
          <div className="bg-purple-500/10 border-2 border-purple-500 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {tr("activeSleepBanner", lang)}
                </span>
              </div>
              <span className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                {formatElapsed(elapsed)}
              </span>
            </div>
            <Button
              onClick={() => stopSleep.mutate()}
              disabled={stopSleep.isPending || isLoading}
              data-testid="button-stop-sleep"
              className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base flex items-center justify-center gap-2"
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
          <div className="grid grid-cols-2 gap-3" dir="ltr">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2" dir={dir}>
                {tr("startTime", lang)}
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-12 text-base border-border bg-background"
                data-testid="input-sleep-start"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2" dir={dir}>
                {tr("endTime", lang)}
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-12 text-base border-border bg-background"
                data-testid="input-sleep-end"
                dir="ltr"
              />
            </div>
          </div>

          {/* Auto duration display */}
          {autoDuration !== null && (
            <div className="text-center text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 rounded-xl py-2">
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
          className="w-full h-16 text-lg font-bold rounded-2xl bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-500/20 active:scale-95 transition-transform"
        >
          {tr("saveSleep", lang)}
        </Button>
      </div>
    </div>
  );
}
