import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Clock, Plus, Moon, Sun, Settings, CalendarDays, ArrowLeft, Timer, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLogFeeding, useLogSleep, useStopSleep, useLogDiaper, useGetActiveSleep,
  getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey,
  getGetActiveSleepQueryKey,
} from "@workspace/api-client-react";
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type LogType = "feeding" | "sleep" | "diaper" | null;

function useInvalidate() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  return () => {
    queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
    queryClient.invalidateQueries({ queryKey: getGetActiveSleepQueryKey() });
  };
}

// ── Quick Feeding Form ────────────────────────────────────────────────────────
function FeedingForm({ onDone, onBack, lang, dir }: { onDone: () => void; onBack: () => void; lang: "he" | "ru"; dir: "rtl" | "ltr" }) {
  const invalidate = useInvalidate();
  const [amountMl, setAmountMl] = useState("");
  const [startTime, setStartTime] = useState(format(new Date(), "HH:mm"));
  const [endTime, setEndTime] = useState("");

  const logFeeding = useLogFeeding({
    mutation: {
      onSuccess: () => { invalidate(); onDone(); },
    },
  });

  const handleSave = () => {
    const [sh, sm] = startTime.split(":").map(Number);
    const startDate = new Date(); startDate.setHours(sh!, sm!, 0, 0);
    let endDate: Date | undefined;
    if (endTime) {
      const [eh, em] = endTime.split(":").map(Number);
      endDate = new Date(); endDate.setHours(eh!, em!, 0, 0);
    }
    logFeeding.mutate({
      data: {
        startedAt: startDate.toISOString(),
        endedAt: endDate?.toISOString(),
        amountMl: amountMl ? parseInt(amountMl) : undefined,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4" dir={dir}>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{tr("feeding", lang)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3" dir="ltr">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5" dir={dir}>{tr("startTime", lang)}</label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11 border-border bg-background" dir="ltr" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5" dir={dir}>{tr("endTime", lang)}</label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11 border-border bg-background" dir="ltr" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("amountMl", lang)}</label>
        <Input type="number" inputMode="numeric" value={amountMl} onChange={(e) => setAmountMl(e.target.value)} placeholder={tr("exAmount", lang)} className="h-11 border-border bg-background" />
      </div>
      <Button onClick={handleSave} disabled={logFeeding.isPending} className="w-full h-12 font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white">
        {tr("saveFeeding", lang)}
      </Button>
    </div>
  );
}

// ── Quick Sleep Form ──────────────────────────────────────────────────────────
function SleepForm({ onDone, onBack, lang, dir }: { onDone: () => void; onBack: () => void; lang: "he" | "ru"; dir: "rtl" | "ltr" }) {
  const invalidate = useInvalidate();
  const [startTime, setStartTime] = useState(format(new Date(), "HH:mm"));
  const [endTime, setEndTime] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const { data: activeSleep } = useGetActiveSleep({ query: { queryKey: getGetActiveSleepQueryKey() } });
  const isSleeping = !!activeSleep?.event;

  useState(() => {
    if (activeSleep?.event?.startedAt) {
      const start = new Date(activeSleep.event.startedAt).getTime();
      const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
      return () => clearInterval(interval);
    }
  });

  const stopSleep = useStopSleep({ mutation: { onSuccess: () => { invalidate(); onDone(); } } });
  const logSleep = useLogSleep({ mutation: { onSuccess: () => { invalidate(); onDone(); } } });

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleManualSave = () => {
    if (!startTime || !endTime) return;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const base = new Date();
    const start = new Date(base); start.setHours(sh!, sm!, 0, 0);
    const end = new Date(base); end.setHours(eh!, em!, 0, 0);
    logSleep.mutate({ data: { startedAt: start.toISOString(), endedAt: end.toISOString() } });
  };

  return (
    <div className="flex flex-col gap-4" dir={dir}>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{tr("sleep", lang)}</span>
      </div>

      {isSleeping ? (
        <div className="bg-purple-500/10 border-2 border-purple-500 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-purple-500" />
            <span className="font-semibold text-purple-600 dark:text-purple-400 text-sm">{tr("activeSleepBanner", lang)}</span>
          </div>
          <span className="font-mono font-bold text-purple-600 dark:text-purple-400" dir="ltr">{formatElapsed(elapsed)}</span>
        </div>
      ) : (
        <Button
          onClick={() => logSleep.mutate({ data: { startedAt: new Date().toISOString() } })}
          disabled={logSleep.isPending}
          className="w-full h-12 font-bold rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
        >
          <Timer className="w-4 h-4" />
          {tr("tapToStart", lang)}
        </Button>
      )}

      {isSleeping && (
        <Button
          onClick={() => stopSleep.mutate()}
          disabled={stopSleep.isPending}
          className="w-full h-12 font-bold rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
        >
          <StopCircle className="w-4 h-4" />
          {tr("stopSleepNow", lang)}
        </Button>
      )}

      <div className="border-t border-border/40 pt-3">
        <p className="text-xs font-semibold text-muted-foreground mb-3">{tr("manualEntry", lang)}</p>
        <div className="grid grid-cols-2 gap-3" dir="ltr">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5" dir={dir}>{tr("startTime", lang)}</label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11 border-border bg-background" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5" dir={dir}>{tr("endTime", lang)}</label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11 border-border bg-background" dir="ltr" />
          </div>
        </div>
        <Button onClick={handleManualSave} disabled={logSleep.isPending || !startTime || !endTime} className="w-full h-11 font-bold rounded-2xl mt-3">
          {tr("saveSleep", lang)}
        </Button>
      </div>
    </div>
  );
}

// ── Quick Diaper Form ─────────────────────────────────────────────────────────
function DiaperForm({ onDone, onBack, lang, dir }: { onDone: () => void; onBack: () => void; lang: "he" | "ru"; dir: "rtl" | "ltr" }) {
  const invalidate = useInvalidate();
  const [diaperType, setDiaperType] = useState<"pee" | "poop" | "both" | null>(null);

  const logDiaper = useLogDiaper({
    mutation: { onSuccess: () => { invalidate(); onDone(); } },
  });

  return (
    <div className="flex flex-col gap-4" dir={dir}>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-lg text-amber-600 dark:text-amber-400">{tr("diaper", lang)}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(["pee", "poop", "both"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setDiaperType(t)}
            className={cn(
              "h-16 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95",
              diaperType === t
                ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400"
                : "bg-muted border-border text-muted-foreground"
            )}
          >
            {tr(t, lang)}
          </button>
        ))}
      </div>
      <Button
        onClick={() => {
          if (!diaperType) return;
          logDiaper.mutate({ data: { diaperType, startedAt: new Date().toISOString() } });
        }}
        disabled={logDiaper.isPending || !diaperType}
        className="w-full h-12 font-bold rounded-2xl bg-amber-600 hover:bg-amber-700 text-white"
      >
        {tr("saveDiaper", lang)}
      </Button>
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
export function BottomNav() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, dir } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logType, setLogType] = useState<LogType>(null);

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setLogType(null);
  };

  const isActive = (path: string) => location === path;

  const navItem = (path: string, Icon: React.ElementType, label: string, testId: string) => (
    <Link
      href={path}
      data-testid={testId}
      className={cn(
        "flex flex-col items-center justify-center w-14 h-full text-muted-foreground transition-colors",
        isActive(path) && "text-primary",
      )}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 h-20 bg-background/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 pb-safe z-50"
        dir={dir}
      >
        {navItem("/", Home, tr("home", lang), "nav-home")}
        {navItem("/history", Clock, tr("history", lang), "nav-history")}

        {/* Plus — center floating */}
        <div className="relative -top-6 flex-shrink-0">
          <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
            <SheetTrigger asChild>
              <button
                data-testid="nav-add"
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/30 active:scale-95 transition-transform"
              >
                <Plus className="w-8 h-8" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2rem] bg-card border-border flex flex-col p-6" dir={dir}
              style={{ minHeight: logType === "sleep" ? "60vh" : "50vh" }}
            >
              <VisuallyHidden>
                <SheetTitle>{tr("logEvent", lang)}</SheetTitle>
              </VisuallyHidden>

              {logType === null && (
                <div className="flex-1 flex flex-col justify-center gap-3">
                  <button
                    onClick={() => setLogType("feeding")}
                    data-testid="nav-feeding"
                    className="w-full flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 p-4 rounded-2xl transition-colors"
                  >
                    <div className="text-2xl font-bold text-center">{tr("feeding", lang)}</div>
                  </button>
                  <button
                    onClick={() => setLogType("sleep")}
                    data-testid="nav-sleep"
                    className="w-full flex items-center justify-center bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 p-4 rounded-2xl transition-colors"
                  >
                    <div className="text-2xl font-bold text-center">{tr("sleep", lang)}</div>
                  </button>
                  <button
                    onClick={() => setLogType("diaper")}
                    data-testid="nav-diaper"
                    className="w-full flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl transition-colors"
                  >
                    <div className="text-2xl font-bold text-center">{tr("diaper", lang)}</div>
                  </button>
                </div>
              )}

              {logType === "feeding" && (
                <FeedingForm onDone={() => setSheetOpen(false)} onBack={() => setLogType(null)} lang={lang} dir={dir} />
              )}
              {logType === "sleep" && (
                <SleepForm onDone={() => setSheetOpen(false)} onBack={() => setLogType(null)} lang={lang} dir={dir} />
              )}
              {logType === "diaper" && (
                <DiaperForm onDone={() => setSheetOpen(false)} onBack={() => setLogType(null)} lang={lang} dir={dir} />
              )}
            </SheetContent>
          </Sheet>
        </div>

        {navItem("/schedule", CalendarDays, tr("schedule", lang), "nav-schedule")}

        {/* Settings */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              data-testid="nav-settings"
              className="flex flex-col items-center justify-center w-14 h-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{tr("settings", lang)}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2rem] bg-card border-border p-6" dir={dir}>
            <SheetTitle className="text-xl font-bold text-center mb-6">{tr("settings", lang)}</SheetTitle>

            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{tr("language", lang)}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLang("he")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-base transition-all active:scale-95",
                    lang === "he"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  עברית
                </button>
                <button
                  onClick={() => setLang("ru")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-base transition-all active:scale-95",
                    lang === "ru"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  Русский
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{tr("theme", lang)}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2",
                    theme === "dark"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  <Moon className="w-4 h-4" />
                  {tr("dark", lang)}
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2",
                    theme === "light"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  <Sun className="w-4 h-4" />
                  {tr("light", lang)}
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="h-20" />
    </>
  );
}
