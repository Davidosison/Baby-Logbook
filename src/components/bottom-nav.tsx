import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Clock, Plus, Moon, Sun, Settings, CalendarDays, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { usePerson } from "@/contexts/person-context";
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
  const [addOpen, setAddOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const isActive = (path: string) => location === path;

  const navItem = (path: string, Icon: React.ElementType, label: string, testId: string) => (
    <Link
      href={path}
      data-testid={testId}
      className={cn(
        "flex flex-col items-center justify-center w-14 h-full text-muted-foreground transition-colors",
        isActive(path) && "text-primary",
      )}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 h-20 bg-background/90 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 pb-safe z-50"
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
            <SheetContent side="bottom" className="h-[50vh] rounded-t-[2rem] bg-card border-border flex flex-col p-6" dir={dir}>
              <VisuallyHidden>
                <SheetTitle>{tr("logEvent", lang)}</SheetTitle>
              </VisuallyHidden>
              <div className="flex-1 flex flex-col justify-center gap-4">
                <Link href="/feeding" data-testid="nav-feeding"
                  onClick={() => setAddOpen(false)}
                  className="w-full flex items-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-2xl transition-colors">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-2xl font-bold">{tr("feeding", lang)}</div>
                  </div>
                </Link>
                <Link href="/sleep" data-testid="nav-sleep"
                  onClick={() => setAddOpen(false)}
                  className="w-full flex items-center bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 p-4 rounded-2xl transition-colors">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-2xl font-bold">{tr("sleep", lang)}</div>
                  </div>
                </Link>
                <Link href="/diaper" data-testid="nav-diaper"
                  onClick={() => setAddOpen(false)}
                  className="w-full flex items-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 p-4 rounded-2xl transition-colors">
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-2xl font-bold">{tr("diaper", lang)}</div>
                  </div>
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
              className="flex flex-col items-center justify-center w-14 h-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{tr("settings", lang)}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2rem] bg-card border-border p-6" dir={dir}>
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

            {/* Theme */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{tr("theme", lang)}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2",
                    theme === "dark"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  <Moon className="w-4 h-4" />
                  {tr("dark", lang)}
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "h-14 rounded-2xl border-2 font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2",
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
      <div className="h-20" />
    </>
  );
}
