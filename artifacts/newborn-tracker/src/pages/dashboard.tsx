import { useListEvents, getListEventsQueryKey, useGetRecentActivity, getGetRecentActivityQueryKey, useGetDailySummary, getGetDailySummaryQueryKey, useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Droplet, Moon, Utensils } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function EventIcon({ type, className }: { type: string, className?: string }) {
  if (type === "feeding") return <Utensils className={cn("w-5 h-5", className)} />;
  if (type === "sleep") return <Moon className={cn("w-5 h-5", className)} />;
  if (type === "diaper") return <Droplet className={cn("w-5 h-5", className)} />;
  return null;
}

export default function DashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  
  const { data: events, isLoading: isLoadingEvents, refetch: refetchEvents } = useListEvents({ date: today }, {
    query: { queryKey: getListEventsQueryKey({ date: today }) }
  });
  
  const { data: recent, isLoading: isLoadingRecent, refetch: refetchRecent } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() }
  });

  const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useGetDailySummary({ date: today }, {
    query: { queryKey: getGetDailySummaryQueryKey({ date: today }) }
  });

  const handleRefresh = () => {
    refetchEvents();
    refetchRecent();
    refetchSummary();
  };

  const getRecentText = (mins: number | null | undefined) => {
    if (mins === null || mins === undefined) return "Never";
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${hrs}h ${m}m ago` : `${hrs}h ago`;
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      <PageHeader title="Dashboard" hebrewTitle="סיכום" />
      
      <div className="p-4 space-y-6">
        {/* Recent Activity Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-card-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Utensils className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-sm font-medium mb-1">Feeding</div>
            <div className="text-xs text-muted-foreground font-medium">{getRecentText(recent?.lastFeedingMinutesAgo)}</div>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Moon className="w-6 h-6 text-purple-500 mb-2" />
            <div className="text-sm font-medium mb-1">Sleep</div>
            <div className="text-xs text-muted-foreground font-medium">{getRecentText(recent?.lastSleepMinutesAgo)}</div>
          </div>
          <div className="bg-card border border-card-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Droplet className="w-6 h-6 text-amber-500 mb-2" />
            <div className="text-sm font-medium mb-1">Diaper</div>
            <div className="text-xs text-muted-foreground font-medium">{getRecentText(recent?.lastDiaperMinutesAgo)}</div>
          </div>
        </div>

        {/* Daily Progress */}
        {summary && (
          <div className="bg-card border border-card-border rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="font-semibold text-lg">Daily Goals</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Feedings</span>
                <span className="text-muted-foreground">{summary.feedingCount} / {summary.feedingGoalMin}-{summary.feedingGoalMax}</span>
              </div>
              <Progress value={Math.min(100, (summary.feedingCount / summary.feedingGoalMin) * 100)} className="h-2 bg-secondary" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Sleep</span>
                <span className="text-muted-foreground">{Math.floor(summary.totalSleepMinutes / 60)}h {summary.totalSleepMinutes % 60}m</span>
              </div>
              <Progress value={Math.min(100, (summary.totalSleepMinutes / summary.sleepGoalMinutes) * 100)} className="h-2 bg-secondary [&>div]:bg-purple-500" />
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Today's Timeline</h3>
            <button onClick={handleRefresh} className="text-sm text-primary font-medium p-2 -mr-2 active:opacity-50">Refresh</button>
          </div>
          
          <div className="space-y-4">
            {isLoadingEvents && <div className="text-center text-muted-foreground py-8 animate-pulse">Loading...</div>}
            {!isLoadingEvents && events?.length === 0 && (
              <div className="text-center text-muted-foreground py-8 bg-card border border-border rounded-2xl">
                No events today yet.
              </div>
            )}
            
            {events?.map((event, i) => (
              <div key={event.id} className="flex gap-4 relative">
                {i !== events.length - 1 && (
                  <div className="absolute top-10 left-6 bottom-[-16px] w-[2px] bg-border z-0" />
                )}
                <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center z-10 bg-card border border-border shadow-sm">
                  <EventIcon 
                    type={event.type} 
                    className={cn(
                      event.type === 'feeding' && "text-blue-500",
                      event.type === 'sleep' && "text-purple-500",
                      event.type === 'diaper' && "text-amber-500"
                    )} 
                  />
                </div>
                <div className="flex-1 bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold capitalize">{event.type}</span>
                    <span className="text-xs text-muted-foreground font-medium">{format(new Date(event.startedAt), "HH:mm")}</span>
                  </div>
                  
                  {event.type === 'feeding' && (
                    <div className="text-sm text-muted-foreground">
                      {event.amountMl ? `${event.amountMl} ml` : ''} 
                      {event.amountMl && event.durationMinutes ? ' · ' : ''}
                      {event.durationMinutes ? `${event.durationMinutes} min` : ''}
                    </div>
                  )}
                  
                  {event.type === 'sleep' && (
                    <div className="text-sm text-muted-foreground">
                      {event.isActive ? 'Sleeping now...' : event.durationMinutes ? `${Math.floor(event.durationMinutes/60)}h ${event.durationMinutes%60}m` : ''}
                    </div>
                  )}
                  
                  {event.type === 'diaper' && (
                    <div className="text-sm text-muted-foreground capitalize">
                      {event.diaperType}
                    </div>
                  )}
                  
                  {event.notes && <div className="text-sm mt-2 italic opacity-80">{event.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}