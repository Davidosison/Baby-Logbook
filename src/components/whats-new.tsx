import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { X, Sparkles } from "lucide-react";

// Bump this whenever there's a new announcement to show everyone once.
const WHATS_NEW_VERSION = "2026-11-08-food";
const STORAGE_KEY = "whats-new-seen";

const ITEMS_HE = [
  "🥗 טאב חדש \"אוכל\" במקום \"לוח\" — כל המזונות של אדם: מה נוסה, כמה פעמים, ומה עוד לא",
  "⚠️ מעקב אלרגנים — 3 ימי חשיפה לכל קבוצה (חלב, ביצה, בוטנים, טחינה ועוד), מתמלא אוטומטית מהטעימות",
  "🥄 רישום טעימה: בוחרים מזונות מהרשימה (כמה ביחד = ארוחה), איך הלך 😍😐😖 ותגובה חריגה",
  "🔁 \"שוב\" חוזר על ארוחה קודמת בלחיצה, ואפשר לשמור ארוחות מועדפות ❤️",
  "✨ כל הטעימות שכבר רשמתם זוהו אוטומטית ונכנסו לרשימה",
];

const ITEMS_RU = [
  "🥗 Новая вкладка «Питание» вместо «График» — все продукты Адама: что пробовал, сколько раз и что ещё нет",
  "⚠️ Аллергены — 3 дня экспозиции для каждой группы (молоко, яйцо, арахис, тхина и др.), заполняется автоматически",
  "🥄 Запись прикорма: выбираем продукты из списка (несколько = приём пищи), реакция 😍😐😖 и необычные симптомы",
  "🔁 «Повторить» — тот же приём пищи одним нажатием, и можно сохранять избранное ❤️",
  "✨ Все прежние записи прикорма распознаны автоматически",
];

export function WhatsNew() {
  const { lang, dir } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === WHATS_NEW_VERSION) return;
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
    setVisible(false);
  };

  if (!visible) return null;

  const items = lang === "he" ? ITEMS_HE : ITEMS_RU;

  return (
    <>
      <div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm" onClick={dismiss} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[96] bg-card border-t border-border rounded-t-[2rem] p-6 shadow-2xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        dir={dir}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
        </div>

        <h2 className="text-center text-xl font-bold mb-1">
          {lang === "he" ? "מה חדש? ✨" : "Что нового? ✨"}
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-5">
          {lang === "he" ? "כמה שיפורים ביומן אדם" : "Несколько улучшений в журнале Адама"}
        </p>

        <div className="space-y-3 mb-6">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-background/50 rounded-2xl px-3 py-2.5 border border-border/40">
              <span className="text-sm leading-relaxed">{item}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm font-semibold text-primary mb-5">
          {lang === "he" ? "יום נפלא לכולם! 💙 — אדם רפאל" : "Прекрасного всем дня! 💙 — Адам Рафаэль"}
        </p>

        <button
          onClick={dismiss}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-95 transition-transform"
        >
          {lang === "he" ? "מגניב, תודה!" : "Класс, спасибо!"}
        </button>
      </div>
    </>
  );
}
