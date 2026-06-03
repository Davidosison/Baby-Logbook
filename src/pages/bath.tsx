import { useState } from "react";
import { useLocation } from "wouter";
import { useLogBath, useLogVitaminD, getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Bath, X } from "lucide-react";

const VITAMIN_D_KEY = "vitamin-d-remind";
const VITAMIN_D_GIVEN_KEY = "vitamin-d-given";
const notifyVitaminD = () => window.dispatchEvent(new Event("vitamin-d-remind-change"));
const vitaminDGivenToday = () => localStorage.getItem(VITAMIN_D_GIVEN_KEY) === format(new Date(), "yyyy-MM-dd");
const markVitaminDGiven = () => localStorage.setItem(VITAMIN_D_GIVEN_KEY, format(new Date(), "yyyy-MM-dd"));

function timeToTodayISO(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h!, m!, 0, 0);
  return d.toISOString();
}

export default function BathPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [notes, setNotes] = useState("");
  const [showVitaminD, setShowVitaminD] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);

  const logVitaminD = useLogVitaminD();

  const logBath = useLogBath({
    mutation: {
      onSuccess: () => {
        setSaveError(null);
        const today = format(new Date(), "yyyy-MM-dd");
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
        if (new Date().getHours() >= 18 && !vitaminDGivenToday()) {
          setShowVitaminD(true);
        } else {
          setLocation("/");
        }
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message ?? String(err);
        setSaveError(msg);
        console.error("Bath save error:", err);
      },
    },
  });

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="מקלחת" russianTitle="Купание" showBack />

      <div className="p-4 max-w-md mx-auto space-y-5 mt-2">

        {/* Big bath icon tap target */}
        <div className="bg-teal-400/10 border-2 border-teal-400/40 rounded-3xl p-8 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-teal-400/20 flex items-center justify-center">
            <Bath className="w-10 h-10 text-teal-400" />
          </div>
          <p className="text-teal-600 dark:text-teal-400 font-semibold text-lg">
            {lang === "he" ? "מקלחת 🛁" : "Купание 🛁"}
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

        <div>
          <label className="block text-sm font-medium mb-2">{tr("notesOptional", lang)}</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tr("bathNotes", lang)}
            className="resize-none h-20 bg-card border-border"
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
            logBath.mutate({ data: { notes: notes || undefined, startedAt: timeToTodayISO(time), loggedBy: name ?? null } });
          }}
          disabled={logBath.isPending}
          className="w-full h-16 text-lg font-bold rounded-2xl bg-teal-500 hover:bg-teal-600 text-white shadow-xl shadow-teal-400/20 active:scale-95 transition-transform"
        >
          {logBath.isPending ? "..." : tr("saveBath", lang)}
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
                  logVitaminD.mutate({ loggedBy: name ?? null });
                  markVitaminDGiven();
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
