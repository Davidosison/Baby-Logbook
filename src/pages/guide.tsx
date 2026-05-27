import { useLanguage } from "@/contexts/language-context";
import { PageHeader } from "@/components/page-header";
import { Utensils, Moon, Droplet, Bath, BookOpen, Users, CalendarDays, Clock } from "lucide-react";

type Section = {
  icon: React.ReactNode;
  color: string;
  title: { he: string; ru: string };
  points: { he: string; ru: string }[];
};

const sections: Section[] = [
  {
    icon: <Utensils className="w-5 h-5" />,
    color: "text-sky-500 bg-sky-400/10 border-sky-400/30",
    title: { he: "🍼 האכלה", ru: "🍼 Кормление" },
    points: [
      { he: "לחץ «לחץ להתחיל» להפעלת טיימר חי שמסונכרן בין כל בני הבית.", ru: "Нажми «Начать» — таймер запустится и будет виден у всех." },
      { he: "אפשרות «האכלה מ-»: הזן שעת התחלה בדיעבד — הטיימר יחשב מאותה שעה.", ru: "«Кормление с»: введи прошлое время — таймер отсчитает от него." },
      { he: "לאחר הסיום, הזן כמות במ\"ל ולחץ שמור.", ru: "После остановки введи количество мл и нажми сохранить." },
      { he: "ניתן גם לתעד ידנית: שעת התחלה + סיום + כמות.", ru: "Можно вручную: время начала + конца + количество." },
    ],
  },
  {
    icon: <Moon className="w-5 h-5" />,
    color: "text-indigo-500 bg-indigo-400/10 border-indigo-400/30",
    title: { he: "😴 שינה", ru: "😴 Сон" },
    points: [
      { he: "לחץ «התחל שינה» — טיימר חי מסונכרן לכל בני הבית.", ru: "Нажми «Начать сон» — таймер виден всем." },
      { he: "«ישן מ-»: הזן שעה בדיעבד לפני ההתחלה — הטיימר יתחיל מאותו זמן.", ru: "«Спит с»: введи прошлое время — таймер считает с него." },
      { he: "לחץ «להפסיק שינה» בדשבורד לסיום מהיר.", ru: "Кнопка «Остановить сон» на главной — быстрая остановка." },
      { he: "ניתן גם לתעד ידנית עם שעת התחלה וסיום.", ru: "Можно записать вручную: время начала и конца." },
    ],
  },
  {
    icon: <Droplet className="w-5 h-5" />,
    color: "text-amber-500 bg-amber-400/10 border-amber-400/30",
    title: { he: "🧷 טיטול", ru: "🧷 Подгузник" },
    points: [
      { he: "בחר פיפי, קקי, או שניהם — לחץ על שניהם יחד לסימון «שניהם».", ru: "Выбери пи-пи, ка-ка или оба — нажми оба для «обоих»." },
      { he: "ניתן לשנות שעה אם זה לא עכשיו, או לנקות ל-שעה הנוכחית.", ru: "Измени время если нужно — или сбрось на текущее." },
      { he: "אחרי 18:00 תופיע תזכורת ויטמין D.", ru: "После 18:00 появится напоминание о витамине D." },
    ],
  },
  {
    icon: <Bath className="w-5 h-5" />,
    color: "text-teal-500 bg-teal-400/10 border-teal-400/30",
    title: { he: "🛁 מקלחת + ויטמין D", ru: "🛁 Купание + витамин D" },
    points: [
      { he: "תעד מקלחת עם שעה והערות אופציונליות.", ru: "Записывай купание со временем и заметками." },
      { he: "אחרי 18:00 תופיע תזכורת ויטמין D.", ru: "После 18:00 появится напоминание о витамине D." },
      { he: "«נתתי לו ✓» — נשמר בהיסטוריה ולא יזכיר שוב היום.", ru: "«Дал(а) ✓» — сохраняется в истории, больше не напомнит сегодня." },
      { he: "«תזכיר לי אח״כ» — תופיע תזכורת בראש הדף הבית.", ru: "«Напомни позже» — баннер появится на главной." },
    ],
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-rose-500 bg-rose-400/10 border-rose-400/30",
    title: { he: "📋 היסטוריה", ru: "📋 История" },
    points: [
      { he: "כל האירועים ממוינים לפי תאריך.", ru: "Все события отсортированы по дате." },
      { he: "ניתן לערוך כל אירוע (לחץ עליו) או למחוק.", ru: "Можно редактировать или удалить любое событие." },
    ],
  },
  {
    icon: <CalendarDays className="w-5 h-5" />,
    color: "text-purple-500 bg-purple-400/10 border-purple-400/30",
    title: { he: "📅 לוח זמנים", ru: "📅 Расписание" },
    points: [
      { he: "תצוגה יומית: ציר זמן של כל האירועים ביום הנבחר.", ru: "Дневной вид: временная шкала всех событий выбранного дня." },
      { he: "תצוגה שבועית: טבלת 7 ימים עם צבע לכל סוג.", ru: "Недельный вид: 7 колонок с цветами по типу события." },
    ],
  },
  {
    icon: <Users className="w-5 h-5" />,
    color: "text-green-500 bg-green-400/10 border-green-400/30",
    title: { he: "👨‍👩‍👧 ריבוי משתמשים", ru: "👨‍👩‍👧 Несколько пользователей" },
    points: [
      { he: "כל בני הבית משתמשים באותו קוד PIN.", ru: "Все члены семьи используют один PIN-код." },
      { he: "כל הטיימרים והנתונים מסונכרנים בזמן אמת.", ru: "Все таймеры и данные синхронизируются в реальном времени." },
      { he: "בהתחברות ראשונה תתבקש להזין את שמך — זה יופיע בהיסטוריה.", ru: "При первом входе укажи имя — оно отображается в истории." },
    ],
  },
  {
    icon: <Clock className="w-5 h-5" />,
    color: "text-orange-500 bg-orange-400/10 border-orange-400/30",
    title: { he: "💡 טיפים שימושיים", ru: "💡 Полезные советы" },
    points: [
      { he: "הוסף לדף הבית של הטלפון לגישה מהירה (כפתור ה-PWA).", ru: "Добавь на экран телефона для быстрого доступа (кнопка PWA)." },
      { he: "כפתור הרענון בדף הבית מעדכן את כל הנתונים.", ru: "Кнопка «Обновить» на главной обновляет все данные." },
      { he: "כפתור «שתף» שולח סיכום יומי להדבקה בצ'אט.", ru: "Кнопка «Поделиться» отправляет дневную сводку в чат." },
      { he: "הנתונים נשמרים לצמיתות בענן.", ru: "Данные постоянно хранятся в облаке." },
    ],
  },
];

