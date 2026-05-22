import { useState, useRef } from "react";
import { useListEventsRange, getListEventsRangeQueryKey } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format, subDays, startOfDay, isToday } from "date-fns";
import { he, ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────────
const HOUR_PX = 56;          // pixels per hour
const TOTAL_PX = HOUR_PX * 24;
const LABEL_W = 40;          // width of left hour-label column (px)
const MIN_BLOCK_PX = 5;      // minimum visible block height (px)
const DIAPER_DISPLAY_MIN = 12; // display minutes for diaper (no duration)
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

// ─── Color helpers ───────────────────────────────────────────────────────────
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

// ─── Utils ───────────────────────────────────────────────────────────────────
function minutesFromMidnight(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

type LayoutEvent = EventItem & { col: number; totalCols: number; startMin: number; durMin: number };

function assignColumns(events: EventItem[]): LayoutEvent[] {
  const sorted = [...events].sort(
    (a, b) => minutesFromMidnight(a.startedAt) - minutesFromMidnight(b.startedAt)
  );
  const colEnds: number[] = [];
  const assigned = sorted.map((event) => {
    const startMin = minutesFromMidnight(event.startedAt);
    const durMin = displayDuration(event);
    const endMin = startMin + durMin;
    let col = colEnds.findIndex((end) => end <= startMin);
    if (col === -1) { col = colEnds.length; colEnds.push(endMin); }
    else { colEnds[col] = endMin; }
    return { event, col, startMin, durMin };
  });
  const maxCols = Math.max(1, colEnds.length);
  return assigned.map(({ event, col, startMin, durMin }) => ({
    ...event, col, totalCols: maxCols, startMin, durMin,
  }));
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

  const byDay = days.reduce<Record<string, EventItem[]>>((acc, d) => {
    acc[format(d, "yyyy-MM-dd")] = [];
    return acc;
  }, {});
  events.forEach((e) => {
    const key = format(new Date(e.startedAt), "yyyy-MM-dd");
    if (byDay[key]) byDay[key]!.push(e);
  });

  return (
    <div className="relative flex flex-col h-full">
      {/* Day header row */}
      <div className="flex shrink-0 bg-background sticky top-0 z-20 border-b border-border/50" style={{ paddingLeft: LABEL_W }}>
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
                className="absolute text-[9px] text-muted-foreground/60 font-mono pr-1 text-right"
                style={{ top: h * HOUR_PX - 5, width: LABEL_W }}
              >
                {h === 0 ? "00:00" : h % 6 === 0 ? `${String(h).padStart(2, "0")}:00` : ""}
              </div>
            ))}
          </div>

          {/* Grid columns */}
          <div className="flex flex-1 relative">
            {/* Hour grid lines */}
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-border/20"
                style={{ top: h * HOUR_PX }}
              />
            ))}

            {/* Current time line */}
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="h-0.5 bg-red-500/70 w-full relative">
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
                    "flex-1 relative border-l border-border/20 min-w-0",
                    isCurrentDay && "bg-primary/3"
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
function DailyTimeline({ events, lang }: { events: EventItem[]; lang: "he" | "ru" }) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / (24 * 60)) * TOTAL_PX;

  const todayEvents = events.filter(
    (e) => format(new Date(e.startedAt), "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
  );

  // Stats
  const feedCount = todayEvents.filter((e) => e.type === "feeding").length;
  const feedMl = todayEvents.filter((e) => e.type === "feeding").reduce((s, e) => s + (e.amountMl ?? 0), 0);
  const sleepMin = todayEvents.filter((e) => e.type === "sleep").reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
  const diaperCount = todayEvents.filter((e) => e.type === "diaper").length;

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 shrink-0">
        <div className="bg-blue-500/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{feedCount}</div>
          <div className="text-[10px] text-muted-foreground">{tr("feeding", lang)}</div>
          {feedMl > 0 && <div className="text-[10px] font-semibold text-blue-500">{feedMl} מ"ל</div>}
        </div>
        <div className="bg-purple-500/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {tr("sleepGoalDuration", lang, Math.floor(sleepMin / 60), sleepMin % 60)}
          </div>
          <div className="text-[10px] text-muted-foreground">{tr("sleep", lang)}</div>
        </div>
        <div className="bg-amber-500/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{diaperCount}</div>
          <div className="text-[10px] text-muted-foreground">{tr("diaper", lang)}</div>
        </div>
      </div>

      {/* Hour grid */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4">
        <div className="relative flex" style={{ height: TOTAL_PX }}>
          {/* Hour labels */}
          <div className="shrink-0 relative" style={{ width: LABEL_W }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="absolute text-[9px] text-muted-foreground/70 font-mono pr-1 text-right"
                style={{ top: h * HOUR_PX - 5, width: LABEL_W }}
              >
                {h % 3 === 0 ? `${String(h).padStart(2, "0")}:00` : ""}
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div className="flex-1 relative border-l border-border/30">
            {/* Hour lines */}
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="absolute left-0 right-0 border-t border-border/20" style={{ top: h * HOUR_PX }} />
            ))}

            {/* Current time */}
            <div className="absolute left-0 right-0 z-10" style={{ top: nowTop }}>
              <div className="h-0.5 bg-red-500/70 w-full relative">
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
              </div>
            </div>

            {/* Events — with column layout to avoid overlaps */}
            {assignColumns(todayEvents).map((ev) => {
              const top = (ev.startMin / (24 * 60)) * TOTAL_PX;
              const height = Math.max(16, (ev.durMin / (24 * 60)) * TOTAL_PX);
              const color = TYPE_COLORS[ev.type] ?? "bg-gray-400";
              const widthPct = 100 / ev.totalCols;
              const leftPct = ev.col * widthPct;

              return (
                <div
                  key={ev.id}
                  className={cn("absolute rounded-xl flex items-center px-1.5 overflow-hidden", color, "text-white text-[10px] font-semibold")}
                  style={{ top, height, left: `${leftPct}%`, width: `calc(${widthPct}% - 3px)` }}
                >
                  {height >= 16 && (
                    <span className="truncate">
                      {ev.type === "feeding" && (ev.amountMl ? `${ev.amountMl}מ"ל` : tr("feeding", lang))}
                      {ev.type === "sleep" && tr("sleep", lang)}
                      {ev.type === "diaper" && (
                        ev.diaperType === "pee" ? tr("pee", lang)
                        : ev.diaperType === "poop" ? tr("poop", lang)
                        : ev.diaperType === "both" ? tr("both", lang)
                        : tr("diaper", lang)
                      )}
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

  const today = new Date();
  const endDate = format(today, "yyyy-MM-dd");
  const startDate = format(subDays(today, 6), "yyyy-MM-dd");

  // Build the 7-day array (oldest → newest)
  const days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(today, 6 - i)));

  const { data: events = [], isLoading } = useListEventsRange(
    { startDate, endDate },
    { query: { queryKey: getListEventsRangeQueryKey({ startDate, endDate }) } }
  );

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
            <DailyTimeline events={events as EventItem[]} lang={lang} />
          )}
        </div>
      )}
    </div>
  );
}
