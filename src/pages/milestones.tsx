import { useState } from "react";
import { useLocation } from "wouter";
import { useLogMilestone, useListMilestones, useGetAuthStatus, getGetAuthStatusQueryKey } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage, type Language } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { tr } from "@/lib/translations";
import { format, parseISO, isToday, addMonths, differenceInMonths, differenceInCalendarDays } from "date-fns";
import { he, ru } from "date-fns/locale";
import { Star, CalendarDays } from "lucide-react";

function ruPlural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function ageAt(birth: Date, when: Date, lang: Language): string {
  const months = Math.max(0, differenceInMonths(when, birth));
  const days = Math.max(0, differenceInCalendarDays(when, addMonths(birth, months)));
  if (lang === "he") {
    const m = months === 1 ? "חודש" : months === 2 ? "חודשיים" : `${months} חודשים`;
    const d = days === 1 ? "יום" : days === 2 ? "יומיים" : `${days} ימים`;
    if (months === 0) return `בגיל ${d}`;
    if (days === 0) return `בגיל ${m}`;
    return `בגיל ${m} ו-${d}`;
  }
  const m = `${months} ${ruPlural(months, "месяц", "месяца", "месяцев")}`;
  const d = `${days} ${ruPlural(days, "день", "дня", "дней")}`;
  if (months === 0) return `в ${d}`;
  if (days === 0) return `в ${m}`;
  return `в ${m} и ${d}`;
}

export default function MilestonesPage() {
  const [, setLocation] = useLocation();
  const { lang, dir } = useLanguage();
  const { name } = usePerson();
  const dateLocale = lang === "he" ? he : ru;
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(todayStr);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: authStatus } = useGetAuthStatus({ query: { queryKey: getGetAuthStatusQueryKey() } });
  const birth = authStatus?.babyBirthDate ? parseISO(authStatus.babyBirthDate) : null;
  const { data: milestones, isLoading } = useListMilestones();

  const logMilestone = useLogMilestone({
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

  // Today keeps the current time so it lands correctly in today's timeline;
  // a past date is pinned to midday so no timezone shift can move it a day.
  const startedAtFor = (d: string) => {
    if (d === todayStr) return new Date().toISOString();
    const at = parseISO(d);
    at.setHours(12, 0, 0, 0);
    return at.toISOString();
  };

  const canSave = title.trim().length > 0 && !!date && !logMilestone.isPending;

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="ציון דרך" russianTitle="Достижение" showBack />

      <div className="p-4 max-w-md mx-auto space-y-5 mt-2">
        <div className="bg-yellow-400/10 border-2 border-yellow-400/50 rounded-3xl p-8 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-400/40" />
          </div>
          <p className="text-yellow-700 dark:text-yellow-400 font-semibold text-lg">
            {lang === "he" ? "אדם עשה משהו חדש! 🎉" : "Адам сделал что-то новое! 🎉"}
          </p>
        </div>

        {/* Date */}
        <div className="bg-card border border-border rounded-3xl p-4">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {tr("milestoneDate", lang)}
          </label>
          {/* iOS draws date inputs in the phone's language and too wide — show our own label under an invisible input */}
          <div className="relative">
            <div className="h-12 w-full rounded-md border border-border bg-background px-3 flex items-center justify-between gap-2 text-base">
              <span className="truncate">
                {format(parseISO(date), lang === "he" ? "EEEE, d בMMMM yyyy" : "EEEE, d MMMM yyyy", { locale: dateLocale })}
              </span>
              <CalendarDays className="w-4 h-4 shrink-0 text-muted-foreground" />
            </div>
            <input
              type="date"
              value={date}
              max={todayStr}
              aria-label={tr("milestoneDate", lang)}
              onChange={(e) => { if (e.target.value) setDate(e.target.value); }}
              onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch { /* picker opens natively */ } }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          {birth && date && (
            <p className="text-xs text-muted-foreground mt-2">{ageAt(birth, parseISO(date), lang)}</p>
          )}
        </div>

        {/* Title */}
        <div className="bg-card border border-border rounded-3xl p-4">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            {tr("milestoneTitle", lang)}
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tr("milestoneTitlePlaceholder", lang)}
            className="h-12 text-base border-border bg-background"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">{tr("notesOptional", lang)}</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none h-24 bg-card border-border"
          />
        </div>

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-2xl p-3 text-center">
            {saveError}
          </div>
        )}

        <Button
          onClick={() => {
            setSaveError(null);
            logMilestone.mutate({
              data: {
                title: title.trim(),
                notes: notes.trim() || null,
                startedAt: startedAtFor(date),
                loggedBy: name ?? null,
              },
            });
          }}
          disabled={!canSave}
          className="w-full h-16 text-lg font-bold rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-white shadow-xl shadow-yellow-400/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {logMilestone.isPending ? "..." : tr("saveMilestone", lang)}
        </Button>

        {/* All milestones so far */}
        <div className="pt-4">
          <h2 className="font-bold text-base mb-3">⭐ {tr("milestonesSoFar", lang)}</h2>
          {isLoading && (
            <div className="text-center text-muted-foreground py-6 animate-pulse text-sm">{tr("loading", lang)}</div>
          )}
          {!isLoading && (milestones?.length ?? 0) === 0 && (
            <div className="text-center text-muted-foreground py-6 card-surface border border-border/50 rounded-2xl text-sm">
              {tr("noMilestones", lang)}
            </div>
          )}
          <div className="space-y-2">
            {milestones?.map((m) => {
              const when = new Date(m.startedAt);
              return (
                <div key={m.id} className="card-surface border border-yellow-300/60 dark:border-yellow-700/40 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm">{m.title}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {isToday(when)
                        ? tr("today", lang)
                        : format(when, lang === "he" ? "d בMMMM yyyy" : "d MMMM yyyy", { locale: dateLocale })}
                    </span>
                  </div>
                  {birth && (
                    <div className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mt-0.5">{ageAt(birth, when, lang)}</div>
                  )}
                  {m.notes && <div className="text-xs text-muted-foreground mt-1">{m.notes}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
