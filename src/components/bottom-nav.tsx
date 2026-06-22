import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Clock, Plus, Moon, Sun, SunMoon, Settings, CalendarDays, UserCircle2, Minus, Bath, Utensils, Droplet, Pill, Syringe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
import { useGoals } from "@/hooks/use-goals";
import { useLogVitaminD } from "@/lib/queries";
import { tr } from "@/lib/translations";
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function BottomNav() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, dir } = useLanguage();
  const { name, setName } = usePerson();
  const { goals, setGoal } = useGoals();
  const [addOpen, setAddOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const logVitaminD = useLogVitaminD();

  const isActive = (path: string) => location === path;

  const navItem = (path: string, Icon: React.ElementType, label: string, testId: string) => (
    <Link
      href={path}
      data-testid={testId}
      className={cn(
        "flex flex-col items-center justify-center w-16 h-full text-muted-foreground transition-colors",
        isActive(path) && "text-primary",
      )}
    >
      <Icon className="w-7 h-7 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 h-24 card-surface !rounded-none border-t border-border flex items-center justify-around px-2 pb-safe z-50"
        dir={dir}
      >
        {/* Home */}
        {navItem("/", Home, tr("home", lang), "nav-home")}

        {/* History */}
        {navItem("/history", Clock, tr("history", lang), "nav-history")}

        {/* Plus — center floating */}
        <div className="relative -top-6 flex-shrink-0">
          <Sheet open={addOpen} onOpenChange={setAddOpen}>
            <SheetTrigger asChild>
              <button
                data-testid="nav-add"
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/30 active:scale-95 transition-transform"
              >
                <Plus className="w-8 h-8" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2rem] card-surface border-white/15 dark:border-white/8 flex flex-col p-6" dir={dir}>
              <VisuallyHidden>
                <SheetTitle>{tr("logEvent", lang)}</SheetTitle>
              </VisuallyHidden>
              <div className="flex-1 flex flex-col justify-center gap-3 py-4">
                <Link href="/feeding" data-testid="nav-feeding"
                  onClick={() => setAddOpen(false)}
                  className="w-full flex items-center bg-sky-400/10 hover:bg-sky-400/20 text-sky-600 dark:text-sky-400 p-4 rounded-2xl transition-colors">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-xl font-bold">{tr("feeding", lang)}</div>
                  </div>
                  <Utensils className="w-5 h-5 opacity-60" />
                </Link>
                <Link href="/sleep" data-testid="nav-sleep"
                  onClick={() => setAddOpen(false)}
                  className="w-full flex items-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-4 rounded-2xl transition-colors">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-xl font-bold">{tr("sleep", lang)}</div>
                  </div>
                  <Moon className="w-5 h-5 opacity-60" />
                </Link>
                <Link href="/diaper" data-testid="nav-diaper"
                  onClick={() => setAddOpen(false)}
                  className="w-full flex items-center bg-amber-400/10 hover:bg-amber-400/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl transition-colors">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-xl font-bold">{tr("diaper", lang)}</div>
                  </div>
                  <Droplet className="w-5 h-5 opacity-60" />
                </Link>
                <Link href="/bath" data-testid="nav-bath"
                  onClick={() => setAddOpen(false)}
                  className="w-full flex items-center bg-teal-400/10 hover:bg-teal-400/20 text-teal-600 dark:text-teal-400 p-4 rounded-2xl transition-colors">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-xl font-bold">{tr("bath", lang)}</div>
                  </div>
                  <Bath className="w-5 h-5 opacity-60" />
                </Link>
                <button data-testid="nav-vitamin-d"
                  onClick={() => {
                    logVitaminD.mutate({ loggedBy: name ?? null });
                    setAddOpen(false);
                  }}
                  disabled={logVitaminD.isPending}
                  className="w-full flex items-center bg-violet-400/10 hover:bg-violet-400/20 text-violet-600 dark:text-violet-400 p-4 rounded-2xl transition-colors disabled:opacity-50">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-xl font-bold">{tr("vitamin_d", lang)}</div>
                  </div>
                  <Pill className="w-5 h-5 opacity-60" />
                </button>
                <Link href="/medications" data-testid="nav-medications"
                  onClick={() => setAddOpen(false)}
                  className="w-full flex items-center bg-rose-400/10 hover:bg-rose-400/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl transition-colors">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-xl font-bold">{tr("medication", lang)}</div>
                  </div>
                  <Syringe className="w-5 h-5 opacity-60" />
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Schedule */}
        {navItem("/schedule", CalendarDays, tr("schedule", lang), "nav-schedule")}

        {/* Settings */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              data-testid="nav-settings"
              className="flex flex-col items-center justify-center w-16 h-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-7 h-7 mb-1" />
              <span className="text-xs font-medium">{tr("settings", lang)}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2rem] card-surface border-white/15 dark:border-white/8 p-6" dir={dir}>
            <SheetTitle className="text-xl font-bold text-center mb-6">{tr("settings", lang)}</SheetTitle>

            {/* Language */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{tr("language", lang)}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLang("he")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-base transition-all active:scale-95",
                    lang === "he"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  עברית
                </button>
                <button
                  onClick={() => setLang("ru")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-base transition-all active:scale-95",
                    lang === "ru"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  Русский
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{tr("yourName", lang)}</p>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={tr("yourNamePlaceholder", lang)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && nameInput.trim()) {
                        setName(nameInput.trim());
                        setEditingName(false);
                      }
                    }}
                    className="flex-1 h-12 px-3 rounded-2xl bg-background border-2 border-border focus:border-primary outline-none text-base"
                    maxLength={30}
                  />
                  <button
                    onClick={() => {
                      if (nameInput.trim()) {
                        setName(nameInput.trim());
                        setEditingName(false);
                      }
                    }}
                    className="h-12 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm"
                  >
                    {tr("letsGo", lang)}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setNameInput(name ?? ""); setEditingName(true); }}
                  className="w-full h-14 rounded-2xl border-2 border-border bg-background flex items-center gap-3 px-4 active:scale-95 transition-transform"
                >
                  <UserCircle2 className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-base font-medium text-left">
                    {name ? tr("helloName", lang, name) : tr("whoAreYou", lang)}
                  </span>
                  <span className="text-xs text-primary font-semibold">{tr("changeName", lang)}</span>
                </button>
              )}
            </div>

            {/* Goals */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{tr("dailyGoals", lang)}</p>
              <div className="space-y-3">
                {/* Feeding goal */}
                <div className="bg-background border border-border rounded-2xl p-3">
                  <p className="text-xs text-muted-foreground mb-2">{tr("feedings", lang)}</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setGoal("feedingGoalMin", Math.max(1, goals.feedingGoalMin - 1))} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center active:scale-95"><Minus className="w-4 h-4 text-primary" /></button>
                      <span className="w-6 text-center font-bold text-base">{goals.feedingGoalMin}</span>
                      <button onClick={() => setGoal("feedingGoalMin", Math.min(goals.feedingGoalMax - 1, goals.feedingGoalMin + 1))} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center active:scale-95"><Plus className="w-4 h-4 text-primary" /></button>
                    </div>
                    <span className="text-muted-foreground text-sm">–</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setGoal("feedingGoalMax", Math.max(goals.feedingGoalMin + 1, goals.feedingGoalMax - 1))} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center active:scale-95"><Minus className="w-4 h-4 text-primary" /></button>
                      <span className="w-6 text-center font-bold text-base">{goals.feedingGoalMax}</span>
                      <button onClick={() => setGoal("feedingGoalMax", Math.min(20, goals.feedingGoalMax + 1))} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center active:scale-95"><Plus className="w-4 h-4 text-primary" /></button>
                    </div>
                  </div>
                </div>
                {/* Sleep goal */}
                <div className="bg-background border border-border rounded-2xl p-3">
                  <p className="text-xs text-muted-foreground mb-2">{tr("sleep", lang)}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setGoal("sleepGoalHours", Math.max(8, goals.sleepGoalHours - 1))} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center active:scale-95"><Minus className="w-4 h-4 text-primary" /></button>
                    <span className="flex-1 text-center font-bold text-base">{goals.sleepGoalHours}{lang === "he" ? " שע'" : " ч."}</span>
                    <button onClick={() => setGoal("sleepGoalHours", Math.min(22, goals.sleepGoalHours + 1))} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center active:scale-95"><Plus className="w-4 h-4 text-primary" /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Theme */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{tr("theme", lang)}</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-1",
                    theme === "dark"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  <Moon className="w-4 h-4" />
                  {tr("dark", lang)}
                </button>
                <button
                  onClick={() => setTheme("auto")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-1",
                    theme === "auto"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  <SunMoon className="w-4 h-4" />
                  {tr("autoTheme", lang)}
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95 flex flex-col items-center justify-center gap-1",
                    theme === "light"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  <Sun className="w-4 h-4" />
                  {tr("light", lang)}
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="h-24" />
    </>
  );
}
