import { useListEvents, getListEventsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetDailySummary, getGetDailySummaryQueryKey, useGetActiveSleep, getGetActiveSleepQueryKey, useStopSleep, useGetActiveFeeding, getGetActiveFeedingQueryKey } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { he, ru } from "date-fns/locale";
import { Droplet, Moon, Utensils, Share2, StopCircle, RefreshCw, Timer, Bath } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

function EventIcon({ type, className }: { type: string; className?: string }) {
  if (type === "feeding") return <Utensils className={cn("w-4 h-4", className)} />;
  if (type === "sleep") return <Moon className={cn("w-4 h-4", className)} />;
  if (type === "diaper") return <Droplet className={cn("w-4 h-4", className)} />;
  if (type === "bath") return <Bath className={cn("w-4 h-4", className)} />;
  if (type === "vitamin_d") return <span className="text-sm leading-none">💊</span>;
  return null;
}

const VITAMIN_D_KEY = "vitamin-d-remind";

export default function DashboardPage() {
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const today = format(new Date(), "yyyy-MM-dd");
  const dateLocale = lang === "he" ? he : ru;
  const queryClient = useQueryClient();

  // ── Sleep timer ──────────────────────────────────────────────────────────────
  const { data: activeSleep } = useGetActiveSleep({
    query: { queryKey: getGetActiveSleepQueryKey() },
  });

  const [sleepElapsed, setSleepElapsed] = useState(0);
  useEffect(() => {
    if (activeSleep?.startedAt) {
      const start = new Date(activeSleep.startedAt).getTime();
      setSleepElapsed(Math.floor((Date.now() - start) / 1000));
      const iv = setInterval(() => setSleepElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
      return () => clearInterval(iv);
    }
    return undefined;
  }, [activeSleep]);

  const stopSleepMutation = useStopSleep({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActiveSleepQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
      },
    },
  });

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Feeding timer (DB-backed, syncs across all devices) ──────────────────────
  const { data: activeFeeding } = useGetActiveFeeding({
    query: { queryKey: getGetActiveFeedingQueryKey() },
  });
  const [feedingElapsed, setFeedingElapsed] = useState(0);
  useEffect(() => {
    if (activeFeeding?.startedAt) {
      const start = new Date(activeFeeding.startedAt).getTime();
      setFeedingElapsed(Math.floor((Date.now() - start) / 1000));
      const iv = setInterval(() => setFeedingElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
      return () => clearInterval(iv);
    }
    return undefined;
  }, [activeFeeding]);

  // ── Vitamin D reminder banner ─────────────────────────────────────────────────
  const [vitaminDRemind, setVitaminDRemind] = useState(() => !!localStorage.getItem(VITAMIN_D_KEY));
  useEffect(() => {
    const sync = () => setVitaminDRemind(!!localStorage.getItem(VITAMIN_D_KEY));
    window.addEventListener("vitamin-d-remind-change", sync);
    return () => window.removeEventListener("vitamin-d-remind-change", sync);
  }, []);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const { data: events, isLoading: isLoadingEvents, refetch: refetchEvents } = useListEvents(
    { date: today },
    { query: { queryKey: getListEventsQueryKey({ date: today }) } },
  );
  const { data: recent, refetch: refetchRecent } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() },
  });
  const { data: summary, refetch: refetchSummary } = useGetDailySummary(
    { date: today },
    { query: { queryKey: getGetDailySummaryQueryKey({ date: today }) } },
  );

  const handleRefresh = () => { refetchEvents(); refetchRecent(); refetchSummary(); };

  const handleShare = () => {
    if (!summary) return;
    const dateLabel = format(new Date(), lang === "he" ? "d בMMMM yyyy" : "d MMMM yyyy", { locale: dateLocale });
    const sleepH = Math.floor(summary.totalSleepMinutes / 60);
    const sleepM = summary.totalSleepMinutes % 60;
    const lines = [
      tr("shareTitle", lang, dateLabel),
      "",
      tr("shareFeedings", lang, summary.feedingCount, summary.totalFeedingMl),
      tr("shareSleep", lang, sleepH, sleepM),
      tr("shareDiapers", lang, summary.diaperCount),
      "",
      tr("shareFooter", lang),
    ];
    const text = lines.join("\n");
    if (navigator.share) navigator.share({ text });
    else navigator.clipboard.writeText(text);
  };

  const getRecentText = (mins: number | null | undefined) => {
    if (mins === null || mins === undefined) return tr("never", lang);
    if (mins < 1) return tr("justNow", lang);
    if (mins < 60) return tr("minutesAgo", lang, mins);
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? tr("hoursMinutesAgo", lang, hrs, m) : tr("hoursAgo", lang, hrs);
  };

  const typeLabel = (type: string) => {
    if (type === "feeding") return tr("feeding", lang);
    if (type === "sleep") return tr("sleep", lang);
    if (type === "diaper") return tr("diaper", lang);
    if (type === "bath") return tr("bath", lang);
    if (type === "vitamin_d") return tr("vitamin_d", lang);
    return type;
  };

  const diaperLabel = (t: string | null | undefined) => {
    if (t === "pee") return tr("pee", lang);
    if (t === "poop") return tr("poop", lang);
    if (t === "both") return tr("both", lang);
    return t ?? "";
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden" dir={dir}>
      <PageHeader hebrewTitle="יומן אדם" russianTitle="Журнал Адама" />

      {/* Main content — scrollable so banners never push cards off-screen */}
      <div
        className="flex-1 overflow-y-auto px-3 pt-2 space-y-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        {/* Hello */}
        {name && (
          <p className="text-sm font-semibold text-primary" dir={dir}>
            {tr("helloName", lang, name)}
          </p>
        )}

        {/* Live sleep banner */}
        {activeSleep && (
          <div className="bg-indigo-500/10 border-2 border-indigo-400/60 rounded-2xl px-3 py-2.5 flex items-center gap-3" dir={dir}>
            <Moon className="w-6 h-6 text-indigo-400 shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-indigo-600 dark:text-indigo-400 text-xs leading-none mb-0.5">{tr("sleepingNow", lang)}</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-indigo-600 dark:text-indigo-400 leading-none">
                {formatTimer(sleepElapsed)}
              </div>
            </div>
            <button
              onClick={() => stopSleepMutation.mutate()}
              disabled={stopSleepMutation.isPending}
              className="shrink-0 h-10 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
            >
              <StopCircle className="w-4 h-4" />
              {tr("stopSleep", lang)}
            </button>
          </div>
        )}

        {/* Live feeding timer banner */}
        {activeFeeding && (
          <div className="bg-sky-400/10 border-2 border-sky-400/60 rounded-2xl px-3 py-2.5 flex items-center gap-3" dir={dir}>
            <Timer className="w-6 h-6 text-sky-400 shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sky-600 dark:text-sky-400 text-xs leading-none mb-0.5">{tr("feedingActive", lang)}</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-sky-600 dark:text-sky-400 leading-none">
                {formatTimer(feedingElapsed)}
              </div>
            </div>
            <Link href="/feeding">
              <button className="shrink-0 h-10 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-transform">
                {tr("goToFeeding", lang)}
              </button>
            </Link>
          </div>
        )}

        {/* Vitamin D reminder banner */}
        {vitaminDRemind && (
          <div className="bg-amber-400/10 border-2 border-amber-400/60 rounded-2xl px-3 py-2.5 flex items-center gap-3" dir={dir}>
            <span className="text-2xl shrink-0">💊</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-amber-600 dark:text-amber-400 text-sm leading-snug">
                {tr("vitaminDReminderBanner", lang)}
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(VITAMIN_D_KEY);
                setVitaminDRemind(false);
              }}
              className="shrink-0 h-10 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs active:scale-95 transition-transform"
            >
              {tr("vitaminDGave", lang)}
            </button>
          </div>
        )}

        {/* Recent Activity Cards */}
        <div className="grid grid-cols-3 gap-2">
          {(["feeding", "sleep", "diaper"] as const).map((type) => {
            const minsAgo =
              type === "feeding" ? recent?.lastFeedingMinutesAgo
              : type === "sleep" ? recent?.lastSleepMinutesAgo
              : recent?.lastDiaperMinutesAgo;
            const icon =
              type === "feeding" ? <Utensils className="w-5 h-5 text-sky-400 mb-1" />
              : type === "sleep" ? <Moon className="w-5 h-5 text-indigo-400 mb-1" />
              : <Droplet className="w-5 h-5 text-amber-400 mb-1" />;
            return (
              <div key={type} className="bg-card border border-border rounded-2xl py-3 px-2 flex flex-col items-center justify-center text-center shadow-sm" data-testid={`card-${type}`}>
                {icon}
                <div className="text-xs font-semibold mb-0.5">{typeLabel(type)}</div>
                <div className="text-[10px] text-muted-foreground font-medium leading-tight">{getRecentText(minsAgo)}</div>
              </div>
            );
          })}
        </div>

        {/* Daily Progress */}
        {summary && (
          <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <button
                onClick={handleShare}
                data-testid="button-share"
                className="flex items-center gap-1 text-xs font-medium text-primary px-2.5 py-1 rounded-xl bg-primary/10 active:bg-primary/20 transition-colors"
              >
                <Share2 className="w-3 h-3" />
                {tr("share", lang)}
              </button>
              <h3 className="font-semibold text-sm">{tr("dailyGoals", lang)}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{summary.feedingCount} / {summary.feedingGoalMin}–{summary.feedingGoalMax}</span>
                <span className="font-medium">{tr("feedings", lang)}</span>
              </div>
              <Progress value={Math.min(100, (summary.feedingCount / summary.feedingGoalMin) * 100)} className="h-1.5 bg-secondary" />
              <div className="flex justify-between text-xs mt-1.5">
                <span className="text-muted-foreground">{tr("sleepGoalDuration", lang, Math.floor(summary.totalSleepMinutes / 60), summary.totalSleepMinutes % 60)}</span>
                <span className="font-medium">{tr("sleep", lang)}</span>
              </div>
              <Progress value={Math.min(100, (summary.totalSleepMinutes / summary.sleepGoalMinutes) * 100)} className="h-1.5 bg-secondary [&>div]:bg-indigo-400" />
            </div>
          </div>
        )}

        {/* Today's Timeline */}
        <div>
          <div className="flex items-center justify-between mb-2" dir={dir}>
            <button onClick={handleRefresh} data-testid="button-refresh" className="flex items-center gap-1 text-xs text-primary font-medium active:opacity-50">
              <RefreshCw className="w-3 h-3" />
              {tr("refresh", lang)}
            </button>
            <h3 className="font-semibold text-sm">{tr("todayTimeline", lang)}</h3>
          </div>

          <div className="space-y-2">
            {isLoadingEvents && (
              <div className="text-center text-muted-foreground py-6 animate-pulse text-sm">{tr("loading", lang)}</div>
            )}
            {!isLoadingEvents && events?.length === 0 && (
              <div className="text-center text-muted-foreground py-6 bg-card border border-border rounded-2xl text-sm">
                {tr("noEventsToday", lang)}
              </div>
            )}
            {events?.map((event) => (
              <div key={event.id} className="bg-card border border-border rounded-2xl px-3 py-2.5 flex items-center gap-3 shadow-sm" data-testid={`event-item-${event.id}`} dir={dir}>
                <div className={cn(
                  "w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-background border border-border",
                  event.type === "feeding" && "text-sky-400",
                  event.type === "sleep" && "text-indigo-400",
                  event.type === "diaper" && "text-amber-400",
                  event.type === "bath" && "text-teal-400",
                  event.type === "vitamin_d" && "text-purple-400",
                )}>
                  <EventIcon type={event.type} />
                </div>
                <div className="flex-1 min-w-0" dir={dir}>
                  <div className="flex justify-between items-center" dir={dir}>
                    <span className="text-[11px] text-muted-foreground">{format(new Date(event.startedAt), "HH:mm")}</span>
                    <span className="font-semibold text-sm">{typeLabel(event.type)}</span>
                  </div>
                  <div className={cn("text-xs text-muted-foreground truncate", dir === "rtl" ? "text-right" : "text-left")}>
                    {event.type === "feeding" && (
                      <>
                        {event.amountMl ? tr("feedingAmount", lang, event.amountMl) : ""}
                        {event.amountMl && event.durationMinutes ? " · " : ""}
                        {event.durationMinutes ? tr("feedingDuration", lang, event.durationMinutes) : ""}
                      </>
                    )}
                    {event.type === "sleep" && (
                      event.isActive ? tr("sleepingNow", lang) : event.durationMinutes ? tr("sleepDuration", lang, Math.floor(event.durationMinutes / 60), event.durationMinutes % 60) : ""
                    )}
                    {event.type === "diaper" && diaperLabel(event.diaperType)}
                    {event.notes ? ` · ${event.notes}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
