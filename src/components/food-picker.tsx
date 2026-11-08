import { useMemo, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/translations";
import type { Language } from "@/contexts/language-context";
import { FOODS, CATEGORIES, type FoodCategory, foodName, foodEmoji } from "@/lib/foods";

export function FoodPicker({
  value,
  onChange,
  lang,
  tried,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  lang: Language;
  tried?: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory>("veg");

  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return FOODS.filter((f) => f.category === category);
    return FOODS.filter((f) =>
      [f.he, f.ru.toLowerCase(), ...(f.aliases ?? [])].some((n) => n.includes(q)),
    );
  }, [q, category]);
  const exactMatch = FOODS.some((f) => f.he === q || f.ru.toLowerCase() === q) || value.includes(query.trim());

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className="flex items-center gap-1 h-8 ps-2.5 pe-2 rounded-full bg-orange-500 text-white text-sm font-semibold active:scale-95 transition-transform"
            >
              <span>{foodEmoji(key)}</span>
              <span>{foodName(key, lang)}</span>
              <X className="w-3.5 h-3.5 opacity-80" />
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr("searchFood", lang)}
          className="w-full h-11 rounded-2xl bg-background border border-border text-base ps-9 pe-9 outline-none focus:ring-2 focus:ring-orange-400/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!q && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                "shrink-0 h-8 px-3 rounded-full border text-xs font-semibold transition-colors",
                category === c.id
                  ? "bg-orange-500/15 border-orange-400 text-orange-700 dark:text-orange-300"
                  : "bg-background border-border text-muted-foreground",
              )}
            >
              {c.emoji} {c[lang]}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {results.map((f) => {
          const selected = value.includes(f.id);
          const isNew = tried ? !tried.has(f.id) : false;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                toggle(f.id);
                if (q) setQuery("");
              }}
              className={cn(
                "relative h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 px-1 transition-all active:scale-95",
                selected
                  ? "bg-orange-500/15 border-orange-400"
                  : "bg-background border-border/60",
              )}
            >
              {selected && (
                <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
              {!selected && isNew && (
                <span className="absolute top-1 end-1 text-[8px] font-bold px-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                  {tr("newFoodBadge", lang)}
                </span>
              )}
              <span className="text-2xl leading-none">{f.emoji}</span>
              <span className="text-[11px] font-medium leading-tight text-center">{f[lang]}</span>
            </button>
          );
        })}
      </div>

      {q && results.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">{tr("noFoodsMatch", lang)}</p>
      )}
      {q && !exactMatch && (
        <button
          type="button"
          onClick={() => {
            toggle(query.trim());
            setQuery("");
          }}
          className="w-full h-11 rounded-2xl border-2 border-dashed border-orange-300 text-orange-700 dark:text-orange-300 font-semibold text-sm active:scale-95 transition-transform"
        >
          {tr("addCustomFood", lang, query.trim())}
        </button>
      )}
    </div>
  );
}
