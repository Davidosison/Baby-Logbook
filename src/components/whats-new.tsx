import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { X, Sparkles } from "lucide-react";

// Bump this whenever there's a new announcement to show everyone once.
const WHATS_NEW_VERSION = "2026-11-08-settings";
const STORAGE_KEY = "whats-new-seen";

const ITEMS_HE = [
  "👥 מי משתמש במכשיר? בהגדרות מחליפים שם בלחיצה אחת (או לוחצים על \"שלום ...\" בדף הבית)",
  "🏠 כל אחד בוחר את הכפתורים המהירים שלו בדף הבית — כולל \"טעימה\" ו\"מקלחת\" (נשמר לפי השם)",
  "🕐 נתתם ויטמין/ברזל לפני כמה דקות? בהיסטוריה ✏️ אפשר לתקן את השעה (גם לטיטול, תרופות ומקלחת)",
  "⚙️ ההגדרות סודרו מחדש: הגיל המדויק של אדם, שפה ותצוגה, מדריך ו\"מה חדש\"",
  "🥗 טאב \"אוכל\" במקום \"לוח\": מה אדם כבר טעם, מעקב אלרגנים (3 ימי חשיפה) והיסטוריית ארוחות",
  "🥄 רישום טעימה: בוחרים מהרשימה ומסמנים איך הלך, ו\"שוב\" חוזר על ארוחה בלחיצה אחת",
];

const ITEMS_RU = [
  "👥 Кто пользуется устройством? В настройках имя меняется одним нажатием (или нажмите на «Привет...» на главной)",
  "🏠 У каждого свои быстрые кнопки на главной — в том числе «Прикорм» и «Купание» (сохраняется по имени)",
  "🕐 Дали витамин/железо пару минут назад? В истории ✏️ можно исправить время (и для подгузника, лекарств, купания)",
  "⚙️ Настройки обновлены: точный возраст Адама, язык и вид, справка и «Что нового»",
  "🥗 Вкладка «Питание» вместо «График»: что Адам уже пробовал, аллергены (3 дня экспозиции) и история",
  "🥄 Запись прикорма: выбор из списка и реакция, а «Повторить» — тот же приём пищи в одно нажатие",
];

const OPEN_EVENT = "open-whats-new";

/** Re-show the latest announcement on demand (e.g. from settings). */
export function openWhatsNew() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Release date of the current announcement, e.g. "2026-11-08". */
export const LAST_UPDATE_DATE = WHATS_NEW_VERSION.slice(0, 10);

export function WhatsNew() {
  const { lang, dir } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const open = () => setVisible(true);
    window.addEventListener(OPEN_EVENT, open);
    if (localStorage.getItem(STORAGE_KEY) === WHATS_NEW_VERSION) {
      return () => window.removeEventListener(OPEN_EVENT, open);
    }
    const t = setTimeout(open, 800);
    return () => {
      clearTimeout(t);
      window.removeEventListener(OPEN_EVENT, open);
    };
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
