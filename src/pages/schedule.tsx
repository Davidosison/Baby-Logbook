import { useState, useRef } from "react";
import { useListEventsRange, getListEventsRangeQueryKey } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format, subDays, startOfDay, isToday } from "date-fns";
import { he, ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────────
const HOUR_PX = 56;
const TOTAL_PX = HOUR_PX * 24;
const LABEL_W = 40;
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

// ─── Color helpers ───────────────────────────────────────────────────────────
const TYPE_COLORS_WEEKLY: Record<string, string> = {
  feeding: "bg-sky-400/75",
  sleep: "bg-indigo-400/85",
  diaper: "bg-amber-400/75",
  bath: "bg-teal-400/75",
  vitamin_d: "bg-purple-400/75",
  medication: "bg-rose-400/75",
};

// ─── Utils ───────────────────────────────────────────────────────────────────
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
function WeeklyGrid({ events, days: rawDays, lang, dir }: { events: EventItem[]; days: Date[]; lang: "he" | "ru"; dir: "rtl" | "ltr" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dateLocale = lang === "he" ? he : ru;

  // For RTL: show today on the right (reading order start) → reverse so today is first in RTL flex
  const days = dir === "rtl" ? [...rawDays].reverse() : rawDays;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes / (24 * 60)) * TOTAL_PX;

  const byDay = rawDays.reduce<Record<string, EventItem[]>>((acc, d) => {
    acc[format(d, "yyyy-MM-dd")] = [];
    return acc;
  }, {});
  events.forEach((e) => {
    const key = format(new Date(e.startedAt), "yyyy-MM-dd");
    if (byDay[key]) byDay[key]!.push(e);
  });

  return (
    // Always LTR for the outer structure so hour labels stay on the left
    <div className="relative flex flex-col h-full overflow-hidden" dir="ltr">
      <div ref={containerRef} className="flex-1 overflow-y-auto overscroll-contain">
        {/* Day header row — sticky */}
        <div className="flex sticky top-0 z-20 bg-background border-b-2 border-border/40" style={{ paddingLeft: LABEL_W }}>
          {days.map((d) => {
            const today = isToday(d);
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "flex-1 text-center py-2.5 min-w-0",
                  today && "bg-primary/8 border-b-2 border-primary"
                )}
              >
                <div className={cn("text-[10px] font-bold uppercase tracking-wider", today ? "text-primary" : "text-muted-foreground/60")}>
                  {format(d, "EEE", { locale: dateLocale })}
                </div>
                <div className={cn(
                  "text-sm font-bold mt-0.5 w-6 h-6 rounded-full flex items-center justify-center mx-auto",
                  today ? "bg-primary text-primary-foreground" : "text-foreground"
                )}>
                  {format(d, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid body */}
        <div className="relative flex" style={{ height: TOTAL_PX }}>
          {/* Hour labels */}
          <div className="shrink-0 relative" style={{ width: LABEL_W }}>
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="absolute text-[9px] text-muted-foreground/40 font-mono pr-1 text-right"
                style={{ top: h * HOUR_PX - 5, width: LABEL_W }}
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
                  "absolute left-0 right-0",
                  h % 6 === 0 ? "border-t border-border/30" : "border-t border-border/10"
                )}
                style={{ top: h * HOUR_PX }}
              />
            ))}

            {/* Current time line */}
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="h-[2px] bg-red-400/70 w-full relative">
                <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-400" />
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
                    isCurrentDay && "bg-primary/5"
                  )}
                >
                  {dayEvents.map((event) => {
                    const startMin = minutesFromMidnight(event.startedAt);
                    const durMin = displayDuration(event);
                    const top = (startMin / (24 * 60)) * TOTAL_PX;
                    const height = Math.max(MIN_BLOCK_PX, (durMin / (24 * 60)) * TOTAL_PX);
                    const color = TYPE_COLORS_WEEKLY[event.type] ?? "bg-purple-400/75";

                    return (
                      <div
                        key={event.id}
                        className={cn("absolute inset-x-[2px] rounded-sm", color)}
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

// ─── Daily Timeline (vertical activity feed) ─────────────────────────────────

type EventAccent = {
  dotCls: string;
  barCls: string;
  endDotCls: string;
  cardCls: string;
};

const EVENT_ACCENT: Record<string, EventAccent> = {
  sleep: {
    dotCls: "border-indigo-400 bg-indigo-500/15",
    barCls: "bg-indigo-400/45",
    endDotCls: "bg-indigo-400/30",
    cardCls: "bg-indigo-500/10 border-indigo-400/25",
  },
  feeding: {
    dotCls: "border-sky-400 bg-sky-400/15",
    barCls: "bg-sky-400/45",
    endDotCls: "bg-sky-400/30",
    cardCls: "bg-sky-400/10 border-sky-400/25",
  },
  diaper: {
    dotCls: "bg-amber-400",
    barCls: "",
    endDotCls: "",
    cardCls: "bg-amber-400/10 border-amber-400/25",
  },
  bath: {
    dotCls: "bg-teal-400",
    barCls: "",
    endDotCls: "",
    cardCls: "bg-teal-400/10 border-teal-400/25",
  },
  vitamin_d: {
    dotCls: "bg-purple-400",
    barCls: "",
    endDotCls: "",
    cardCls: "bg-purple-400/10 border-purple-400/25",
  },
  medication: {
    dotCls: "bg-rose-400",
    barCls: "",
    endDotCls: "",
    cardCls: "bg-rose-400/10 border-rose-400/25",
  },
};

function TimelineEventRow({
  event,
  lang,
  isLast,
}: {
  event: EventItem;
  lang: "he" | "ru";
  isLast: boolean;
}) {
  const isDiaper = event.type === "diaper";
  const durMin = event.durationMinutes ?? 0;
  const hasDuration = !isDiaper && durMin > 5;
  const barHeight = hasDuration ? Math.max(10, Math.min(52, Math.round(durMin * 0.65))) : 0;
  const accent = EVENT_ACCENT[event.type] ?? EVENT_ACCENT.feeding;

  const label =
    event.type === "feeding"
      ? tr("feeding", lang)
      : event.type === "sleep"
        ? event.isActive
          ? tr("sleepingNow", lang)
          : tr("sleep", lang)
        : event.type === "bath"
          ? tr("bath", lang)
          : event.type === "vitamin_d"
            ? tr("vitamin_d", lang)
            : event.type === "medication"
              ? tr("medication", lang)
              : event.diaperType === "pee"
                ? tr("pee", lang)
                : event.diaperType === "poop"
                  ? tr("poop", lang)
                  : event.diaperType === "both"
                    ? tr("both", lang)
                    : tr("diaper", lang);

  const subParts: string[] = [];
  if (event.type === "feeding") {
    if (event.amountMl) subParts.push(tr("feedingAmount", lang, event.amountMl));
    if (event.durationMinutes) subParts.push(tr("feedingDuration", lang, event.durationMinutes));
  }
  if (event.type === "sleep" && !event.isActive && durMin) {
    subParts.push(tr("sleepDuration", lang, Math.floor(durMin / 60), durMin % 60));
  }

  return (
    <div className="flex">
      {/* Time column */}
      <div className="w-11 shrink-0 flex flex-col items-end pt-1 pr-2">
        <span className="text-[10px] text-muted-foreground/65 font-mono leading-none">
          {format(new Date(event.startedAt), "HH:mm")}
        </span>
        {event.endedAt && !isDiaper && (
          <span className="text-[9px] text-muted-foreground/40 font-mono leading-none mt-0.5">
            {format(new Date(event.endedAt), "HH:mm")}
          </span>
        )}
      </div>

      {/* Marker + spine column */}
      <div className="w-5 shrink-0 flex flex-col items-center">
        {isDiaper ? (
          <div className={cn("mt-1.5 shrink-0 w-2.5 h-2.5 rounded-full", accent.dotCls)} />
        ) : (
          <>
            <div className={cn("mt-1 shrink-0 w-3.5 h-3.5 rounded-full border-2", accent.dotCls)} />
            {hasDuration && (
              <div
                className={cn("shrink-0 w-1 rounded-full mt-0.5", accent.barCls)}
                style={{ height: barHeight }}
              />
            )}
            {hasDuration && (
              <div className={cn("shrink-0 w-2 h-2 rounded-full", accent.endDotCls)} />
            )}
          </>
        )}
        {/* Spine connecting to next event */}
        {!isLast && <div className="flex-1 w-px bg-border/30 mt-1 min-h-[10px]" />}
      </div>

      {/* Content card + bottom spacing */}
      <div className={cn("flex-1 min-w-0 pl-3", isLast ? "pb-2" : "pb-4")}>
        <div className={cn("rounded-2xl px-3 py-2 border", accent.cardCls)}>
          <div className="font-semibold text-sm leading-snug">{label}</div>
          {(subParts.length > 0 || event.notes) && (
            <div className="text-xs text-muted-foreground/75 mt-0.5 leading-snug">
              {subParts.join(" · ")}
              {subParts.length > 0 && event.notes ? " · " : ""}
              {event.notes ?? ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DailyTimeline({ events, lang }: { events: EventItem[]; lang: "he" | "ru" }) {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  const todayEvents = events
    .filter((e) => format(new Date(e.startedAt), "yyyy-MM-dd") === todayStr)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  const feedCount = todayEvents.filter((e) => e.type === "feeding").length;
  const feedMl = todayEvents.filter((e) => e.type === "feeding").reduce((s, e) => s + (e.amountMl ?? 0), 0);
  const sleepMin = todayEvents.filter((e) => e.type === "sleep").reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
  const diaperCount = todayEvents.filter((e) => e.type === "diaper").length;

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 shrink-0">
        <div className="bg-sky-400/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{feedCount}</div>
          <div className="text-[10px] text-muted-foreground">{tr("feeding", lang)}</div>
          {feedMl > 0 && <div className="text-[10px] font-semibold text-sky-500/80">{feedMl} מ"ל</div>}
        </div>
        <div className="bg-indigo-500/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {tr("sleepGoalDuration", lang, Math.floor(sleepMin / 60), sleepMin % 60)}
          </div>
          <div className="text-[10px] text-muted-foreground">{tr("sleep", lang)}</div>
        </div>
        <div className="bg-amber-400/10 rounded-2xl p-3 text-center">
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{diaperCount}</div>
          <div className="text-[10px] text-muted-foreground">{tr("diaper", lang)}</div>
        </div>
      </div>

      {/* Vertical timeline feed */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {todayEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            {tr("noEventsToday", lang)}
          </div>
        ) : (
          todayEvents.map((event, index) => (
            <TimelineEventRow
              key={event.id}
              event={event}
              lang={lang}
              isLast={index === todayEvents.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────
function Legend({ lang }: { lang: "he" | "ru" }) {
  return (
    <div className="flex justify-center gap-4 py-2 shrink-0">
      {[
        { color: "bg-sky-400", label: tr("feeding", lang) },
        { color: "bg-indigo-400", label: tr("sleep", lang) },
        { color: "bg-amber-400", label: tr("diaper", lang) },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={cn("w-2.5 h-2.5 rounded-sm", color)} />
          <span className="text-[10px] text-muted-foreground/75 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Schedule Page ────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { lang, dir } = useLanguage();
  const [tab, setTab] = useState<"weekly" | "daily">("daily");

  const today = new Date();
  const endDate = format(today, "yyyy-MM-dd");
  const startDate = format(subDays(today, 6), "yyyy-MM-dd");

  const days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(today, 6 - i)));

  const { data: events = [], isLoading } = useListEventsRange(
    { startDate, endDate },
    { query: { queryKey: getListEventsRangeQueryKey({ startDate, endDate }) } }
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-transparent" dir={dir}>
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
            <WeeklyGrid events={events as EventItem[]} days={days} lang={lang} dir={dir} />
          ) : (
            <DailyTimeline events={events as EventItem[]} lang={lang} />
          )}
        </div>
      )}
    </div>
  );
}
