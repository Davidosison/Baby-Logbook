import type { Language } from "@/contexts/language-context";

const t = {
  appName: { he: "היומן של אדם ❤️‍🔥", ru: "Журнал Адама ❤️‍🔥" },

  // PIN page
  welcome: { he: "ברוכים הבאים", ru: "Добро пожаловать" },
  enterPin: { he: "הזינו את הקוד המשפחתי", ru: "Введите семейный PIN-код" },
  wrongPin: { he: "קוד שגוי", ru: "Неверный PIN" },
  tryAgain: { he: "אנא נסו שנית.", ru: "Пожалуйста, попробуйте снова." },
  error: { he: "שגיאה", ru: "Ошибка" },
  cannotVerifyPin: { he: "לא ניתן לאמת את הקוד. אנא נסו שנית.", ru: "Не удалось проверить PIN. Попробуйте снова." },
  deleteKey: { he: "מחק", ru: "Удалить" },

  // Navigation
  home: { he: "בית", ru: "Главная" },
  history: { he: "היסטוריה", ru: "История" },
  schedule: { he: "לוח", ru: "График" },
  settings: { he: "הגדרות", ru: "Настройки" },
  theme: { he: "ערכת נושא", ru: "Тема" },
  language: { he: "שפה", ru: "Язык" },
  logEvent: { he: "תיעוד אירוע", ru: "Записать" },
  time: { he: "שעה", ru: "Время" },
  dark: { he: "כהה", ru: "Тёмная" },
  light: { he: "בהיר", ru: "Светлая" },
  hebrew: { he: "עברית", ru: "Иврит" },
  russian: { he: "רוסית", ru: "Русский" },

  // Event types
  feeding: { he: "האכלה", ru: "Кормление" },
  sleep: { he: "שינה", ru: "Сон" },
  diaper: { he: "טיטול", ru: "Подгузник" },

  // Dashboard
  summary: { he: "סיכום", ru: "Сводка" },
  never: { he: "מעולם", ru: "Никогда" },
  justNow: { he: "עכשיו", ru: "Сейчас" },
  dailyGoals: { he: "יעדים יומיים", ru: "Дневные цели" },
  feedings: { he: "האכלות", ru: "Кормления" },
  todayTimeline: { he: "ציר הזמן של היום", ru: "График дня" },
  refresh: { he: "רענן", ru: "Обновить" },
  loading: { he: "טוען...", ru: "Загрузка..." },
  noEventsToday: { he: "אין אירועים היום עדיין", ru: "Сегодня событий нет" },
  sleepingNow: { he: "ישן עכשיו...", ru: "Спит сейчас..." },
  share: { he: "שתף", ru: "Поделиться" },

  // Diaper types
  pee: { he: "פיפי", ru: "Пи-пи" },
  poop: { he: "קקי", ru: "Ка-ка" },
  both: { he: "שניהם", ru: "Оба" },

  // Feeding page
  startTime: { he: "שעת התחלה", ru: "Начало" },
  endTime: { he: "שעת סיום", ru: "Конец" },
  autoDuration: { he: (m: number) => `משך: ${m} דק'`, ru: (m: number) => `Длительность: ${m} мин.` },
  liveTimer: { he: "טיימר חי", ru: "Таймер" },
  tapToStart: { he: "לחץ להתחיל", ru: "Нажмите чтобы начать" },
  tapToStop: { he: "לחץ לסיום", ru: "Нажмите для остановки" },
  timerRunning: { he: "מודד...", ru: "Идёт отсчёт..." },
  amountMl: { he: 'כמות (מ"ל)', ru: "Количество (мл)" },
  exAmount: { he: "לדוגמה: 120", ru: "Например: 120" },
  notesOptional: { he: "הערות (אופציונלי)", ru: "Примечания (необязательно)" },
  exNotes: { he: "לדוגמה: צד שמאל קודם...", ru: "Например: сначала левая сторона..." },
  saveFeeding: { he: "שמור האכלה", ru: "Сохранить кормление" },

  // Sleep page
  activeSleepBanner: { he: "שינה פעילה", ru: "Активный сон" },
  stopSleepNow: { he: "עצור שינה", ru: "Остановить сон" },
  asleep: { he: "ישן", ru: "Спит" },
  babyAwake: { he: "התינוק ער", ru: "Малыш не спит" },
  wakeUp: { he: "התעורר", ru: "Разбудить" },
  stopSleep: { he: "להפסיק שינה", ru: "Остановить сон" },
  startSleepLabel: { he: "שינה", ru: "Сон" },
  startSleepSub: { he: "להתחיל שינה", ru: "Начать сон" },
  saveSleep: { he: "שמור שינה", ru: "Сохранить сон" },
  manualEntry: { he: "רישום ידני", ru: "Ручной ввод" },

  // Diaper page
  exDiaperNotes: { he: "לדוגמה: הפריחה נראית טוב יותר...", ru: "Например: сыпь выглядит лучше..." },
  saveDiaper: { he: "שמור טיטול", ru: "Сохранить" },

  // History page
  loadingHistory: { he: "טוען היסטוריה...", ru: "Загрузка истории..." },
  noEvents: { he: "אין אירועים מתועדים עדיין", ru: "Событий пока нет" },
  deleteEvent: { he: "מחיקת אירוע", ru: "Удалить событие" },
  deleteConfirm: { he: "האם אתה בטוח שברצונך למחוק אירוע זה? פעולה זו אינה הפיכה.", ru: "Вы уверены, что хотите удалить это событие? Это действие нельзя отменить." },
  cancel: { he: "ביטול", ru: "Отмена" },
  delete: { he: "מחק", ru: "Удалить" },
  sleepingShort: { he: "ישן...", ru: "Спит..." },
  editEvent: { he: "עריכת אירוע", ru: "Изменить событие" },
  saveChanges: { he: "שמור שינויים", ru: "Сохранить изменения" },
  today: { he: "היום", ru: "Сегодня" },
  yesterday: { he: "אתמול", ru: "Вчера" },

  // Schedule page
  scheduleTitle: { he: "לוח זמנים", ru: "Расписание" },
  weekly: { he: "שבועי", ru: "Неделя" },
  daily: { he: "יומי", ru: "День" },
  loadingSchedule: { he: "טוען לוח...", ru: "Загрузка..." },
  noScheduleData: { he: "אין נתונים לתצוגה", ru: "Нет данных" },

  // Header / app
  babyTracker: { he: "היומן של אדם ❤️‍🔥", ru: "Журнал Адама ❤️‍🔥" },
  agePrefix: { he: "בן", ru: "возраст" },

  // Push prompt
  enablePushTitle: { he: "הפעל התראות האכלה", ru: "Включить напоминания" },
  enablePushSub: { he: "קבלו תזכורת כל 3 שעות", ru: "Напоминание каждые 3 часа" },
  pushEnabledTitle: { he: "התראות מופעלות", ru: "Уведомления включены" },
  pushEnabledSub: { he: "תקבלו התראה כשהתינוק לא הוזן 3 שעות", ru: "Уведомление придёт, если не кормили 3 часа" },
  enable: { he: "הפעל", ru: "Включить" },

  // Time ago
  minutesAgo: { he: (m: number) => `לפני ${m}ד'`, ru: (m: number) => `${m} мин. назад` },
  hoursAgo: { he: (h: number) => `לפני ${h}ש'`, ru: (h: number) => `${h} ч. назад` },
  hoursMinutesAgo: { he: (h: number, m: number) => `לפני ${h}ש' ${m}ד'`, ru: (h: number, m: number) => `${h} ч. ${m} мин. назад` },

  // Duration formatting
  sleepDuration: { he: (h: number, m: number) => `${h}ש' ${m}ד'`, ru: (h: number, m: number) => `${h} ч. ${m} мин.` },
  feedingDuration: { he: (d: number) => `${d} דק'`, ru: (d: number) => `${d} мин.` },
  feedingAmount: { he: (a: number) => `${a} מ"ל`, ru: (a: number) => `${a} мл` },
  sleepGoalDuration: { he: (h: number, m: number) => `${h}ש' ${m}ד'`, ru: (h: number, m: number) => `${h} ч. ${m} мин.` },

  // Name / person greeting
  whoAreYou: { he: "מה שמך?", ru: "Как тебя зовут?" },
  whoAreYouSub: { he: "כדי שנדע מי מתעד", ru: "Чтобы мы знали, кто записывает" },
  whoIsLogging: { he: "מי מתעד?", ru: "Кто записывает?" },
  pickYourName: { he: "בחר את שמך", ru: "Выбери своё имя" },
  otherPerson: { he: "+ אדם אחר", ru: "+ Другой человек" },
  backToList: { he: "חזרה לרשימה", ru: "Назад к списку" },
  yourNamePlaceholder: { he: "השם שלך...", ru: "Твоё имя..." },
  letsGo: { he: "בוא נתחיל 👶", ru: "Начнём 👶" },
  helloName: { he: (n: string) => `שלום ${n}! 👋`, ru: (n: string) => `Привет ${n}! 👋` },
  changeName: { he: "שנה שם", ru: "Изменить имя" },
  yourName: { he: "השם שלך", ru: "Твоё имя" },

  // Install guide
  installTitle: { he: "הוסף למסך הבית", ru: "Добавить на экран" },
  installSubtitle: { he: "פתח את האפליקציה כמו אפליקציה אמיתית", ru: "Открывай как обычное приложение" },
  installIOS1: { he: "פתח ב-Safari (לא Chrome)", ru: "Открой в Safari (не Chrome)" },
  installIOS2: { he: "לחץ על כפתור השיתוף בתחתית", ru: "Нажми кнопку «Поделиться» внизу" },
  installIOS3: { he: "בחר «הוסף למסך הבית»", ru: "Выбери «На экран «Домой»»" },
  installAndroid1: { he: "פתח ב-Chrome", ru: "Открой в Chrome" },
  installAndroid2: { he: "לחץ על תפריט ⋮ בפינה הימנית", ru: "Нажми меню ⋮ в правом углу" },
  installAndroid3: { he: "בחר «הוסף לדף הבית»", ru: "Выбери «Добавить на гл. экран»" },
  installDismiss: { he: "הבנתי, תודה!", ru: "Понятно, спасибо!" },
  installIphone: { he: "iPhone / iPad", ru: "iPhone / iPad" },
  installAndroid: { he: "אנדרואיד", ru: "Android" },

  // Share feature
  shareTitle: { he: (date: string) => `עדכון אדם — ${date}`, ru: (date: string) => `Обновление Адама — ${date}` },
  shareFeedings: { he: (n: number, ml: number) => `🍼 האכלות: ${n} פעמים · ${ml} מ"ל`, ru: (n: number, ml: number) => `🍼 Кормления: ${n} раз · ${ml} мл` },
  shareSleep: { he: (h: number, m: number) => `😴 שינה: ${h} שעות ${m} דקות`, ru: (h: number, m: number) => `😴 Сон: ${h} ч. ${m} мин.` },
  shareDiapers: { he: (n: number) => `🧷 טיטולים: ${n}`, ru: (n: number) => `🧷 Подгузников: ${n}` },
  shareFooter: { he: "נשלח מיומן אדם 👶", ru: "Отправлено из Журнала Адама 👶" },
};

export function tr<K extends keyof typeof t>(
  key: K,
  lang: Language,
  ...args: (typeof t)[K][Language] extends (...a: any[]) => string ? Parameters<(typeof t)[K][Language]> : []
): string {
  const val = (t[key] as any)[lang];
  if (typeof val === "function") return val(...args);
  return val as string;
}

export default t;
