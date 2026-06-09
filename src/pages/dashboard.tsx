import {
  useListEvents, getListEventsQueryKey,
  useGetRecentActivity, getGetRecentActivityQueryKey,
  useGetDailySummary, getGetDailySummaryQueryKey,
  useGetActiveSleep, getGetActiveSleepQueryKey,
  useStopSleep,
  useGetActiveFeeding, getGetActiveFeedingQueryKey,
  useLogVitaminD, useLogDiaper, useStartSleep,
} from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { he, ru } from "date-fns/locale";
import {
  Droplet, Moon, Utensils, Share2, StopCircle, RefreshCw,
  Timer, Bath, Sparkles, Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getSupabase, toEvent, type EventRow } from "@/lib/supabase";
import type { Language } from "@/contexts/language-context";

// ── Outside component: insight generator ─────────────────────────────────────
function generateInsight(
  avgFeedings: number,
  avgSleepH: number,
  avgMlPerDay: number,
  days: number,
  lang: Language,
): string {
  const he = lang === "he";
  if (days === 1) {
    if (avgFeedings >= 8 && avgSleepH >= 14)
      return he ? "יום מצוין! הרבה האכלות ושינה מעולה 🌟" : "Отличный день! Много кормлений и прекрасный сон 🌟";
    if (avgFeedings >= 6 && avgSleepH >= 12)
      return he ? "יום טוב! אדם אכל וישן כמו שצריך 💪" : "Хороший день! Адам хорошо ел и спал 💪";
    if (avgFeedings < 6)
      return he ? "כדאי לנסות להוסיף עוד האכלות" : "Стоит постараться добавить ещё кормлений";
    if (avgSleepH < 10)
      return he ? "שינה מועטה היום — תנסו לנוח יחד 💤" : "Мало сна сегодня — попробуйте отдохнуть вместе 💤";
    return he ? "יום רגיל — עבודה מצוינת! 🍀" : "Обычный день — отличная работа! 🍀";
  }
  if (days === 7) {
    if (avgSleepH >= 14)
      return he
        ? `שבוע שינה מצוין! ממוצע ${avgSleepH.toFixed(1)} שעות ביום 🎉`
        : `Отличная неделя сна! Среднее — ${avgSleepH.toFixed(1)} ч./день 🎉`;
    if (avgMlPerDay >= 600)
      return he
        ? `תזונה מצוינת! ממוצע ${Math.round(avgMlPerDay)} מ"ל ביום 🍼`
        : `Отличное питание! Среднее — ${Math.round(avgMlPerDay)} мл/день 🍼`;
    if (avgFeedings >= 8)
      return he
        ? `${avgFeedings.toFixed(1)} האכלות ביום בממוצע — מאמץ גדול! 💪`
        : `${avgFeedings.toFixed(1)} корм./день в среднем — большой труд! 💪`;
    return he
      ? `שבוע בריא לאדם — ${avgFeedings.toFixed(1)} האכלות ו-${avgSleepH.toFixed(1)}ש' שינה ביום`
      : `Здоровая неделя у Адама — ${avgFeedings.toFixed(1)} корм. и ${avgSleepH.toFixed(1)} ч. сна в день`;
  }
  // 2 days
  if (avgSleepH >= 13) return he ? "שינה מצוינת בשני הימים! 😴✨" : "Отличный сон за два дня! 😴✨";
  if (avgFeedings >= 7) return he ? "האכלות מצוינות — המשיכו כך! 👏" : "Хорошие кормления — так держать! 👏";
  return he ? "שני ימים טובים לאדם 💙" : "Два хороших дня у Адама 💙";
}

function EventIcon({ type, className }: { type: string; className?: string }) {
  if (type === "feeding") return <Utensils className={cn("w-4 h-4", className)} />;
  if (type === "sleep") return <Moon className={cn("w-4 h-4", className)} />;
  if (type === "diaper") return <Droplet className={cn("w-4 h-4", className)} />;
  if (type === "bath") return <Bath className={cn("w-4 h-4", className)} />;
  if (type === "vitamin_d") return <span className="text-sm leading-none">💊</span>;
  return null;
}

const VITAMIN_D_KEY = "vitamin-d-remind";
const VITAMIN_D_GIVEN_KEY = "vitamin-d-given";
const vitaminDGivenToday = () => localStorage.getItem(VITAMIN_D_GIVEN_KEY) === format(new Date(), "yyyy-MM-dd");
const markVitaminDGiven = () => localStorage.setItem(VITAMIN_D_GIVEN_KEY, format(new Date(), "yyyy-MM-dd"));

