import { useState } from "react";
import { useLocation } from "wouter";
import { useLogDiaper, getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function DiaperPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const [diaperType, setDiaperType] = useState<"pee" | "poop" | "both" | null>(null);
  const [notes, setNotes] = useState("");

  const logDiaper = useLogDiaper({
    mutation: {
      onSuccess: () => {
        const today = format(new Date(), "yyyy-MM-dd");
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
        setLocation("/");
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
            logDiaper.mutate({ data: { diaperType, notes: notes || undefined, startedAt: new Date().toISOString() } });
          }}
          disabled={logDiaper.isPending || !diaperType}
          data-testid="button-save-diaper"
          className="w-full h-16 text-lg font-bold rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-500/20 active:scale-95 transition-transform"
        >
          {tr("saveDiaper", lang)}
        </Button>
      </div>
    </div>
  );
}
