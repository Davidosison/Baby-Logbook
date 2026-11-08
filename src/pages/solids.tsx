import { useMemo, useState } from "react";
import { useLocation, useSearchParams } from "wouter";
import { useLogSolids, useListSolids } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { FoodPicker } from "@/components/food-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Heart, Minus, Plus, X } from "lucide-react";
import {
  REACTIONS, SYMPTOMS, type Reaction, type Symptom,
  foodsOf, foodName, foodEmoji, mealKey, computeFoodStats,
} from "@/lib/foods";

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

type MealPreset = { key: string; foods: string[]; tsp: number | null };

export default function SolidsPage() {
  const [, setLocation] = useLocation();
  const [search] = useSearchParams();
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [foods, setFoods] = useState<string[]>(() => search.get("foods")?.split(",").filter(Boolean) ?? []);
  const [tsp, setTsp] = useState(() => Number(search.get("tsp")) || 1);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: history } = useListSolids();
  const tried = useMemo(() => new Set(computeFoodStats(history ?? []).keys()), [history]);

  const { recent, favorites } = useMemo(() => {
    const recent: MealPreset[] = [];
    const favorites: MealPreset[] = [];
    const seenRecent = new Set<string>();
    const seenFav = new Set<string>();
    for (const e of history ?? []) {
      const f = foodsOf(e);
      if (!f.length) continue;
      const key = mealKey(f);
      if (e.isFavorite && !seenFav.has(key)) {
        seenFav.add(key);
        favorites.push({ key, foods: f, tsp: e.amountTsp });
      }
      if (recent.length < 4 && !seenRecent.has(key)) {
        seenRecent.add(key);
        recent.push({ key, foods: f, tsp: e.amountTsp });
      }
    }
    return { recent: recent.filter((r) => !seenFav.has(r.key)), favorites };
  }, [history]);

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

  const applyPreset = (p: MealPreset) => {
    setFoods(p.foods);
    if (p.tsp) setTsp(p.tsp);
  };

  const presetLabel = (p: MealPreset) =>
    p.foods.map((k) => `${foodEmoji(k)} ${foodName(k, lang)}`).join(" + ");

  const canSave = foods.length > 0 && !logSolids.isPending;

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="טעימות" russianTitle="Прикорм" showBack />

      <div className="p-4 max-w-md mx-auto space-y-4 mt-1">
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

        {/* What he ate */}
        <div className="bg-card border border-border rounded-3xl p-4 space-y-3">
          <label className="block text-sm font-bold">{tr("whatDidHeEat", lang)}</label>

          {(favorites.length > 0 || recent.length > 0) && foods.length === 0 && (
            <div className="space-y-2">
              {favorites.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">❤️ {tr("favoriteMeals", lang)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {favorites.map((p) => (
                      <button key={p.key} type="button" onClick={() => applyPreset(p)}
                        className="min-h-8 py-1 px-3 text-start rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-xs font-medium active:scale-95 transition-transform">
                        {presetLabel(p)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recent.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">🔁 {tr("recentMeals", lang)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((p) => (
                      <button key={p.key} type="button" onClick={() => applyPreset(p)}
                        className="min-h-8 py-1 px-3 text-start rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs font-medium active:scale-95 transition-transform">
                        {presetLabel(p)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <FoodPicker value={foods} onChange={setFoods} lang={lang} tried={tried} />
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

        {/* Reaction */}
        <div className="bg-card border border-border rounded-3xl p-4 space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground">{tr("howDidItGo", lang)}</label>
          <div className="grid grid-cols-3 gap-2">
            {REACTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReaction((cur) => (cur === r.id ? null : r.id))}
                className={cn(
                  "h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95",
                  reaction === r.id ? "bg-orange-500/15 border-orange-400" : "bg-background border-border/60",
                )}
              >
                <span className="text-2xl leading-none">{r.emoji}</span>
                <span className="text-[11px] font-semibold">{r[lang]}</span>
              </button>
            ))}
          </div>
          <label className="block text-xs font-semibold text-muted-foreground pt-1">{tr("unusualReaction", lang)}</label>
          <div className="flex flex-wrap gap-1.5">
            {SYMPTOMS.map((s) => {
              const on = symptoms.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSymptoms((cur) => (on ? cur.filter((x) => x !== s.id) : [...cur, s.id]))}
                  className={cn(
                    "h-9 px-3 rounded-full border text-xs font-semibold transition-colors",
                    on
                      ? "bg-red-500/15 border-red-400 text-red-700 dark:text-red-300"
                      : "bg-background border-border text-muted-foreground",
                  )}
                >
                  {on ? "⚠️ " : ""}{s[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">{tr("notesOptional", lang)}</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tr("solidsNotesPlaceholder", lang)}
            className="resize-none h-20 bg-card border-border"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsFavorite((v) => !v)}
          className={cn(
            "w-full h-12 rounded-2xl border-2 flex items-center justify-center gap-2 font-semibold text-sm transition-colors",
            isFavorite
              ? "bg-rose-50 dark:bg-rose-900/20 border-rose-300 text-rose-600 dark:text-rose-300"
              : "bg-card border-border text-muted-foreground",
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
          {tr("saveAsFavorite", lang)}
        </button>

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
                foods,
                foodType: foods.map((k) => foodName(k, lang)).join(", "),
                amountTsp: tsp,
                reaction,
                symptoms,
                isFavorite,
                notes: notes.trim() || null,
                startedAt: timeToTodayISO(time),
                loggedBy: name ?? null,
              },
            });
          }}
          disabled={!canSave}
          className="w-full h-16 text-lg font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-400/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {logSolids.isPending ? "..." : foods.length === 0 ? tr("pickAtLeastOne", lang) : tr("saveSolids", lang)}
        </Button>
      </div>
    </div>
  );
}
