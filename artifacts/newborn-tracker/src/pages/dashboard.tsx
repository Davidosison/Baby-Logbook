import { useListEvents, getListEventsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetDailySummary, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { he, ru } from "date-fns/locale";
import { Droplet, Moon, Utensils, Share2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function EventIcon({ type, className }: { type: string; className?: string }) {
  if (type === "feeding") return <Utensils className={cn("w-5 h-5", className)} />;
  if (type === "sleep") return <Moon className={cn("w-5 h-5", className)} />;
  if (type === "diaper") return <Droplet className={cn("w-5 h-5", className)} />;
  return null;
}

export default function DashboardPage() {
  const { lang, dir } = useLanguage();
  const today = format(new Date(), "yyyy-MM-dd");
  const dateLocale = lang === "he" ? he : ru;

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
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
    }
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
    return type;
  };

  const diaperLabel = (t: string | null | undefined) => {
    if (t === "pee") return tr("pee", lang);
    if (t === "poop") return tr("poop", lang);
    if (t === "both") return tr("both", lang);
    return t ?? "";
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-32" dir={dir}>
      <PageHeader hebrewTitle="יומן אדם" russianTitle="Журнал Адама" />

      <div className="p-4 space-y-6">
        {/* Recent Activity Cards */}
        <div className="grid grid-cols-3 gap-3">
          {(["feeding", "sleep", "diaper"] as const).map((type) => {
            const minsAgo =
              type === "feeding" ? recent?.lastFeedingMinutesAgo
              : type === "sleep" ? recent?.lastSleepMinutesAgo
              : recent?.lastDiaperMinutesAgo;
            const icon =
              type === "feeding" ? <Utensils className="w-6 h-6 text-blue-500 mb-2" />
              : type === "sleep" ? <Moon className="w-6 h-6 text-purple-500 mb-2" />
              : <Droplet className="w-6 h-6 text-amber-500 mb-2" />;
            return (
              <div key={type} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm" data-testid={`card-${type}`}>
                {icon}
                <div className="text-sm font-medium mb-1">{typeLabel(type)}</div>
                <div className="text-xs text-muted-foreground font-medium">{getRecentText(minsAgo)}</div>
              </div>
            );
          })}
        </div>

        {/* Daily Progress */}
        {summary && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{tr("dailyGoals", lang)}</h3>
              <button
                onClick={handleShare}
                data-testid="button-share"
                className="flex items-center gap-1.5 text-sm font-medium text-primary px-3 py-1.5 rounded-xl bg-primary/10 active:bg-primary/20 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {tr("share", lang)}
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{tr("feedings", lang)}</span>
                <span className="text-muted-foreground">{summary.feedingCount} / {summary.feedingGoalMin}–{summary.feedingGoalMax}</span>
              </div>
              <Progress value={Math.min(100, (summary.feedingCount / summary.feedingGoalMin) * 100)} className="h-2 bg-secondary" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{tr("sleep", lang)}</span>
                <span className="text-muted-foreground">{tr("sleepGoalDuration", lang, Math.floor(summary.totalSleepMinutes / 60), summary.totalSleepMinutes % 60)}</span>
              </div>
              <Progress value={Math.min(100, (summary.totalSleepMinutes / summary.sleepGoalMinutes) * 100)} className="h-2 bg-secondary [&>div]:bg-purple-500" />
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleRefresh} data-testid="button-refresh" className="text-sm text-primary font-medium p-2 active:opacity-50">{tr("refresh", lang)}</button>
            <h3 className="font-semibold text-lg">{tr("todayTimeline", lang)}</h3>
          </div>

          <div className="space-y-4">
            {isLoadingEvents && (
              <div className="text-center text-muted-foreground py-8 animate-pulse">{tr("loading", lang)}</div>
            )}
            {!isLoadingEvents && events?.length === 0 && (
              <div className="text-center text-muted-foreground py-8 bg-card border border-border rounded-2xl">
                {tr("noEventsToday", lang)}
              </div>
            )}

            {events?.map((event, i) => (
              <div key={event.id} className="flex gap-3 relative items-start" data-testid={`event-item-${event.id}`} dir={dir}>
                {/* Timeline vertical line — anchored to icon column on the inline-start side */}
                {i !== events.length - 1 && (
                  <div className="absolute top-12 bottom-[-16px] w-[2px] bg-border z-0 inline-start-5" style={{ [dir === "rtl" ? "right" : "left"]: "20px" }} />
                )}

                {/* Icon — inline-start = right in RTL, left in LTR */}
                <div className={cn(
                  "w-10 h-10 shrink-0 rounded-full flex items-center justify-center z-10 bg-card border border-border shadow-sm",
                  event.type === "feeding" && "text-blue-500",
                  event.type === "sleep" && "text-purple-500",
                  event.type === "diaper" && "text-amber-500",
                )}>
                  <EventIcon type={event.type} />
                </div>

                {/* Content card */}
                <div className="flex-1 bg-card border border-border rounded-2xl p-4 shadow-sm min-w-0">
                  {/* Category name + time — name on inline-start (right in RTL) */}
                  <div className="flex justify-between items-start mb-1" dir={dir}>
                    <span className="text-xs text-muted-foreground font-medium">{format(new Date(event.startedAt), "HH:mm")}</span>
                    <span className="font-bold text-base">{typeLabel(event.type)}</span>
                  </div>
                  {event.type === "feeding" && (
                    <div className={cn("text-sm text-muted-foreground", dir === "rtl" ? "text-right" : "text-left")}>
                      {event.amountMl ? tr("feedingAmount", lang, event.amountMl) : ""}
                      {event.amountMl && event.durationMinutes ? " · " : ""}
                      {event.durationMinutes ? tr("feedingDuration", lang, event.durationMinutes) : ""}
                    </div>
                  )}
                  {event.type === "sleep" && (
                    <div className={cn("text-sm text-muted-foreground", dir === "rtl" ? "text-right" : "text-left")}>
                      {event.isActive ? tr("sleepingNow", lang) : event.durationMinutes ? tr("sleepDuration", lang, Math.floor(event.durationMinutes / 60), event.durationMinutes % 60) : ""}
                    </div>
                  )}
                  {event.type === "diaper" && (
                    <div className={cn("text-sm text-muted-foreground", dir === "rtl" ? "text-right" : "text-left")}>
                      {diaperLabel(event.diaperType)}
                    </div>
                  )}
                  {event.notes && <div className={cn("text-sm mt-2 italic opacity-80", dir === "rtl" ? "text-right" : "text-left")}>{event.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
