import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetActiveSleep, getGetActiveSleepQueryKey, useStartSleep, useStopSleep, getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function SleepPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: activeSleep, isLoading } = useGetActiveSleep({
    query: { queryKey: getGetActiveSleepQueryKey() }
  });

  const [localElapsed, setLocalElapsed] = useState(0);

  useEffect(() => {
    if (activeSleep?.event && activeSleep.event.startedAt) {
      const start = new Date(activeSleep.event.startedAt).getTime();
      setLocalElapsed(Math.floor((Date.now() - start) / 60000));
      
      const interval = setInterval(() => {
        setLocalElapsed(Math.floor((Date.now() - start) / 60000));
      }, 60000);
      return () => clearInterval(interval);
    } else {
      setLocalElapsed(0);
    }
  }, [activeSleep]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetActiveSleepQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
  };

  const startSleep = useStartSleep({
    mutation: { onSuccess: invalidateAll }
  });

  const stopSleep = useStopSleep({
    mutation: { 
      onSuccess: () => {
        invalidateAll();
        setLocation("/");
      }
    }
  });

  const isSleeping = !!activeSleep?.event;

  return (
    <div className="min-h-[100dvh] bg-background pb-32 flex flex-col" dir="rtl">
      <PageHeader hebrewTitle="שינה" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        
        {isSleeping ? (
          <div className="text-center mb-12">
            <div className="text-7xl font-light tracking-tighter tabular-nums text-purple-600 dark:text-purple-400 mb-2">
              {Math.floor(localElapsed / 60)}:{String(localElapsed % 60).padStart(2, '0')}
            </div>
            <div className="text-lg text-muted-foreground font-medium">ישן</div>
          </div>
        ) : (
          <div className="text-center mb-12">
            <div className="text-2xl text-muted-foreground font-medium">התינוק ער</div>
          </div>
        )}

        <button
          onClick={() => isSleeping ? stopSleep.mutate({}) : startSleep.mutate({})}
          disabled={startSleep.isPending || stopSleep.isPending || isLoading}
          data-testid="button-sleep-toggle"
          className={`w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 active:scale-95 ${
            isSleeping 
              ? "bg-card border-4 border-purple-500 text-foreground" 
              : "bg-purple-600 border-4 border-purple-600 text-white shadow-purple-500/30 hover:bg-purple-700"
          }`}
        >
          <div className="text-4xl font-bold mb-2" dir="rtl">
            {isSleeping ? "התעורר" : "שינה"}
          </div>
          <div className="text-lg opacity-80" dir="rtl">
            {isSleeping ? "להפסיק שינה" : "להתחיל שינה"}
          </div>
        </button>

      </div>
    </div>
  );
}
