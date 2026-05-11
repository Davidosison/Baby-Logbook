import { useState } from "react";
import { useListEvents, getListEventsQueryKey, useDeleteEvent, useUpdateEvent, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format, isToday, isYesterday } from "date-fns";
import { he, ru } from "date-fns/locale";
import { Droplet, Moon, Utensils, Trash2, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
};

function EventIcon({ type, className }: { type: string; className?: string }) {
  if (type === "feeding") return <Utensils className={cn("w-5 h-5", className)} />;
  if (type === "sleep") return <Moon className={cn("w-5 h-5", className)} />;
  if (type === "diaper") return <Droplet className={cn("w-5 h-5", className)} />;
  return null;
}

function EditSheet({
  event,
  open,
  onClose,
  onSave,
  lang,
  dir,
}: {
  event: EventItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, data: any) => void;
  lang: "he" | "ru";
  dir: "rtl" | "ltr";
}) {
  const [amountMl, setAmountMl] = useState(event?.amountMl?.toString() ?? "");
  const [startTime, setStartTime] = useState(event ? format(new Date(event.startedAt), "HH:mm") : "");
  const [endTime, setEndTime] = useState(event?.endedAt ? format(new Date(event.endedAt), "HH:mm") : "");
  const [diaperType, setDiaperType] = useState<"pee" | "poop" | "both" | "">(
    (event?.diaperType as any) ?? ""
  );
  const [notes, setNotes] = useState(event?.notes ?? "");

  if (!event) return null;

  function toTodayISO(timeStr: string, baseISO: string): string {
    const base = new Date(baseISO);
    const [h, m] = timeStr.split(":").map(Number);
    base.setHours(h!, m!, 0, 0);
    return base.toISOString();
  }

  const handleSave = () => {
    const data: any = { notes: notes || null };
    if (event.type === "feeding") {
      if (amountMl) data.amountMl = parseInt(amountMl);
      if (startTime) data.startedAt = toTodayISO(startTime, event.startedAt);
      if (endTime) data.endedAt = toTodayISO(endTime, event.startedAt);
    }
    if (event.type === "sleep") {
      if (startTime) data.startedAt = toTodayISO(startTime, event.startedAt);
      if (endTime) data.endedAt = toTodayISO(endTime, event.startedAt);
    }
    if (event.type === "diaper" && diaperType) {
      data.diaperType = diaperType;
    }
    onSave(event.id, data);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[2rem] bg-card border-border p-6 max-h-[80vh] overflow-y-auto" dir={dir}>
        <SheetHeader className="mb-5">
          <SheetTitle className="text-xl font-bold">{tr("editEvent", lang)}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Feeding fields */}
          {event.type === "feeding" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("startTime", lang)}</label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-12 bg-background" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("endTime", lang)}</label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-12 bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("amountMl", lang)}</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={amountMl}
                  onChange={(e) => setAmountMl(e.target.value)}
                  placeholder={tr("exAmount", lang)}
                  className="h-12 bg-background"
                />
              </div>
            </>
          )}

          {/* Sleep fields */}
          {event.type === "sleep" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("startTime", lang)}</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-12 bg-background" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("endTime", lang)}</label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-12 bg-background" />
              </div>
            </div>
          )}

          {/* Diaper fields */}
          {event.type === "diaper" && (
            <div className="grid grid-cols-3 gap-2">
              {(["pee", "poop", "both"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDiaperType(t)}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold transition-all",
                    diaperType === t
                      ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400"
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
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{tr("notesOptional", lang)}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20 bg-background"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-14 text-base font-bold rounded-2xl"
          >
            {tr("saveChanges", lang)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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

  // Group by date, latest date first
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
        {isLoading && (
          <div className="text-center text-muted-foreground py-8 animate-pulse">{tr("loadingHistory", lang)}</div>
        )}
        {!isLoading && events?.length === 0 && (
          <div className="text-center text-muted-foreground py-12">{tr("noEvents", lang)}</div>
        )}

        {sortedDates.map((date) => (
          <div key={date} className="space-y-3">
            <h3 className="font-semibold text-lg sticky top-20 bg-background/95 backdrop-blur py-2 z-10 text-start">
              {dateHeading(date)}
            </h3>

            <div className="space-y-3">
              {groupedEvents![date]!.map((event) => (
                <div
                  key={event.id}
                  data-testid={`history-event-${event.id}`}
                  className="flex gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm items-center"
                  dir={dir}
                >
                  {/* Icon — inline-start (right in RTL) */}
                  <div
                    className={cn(
                      "w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-background border border-border",
                      event.type === "feeding" && "text-blue-500",
                      event.type === "sleep" && "text-purple-500",
                      event.type === "diaper" && "text-amber-500",
                    )}
                  >
                    <EventIcon type={event.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5" dir={dir}>
                      <span className="text-xs text-muted-foreground font-medium shrink-0">
                        {format(new Date(event.startedAt), "HH:mm")}
                        {event.endedAt ? ` – ${format(new Date(event.endedAt), "HH:mm")}` : ""}
                      </span>
                      <span className="font-semibold">{typeLabel(event.type)}</span>
                    </div>
                    <div className={cn("text-sm text-muted-foreground truncate", dir === "rtl" ? "text-right" : "text-left")}>
                      {event.type === "feeding" && (
                        <>
                          {event.amountMl ? tr("feedingAmount", lang, event.amountMl) : ""}
                          {event.amountMl && event.durationMinutes ? " · " : ""}
                          {event.durationMinutes ? tr("feedingDuration", lang, event.durationMinutes) : ""}
                        </>
                      )}
                      {event.type === "sleep" && (
                        <>
                          {event.isActive
                            ? tr("sleepingShort", lang)
                            : event.durationMinutes
                            ? tr("sleepDuration", lang, Math.floor(event.durationMinutes / 60), event.durationMinutes % 60)
                            : ""}
                        </>
                      )}
                      {event.type === "diaper" && <span>{diaperLabel(event.diaperType)}</span>}
                    </div>
                    {event.notes && (
                      <div className={cn("text-xs text-muted-foreground/70 italic mt-0.5 truncate", dir === "rtl" ? "text-right" : "text-left")}>
                        {event.notes}
                      </div>
                    )}
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditEvent(event as EventItem)}
                    data-testid={`button-edit-${event.id}`}
                    className="w-9 h-9 shrink-0 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteId(event.id)}
                    data-testid={`button-delete-${event.id}`}
                    className="w-9 h-9 shrink-0 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Sheet */}
      <EditSheet
        event={editEvent}
        open={editEvent !== null}
        onClose={() => setEditEvent(null)}
        onSave={(id, data) => updateEventMutation.mutate({ id, data })}
        lang={lang}
        dir={dir}
      />

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
