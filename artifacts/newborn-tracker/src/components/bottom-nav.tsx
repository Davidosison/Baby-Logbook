import { Link, useLocation } from "wouter";
import { Home, Clock, Plus, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function BottomNav() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => location === path;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-4 pb-safe z-50">
        <Link href="/" className={cn("flex flex-col items-center justify-center w-16 h-full text-muted-foreground transition-colors", isActive("/") && "text-primary")}>
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link href="/history" className={cn("flex flex-col items-center justify-center w-16 h-full text-muted-foreground transition-colors", isActive("/history") && "text-primary")}>
          <Clock className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">History</span>
        </Link>

        <div className="relative -top-6">
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform hover-elevate">
                <Plus className="w-8 h-8" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[50vh] rounded-t-[2rem] bg-card border-border flex flex-col p-6">
              <VisuallyHidden>
                <SheetTitle>Log Event</SheetTitle>
              </VisuallyHidden>
              <div className="flex-1 flex flex-col justify-center gap-4">
                <Link href="/feeding" className="w-full flex items-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-2xl transition-colors">
                  <div className="flex-1 text-right ml-4">
                    <div className="text-2xl font-bold" dir="rtl">האכלה</div>
                    <div className="text-sm opacity-80 font-medium">Feeding</div>
                  </div>
                </Link>
                <Link href="/sleep" className="w-full flex items-center bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 p-4 rounded-2xl transition-colors">
                  <div className="flex-1 text-right ml-4">
                    <div className="text-2xl font-bold" dir="rtl">שינה</div>
                    <div className="text-sm opacity-80 font-medium">Sleep</div>
                  </div>
                </Link>
                <Link href="/diaper" className="w-full flex items-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-500 p-4 rounded-2xl transition-colors">
                  <div className="flex-1 text-right ml-4">
                    <div className="text-2xl font-bold" dir="rtl">טיטול</div>
                    <div className="text-sm opacity-80 font-medium">Diaper</div>
                  </div>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex flex-col items-center justify-center w-16 h-full text-muted-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-6 h-6 mb-1" /> : <Moon className="w-6 h-6 mb-1" />}
          <span className="text-[10px] font-medium">Theme</span>
        </button>
      </div>
      <div className="h-20" /> {/* Spacer for scroll area */}
    </>
  );
}