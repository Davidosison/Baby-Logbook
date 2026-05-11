import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLogFeeding, getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Timer, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function timeToTodayISO(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h!, m!, 0, 0);
  return d.toISOString();
}

function computeAutoMinutes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh! * 60 + em!) - (sh! * 60 + sm!);
  return diff > 0 ? diff : null;
}

export default function FeedingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const [amountMl, setAmountMl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  // Live timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartRef = useRef<Date | null>(null);

  const autoDuration = computeAutoMinutes(startTime, endTime);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = () => {
    const now = new Date();
    timerStartRef.current = now;
    setStartTime(format(now, "HH:mm"));
    setEndTime("");
    setTimerSeconds(0);
    setTimerActive(true);
    timerRef.current = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const now = new Date();
    setEndTime(format(now, "HH:mm"));
    setTimerActive(false);
  };

  const logFeeding = useLogFeeding({
    mutation: {
      onSuccess: () => {
        const today = format(new Date(), "yyyy-MM-dd");
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
        setLocation("/");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logFeeding.mutate({
      data: {
        amountMl: amountMl ? parseInt(amountMl) : undefined,
        durationMinutes: autoDuration ?? undefined,
        notes: notes || undefined,
        startedAt: startTime ? timeToTodayISO(startTime) : new Date().toISOString(),
        endedAt: endTime ? timeToTodayISO(endTime) : undefined,
      },
    });
  };

  const formatTimerDisplay = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const canSave = !logFeeding.isPending && (!!amountMl || !!startTime || !!autoDuration);

  return (
    <div className="min-h-[100dvh] bg-background pb-32" dir={dir}>
      <PageHeader hebrewTitle="האכלה" russianTitle="Кормление" />

      <div className="p-4 max-w-md mx-auto space-y-5">

        {/* Live Timer Feature */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-5">
          <div className={cn("flex items-center justify-between mb-4", dir === "rtl" ? "flex-row" : "flex-row")}>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              {tr("liveTimer", lang)}
            </span>
            {timerActive && (
              <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {formatTimerDisplay(timerSeconds)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={timerActive ? stopTimer : startTimer}
            data-testid="button-timer-toggle"
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95",
              timerActive
                ? "bg-red-500/10 border-2 border-red-500 text-red-500"
                : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            )}
          >
            {timerActive
              ? <><StopCircle className="w-5 h-5" />{tr("tapToStop", lang)}</>
              : <><Timer className="w-5 h-5" />{tr("tapToStart", lang)}</>
            }
          </button>
          {timerActive && (
            <p className="text-xs text-center text-muted-foreground mt-2">{tr("timerRunning", lang)}</p>
          )}
        </div>

        {/* Start / End Time */}
        <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("startTime", lang)}</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-12 text-base bg-background"
                data-testid="input-start-time"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("endTime", lang)}</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-12 text-base bg-background"
                data-testid="input-end-time"
              />
            </div>
          </div>
          {autoDuration !== null && (
            <div className="text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-xl py-2">
              {tr("autoDuration", lang, autoDuration)}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="bg-card border border-border rounded-3xl p-5">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("amountMl", lang)}</label>
          <Input
            type="number"
            pattern="[0-9]*"
            inputMode="numeric"
            value={amountMl}
            onChange={(e) => setAmountMl(e.target.value)}
            placeholder={tr("exAmount", lang)}
            className="h-12 text-base bg-background"
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
            className="resize-none h-24 bg-card"
            data-testid="input-notes"
          />
        </div>

        <Button
          type="button"
          onClick={(e) => handleSubmit(e as any)}
          disabled={!canSave}
          data-testid="button-save-feeding"
          className="w-full h-16 text-lg font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
        >
          {tr("saveFeeding", lang)}
        </Button>
      </div>
    </div>
  );
}
