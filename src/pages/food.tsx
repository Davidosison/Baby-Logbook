import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useListSolids, useUpdateEvent } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useLanguage, type Language } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { he, ru } from "date-fns/locale";
import { Heart, Plus, RotateCcw, Search, X } from "lucide-react";
import type { Event } from "@/lib/supabase";
import {
  FOODS, FOOD_BY_ID, CATEGORIES, ALLERGEN_GROUPS, REACTIONS, SYMPTOMS, EXPOSURES_TARGET,
  type FoodStat, type Reaction,
  foodsOf, foodName, foodEmoji, tspLabel, computeFoodStats, computeAllergenProgress,
} from "@/lib/foods";

type Segment = "foods" | "allergens" | "meals";
type Filter = "all" | "tried" | "notTried";

function whenLabel(iso: string, lang: Language) {
  const d = new Date(iso);
  const t = format(d, "HH:mm");
  if (isToday(d)) return `${tr("today", lang)} ${t}`;
  if (isYesterday(d)) return `${tr("yesterday", lang)} ${t}`;
  return format(d, lang === "he" ? "d בMMMM, HH:mm" : "d MMMM, HH:mm", { locale: lang === "he" ? he : ru });
}

function topReaction(s: FoodStat | undefined): Reaction | null {
  if (!s) return null;
  const entries = Object.entries(s.reactions) as [Reaction, number][];
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0]![0];
}

function repeatHref(e: Event) {
  const foods = foodsOf(e).map(encodeURIComponent).join(",");
  return `/solids?foods=${foods}${e.amountTsp ? `&tsp=${e.amountTsp}` : ""}`;
}