type SharePeriod = "today" | "2days" | "week";
type ShareData = {
  feedingCount: number;
  totalMl: number;
  sleepMins: number;
  diaperCount: number;
  insight: string;
  textToCopy: string;
  periodLabel: string;
};

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

  // ── Feeding timer ────────────────────────────────────────────────────────────
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

  // ── Quick Actions ────────────────────────────────────────────────────────────
  const [quickDone, setQuickDone] = useState<string | null>(null);
  const [splashing, setSplashing] = useState<string | null>(null);

  const quickFlash = (key: string) => {
    setSplashing(key);
    setQuickDone(key);
    setTimeout(() => setQuickDone(null), 1200);
  };

  const logDiaper = useLogDiaper({
    mutation: { onSuccess: (_, vars) => quickFlash(vars.data.diaperType) },
  });
  const startSleepQuick = useStartSleep({
    mutation: { onSuccess: () => quickFlash("sleep") },
  });

  // ── Vitamin D ────────────────────────────────────────────────────────────────
  const logVitaminD = useLogVitaminD();
  const [vitaminDRemind, setVitaminDRemind] = useState(
    () => !!localStorage.getItem(VITAMIN_D_KEY) && !vitaminDGivenToday(),
  );
  useEffect(() => {
    const sync = () => setVitaminDRemind(!!localStorage.getItem(VITAMIN_D_KEY) && !vitaminDGivenToday());
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

  // ── Share Sheet ──────────────────────────────────────────────────────────────
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [sharePeriod, setSharePeriod] = useState<SharePeriod | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);

  const generateShareContent = async (period: SharePeriod) => {
    setShareLoading(true);
    setShareData(null);
    setSharePeriod(period);
    try {
      const daysBack = period === "today" ? 1 : period === "2days" ? 2 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack + 1);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await getSupabase()
        .from("events")
        .select("*")
        .gte("started_at", startDate.toISOString())
        .order("started_at", { ascending: true });
      if (error) throw error;

      const evts = (data as EventRow[]).map(toEvent);
      const feedings = evts.filter(e => e.type === "feeding");
      const sleeps = evts.filter(e => e.type === "sleep" && !e.isActive);
      const diapers = evts.filter(e => e.type === "diaper");

      const totalMl = feedings.reduce((s, e) => s + (e.amountMl ?? 0), 0);
      const sleepMins = sleeps.reduce((s, e) => s + (e.durationMinutes ?? 0), 0);

      const avgFeedingsPerDay = feedings.length / daysBack;
      const avgSleepH = (sleepMins / daysBack) / 60;
      const avgMlPerDay = totalMl / daysBack;

      const insight = generateInsight(avgFeedingsPerDay, avgSleepH, avgMlPerDay, daysBack, lang);

      const periodLabel = period === "today"
        ? format(new Date(), lang === "he" ? "d בMMMM" : "d MMMM", { locale: dateLocale })
        : period === "2days"
          ? (lang === "he" ? "יומיים אחרונים" : "Последние 2 дня")
          : (lang === "he" ? "שבוע אחרון" : "Последняя неделя");

      const sleepH = Math.floor(sleepMins / 60);
      const sleepM = sleepMins % 60;

      const textLines = lang === "he" ? [
        `👶 עדכון אדם — ${periodLabel}`,
        `🍼 האכלות: ${feedings.length}${daysBack > 1 ? ` (${avgFeedingsPerDay.toFixed(1)}/יום)` : ""} · ${totalMl} מ"ל`,
        `😴 שינה: ${sleepH}ש' ${sleepM}ד'`,
        `🧷 טיטולים: ${diapers.length}`,
        "",
        `✨ ${insight}`,
        "",
        "נשלח מיומן אדם 👶",
      ] : [
        `👶 Адам — ${periodLabel}`,
        `🍼 Кормления: ${feedings.length}${daysBack > 1 ? ` (${avgFeedingsPerDay.toFixed(1)}/день)` : ""} · ${totalMl} мл`,
        `😴 Сон: ${sleepH} ч. ${sleepM} мин.`,
        `🧷 Подгузников: ${diapers.length}`,
        "",
        `✨ ${insight}`,
        "",
        "Журнал Адама 👶",
      ];

      setShareData({
        feedingCount: feedings.length,
        totalMl,
        sleepMins,
        diaperCount: diapers.length,
        insight,
        textToCopy: textLines.join("\n"),
        periodLabel,
      });
    } catch (e) {
      console.error("Share fetch error", e);
    } finally {
      setShareLoading(false);
    }
  };

  const doShare = () => {
    if (!shareData) return;
    if (navigator.share) navigator.share({ text: shareData.textToCopy });
    else {
      navigator.clipboard.writeText(shareData.textToCopy);
      setShareOpen(false);
    }
  };

  // ── Label helpers ─────────────────────────────────────────────────────────────
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
    <div className="h-[100dvh] bg-transparent flex flex-col overflow-hidden" dir={dir}>
      <PageHeader hebrewTitle="יומן אדם" russianTitle="Журнал Адама" showGuide />

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

        {/* ── Quick Actions — 5 buttons in a single row, no scroll ─────────── */}
        <div className="grid grid-cols-5 gap-1.5" dir="ltr">
          {/* Pee */}
          <button
            onClick={() => logDiaper.mutate({ data: { diaperType: "pee", loggedBy: name ?? null } })}
            disabled={logDiaper.isPending}
            onAnimationEnd={() => splashing === "pee" && setSplashing(null)}
            className={cn(
              "h-12 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold text-[9px] transition-colors active:scale-95 disabled:opacity-50",
              splashing === "pee" && "btn-pop",
              quickDone === "pee"
                ? "bg-green-400/20 border-green-400 text-green-600 dark:text-green-400"
                : "bg-amber-400/10 border-amber-400/40 text-amber-700 dark:text-amber-400"
            )}
          >
            <span className="text-lg leading-none">{quickDone === "pee" ? "✓" : "💧"}</span>
            <span>{lang === "he" ? "פיפי" : "Пи-пи"}</span>
          </button>

          {/* Poop */}
          <button
            onClick={() => logDiaper.mutate({ data: { diaperType: "poop", loggedBy: name ?? null } })}
            disabled={logDiaper.isPending}
            onAnimationEnd={() => splashing === "poop" && setSplashing(null)}
            className={cn(
              "h-12 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold text-[9px] transition-colors active:scale-95 disabled:opacity-50",
              splashing === "poop" && "btn-pop",
              quickDone === "poop"
                ? "bg-green-400/20 border-green-400 text-green-600 dark:text-green-400"
                : "bg-amber-400/10 border-amber-400/40 text-amber-700 dark:text-amber-400"
            )}
          >
            <span className="text-lg leading-none">{quickDone === "poop" ? "✓" : "💩"}</span>
            <span>{lang === "he" ? "קקי" : "Ка-ка"}</span>
          </button>

          {/* Both */}
          <button
            onClick={() => logDiaper.mutate({ data: { diaperType: "both", loggedBy: name ?? null } })}
            disabled={logDiaper.isPending}
            onAnimationEnd={() => splashing === "both" && setSplashing(null)}
            className={cn(
              "h-12 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold text-[9px] transition-colors active:scale-95 disabled:opacity-50",
              splashing === "both" && "btn-pop",
              quickDone === "both"
                ? "bg-green-400/20 border-green-400 text-green-600 dark:text-green-400"
                : "bg-amber-400/10 border-amber-400/40 text-amber-700 dark:text-amber-400"
            )}
          >
            <span className="text-lg leading-none">{quickDone === "both" ? "✓" : "🧷"}</span>
            <span>{lang === "he" ? "שניהם" : "Оба"}</span>
          </button>

          {/* Feeding — navigates to /feeding */}
          <Link href="/feeding">
            <button className="h-12 w-full rounded-2xl border-2 bg-sky-400/10 border-sky-400/40 flex flex-col items-center justify-center gap-0.5 font-bold text-[9px] text-sky-700 dark:text-sky-400 active:scale-95 transition-transform">
              <span className="text-lg leading-none">🍼</span>
              <span>{lang === "he" ? "האכלה" : "Корм."}</span>
            </button>
          </Link>

          {/* Sleep */}
          <button
            onClick={() => { if (!activeSleep) startSleepQuick.mutate({ loggedBy: name ?? null }); }}
            disabled={startSleepQuick.isPending}
            onAnimationEnd={() => splashing === "sleep" && setSplashing(null)}
            className={cn(
              "h-12 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold text-[9px] transition-colors active:scale-95 disabled:opacity-50",
              splashing === "sleep" && "btn-pop",
              activeSleep
                ? "bg-indigo-400/20 border-indigo-400 text-indigo-600 dark:text-indigo-400"
                : quickDone === "sleep"
                  ? "bg-green-400/20 border-green-400 text-green-600 dark:text-green-400"
                  : "bg-indigo-400/10 border-indigo-400/40 text-indigo-700 dark:text-indigo-400"
            )}
          >
            <span className="text-lg leading-none">{quickDone === "sleep" ? "✓" : activeSleep ? "🌙" : "😴"}</span>
            <span>{activeSleep ? (lang === "he" ? "ישן" : "Спит") : (lang === "he" ? "שינה" : "Сон")}</span>
          </button>
        </div>

        {/* Live sleep banner */}
        {activeSleep && (
          <div className="glass-card border-2 border-indigo-400/60 rounded-2xl px-3 py-2.5 flex items-center gap-3" dir={dir}>
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
          <div className="glass-card border-2 border-sky-400/60 rounded-2xl px-3 py-2.5 flex items-center gap-3" dir={dir}>
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
          <div className="glass-card border-2 border-amber-400/60 rounded-2xl px-3 py-2.5 flex items-center gap-3" dir={dir}>
            <span className="text-2xl shrink-0">💊</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-amber-600 dark:text-amber-400 text-sm leading-snug">
                {tr("vitaminDReminderBanner", lang)}
              </div>
            </div>
            <button
              onClick={() => {
                logVitaminD.mutate({ loggedBy: name ?? null });
                markVitaminDGiven();
                localStorage.removeItem(VITAMIN_D_KEY);
                setVitaminDRemind(false);
              }}
              className="shrink-0 h-10 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs active:scale-95 transition-transform"
            >
              {tr("vitaminDGave", lang)}
            </button>
          </div>
        )}

        {/* ── Recent Activity Cards ─────────────────────────────────────────── */}
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
              <div key={type} className="glass-card border border-border/50 rounded-3xl py-3 px-2 flex flex-col items-center justify-center text-center shadow-sm" data-testid={`card-${type}`}>
                {icon}
                <div className="text-xs font-semibold mb-0.5">{typeLabel(type)}</div>
                <div className="text-[10px] text-muted-foreground font-medium leading-tight">{getRecentText(minsAgo)}</div>
              </div>
            );
          })}
        </div>

        {/* ── Daily Progress ────────────────────────────────────────────────── */}
        {summary && (
          <div className="glass-card border border-border/50 rounded-3xl px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              {/* Share button — opens the sheet */}
              <button
                onClick={() => { setShareOpen(true); setSharePeriod(null); setShareData(null); }}
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

        {/* ── Today's Timeline ──────────────────────────────────────────────── */}
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
              <div className="text-center text-muted-foreground py-6 glass-card border border-border/50 rounded-2xl text-sm">
                {tr("noEventsToday", lang)}
              </div>
            )}
            {events?.map((event) => (
              <div key={event.id} className="glass-card border border-border/50 rounded-3xl px-3 py-2.5 flex items-center gap-3 shadow-sm" data-testid={`event-item-${event.id}`} dir={dir}>
                <div className={cn(
                  "w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-background/60 border border-border/50",
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

      {/* ── Share Sheet ───────────────────────────────────────────────────────── */}
      <Sheet
        open={shareOpen}
        onOpenChange={(open) => {
          setShareOpen(open);
          if (!open) { setSharePeriod(null); setShareData(null); }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-[2rem] glass-card border-border/60 p-6" dir={dir}>
          <SheetTitle className="text-center font-bold text-xl mb-5">
            {lang === "he" ? "📤 שיתוף עדכון" : "📤 Поделиться"}
          </SheetTitle>

          {/* Period picker */}
          {!sharePeriod && (
            <div className="grid grid-cols-3 gap-3">
              {([
                ["today",  lang === "he" ? "היום" : "Сегодня"],
                ["2days",  lang === "he" ? "יומיים" : "2 дня"],
                ["week",   lang === "he" ? "שבוע" : "Неделя"],
              ] as [SharePeriod, string][]).map(([p, label]) => (
                <button
                  key={p}
                  onClick={() => generateShareContent(p)}
                  className="h-16 rounded-2xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 active:scale-95 transition-all font-bold text-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {shareLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-9 h-9 animate-spin text-primary" />
            </div>
          )}

          {/* Preview */}
          {shareData && !shareLoading && (() => {
            const sh = Math.floor(shareData.sleepMins / 60);
            const sm = shareData.sleepMins % 60;
            return (
              <>
                {/* Stats */}
                <div className="bg-background/50 rounded-2xl p-4 mb-3 border border-border/50 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{shareData.periodLabel}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">🍼</span>
                    <span className="font-medium">
                      {lang === "he"
                        ? `${shareData.feedingCount} האכלות · ${shareData.totalMl} מ"ל`
                        : `${shareData.feedingCount} кормлений · ${shareData.totalMl} мл`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">😴</span>
                    <span className="font-medium">
                      {lang === "he" ? `${sh}ש' ${sm}ד' שינה` : `${sh} ч. ${sm} мин. сна`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">🧷</span>
                    <span className="font-medium">
                      {lang === "he" ? `${shareData.diaperCount} טיטולים` : `${shareData.diaperCount} подгузников`}
                    </span>
                  </div>
                </div>

                {/* AI Insight */}
                <div className="bg-primary/10 rounded-2xl p-4 mb-5 border border-primary/25 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{shareData.insight}</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSharePeriod(null); setShareData(null); }}
                    className="flex-1 h-12 rounded-2xl border-2 border-border/60 text-sm font-medium active:scale-95 transition-transform"
                  >
                    {lang === "he" ? "← חזרה" : "← Назад"}
                  </button>
                  <button
                    onClick={doShare}
                    className="flex-[2] h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Share2 className="w-4 h-4" />
                    {tr("share", lang)}
                  </button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