export default function GuidePage() {
  const { lang, dir } = useLanguage();
  const t = (obj: { he: string; ru: string }) => obj[lang];

  return (
    <div className="min-h-[100dvh] bg-background pb-32" dir={dir}>
      <PageHeader
        hebrewTitle="מדריך למשתמש"
        russianTitle="Руководство"
        showBack
      />

      <div className="p-4 max-w-md mx-auto space-y-3 mt-2">
        {/* Intro */}
        <div className="bg-card border border-border rounded-3xl p-4 text-center">
          <div className="text-4xl mb-2">👶</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lang === "he"
              ? "האפליקציה עוזרת לכם לעקוב אחר האכלות, שינה, טיטולים ועוד — ומסונכרנת בין כל בני המשפחה."
              : "Приложение помогает отслеживать кормления, сон, подгузники и многое другое — синхронизация между всей семьёй."}
          </p>
        </div>

        {/* Feature sections */}
        {sections.map((section, i) => (
          <div key={i} className="bg-card border border-border rounded-3xl overflow-hidden">
            {/* Section header */}
            <div className={`flex items-center gap-3 px-4 py-3 border-b border-border`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${section.color}`}>
                {section.icon}
              </div>
              <span className="font-bold text-sm">{t(section.title)}</span>
            </div>
            {/* Points */}
            <ul className="px-4 py-3 space-y-2">
              {section.points.map((point, j) => (
                <li key={j} className="flex gap-2 text-sm text-muted-foreground leading-snug">
                  <span className="text-muted-foreground/40 shrink-0 mt-0.5">•</span>
                  <span>{t(point)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-2">
          {lang === "he" ? "בהצלחה! 💙" : "Удачи! 💙"}
        </div>
      </div>
    </div>
  );
}