export default function FoodPage() {
  const [, setLocation] = useLocation();
  const { lang, dir } = useLanguage();
  const [segment, setSegment] = useState<Segment>("foods");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openFood, setOpenFood] = useState<string | null>(null);

  const { data: solids, isLoading } = useListSolids();
  const updateEvent = useUpdateEvent();
  const events = solids ?? [];

  const stats = useMemo(() => computeFoodStats(events), [events]);
  const allergens = useMemo(() => computeAllergenProgress(events), [events]);
  const allergensDone = ALLERGEN_GROUPS.filter((g) => allergens[g.id].days >= EXPOSURES_TARGET).length;
  const customKeys = [...stats.keys()].filter((k) => !FOOD_BY_ID[k]);

  const q = query.trim().toLowerCase();
  const visible = (key: string) => {
    const tried = stats.has(key);
    if (filter === "tried" && !tried) return false;
    if (filter === "notTried" && tried) return false;
    if (!q) return true;
    const f = FOOD_BY_ID[key];
    const names = f ? [f.he, f.ru.toLowerCase(), ...(f.aliases ?? [])] : [key.toLowerCase()];
    return names.some((n) => n.includes(q));
  };

  const favorites = events.filter((e) => e.isFavorite);

  const renderTile = (key: string) => {
    const s = stats.get(key);
    const r = REACTIONS.find((x) => x.id === topReaction(s));
    return (
      <button
        key={key}
        onClick={() => setOpenFood(key)}
        className={cn(
          "relative h-[84px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1 px-1 transition-all active:scale-95",
          s ? "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800" : "bg-card border-border/50 opacity-70",
        )}
      >
        {s && (
          <span className="absolute top-1 end-1 min-w-4 h-4 px-1 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center">
            ×{s.count}
          </span>
        )}
        {r && <span className="absolute top-1 start-1 text-[11px] leading-none">{r.emoji}</span>}
        {s?.hadSymptoms && <span className="absolute bottom-1 start-1 text-[10px] leading-none">⚠️</span>}
        <span className={cn("text-2xl leading-none", !s && "grayscale-[40%]")}>{foodEmoji(key)}</span>
        <span className="text-[11px] font-medium leading-tight text-center line-clamp-2">{foodName(key, lang)}</span>
      </button>
    );
  };

  const openStat = openFood ? stats.get(openFood) : undefined;
  const openFoodDef = openFood ? FOOD_BY_ID[openFood] : undefined;
  const openGroup = openFoodDef?.allergen ? ALLERGEN_GROUPS.find((g) => g.id === openFoodDef.allergen) : undefined;
  const openEvents = openFood ? events.filter((e) => foodsOf(e).includes(openFood)).slice(0, 5) : [];

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="המזונות של אדם" russianTitle="Питание Адама" />

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Summary */}
        <div className="rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20 border border-orange-200/70 dark:border-orange-900/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {tr("foodsTried", lang, stats.size)}
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                {tr("allergensDone", lang, allergensDone, ALLERGEN_GROUPS.length)} ✓ · {events.length} {lang === "he" ? "טעימות" : "записей"}
              </p>
            </div>
            <span className="text-5xl">🥄</span>
          </div>
          <Link href="/solids">
            <button className="mt-3 w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Plus className="w-5 h-5" />
              {tr("newTasting", lang)}
            </button>
          </Link>
        </div>

        {/* Segments */}
        <div className="flex gap-1 bg-muted rounded-2xl p-1">
          {(["foods", "allergens", "meals"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              className={cn(
                "flex-1 h-9 rounded-xl text-sm font-semibold transition-all",
                segment === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {tr(s === "foods" ? "tabFoods" : s === "allergens" ? "tabAllergens" : "tabMeals", lang)}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground py-8 animate-pulse text-sm">{tr("loading", lang)}</div>
        )}

        {/* ── Foods ─────────────────────────────────────────────────────── */}
        {segment === "foods" && !isLoading && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr("searchFood", lang)}
                className="w-full h-11 rounded-2xl bg-card border border-border text-base ps-9 pe-9 outline-none focus:ring-2 focus:ring-orange-400/30"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              {([
                ["all", tr("filterAll", lang), FOODS.length + customKeys.length],
                ["tried", tr("filterTried", lang), stats.size],
                ["notTried", tr("filterNotTried", lang), FOODS.filter((f) => !stats.has(f.id)).length],
              ] as [Filter, string, number][]).map(([id, label, n]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={cn(
                    "h-8 px-3 rounded-full border text-xs font-semibold transition-colors",
                    filter === id
                      ? "bg-orange-500/15 border-orange-400 text-orange-700 dark:text-orange-300"
                      : "bg-card border-border text-muted-foreground",
                  )}
                >
                  {label} ({n})
                </button>
              ))}
            </div>

            {CATEGORIES.map((c) => {
              const keys = FOODS.filter((f) => f.category === c.id).map((f) => f.id).filter(visible);
              if (!keys.length) return null;
              const triedInCat = FOODS.filter((f) => f.category === c.id && stats.has(f.id)).length;
              const totalInCat = FOODS.filter((f) => f.category === c.id).length;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm">{c.emoji} {c[lang]}</h3>
                    <span className="text-[11px] text-muted-foreground">{triedInCat}/{totalInCat}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">{keys.map(renderTile)}</div>
                </div>
              );
            })}
            {customKeys.filter(visible).length > 0 && (
              <div>
                <h3 className="font-bold text-sm mb-2">🥄 {lang === "he" ? "עוד" : "Другое"}</h3>
                <div className="grid grid-cols-4 gap-2">{customKeys.filter(visible).map(renderTile)}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Allergens ─────────────────────────────────────────────────── */}
        {segment === "allergens" && !isLoading && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground px-1">{tr("exposuresNote", lang)}</p>
            {ALLERGEN_GROUPS.map((g) => {
              const p = allergens[g.id];
              const done = p.days >= EXPOSURES_TARGET;
              const groupFoods = FOODS.filter((f) => f.allergen === g.id);
              const chips = p.foods.length ? p.foods : groupFoods.map((f) => f.id);
              return (
                <div
                  key={g.id}
                  className={cn(
                    "rounded-3xl border p-4",
                    done ? "bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800" : "bg-card border-border/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{g.emoji}</span>
                      <span className="font-bold">{g[lang]}</span>
                      {p.hadSymptoms && <span title={tr("hadReactionWarning", lang)}>⚠️</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: EXPOSURES_TARGET }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                            i < p.days ? "bg-green-500 border-green-500 text-white" : "border-border text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className={cn("text-xs font-semibold mt-1.5", done ? "text-green-700 dark:text-green-400" : "text-muted-foreground")}>
                    {done ? tr("exposureStatusDone", lang) : p.days === 0 ? tr("exposureStatusNone", lang) : tr("exposureStatusProgress", lang, p.days)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {chips.map((k) => (
                      <button
                        key={k}
                        onClick={() => setLocation(`/solids?foods=${encodeURIComponent(k)}`)}
                        className={cn(
                          "h-8 px-2.5 rounded-full border text-xs font-medium active:scale-95 transition-transform",
                          p.foods.includes(k)
                            ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800"
                            : "bg-background border-border text-muted-foreground",
                        )}
                      >
                        {foodEmoji(k)} {foodName(k, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Meals ─────────────────────────────────────────────────────── */}
        {segment === "meals" && !isLoading && (
          <div className="space-y-3">
            {events.length === 0 && (
              <div className="text-center text-muted-foreground py-8 card-surface border border-border/50 rounded-2xl text-sm">
                {tr("noTastingsYet", lang)}
              </div>
            )}
            {favorites.length > 0 && (
              <h3 className="font-bold text-sm">❤️ {tr("favoriteMeals", lang)}</h3>
            )}
            {[...favorites, ...events.filter((e) => !e.isFavorite)].map((e, i) => {
              const reaction = REACTIONS.find((r) => r.id === e.reaction);
              const showAllHeader = i === favorites.length && favorites.length > 0;
              return (
                <div key={e.id}>
                  {showAllHeader && <h3 className="font-bold text-sm mb-3 mt-2">{tr("tabMeals", lang)}</h3>}
                  <div className="card-surface border border-orange-200/60 dark:border-orange-900/40 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{whenLabel(e.startedAt, lang)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setLocation(repeatHref(e))}
                          className="h-8 px-2.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {tr("repeatMeal", lang)}
                        </button>
                        <button
                          onClick={() => updateEvent.mutate({ id: e.id, data: { isFavorite: !e.isFavorite } })}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
                        >
                          <Heart className={cn("w-4 h-4", e.isFavorite && "fill-current")} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {foodsOf(e).map((k) => (
                        <span key={k} className="h-7 px-2.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200/70 dark:border-orange-900/50 text-xs font-medium flex items-center">
                          {foodEmoji(k)} {foodName(k, lang)}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
                      {e.amountTsp != null && <span>{tspLabel(e.amountTsp, lang)}</span>}
                      {reaction && <span>{reaction.emoji} {reaction[lang]}</span>}
                      {e.symptoms?.length ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          ⚠️ {e.symptoms.map((s) => SYMPTOMS.find((x) => x.id === s)?.[lang] ?? s).join(", ")}
                        </span>
                      ) : null}
                      {e.loggedBy && <span>👤 {e.loggedBy}</span>}
                    </div>
                    {e.notes && <p className="text-xs leading-relaxed">{e.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Food detail */}
      <Sheet open={openFood !== null} onOpenChange={(o) => !o && setOpenFood(null)}>
        <SheetContent side="bottom" className="rounded-t-[2rem] card-surface border-border/60 p-6 max-h-[85dvh] overflow-y-auto" dir={dir}>
          {openFood && (
            <>
              <div className="flex flex-col items-center gap-1 mb-4">
                <span className="text-5xl">{foodEmoji(openFood)}</span>
                <SheetTitle className="text-xl font-bold">{foodName(openFood, lang)}</SheetTitle>
                {openGroup && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {tr("allergenBadge", lang)} · {openGroup.emoji} {openGroup[lang]}
                  </span>
                )}
              </div>
              <div className="rounded-2xl bg-background/60 border border-border/50 p-3 text-sm space-y-1 mb-3">
                <p className="font-semibold">
                  {!openStat ? tr("notTriedYet", lang) : openStat.count === 1 ? tr("triedOnce", lang) : tr("triedTimes", lang, openStat.count)}
                </p>
                {openStat && <p className="text-muted-foreground text-xs">{tr("lastTimeOn", lang, whenLabel(openStat.lastAt, lang))}</p>}
                {openStat && Object.keys(openStat.reactions).length > 0 && (
                  <p className="text-xs">
                    {REACTIONS.filter((r) => openStat.reactions[r.id]).map((r) => `${r.emoji}×${openStat.reactions[r.id]}`).join("  ")}
                  </p>
                )}
                {openStat?.hadSymptoms && (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">{tr("hadReactionWarning", lang)}</p>
                )}
              </div>
              {openEvents.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {openEvents.map((e) => (
                    <div key={e.id} className="text-xs flex justify-between gap-2 border-b border-border/40 pb-1.5">
                      <span className="truncate">{foodsOf(e).map((k) => foodName(k, lang)).join(", ")}</span>
                      <span className="text-muted-foreground shrink-0">{whenLabel(e.startedAt, lang)}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setLocation(`/solids?foods=${encodeURIComponent(openFood)}`)}
                className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold active:scale-95 transition-transform"
              >
                {tr("logWithFood", lang, foodName(openFood, lang))}
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
