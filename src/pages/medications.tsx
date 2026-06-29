import { useState } from "react";
import { useLocation } from "wouter";
import { useLogMedication } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { Thermometer, X } from "lucide-react";

// If the entered clock-time is later in the day than right now, it hasn't happened yet
// today — it must refer to yesterday (e.g. logging a 23:30 dose at 3am the next morning).
function timeToTodayISO(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const entryMinutes = h! * 60 + m!;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const d = new Date(now);
  if (entryMinutes > nowMinutes) d.setDate(d.getDate() - 1);
  d.setHours(h!, m!, 0, 0);
  return d.toISOString();
}

export default function MedicationsPage() {
  const [, setLocation] = useLocation();
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const logMedication = useLogMedication({
    mutation: {
      onSuccess: () => {
        setSaveError(null);
        setLocation("/");
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message ?? String(err);
        setSaveError(msg);
        console.error("Medication save error:", err);
      },
    },
  });

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="תרופות" russianTitle="Лекарства" showBack />

      <div className="p-4 max-w-md mx-auto space-y-5 mt-2">

        {/* Hero icon */}
        <div className="bg-rose-400/10 border-2 border-rose-400/40 rounded-3xl p-8 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-rose-400/20 flex items-center justify-center">
            <Thermometer className="w-10 h-10 text-rose-400" />
          </div>
          <p className="text-rose-600 dark:text-rose-400 font-semibold text-lg">
            {lang === "he" ? "רישום תרופה 💊" : "Запись лекарства 💊"}
          </p>
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
            />
            <button
              onClick={() => setTime(format(new Date(), "HH:mm"))}
              className="h-12 w-12 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-transform shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {tr("medicationNotes", lang)}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tr("medicationNotesPlaceholder", lang)}
            className="resize-none h-24 bg-card border-border"
            autoFocus
          />
        </div>

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-2xl p-3 text-center">
            {saveError}
          </div>
        )}

        <Button
          onClick={() => {
            setSaveError(null);
            logMedication.mutate({
              data: {
                notes: notes || undefined,
                startedAt: timeToTodayISO(time),
                loggedBy: name ?? null,
              },
            });
          }}
          disabled={logMedication.isPending}
          className="w-full h-16 text-lg font-bold rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-400/20 active:scale-95 transition-transform"
        >
          {logMedication.isPending ? "..." : tr("saveMedication", lang)}
        </Button>
      </div>
    </div>
  );
}
