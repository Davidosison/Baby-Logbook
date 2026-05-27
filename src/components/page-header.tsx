import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@/lib/queries";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { formatDistanceToNow } from "date-fns";
import { he, ru } from "date-fns/locale";
import { ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title?: string;
  hebrewTitle?: string;
  russianTitle?: string;
  showBack?: boolean;
  showGuide?: boolean;
}

export function PageHeader({ hebrewTitle, russianTitle, showBack, showGuide }: PageHeaderProps) {
  const { lang, dir } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: authStatus } = useGetAuthStatus({
    query: { queryKey: getGetAuthStatusQueryKey() },
  });

  let ageInfo = "";
  if (authStatus?.babyBirthDate) {
    const locale = lang === "he" ? he : ru;
    const age = formatDistanceToNow(new Date(authStatus.babyBirthDate), { locale });
    ageInfo = `${tr("agePrefix", lang)} ${age}`;
  }

  const title = lang === "he" ? (hebrewTitle ?? tr("appName", lang)) : (russianTitle ?? tr("appName", lang));
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const showSideButton = showBack || showGuide;

  return (
    <div className="sticky top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border pt-safe" dir={dir}>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => setLocation("/")}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-accent active:bg-accent/80 transition-colors shrink-0 text-muted-foreground"
              aria-label="back"
            >
              <BackIcon className="w-5 h-5" />
            </button>
          )}
          {showGuide && !showBack && (
            <button
              onClick={() => setLocation("/guide")}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-accent active:bg-accent/80 transition-colors shrink-0 text-muted-foreground"
              aria-label="guide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {ageInfo && (
              <p className="text-xs text-muted-foreground mt-0.5">{ageInfo}</p>
            )}
          </div>
          {showSideButton && <div className="w-9" />}
        </div>
      </div>
    </div>
  );
}
