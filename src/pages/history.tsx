import { useState } from "react";
import {
  useListEvents, getListEventsQueryKey,
  useDeleteEvent, useUpdateEvent,
  useListEventsRange, getListEventsRangeQueryKey,
  getGetRecentActivityQueryKey, getGetDailySummaryQueryKey,
} from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format, isToday, isYesterday, subDays, startOfDay, endOfDay } from "date-fns";
import { he, ru } from "date-fns/locale";
import { Droplet, Moon, Utensils, Trash2, Pencil, BarChart2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type EventItem = {
  id: number;
  type: string;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes?: number | null;
  amountMl?: number | null;
  diaperType?: string | null;
  notes?: string | null;
  isActive: boolean;
  loggedBy?: string | null;
};

function EventIcon({ type, className }: { type: string; className?: string }) {
  if (type === "feeding") return <Utensils className={cn("w-4 h-4", className)} />;
  if (type === "sleep") return <Moon className={cn("w-4 h-4", className)} />;
  if (type === "diaper") return <Droplet className={cn("w-4 h-4", className)} />;
  if (type === "bath") return <span className={cn("text-sm leading-none", className)}>🛁</span>;
  if (type === "vitamin_d") return <span className={cn("text-sm leading-none", className)}>💊</span>;
  return null;
}

// Isolated edit sheet — always remounted via key prop, so state is always fresh
function EditSheet({
  event,
  onClose,
  onSave,
  lang,
  dir,
}: {
  event: EventItem;
  onClose: () => void;
  onSave: (id: number, data: Record<string, unknown>) => void;
  lang: "he" | "ru";
  dir: "rtl" | "ltr";
}) {
  const [amountMl, setAmountMl] = useState(event.amountMl?.toString() ?? "");
  const [startTime, setStartTime] = useState(format(new Date(event.startedAt), "HH:mm"));
  const [endTime, setEndTime] = useState(event.endedAt ? format(new Date(event.endedAt), "HH:mm") : "");
  const [diaperType, setDiaperType] = useState<"pee" | "poop" | "both">(
    (event.diaperType as "pee" | "poop" | "both") ?? "pee"
  );
  const [notes, setNotes] = useState(event.notes ?? "");

  function applyTime(timeStr: string, baseISO: string): string {
    const base = new Date(baseISO);
    const [h, m] = timeStr.split(":").map(Number);
    base.setHours(h!, m!, 0, 0);
    return base.toISOString();
  }

  const handleSave = () => {
    const data: Record<string, unknown> = { notes: notes || null };

    if (event.type === "feeding") {
      data.amountMl = amountMl ? parseInt(amountMl) : null;
      data.startedAt = applyTime(startTime, event.startedAt);
      if (endTime) data.endedAt = applyTime(endTime, event.startedAt);
    }
    if (event.type === "sleep") {
      data.startedAt = applyTime(startTime, event.startedAt);
      if (endTime) data.endedAt = applyTime(endTime, event.startedAt);
    }
    if (event.type === "diaper") {
      data.diaperType = diaperType;
    }

    onSave(event.id, data);
  };

  const canSave =
    event.type === "feeding" ? true
    : event.type === "sleep" ? !!startTime
    : event.type === "diaper" ? !!diaperType
    : true;

  return (
    <SheetContent
      side="bottom"
      className="rounded-t-[2rem] bg-card border-border p-6 max-h-[85vh] overflow-y-auto"
      dir={dir}
    >
      <SheetHeader className="mb-5">
        <SheetTitle className="text-xl font-bold text-center">{tr("editEvent", lang)}</SheetTitle>
      </SheetHeader>

      <div className="space-y-4">
        {/* Feeding */}
        {event.type === "feeding" && (
          <>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  {tr("startTime", lang)}
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-12 border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  {tr("endTime", lang)}
                </label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-12 border-border bg-background"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                {tr("amountMl", lang)}
              </label>
              <Input
                type="number"
                inputMode="numeric"
                value={amountMl}
                onChange={(e) => setAmountMl(e.target.value)}
                placeholder={tr("exAmount", lang)}
                className="h-12 border-border bg-background"
              />
            </div>
          </>
        )}

        {/* Sleep */}
        {event.type === "sleep" && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                {tr("startTime", lang)}
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-12 border-border bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                {tr("endTime", lang)}
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-12 border-border bg-background"
              />
            </div>
          </div>
        )}

        {/* Diaper */}
        {event.type === "diaper" && (
          <div className="grid grid-cols-3 gap-2">
            {(["pee", "poop", "both"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDiaperType(t)}
                className={cn(
                  "h-14 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95",
                  diaperType === t
                    ? "bg-amber-400/20 border-amber-400 text-amber-700 dark:text-amber-400"
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                {tr(t, lang)}
              </button>
            ))}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            {tr("notesOptional", lang)}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none h-20 border-border bg-background"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full h-14 text-base font-bold rounded-2xl"
        >
          {tr("saveChanges", lang)}
        </Button>
      </div>
    </SheetContent>
  );
}

function WeeklyStats({ lang, dir }: { lang: "he" | "ru"; dir: "rtl" | "ltr" }) {
  const today = new Date();
  const startDate = format(subDays(today, 6), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");
  const dateLocale = lang === "he" ? he : ru;

  const { data: events } = useListEventsRange(
    { startDate, endDate },
    { query: { queryKey: getListEventsRangeQueryKey({ startDate, endDate }) } },
  );

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dayEvents = events?.filter((e) => format(new Date(e.startedAt), "yyyy-MM-dd") === dateStr) ?? [];
    const sleepMin = dayEvents.filter((e) => e.type === "sleep").reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
    const feedingMl = dayEvents.filter((e) => e.type === "feeding").reduce((s, e) => s + (e.amountMl ?? 0), 0);
    return {
      label: format(d, "EEE", { locale: dateLocale }),
      isToday: i === 6,
      feedingMl,
      sleepLabel: sleepMin === 0 ? "—" : `${Math.floor(sleepMin / 60)}:${String(sleepMin % 60).padStart(2, "0")}`,
      diapers: dayEvents.filter((e) => e.type === "diaper").length,
    };
  });

  const rows = [
    {
      icon: <Utensils className="w-3 h-3" />,
      color: "text-sky-400",
      values: days.map((d) => ({ val: d.feedingMl === 0 ? "—" : `${d.feedingMl}`, isToday: d.isToday })),
    },
    {
      icon: <Moon className="w-3 h-3" />,
      color: "text-indigo-400",
      values: days.map((d) => ({ val: d.sleepLabel, isToday: d.isToday })),
    },
    {
      icon: <Droplet className="w-3 h-3" />,
      color: "text-amber-400",
      values: days.map((d) => ({ val: d.diapers === 0 ? "—" : String(d.diapers), isToday: d.isToday })),
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-4 shadow-sm" dir={dir}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">{lang === "he" ? "7 ימים אחרונים" : "7 последних дней"}</h3>
        </div>
        <span className="text-[10px] text-muted-foreground/60">{lang === "he" ? "🍼 = מ״ל | 😴 = שעות | 🧷 = מספר" : "🍼 = мл | 😴 = часы | 🧷 = кол-во"}</span>
      </div>

      {/* Table */}
      <div className="grid grid-cols-[20px_repeat(7,1fr)] gap-y-1">
        {/* Header: day labels */}
        <div />
        {days.map((d, i) => (
          <div
            key={i}
            className={cn(
              "text-center text-[10px] font-semibold pb-1.5",
              d.isToday ? "text-primary" : "text-muted-foreground/60",
            )}
          >
            {d.label}
          </div>
        ))}

        {/* Data rows */}
        {rows.map((row, ri) => (
          <>
            <div key={`icon-${ri}`} className={cn("flex items-center justify-center", row.color)}>
              {row.icon}
            </div>
            {row.values.map((cell, ci) => (
              <div
                key={ci}
                className={cn(
                  "text-center text-[11px] font-semibold py-1 rounded-lg",
                  cell.isToday
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {cell.val}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const dateLocale = lang === "he" ? he : ru;

  const { data: events, isLoading } = useListEvents(
    { limit: 200 },
    { query: { queryKey: getListEventsQueryKey({ limit: 200 }) } },
  );

  const deleteEventMutation = useDeleteEvent({
    mutation: {
      onSuccess: () => {
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey() });
      },
    },
  });

  const updateEventMutation = useUpdateEvent({
    mutation: {
      onSuccess: () => {
        setEditEvent(null);
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey() });
      },
    },
  });

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

  const dateHeading = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    if (isToday(d)) return tr("today", lang);
    if (isYesterday(d)) return tr("yesterday", lang);
    return format(d, lang === "he" ? "EEEE, d בMMMM" : "EEEE, d MMMM", { locale: dateLocale });
  };

  const groupedEvents = events?.reduce(
    (acc, event) => {
      const date = format(new Date(event.startedAt), "yyyy-MM-dd");
      if (!acc[date]) acc[date] = [];
      acc[date]!.push(event);
      return acc;
    },
    {} as Record<string, typeof events>,
  );

  const sortedDates = groupedEvents
    ? Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a))
    : [];

  return (
    <div className="min-h-[100dvh] bg-background pb-32" dir={dir}>
      <PageHeader hebrewTitle="היסטוריה" russianTitle="История" />

      <div className="p-4 space-y-8">
        <WeeklyStats lang={lang} dir={dir} />

        {isLoading && (
          <div className="text-center text-muted-foreground py-8 animate-pulse">
            {tr("loadingHistory", lang)}
          </div>
        )}
        {!isLoading && events?.length === 0 && (
          <div className="text-center text-muted-foreground py-12">{tr("noEvents", lang)}</div>
        )}

        {sortedDates.map((date) => (
          <div key={date} className="space-y-2">
            <h3 className="font-semibold text-base sticky top-20 bg-background/95 backdrop-blur py-2 z-10">
              {dateHeading(date)}
            </h3>

            <div className="space-y-2">
              {groupedEvents![date]!.map((event) => (
                <div
                  key={event.id}
                  data-testid={`history-event-${event.id}`}
                  className="flex gap-2 bg-card border border-border rounded-2xl px-3 py-3 shadow-sm items-center"
                  dir={dir}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-background border border-border",
                    event.type === "feeding" && "text-sky-400",
                    event.type === "sleep" && "text-indigo-400",
                    event.type === "diaper" && "text-amber-400",
                    event.type === "bath" && "text-teal-400",
                    event.type === "vitamin_d" && "text-purple-400",
                  )}>
                    <EventIcon type={event.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1" dir={dir}>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {format(new Date(event.startedAt), "HH:mm")}
                        {event.endedAt ? `–${format(new Date(event.endedAt), "HH:mm")}` : ""}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {event.loggedBy && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                            👤 {event.loggedBy}
                          </span>
                        )}
                        <span className="font-semibold text-sm">{typeLabel(event.type)}</span>
                      </div>
                    </div>
                    <div className={cn("text-xs text-muted-foreground truncate mt-0.5", dir === "rtl" ? "text-right" : "text-left")}>
                      {event.type === "feeding" && (
                        <>
                          {event.amountMl ? tr("feedingAmount", lang, event.amountMl) : ""}
                          {event.amountMl && event.durationMinutes ? " · " : ""}
                          {event.durationMinutes ? tr("feedingDuration", lang, event.durationMinutes) : ""}
                        </>
                      )}
                      {event.type === "sleep" && (event.isActive
                        ? tr("sleepingShort", lang)
                        : event.durationMinutes
                          ? tr("sleepDuration", lang, Math.floor(event.durationMinutes / 60), event.durationMinutes % 60)
                          : "")}
                      {event.type === "diaper" && diaperLabel(event.diaperType)}
                    </div>
                  </div>

                  {/* Edit */}
                  <button
                    onClick={() => setEditEvent(event as EventItem)}
                    data-testid={`button-edit-${event.id}`}
                    className="w-8 h-8 shrink-0 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteId(event.id)}
                    data-testid={`button-delete-${event.id}`}
                    className="w-8 h-8 shrink-0 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Sheet — key forces remount with fresh state for each event */}
      <Sheet open={editEvent !== null} onOpenChange={(open) => !open && setEditEvent(null)}>
        {editEvent && (
          <EditSheet
            key={editEvent.id}
            event={editEvent}
            onClose={() => setEditEvent(null)}
            onSave={(id, data) => updateEventMutation.mutate({ id, data: data as any })}
            lang={lang}
            dir={dir}
          />
        )}
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl" dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("deleteEvent", lang)}</AlertDialogTitle>
            <AlertDialogDescription>{tr("deleteConfirm", lang)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogAction
              onClick={() => deleteId && deleteEventMutation.mutate({ id: deleteId })}
              data-testid="button-confirm-delete"
              className="h-12 rounded-xl bg-destructive hover:bg-destructive text-destructive-foreground"
            >
              {tr("delete", lang)}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-12 rounded-xl">{tr("cancel", lang)}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
