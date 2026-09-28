import { useState } from "react";
import { useLocation } from "wouter";
import { useLogSolids } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { format } from "date-fns";
import { Carrot, Minus, Plus, X } from "lucide-react";

// A clock-time later than now must mean yesterday (e.g. logging 23:30 at 1am).
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

const TSP_STEP = 0.5;
const TSP_MAX = 20;

export default function SolidsPage() {
  const [, setLocation] = useLocation();
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [foodType, setFoodType] = useState("");
  const [tsp, setTsp] = useState(1);
  const [saveError, setSaveError] = useState<string | null>(null);

  const logSolids = useLogSolids({
    mutation: {
      onSuccess: () => {
        setSaveError(null);
        setLocation("/");
      },
      onError: (err: unknown) => {
        setSaveError((err as { message?: string })?.message ?? String(err));
      },
    },
  });

  const canSave = foodType.trim().length > 0 && !logSolids.isPending;

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="טעימות" russianTitle="Прикорм" showBack />

      <div className="p-4 max-w-md mx-auto space-y-5 mt-2">
        <div className="bg-orange-400/10 border-2 border-orange-400/40 rounded-3xl p-8 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-orange-400/20 flex items-center justify-center">
            <Carrot className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-orange-600 dark:text-orange-400 font-semibold text-lg">
            {lang === "he" ? "רישום טעימה 🥄" : "Запись прикорма 🥄"}
          </p>
        </div>

        {/* Time */}
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

        {/* Food type */}
        <div className="bg-card border border-border rounded-3xl p-4">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {tr("foodType", lang)}
          </label>
          <Input
            value={foodType}
            onChange={(e) => setFoodType(e.target.value)}
            placeholder={tr("foodTypePlaceholder", lang)}
            className="h-12 text-base border-border bg-background"
            autoFocus
          />
        </div>

        {/* Teaspoons */}
        <div className="bg-card border border-border rounded-3xl p-4">
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            {tr("teaspoons", lang)}
          </label>
          <div className="flex items-center justify-between gap-3" dir="ltr">
            <button
              onClick={() => setTsp((v) => Math.max(TSP_STEP, v - TSP_STEP))}
              disabled={tsp <= TSP_STEP}
              className="w-14 h-14 rounded-2xl bg-orange-400/15 text-orange-600 dark:text-orange-400 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            >
              <Minus className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-4xl font-bold tabular-nums">{tsp}</span>
              <span className="text-sm text-muted-foreground ms-2">{tr("tspUnit", lang)}</span>
            </div>
            <button
              onClick={() => setTsp((v) => Math.min(TSP_MAX, v + TSP_STEP))}
              disabled={tsp >= TSP_MAX}
              className="w-14 h-14 rounded-2xl bg-orange-400/15 text-orange-600 dark:text-orange-400 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-2xl p-3 text-center">
            {saveError}
          </div>
        )}

        <Button
          onClick={() => {
            setSaveError(null);
            logSolids.mutate({
              data: {
                foodType: foodType.trim(),
                amountTsp: tsp,
                startedAt: timeToTodayISO(time),
                loggedBy: name ?? null,
              },
            });
          }}
          disabled={!canSave}
          className="w-full h-16 text-lg font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-400/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {logSolids.isPending ? "..." : tr("saveSolids", lang)}
        </Button>
      </div>
    </div>
  );
}
