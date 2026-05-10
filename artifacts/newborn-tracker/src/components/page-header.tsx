import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";
import { LiveClock } from "./live-clock";
import { formatDistanceToNow } from "date-fns";

export function PageHeader({ hebrewTitle }: { title?: string; hebrewTitle?: string }) {
  const { data: authStatus } = useGetAuthStatus({
    query: {
      queryKey: getGetAuthStatusQueryKey()
    }
  });

  const babyInfo = authStatus?.babyName ? authStatus.babyName : "מעקב תינוק";
  let ageInfo = "";
  if (authStatus?.babyBirthDate) {
    const age = formatDistanceToNow(new Date(authStatus.babyBirthDate));
    ageInfo = ` · בן/בת ${age}`;
  }

  return (
    <div className="sticky top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border pt-safe" dir="rtl">
      <div className="px-4 py-3 flex flex-col items-center justify-center">
        <div className="w-full flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-muted-foreground">{babyInfo}{ageInfo}</span>
          <LiveClock />
        </div>
        {hebrewTitle && (
          <h1 className="text-2xl font-bold tracking-tight mt-1">{hebrewTitle}</h1>
        )}
      </div>
    </div>
  );
}
