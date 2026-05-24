import { useState } from "react";
import { useLocation } from "wouter";
import { useLogDiaper, getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const VITAMIN_D_KEY = "vitamin-d-remind";
const notifyVitaminD = () => window.dispatchEvent(new Event("vitamin-d-remind-change"));

function timeToTodayISO(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h!, m!, 0, 0);
  return d.toISOString();
}

export default function DiaperPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const [diaperType, setDiaperType] = useState<"pee" | "poop" | "both" | null>(null);
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [notes, setNotes] = useState("");
  const [showVitaminD, setShowVitaminD] = useState(false);

  const logDiaper = useLogDiaper({
    mutation: {
      onSuccess: () => {
        const today = format(new Date(), "yyyy-MM-dd");
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
        if (new Date().getHours() >= 18) {
          setShowVitaminD(true);
        } else {
          setLocation("/");
        }
      },
    },
  });

  const togglePee = () =>
    setDiaperType((d) => d === "pee" ? null : d === "poop" ? "both" : d === "both" ? "poop" : "pee");
  const togglePoop = () =>
    setDiaperType((d) => d === "poop" ? null : d === "pee" ? "both" : d === "both" ? "pee" : "poop");

  return (
    <div className="min-h-[100dvh] bg-background pb-32" dir={dir}>
      <PageHeader hebrewTitle="טיטול" russianTitle="Подгузник" showBack />

      <div className="p-4 max-w-md mx-auto space-y-5 mt-2">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            data-testid="button-diaper-pee"
            onClick={togglePee}
            className={cn(
              "h-32 rounded-3xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 font-bold text-3xl",
              diaperType === "pee" || diaperType === "both"
                ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400"
                : "bg-card border-border text-muted-foreground"
            )}
          >
            {tr("pee", lang)}
          </button>

          <button
            type="button"
            data-testid="button-diaper-poop"
            onClick={togglePoop}
            className={cn(
              "h-32 rounded-3xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 font-bold text-3xl",
              diaperType === "poop" || diaperType === "both"
                ? "bg-orange-800/20 border-orange-800 text-orange-900 dark:text-orange-500"
                : "bg-card border-border text-muted-foreground"
            )}
          >
            {tr("poop", lang)}
          </button>
        </div>

        {/* Time picker */}
        <div className="bg-card border border-border rounded-3xl p-4">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {tr("time", lang)}
          </label>
          <div className="flex gap-2">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 h-12 text-base border-border bg-background"
              data-testid="input-diaper-time"
            />
            <button
              onClick={() => setTime(format(new Date(), "HH:mm"))}
              className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">{tr("notesOptional", lang)}</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tr("exDiaperNotes", lang)}
            className="resize-none h-24 bg-card border-border"
            data-testid="input-diaper-notes"
          />
        </div>

        <Button
          onClick={() => {
            if (!diaperType) return;
            logDiaper.mutate({ data: { diaperType, notes: notes || undefined, startedAt: timeToTodayISO(time), loggedBy: name ?? null } });
          }}
          disabled={logDiaper.isPending || !diaperType}
          data-testid="button-save-diaper"
          className="w-full h-16 text-lg font-bold rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-500/20 active:scale-95 transition-transform"
        >
          {tr("saveDiaper", lang)}
        </Button>
      </div>

      {/* Vitamin D Reminder Overlay */}
      {showVitaminD && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl" dir={dir}>
            <div className="text-5xl mb-3">💊</div>
            <h2 className="text-lg font-bold mb-2">{tr("vitaminDTitle", lang)}</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {tr("vitaminDBody", lang)}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  localStorage.removeItem(VITAMIN_D_KEY);
                  notifyVitaminD();
                  setLocation("/");
                }}
                className="w-full h-12 rounded-2xl font-bold"
              >
                {tr("vitaminDGave", lang)}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem(VITAMIN_D_KEY, "true");
                  notifyVitaminD();
                  setLocation("/");
                }}
                className="w-full h-12 rounded-2xl font-bold"
              >
                {tr("vitaminDRemindLater", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
