import { useState } from "react";
import { Link } from "wouter";
import { useGetAuthStatus, getGetAuthStatusQueryKey, useGetFamilyMembers } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { useTheme } from "@/components/theme-provider";
import { openWhatsNew, LAST_UPDATE_DATE } from "@/components/whats-new";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { useQuickActions, QUICK_ACTIONS, QUICK_ACTIONS_MIN, QUICK_ACTIONS_MAX } from "@/hooks/use-quick-actions";
import { tr } from "@/lib/translations";
import { exactAge } from "@/lib/age";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Check, ChevronLeft, ChevronRight, BookOpen, Sparkles, Moon, Sun, SunMoon } from "lucide-react";

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="card-surface border border-border/60 rounded-3xl p-4 space-y-3 shadow-sm">
      <div>
        <h2 className="font-bold text-base">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 bg-muted rounded-2xl p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex-1 h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all",
            value === o.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { lang, setLang, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { name, knownNames, setName } = usePerson();
  const { enabled, toggle } = useQuickActions();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: authStatus } = useGetAuthStatus({ query: { queryKey: getGetAuthStatusQueryKey() } });
  const birth = authStatus?.babyBirthDate ? parseISO(authStatus.babyBirthDate) : null;
  const { data: dbNames = [] } = useGetFamilyMembers();
  const people = [...new Set([...dbNames, ...knownNames, ...(name ? [name] : [])])].sort();

  const saveNewName = () => {
    const n = newName.trim();
    if (!n) return;
    setName(n);
    setNewName("");
    setAdding(false);
  };

  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-[100dvh] bg-transparent pb-32" dir={dir}>
      <PageHeader hebrewTitle="הגדרות" russianTitle="Настройки" />

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Baby */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-100 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/30 border border-sky-200/70 dark:border-sky-900/40 p-4 flex items-center gap-4">
          <span className="text-5xl">👶</span>
          <div className="min-w-0">
            <p className="text-xl font-bold">{lang === "he" ? "אדם רפאל" : "Адам Рафаэль"}</p>
            {birth && (
              <>
                <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">{exactAge(birth, new Date(), lang)}</p>
                <p className="text-xs text-muted-foreground">{tr("bornOn", lang, format(birth, "d.M.yyyy"))}</p>
              </>
            )}
          </div>
        </div>

        {/* Who is using this device */}
        <Section title={tr("whoUsesDevice", lang)} sub={tr("whoUsesDeviceSub", lang)}>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <button
                key={p}
                onClick={() => setName(p)}
                className={cn(
                  "h-11 px-4 rounded-2xl border-2 text-sm font-semibold flex items-center gap-1.5 transition-all active:scale-95",
                  p === name
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border text-foreground",
                )}
              >
                {p === name && <Check className="w-4 h-4" />}
                {p}
              </button>
            ))}
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="h-11 px-4 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground active:scale-95 transition-transform"
              >
                {tr("addPerson", lang)}
              </button>
            )}
          </div>
          {adding && (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNewName()}
                placeholder={tr("yourNamePlaceholder", lang)}
                maxLength={30}
                className="flex-1 h-11 px-3 rounded-2xl bg-background border-2 border-border focus:border-primary outline-none text-base"
              />
              <button
                onClick={saveNewName}
                disabled={!newName.trim()}
                className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40"
              >
                {tr("save", lang)}
              </button>
            </div>
          )}
        </Section>

        {/* Quick buttons */}
        <Section title={tr("quickButtonsTitle", lang)} sub={tr("quickButtonsSub", lang, QUICK_ACTIONS_MIN, QUICK_ACTIONS_MAX)}>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_ACTIONS.map((a) => {
              const on = enabled.includes(a.id);
              const locked = (on && enabled.length <= QUICK_ACTIONS_MIN) || (!on && enabled.length >= QUICK_ACTIONS_MAX);
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className={cn(
                    "relative h-[72px] rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                    on ? "bg-primary/10 border-primary" : "bg-background border-border/60",
                    locked && !on && "opacity-40",
                  )}
                >
                  {on && (
                    <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <span className="text-2xl leading-none">{a.emoji}</span>
                  <span className="text-[11px] font-semibold">{a[lang]}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Display */}
        <Section title={tr("displayTitle", lang)}>
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { id: "he", label: "עברית" },
              { id: "ru", label: "Русский" },
            ]}
          />
          <Segmented
            value={theme === "system" ? "auto" : theme}
            onChange={setTheme}
            options={[
              { id: "dark", label: <><Moon className="w-4 h-4" />{tr("dark", lang)}</> },
              { id: "auto", label: <><SunMoon className="w-4 h-4" />{tr("autoTheme", lang)}</> },
              { id: "light", label: <><Sun className="w-4 h-4" />{tr("light", lang)}</> },
            ]}
          />
        </Section>

        {/* Info */}
        <Section title={tr("infoTitle", lang)}>
          <div className="divide-y divide-border/60 -my-1">
            <Link href="/guide" className="flex items-center gap-3 py-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="flex-1 font-medium text-sm">{tr("guide", lang)}</span>
              <Chevron className="w-4 h-4 text-muted-foreground" />
            </Link>
            <button onClick={openWhatsNew} className="w-full flex items-center gap-3 py-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="flex-1 font-medium text-sm text-start">{tr("whatsNewLink", lang)}</span>
              <Chevron className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            {tr("lastUpdated", lang, format(parseISO(LAST_UPDATE_DATE), "d.M.yyyy"))}
          </p>
        </Section>
      </div>
    </div>
  );
}
