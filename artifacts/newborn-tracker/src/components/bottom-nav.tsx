import { Link, useLocation } from "wouter";
import { Home, Clock, Plus, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function BottomNav() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { lang, setLang, dir } = useLanguage();

  const isActive = (path: string) => location === path;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 pb-safe z-50"
        dir={dir}
      >
        {/* Home */}
        <Link
          href="/"
          data-testid="nav-home"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-muted-foreground transition-colors",
            isActive("/") && "text-primary",
          )}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">{tr("home", lang)}</span>
        </Link>

        {/* History */}
        <Link
          href="/history"
          data-testid="nav-history"
          className={cn(
            "flex flex-col items-center justify-center w-14 h-full text-muted-foreground transition-colors",
            isActive("/history") && "text-primary",
          )}
        >
          <Clock className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">{tr("history", lang)}</span>
        </Link>

        {/* Plus — center, floating */}
        <div className="relative -top-6 flex-shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <button
                data-testid="nav-add"
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <Plus className="w-8 h-8" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[50vh] rounded-t-[2rem] bg-card border-border flex flex-col p-6" dir={dir}>
              <VisuallyHidden>
                <SheetTitle>{tr("logEvent", lang)}</SheetTitle>
              </VisuallyHidden>
              <div className="flex-1 flex flex-col justify-center gap-4">
                <Link
                  href="/feeding"
                  data-testid="nav-feeding"
                  className="w-full flex items-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-2xl transition-colors"
                >
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-2xl font-bold">{tr("feeding", lang)}</div>
                  </div>
                </Link>
                <Link
                  href="/sleep"
                  data-testid="nav-sleep"
                  className="w-full flex items-center bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 p-4 rounded-2xl transition-colors"
                >
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-2xl font-bold">{tr("sleep", lang)}</div>
                  </div>
                </Link>
                <Link
                  href="/diaper"
                  data-testid="nav-diaper"
                  className="w-full flex items-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 p-4 rounded-2xl transition-colors"
                >
                  <div className={cn("flex-1", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="text-2xl font-bold">{tr("diaper", lang)}</div>
                  </div>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Language toggle */}
        <button
          data-testid="nav-language"
          onClick={() => setLang(lang === "he" ? "ru" : "he")}
          className="flex flex-col items-center justify-center w-14 h-full text-muted-foreground hover:text-foreground transition-colors"
          title={lang === "he" ? "Switch to Russian" : "Переключить на иврит"}
        >
          <span className="text-lg font-bold leading-none mb-1">
            {lang === "he" ? "РУ" : "עב"}
          </span>
          <span className="text-[10px] font-medium">
            {lang === "he" ? "Рус" : "עברית"}
          </span>
        </button>

        {/* Theme toggle */}
        <button
          data-testid="nav-theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex flex-col items-center justify-center w-14 h-full text-muted-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-6 h-6 mb-1" /> : <Moon className="w-6 h-6 mb-1" />}
          <span className="text-[10px] font-medium">{tr("theme", lang)}</span>
        </button>
      </div>
      <div className="h-20" />
    </>
  );
}
