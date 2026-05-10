import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";
import { LiveClock } from "./live-clock";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { formatDistanceToNow } from "date-fns";
import { he, ru } from "date-fns/locale";

export function PageHeader({ hebrewTitle, russianTitle }: { title?: string; hebrewTitle?: string; russianTitle?: string }) {
  const { lang, dir } = useLanguage();
  const { data: authStatus } = useGetAuthStatus({
    query: { queryKey: getGetAuthStatusQueryKey() },
  });

  const babyInfo = authStatus?.babyName ?? tr("babyTracker", lang);
  let ageInfo = "";
  if (authStatus?.babyBirthDate) {
    const locale = lang === "he" ? he : ru;
    const age = formatDistanceToNow(new Date(authStatus.babyBirthDate), { locale });
    ageInfo = ` · ${tr("agePrefix", lang)} ${age}`;
  }

  const title = lang === "he" ? hebrewTitle : (russianTitle ?? hebrewTitle);

  return (
    <div className="sticky top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border pt-safe" dir={dir}>
      <div className="px-4 py-3 flex flex-col items-center justify-center">
        <div className="w-full flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-muted-foreground">{babyInfo}{ageInfo}</span>
          <LiveClock />
        </div>
        {title && (
          <h1 className="text-2xl font-bold tracking-tight mt-1">{title}</h1>
        )}
      </div>
    </div>
  );
}
