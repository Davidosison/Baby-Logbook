import { addMonths, differenceInMonths, differenceInCalendarDays } from "date-fns";
import type { Language } from "@/contexts/language-context";

function ruPlural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** Exact age split into months and days, e.g. "5 חודשים ו-3 ימים". */
export function exactAge(birth: Date, when: Date, lang: Language): string {
  const months = Math.max(0, differenceInMonths(when, birth));
  const days = Math.max(0, differenceInCalendarDays(when, addMonths(birth, months)));
  if (lang === "he") {
    const m = months === 1 ? "חודש" : months === 2 ? "חודשיים" : `${months} חודשים`;
    const d = days === 1 ? "יום" : days === 2 ? "יומיים" : `${days} ימים`;
    if (months === 0) return d;
    if (days === 0) return m;
    return `${m} ו-${d}`;
  }
  const m = `${months} ${ruPlural(months, "месяц", "месяца", "месяцев")}`;
  const d = `${days} ${ruPlural(days, "день", "дня", "дней")}`;
  if (months === 0) return d;
  if (days === 0) return m;
  return `${m} и ${d}`;
}

/** "בגיל 5 חודשים ו-3 ימים" / "в 5 месяцев и 3 дня". */
export function ageAt(birth: Date, when: Date, lang: Language): string {
  return lang === "he" ? `בגיל ${exactAge(birth, when, lang)}` : `в ${exactAge(birth, when, lang)}`;
}
