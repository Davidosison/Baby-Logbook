import { format } from "date-fns";
import type { Language } from "@/contexts/language-context";

export type FoodCategory = "veg" | "fruit" | "grain" | "protein" | "fat" | "allergen" | "drink";
export type AllergenGroup = "milk" | "egg" | "peanut" | "sesame" | "treenut" | "wheat" | "fish" | "soy";
export type Reaction = "loved" | "ok" | "disliked";
export type Symptom = "rash" | "vomit" | "diarrhea" | "swelling";

export type Food = {
  id: string;
  he: string;
  ru: string;
  emoji: string;
  category: FoodCategory;
  allergen?: AllergenGroup;
  // Extra spellings used to recognise free-text tastings logged before the catalog existed.
  aliases?: string[];
};

export const FOODS: Food[] = [
  // Vegetables
  { id: "carrot", he: "גזר", ru: "Морковь", emoji: "🥕", category: "veg" },
  { id: "zucchini", he: "קישוא", ru: "Кабачок", emoji: "🥒", category: "veg", aliases: ["קישו", "זוקיני"] },
  { id: "sweet_potato", he: "בטטה", ru: "Батат", emoji: "🍠", category: "veg" },
  { id: "potato", he: "תפוח אדמה", ru: "Картофель", emoji: "🥔", category: "veg", aliases: ["תפוחי אדמה"] },
  { id: "butternut", he: "דלורית", ru: "Баттернат", emoji: "🎃", category: "veg" },
  { id: "pumpkin", he: "דלעת", ru: "Тыква", emoji: "🎃", category: "veg" },
  { id: "broccoli", he: "ברוקולי", ru: "Брокколи", emoji: "🥦", category: "veg" },
  { id: "cauliflower", he: "כרובית", ru: "Цветная капуста", emoji: "🥦", category: "veg" },
  { id: "green_beans", he: "שעועית ירוקה", ru: "Стручковая фасоль", emoji: "🫛", category: "veg" },
  { id: "peas", he: "אפונה", ru: "Горошек", emoji: "🫛", category: "veg" },
  { id: "spinach", he: "תרד", ru: "Шпинат", emoji: "🥬", category: "veg" },
  { id: "tomato", he: "עגבנייה", ru: "Помидор", emoji: "🍅", category: "veg", aliases: ["עגבניה"] },
  { id: "cucumber", he: "מלפפון", ru: "Огурец", emoji: "🥒", category: "veg" },
  { id: "pepper", he: "פלפל", ru: "Перец", emoji: "🫑", category: "veg" },
  { id: "eggplant", he: "חציל", ru: "Баклажан", emoji: "🍆", category: "veg" },
  { id: "corn", he: "תירס", ru: "Кукуруза", emoji: "🌽", category: "veg" },
  { id: "onion", he: "בצל", ru: "Лук", emoji: "🧅", category: "veg" },
  { id: "beet", he: "סלק", ru: "Свёкла", emoji: "🫜", category: "veg" },

  // Fruit
  { id: "apple", he: "תפוח עץ", ru: "Яблоко", emoji: "🍎", category: "fruit", aliases: ["תפוח"] },
  { id: "pear", he: "אגס", ru: "Груша", emoji: "🍐", category: "fruit" },
  { id: "banana", he: "בננה", ru: "Банан", emoji: "🍌", category: "fruit" },
  { id: "peach", he: "אפרסק", ru: "Персик", emoji: "🍑", category: "fruit" },
  { id: "apricot", he: "משמש", ru: "Абрикос", emoji: "🍑", category: "fruit" },
  { id: "mango", he: "מנגו", ru: "Манго", emoji: "🥭", category: "fruit" },
  { id: "melon", he: "מלון", ru: "Дыня", emoji: "🍈", category: "fruit" },
  { id: "watermelon", he: "אבטיח", ru: "Арбуз", emoji: "🍉", category: "fruit" },
  { id: "strawberry", he: "תות", ru: "Клубника", emoji: "🍓", category: "fruit" },
  { id: "blueberry", he: "אוכמניות", ru: "Черника", emoji: "🫐", category: "fruit" },
  { id: "grapes", he: "ענבים", ru: "Виноград", emoji: "🍇", category: "fruit" },
  { id: "orange", he: "תפוז", ru: "Апельсин", emoji: "🍊", category: "fruit" },
  { id: "kiwi", he: "קיווי", ru: "Киви", emoji: "🥝", category: "fruit" },
  { id: "persimmon", he: "אפרסמון", ru: "Хурма", emoji: "🟠", category: "fruit" },
  { id: "dates", he: "תמר", ru: "Финики", emoji: "🌴", category: "fruit", aliases: ["תמרים"] },
  { id: "cherry", he: "דובדבן", ru: "Вишня", emoji: "🍒", category: "fruit" },
  { id: "pineapple", he: "אננס", ru: "Ананас", emoji: "🍍", category: "fruit" },

  // Grains
  { id: "rice", he: "אורז", ru: "Рис", emoji: "🍚", category: "grain" },
  { id: "oats", he: "שיבולת שועל", ru: "Овсянка", emoji: "🥣", category: "grain", aliases: ["קוואקר"] },
  { id: "quinoa", he: "קינואה", ru: "Киноа", emoji: "🌾", category: "grain" },
  { id: "buckwheat", he: "כוסמת", ru: "Гречка", emoji: "🌾", category: "grain" },
  { id: "millet", he: "דוחן", ru: "Пшено", emoji: "🌾", category: "grain" },

  // Protein
  { id: "chicken", he: "עוף", ru: "Курица", emoji: "🍗", category: "protein", aliases: ["כנפיים", "פרגית"] },
  { id: "turkey", he: "הודו", ru: "Индейка", emoji: "🦃", category: "protein" },
  { id: "beef", he: "בקר", ru: "Говядина", emoji: "🥩", category: "protein" },
  { id: "lentils", he: "עדשים", ru: "Чечевица", emoji: "🫘", category: "protein" },
  { id: "chickpeas", he: "חומוס", ru: "Нут", emoji: "🫘", category: "protein" },
  { id: "beans", he: "שעועית", ru: "Фасоль", emoji: "🫘", category: "protein" },

  // Healthy fat
  { id: "avocado", he: "אבוקדו", ru: "Авокадо", emoji: "🥑", category: "fat" },
  { id: "olive_oil", he: "שמן זית", ru: "Оливковое масло", emoji: "🫒", category: "fat" },

  // Allergens
  { id: "yogurt", he: "יוגורט", ru: "Йогурт", emoji: "🥛", category: "allergen", allergen: "milk" },
  { id: "white_cheese", he: "גבינה לבנה", ru: "Белый сыр", emoji: "🧀", category: "allergen", allergen: "milk", aliases: ["גבינה"] },
  { id: "cottage", he: "קוטג'", ru: "Творог", emoji: "🧀", category: "allergen", allergen: "milk", aliases: ["קוטג"] },
  { id: "hard_cheese", he: "גבינה צהובה", ru: "Твёрдый сыр", emoji: "🧀", category: "allergen", allergen: "milk" },
  { id: "butter", he: "חמאה", ru: "Сливочное масло", emoji: "🧈", category: "allergen", allergen: "milk" },
  { id: "egg", he: "ביצה", ru: "Яйцо", emoji: "🥚", category: "allergen", allergen: "egg", aliases: ["ביצים", "חלמון"] },
  { id: "peanut_butter", he: "חמאת בוטנים", ru: "Арахисовая паста", emoji: "🥜", category: "allergen", allergen: "peanut" },
  { id: "bamba", he: "במבה", ru: "Бамба", emoji: "🥜", category: "allergen", allergen: "peanut" },
  { id: "peanut", he: "בוטנים", ru: "Арахис", emoji: "🥜", category: "allergen", allergen: "peanut" },
  { id: "tahini", he: "טחינה", ru: "Тхина", emoji: "🫙", category: "allergen", allergen: "sesame", aliases: ["שומשום"] },
  { id: "almond", he: "שקדים", ru: "Миндаль", emoji: "🌰", category: "allergen", allergen: "treenut", aliases: ["שקד"] },
  { id: "walnut", he: "אגוזי מלך", ru: "Грецкий орех", emoji: "🌰", category: "allergen", allergen: "treenut", aliases: ["אגוז מלך"] },
  { id: "cashew", he: "קשיו", ru: "Кешью", emoji: "🌰", category: "allergen", allergen: "treenut" },
  { id: "bread", he: "לחם", ru: "Хлеб", emoji: "🍞", category: "allergen", allergen: "wheat" },
  { id: "pasta", he: "פסטה", ru: "Макароны", emoji: "🍝", category: "allergen", allergen: "wheat" },
  { id: "ptitim", he: "פתיתים", ru: "Птитим", emoji: "🍝", category: "allergen", allergen: "wheat" },
  { id: "semolina", he: "סולת", ru: "Манка", emoji: "🥣", category: "allergen", allergen: "wheat" },
  { id: "salmon", he: "סלמון", ru: "Лосось", emoji: "🐟", category: "allergen", allergen: "fish" },
  { id: "white_fish", he: "דג לבן", ru: "Белая рыба", emoji: "🐟", category: "allergen", allergen: "fish", aliases: ["דגים", "אמנון", "מוסר", "בקלה"] },
  { id: "tuna", he: "טונה", ru: "Тунец", emoji: "🐟", category: "allergen", allergen: "fish" },
  { id: "tofu", he: "טופו", ru: "Тофу", emoji: "🫘", category: "allergen", allergen: "soy", aliases: ["סויה"] },

  // Drinks
  { id: "water", he: "מים", ru: "Вода", emoji: "💧", category: "drink" },
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export const CATEGORIES: { id: FoodCategory; he: string; ru: string; emoji: string }[] = [
  { id: "veg", he: "ירקות", ru: "Овощи", emoji: "🥦" },
  { id: "fruit", he: "פירות", ru: "Фрукты", emoji: "🍎" },
  { id: "grain", he: "דגנים", ru: "Крупы", emoji: "🌾" },
  { id: "protein", he: "חלבון", ru: "Белок", emoji: "🍗" },
  { id: "fat", he: "שומן בריא", ru: "Полезные жиры", emoji: "🥑" },
  { id: "allergen", he: "אלרגנים", ru: "Аллергены", emoji: "⚠️" },
  { id: "drink", he: "שתייה", ru: "Напитки", emoji: "💧" },
];

export const ALLERGEN_GROUPS: { id: AllergenGroup; he: string; ru: string; emoji: string }[] = [
  { id: "milk", he: "חלב", ru: "Молоко", emoji: "🥛" },
  { id: "egg", he: "ביצה", ru: "Яйцо", emoji: "🥚" },
  { id: "peanut", he: "בוטנים", ru: "Арахис", emoji: "🥜" },
  { id: "sesame", he: "שומשום (טחינה)", ru: "Кунжут (тхина)", emoji: "🫙" },
  { id: "treenut", he: "אגוזים", ru: "Орехи", emoji: "🌰" },
  { id: "wheat", he: "חיטה", ru: "Пшеница", emoji: "🌾" },
  { id: "fish", he: "דגים", ru: "Рыба", emoji: "🐟" },
  { id: "soy", he: "סויה", ru: "Соя", emoji: "🫘" },
];

export const EXPOSURES_TARGET = 3;

export const REACTIONS: { id: Reaction; emoji: string; he: string; ru: string }[] = [
  { id: "loved", emoji: "😍", he: "אהב", ru: "Понравилось" },
  { id: "ok", emoji: "😐", he: "ככה-ככה", ru: "Так себе" },
  { id: "disliked", emoji: "😖", he: "לא אהב", ru: "Не понравилось" },
];

export const SYMPTOMS: { id: Symptom; he: string; ru: string }[] = [
  { id: "rash", he: "פריחה", ru: "Сыпь" },
  { id: "vomit", he: "הקאה", ru: "Рвота" },
  { id: "diarrhea", he: "שלשול", ru: "Диарея" },
  { id: "swelling", he: "נפיחות / גרד", ru: "Отёк / зуд" },
];

// Longest spellings first, so "תפוח אדמה" is consumed before "תפוח" can match it as an apple.
const MATCHERS: { text: string; id: string }[] = FOODS.flatMap((f) =>
  [f.he, f.ru.toLowerCase(), ...(f.aliases ?? [])].map((text) => ({ text, id: f.id })),
).sort((a, b) => b.text.length - a.text.length);

/** Turn free text like "עוף, קישוא וגזר טחון" into catalog ids; unrecognised text stays as one custom item. */
export function parseFoodText(text: string): string[] {
  let rest = ` ${text.toLowerCase()} `;
  const found: string[] = [];
  for (const m of MATCHERS) {
    const idx = rest.indexOf(m.text);
    if (idx === -1) continue;
    if (!found.includes(m.id)) found.push(m.id);
    rest = rest.split(m.text).join(" ".repeat(m.text.length));
  }
  if (found.length === 0 && text.trim()) return [text.trim()];
  return found;
}

type SolidsLike = {
  startedAt: string;
  foods?: string[] | null;
  foodType?: string | null;
  amountTsp?: number | null;
  reaction?: string | null;
  symptoms?: string[] | null;
};

export function foodsOf(e: SolidsLike): string[] {
  if (e.foods && e.foods.length > 0) return e.foods;
  if (e.foodType) return parseFoodText(e.foodType);
  return [];
}

export function foodName(key: string, lang: Language): string {
  const f = FOOD_BY_ID[key];
  return f ? f[lang] : key;
}

export function foodEmoji(key: string): string {
  return FOOD_BY_ID[key]?.emoji ?? "🥄";
}

export function tspLabel(n: number, lang: Language): string {
  if (lang === "he") return n === 1 ? "כפית אחת" : `${n} כפיות`;
  return `${n} ложк.`;
}

/** One-line description of a tasting for timelines: "בטטה, גזר · 3 כפיות · 😍 · ⚠️ פריחה". */
export function solidsDetail(e: SolidsLike, lang: Language): string {
  const parts: string[] = [];
  const foods = foodsOf(e);
  if (foods.length) parts.push(foods.map((k) => foodName(k, lang)).join(", "));
  if (e.amountTsp != null) parts.push(tspLabel(e.amountTsp, lang));
  const reaction = REACTIONS.find((r) => r.id === e.reaction);
  if (reaction) parts.push(reaction.emoji);
  if (e.symptoms?.length) {
    parts.push(`⚠️ ${e.symptoms.map((s) => SYMPTOMS.find((x) => x.id === s)?.[lang] ?? s).join(", ")}`);
  }
  return parts.join(" · ");
}

export type FoodStat = {
  key: string;
  count: number;
  lastAt: string;
  reactions: Partial<Record<Reaction, number>>;
  hadSymptoms: boolean;
};

export function computeFoodStats(events: SolidsLike[]): Map<string, FoodStat> {
  const stats = new Map<string, FoodStat>();
  for (const e of events) {
    for (const key of foodsOf(e)) {
      const s = stats.get(key) ?? { key, count: 0, lastAt: e.startedAt, reactions: {}, hadSymptoms: false };
      s.count += 1;
      if (e.startedAt > s.lastAt) s.lastAt = e.startedAt;
      if (e.reaction) s.reactions[e.reaction as Reaction] = (s.reactions[e.reaction as Reaction] ?? 0) + 1;
      if (e.symptoms?.length) s.hadSymptoms = true;
      stats.set(key, s);
    }
  }
  return stats;
}

export type AllergenProgress = { days: number; foods: string[]; hadSymptoms: boolean };

/** Each calendar day with any food from the group counts as one exposure. */
export function computeAllergenProgress(events: SolidsLike[]): Record<AllergenGroup, AllergenProgress> {
  const days: Record<string, Set<string>> = {};
  const foods: Record<string, Set<string>> = {};
  const symptoms: Record<string, boolean> = {};
  for (const e of events) {
    const day = format(new Date(e.startedAt), "yyyy-MM-dd");
    for (const key of foodsOf(e)) {
      const group = FOOD_BY_ID[key]?.allergen;
      if (!group) continue;
      (days[group] ??= new Set()).add(day);
      (foods[group] ??= new Set()).add(key);
      if (e.symptoms?.length) symptoms[group] = true;
    }
  }
  return Object.fromEntries(
    ALLERGEN_GROUPS.map((g) => [
      g.id,
      { days: days[g.id]?.size ?? 0, foods: [...(foods[g.id] ?? [])], hadSymptoms: !!symptoms[g.id] },
    ]),
  ) as Record<AllergenGroup, AllergenProgress>;
}

/** Identity of a meal regardless of food order — used to de-duplicate "recent meals" and favourites. */
export function mealKey(foods: string[]): string {
  return [...foods].sort().join("|");
}
