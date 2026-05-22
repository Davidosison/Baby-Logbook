import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLogFeeding, getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Timer, StopCircle } from "lucide-react";

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
  const { name } = usePerson();
  const [amountMl, setAmountMl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const autoDuration = computeAutoMinutes(startTime, endTime);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = () => {
    const now = new Date();
    setStartTime(format(now, "HH:mm"));
    setEndTime("");
    setTimerSeconds(0);
    setTimerActive(true);
    timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEndTime(format(new Date(), "HH:mm"));
    setTimerActive(false);
  };

  const formatTimerDisplay = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

  const handleSave = () => {
    logFeeding.mutate({
      data: {
        amountMl: amountMl ? parseInt(amountMl) : undefined,
        durationMinutes: autoDuration ?? undefined,
        notes: notes || undefined,
        startedAt: startTime ? timeToTodayISO(startTime) : new Date().toISOString(),
        endedAt: endTime ? timeToTodayISO(endTime) : undefined,
        loggedBy: name ?? null,
      },
    });
  };

  const canSave = !logFeeding.isPending && (!!amountMl || !!startTime);

  return (
    <div className="min-h-[100dvh] bg-background pb-32" dir={dir}>
      <PageHeader hebrewTitle="האכלה" russianTitle="Кормление" showBack />

      <div className="p-4 max-w-md mx-auto space-y-4">

        {/* Live Timer */}
        <div className="bg-sky-400/5 border border-sky-400/20 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              {tr("liveTimer", lang)}
            </span>
            {timerActive && (
              <span className="text-2xl font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                {formatTimerDisplay(timerSeconds)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={timerActive ? stopTimer : startTimer}
            data-testid="button-timer-toggle"
            className={[
              "w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95",
              timerActive
                ? "bg-red-500/10 border-2 border-red-500 text-red-500"
                : "bg-sky-500 text-white",
            ].join(" ")}
          >
            {timerActive
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
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-12 text-base border-border bg-background"
                data-testid="input-start-time"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {tr("endTime", lang)}
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-12 text-base border-border bg-background"
                data-testid="input-end-time"
              />
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
