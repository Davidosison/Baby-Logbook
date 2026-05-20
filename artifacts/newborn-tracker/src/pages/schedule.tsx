import { useState, useRef, useEffect } from "react";
import { useListEventsRange, getListEventsRangeQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format, subDays, addDays, startOfDay, isToday, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { he, ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────
const HOUR_PX = 40;          // compact: pixels per hour
const TOTAL_PX = HOUR_PX * 24;
const LABEL_W = 44;          // width of left hour-label column (px)
const MIN_BLOCK_PX = 5;
const DIAPER_DISPLAY_MIN = 12;
const FEEDING_DISPLAY_MIN = 15;

type EventItem = {
  id: number;
  type: string;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes?: number | null;
  amountMl?: number | null;
  diaperType?: string | null;
  isActive: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  feeding: "bg-blue-500",
  sleep: "bg-purple-500",
  diaper: "bg-amber-500",
};

const TYPE_COLORS_WEEKLY: Record<string, string> = {
  feeding: "bg-blue-400/80",
  sleep: "bg-purple-500/90",
  diaper: "bg-amber-400/80",
};

function minutesFromMidnight(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function displayDuration(event: EventItem) {
  if (event.durationMinutes) return event.durationMinutes;
  if (event.type === "diaper") return DIAPER_DISPLAY_MIN;
  if (event.type === "feeding") {
    if (event.endedAt) {
      const d = Math.round((new Date(event.endedAt).getTime() - new Date(event.startedAt).getTime()) / 60000);
      return Math.max(d, FEEDING_DISPLAY_MIN);
    }
    return FEEDING_DISPLAY_MIN;
  }
  return FEEDING_DISPLAY_MIN;
}

// ─── Weekly Pattern Grid ─────────────────────────────────────────────────────
function WeeklyGrid({ events, days, lang }: { events: EventItem[]; days: Date[]; lang: "he" | "ru" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dateLocale = lang === "he" ? he : ru;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / (24 * 60)) * TOTAL_PX;

  useEffect(() => {
    if (containerRef.current) {
      const scrollTo = Math.max(0, nowTop - 100);
      containerRef.current.scrollTop = scrollTo;
    }
  }, [nowTop]);

  const byDay = days.reduce<Record<string, EventItem[]>>((acc, d) => {
    acc[format(d, "yyyy-MM-dd")] = [];
    return acc;
  }, {});
  events.forEach((e) => {
    const key = format(new Date(e.startedAt), "yyyy-MM-dd");
    if (byDay[key]) byDay[key]!.push(e);
  });

  return (
    <div className="relative flex flex-col h-full" dir="ltr">
      {/* Day header row */}
      <div className="flex shrink-0 bg-background sticky top-0 z-20 border-b border-border/60" style={{ paddingLeft: LABEL_W }}>
        {days.map((d) => {
          const today = isToday(d);
          return (
            <div key={d.toISOString()} className="flex-1 text-center py-2 min-w-0">
              <div className={cn("text-[10px] font-semibold uppercase tracking-wide", today ? "text-primary" : "text-muted-foreground")}>
                {format(d, "EEE", { locale: dateLocale })}
              </div>
              <div className={cn("text-xs font-bold", today ? "text-primary" : "text-foreground")}>
                {format(d, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="relative flex" style={{ height: TOTAL_PX }}>
          {/* Hour labels */}
          <div className="shrink-0 relative" style={{ width: LABEL_W }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="absolute text-[9px] text-muted-foreground/80 font-mono pr-1 text-right"
                style={{ top: h * HOUR_PX - 5, width: LABEL_W }}
                dir="ltr"
              >
                {h % 3 === 0 ? `${String(h).padStart(2, "0")}:00` : ""}
              </div>
            ))}
          </div>

          {/* Grid columns */}
          <div className="flex flex-1 relative">
            {/* Hour grid lines */}
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className={cn(
                  "absolute left-0 right-0 border-t",
                  h % 6 === 0 ? "border-border/70" : h % 3 === 0 ? "border-border/45" : "border-border/25"
                )}
                style={{ top: h * HOUR_PX }}
              />
            ))}

            {/* Current time line */}
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="h-0.5 bg-red-500/80 w-full relative">
                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
              </div>
            </div>

            {/* Day columns */}
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const dayEvents = byDay[key] ?? [];
              const isCurrentDay = isToday(d);

              return (
                <div
                  key={key}
                  className={cn(
                    "flex-1 relative border-l border-border/40 min-w-0",
                    isCurrentDay && "bg-primary/5"
                  )}
                >
                  {dayEvents.map((event) => {
                    const startMin = minutesFromMidnight(event.startedAt);
                    const durMin = displayDuration(event);
                    const top = (startMin / (24 * 60)) * TOTAL_PX;
                    const height = Math.max(MIN_BLOCK_PX, (durMin / (24 * 60)) * TOTAL_PX);
                    const color = TYPE_COLORS_WEEKLY[event.type] ?? "bg-gray-400";

                    return (
                      <div
                        key={event.id}
                        className={cn("absolute inset-x-[1px] rounded-sm opacity-90", color)}
                        style={{ top, height }}
                        title={`${event.type} ${format(new Date(event.startedAt), "HH:mm")}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Daily Timeline ──────────────────────────────────────────────────────────
function DailyTimeline({ events, lang, date }: { events: EventItem[]; lang: "he" | "ru"; date: Date }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const isViewingToday = isToday(date);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / (24 * 60)) * TOTAL_PX;

  useEffect(() => {
    if (containerRef.current) {
      const scrollTo = isViewingToday ? Math.max(0, nowTop - 100) : 0;
      containerRef.current.scrollTop = scrollTo;
    }
  }, [isViewingToday, nowTop, date]);

  const dateStr = format(date, "yyyy-MM-dd");
  const dayEvents = events.filter(
    (e) => format(new Date(e.startedAt), "yyyy-MM-dd") === dateStr
  );

  const feedCount = dayEvents.filter((e) => e.type === "feeding").length;
  const feedMl = dayEvents.filter((e) => e.type === "feeding").reduce((s, e) => s + (e.amountMl ?? 0), 0);
  const sleepMin = dayEvents.filter((e) => e.type === "sleep").reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
  const diaperCount = dayEvents.filter((e) => e.type === "diaper").length;

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 shrink-0">
        <div className="bg-blue-500/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400" dir="ltr">{feedCount}</div>
          <div className="text-[10px] text-muted-foreground">{tr("feeding", lang)}</div>
          {feedMl > 0 && <div className="text-[10px] font-semibold text-blue-500" dir="ltr">{feedMl}ml</div>}
        </div>
        <div className="bg-purple-500/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400" dir="ltr">
            {Math.floor(sleepMin / 60)}h{sleepMin % 60}m
          </div>
          <div className="text-[10px] text-muted-foreground">{tr("sleep", lang)}</div>
        </div>
        <div className="bg-amber-500/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400" dir="ltr">{diaperCount}</div>
          <div className="text-[10px] text-muted-foreground">{tr("diaper", lang)}</div>
        </div>
      </div>

      {/* Hour grid */}
      <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain px-4">
        <div className="relative flex" style={{ height: TOTAL_PX }} dir="ltr">
          {/* Hour labels */}
          <div className="shrink-0 relative" style={{ width: LABEL_W }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="absolute text-[9px] text-muted-foreground/80 font-mono pr-1 text-right"
                style={{ top: h * HOUR_PX - 5, width: LABEL_W }}
              >
                {h % 3 === 0 ? `${String(h).padStart(2, "0")}:00` : ""}
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div className="flex-1 relative border-l border-border/60">
            {/* Hour lines */}
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className={cn(
                  "absolute left-0 right-0 border-t",
                  h % 6 === 0 ? "border-border/70" : h % 3 === 0 ? "border-border/45" : "border-border/25"
                )}
                style={{ top: h * HOUR_PX }}
              />
            ))}

            {/* Current time */}
            {isViewingToday && (
              <div className="absolute left-0 right-0 z-10" style={{ top: nowTop }}>
                <div className="h-0.5 bg-red-500/80 w-full relative">
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                </div>
              </div>
            )}

            {/* Events */}
            {dayEvents.map((event) => {
              const startMin = minutesFromMidnight(event.startedAt);
              const durMin = displayDuration(event);
              const top = (startMin / (24 * 60)) * TOTAL_PX;
              const height = Math.max(16, (durMin / (24 * 60)) * TOTAL_PX);
              const color = TYPE_COLORS[event.type] ?? "bg-gray-400";

              return (
                <div
                  key={event.id}
                  className={cn("absolute inset-x-2 rounded-xl flex items-center px-2 overflow-hidden", color, "text-white text-[10px] font-semibold")}
                  style={{ top, height }}
                >
                  {height >= 16 && (
                    <span className="truncate">
                      {event.type === "feeding" && (event.amountMl ? `${event.amountMl}ml` : tr("feeding", lang))}
                      {event.type === "sleep" && tr("sleep", lang)}
                      {event.type === "diaper" && (event.diaperType ?? tr("diaper", lang))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────
function Legend({ lang }: { lang: "he" | "ru" }) {
  return (
    <div className="flex justify-center gap-4 py-2 shrink-0">
      {[
        { type: "feeding", color: "bg-blue-500", label: tr("feeding", lang) },
        { type: "sleep", color: "bg-purple-500", label: tr("sleep", lang) },
        { type: "diaper", color: "bg-amber-500", label: tr("diaper", lang) },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={cn("w-2.5 h-2.5 rounded-sm", color)} />
          <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Schedule Page ────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { lang, dir } = useLanguage();
  const [tab, setTab] = useState<"weekly" | "daily">("weekly");
  const [weekOffset, setWeekOffset] = useState(0);  // 0 = current week
  const [dayOffset, setDayOffset] = useState(0);    // 0 = today

  const today = new Date();

  // Daily: selected day
  const selectedDay = startOfDay(addDays(today, dayOffset));
  const isSelectedFuture = selectedDay > startOfDay(today);

  // Weekly: 7-day window
  const weekAnchor = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), weekOffset);
  const weekEnd = endOfWeek(weekAnchor, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));

  // Fetch range covers both views
  const fetchStart = tab === "weekly" ? format(weekAnchor, "yyyy-MM-dd") : format(selectedDay, "yyyy-MM-dd");
  const fetchEnd = tab === "weekly" ? format(weekEnd, "yyyy-MM-dd") : format(selectedDay, "yyyy-MM-dd");

  const { data: events = [], isLoading } = useListEventsRange(
    { startDate: fetchStart, endDate: fetchEnd },
    { query: { queryKey: getListEventsRangeQueryKey({ startDate: fetchStart, endDate: fetchEnd }) } }
  );

  const dateLocale = lang === "he" ? he : ru;

  const weekLabel = `${format(weekAnchor, "d MMM", { locale: dateLocale })} – ${format(weekEnd, "d MMM", { locale: dateLocale })}`;
  const dayLabel = isToday(selectedDay)
    ? tr("today", lang)
    : format(selectedDay, lang === "he" ? "d בMMMM" : "d MMMM", { locale: dateLocale });

  return (
    <div className="flex flex-col h-[100dvh] bg-background" dir={dir}>
      <PageHeader hebrewTitle="לוח זמנים" russianTitle="Расписание" />

      {/* Tab switcher */}
      <div className="flex gap-1 mx-4 my-3 bg-muted rounded-2xl p-1 shrink-0">
        <button
          onClick={() => setTab("weekly")}
          className={cn(
            "flex-1 h-9 rounded-xl text-sm font-semibold transition-all",
            tab === "weekly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          {tr("weekly", lang)}
        </button>
        <button
          onClick={() => setTab("daily")}
          className={cn(
            "flex-1 h-9 rounded-xl text-sm font-semibold transition-all",
            tab === "daily" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          {tr("daily", lang)}
        </button>
      </div>

      {/* Navigation row */}
      <div className="flex items-center justify-between px-4 pb-2 shrink-0" dir="ltr">
        <button
          onClick={() => tab === "weekly" ? setWeekOffset((w) => w - 1) : setDayOffset((d) => d - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {tab === "weekly" ? weekLabel : dayLabel}
        </span>
        <button
          onClick={() => tab === "weekly" ? setWeekOffset((w) => w + 1) : setDayOffset((d) => d + 1)}
          disabled={tab === "daily" && isSelectedFuture}
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded-full bg-card border border-border transition-colors active:scale-95",
            tab === "daily" && isSelectedFuture
              ? "opacity-30 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <Legend lang={lang} />

      {isLoading && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
          {tr("loadingSchedule", lang)}
        </div>
      )}

      {!isLoading && (
        <div className="flex-1 min-h-0 pb-24">
          {tab === "weekly" ? (
            <WeeklyGrid events={events as EventItem[]} days={days} lang={lang} />
          ) : (
            <DailyTimeline events={events as EventItem[]} lang={lang} date={selectedDay} />
          )}
        </div>
      )}
    </div>
  );
}
