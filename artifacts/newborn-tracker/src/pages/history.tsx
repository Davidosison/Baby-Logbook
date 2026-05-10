import { useState } from "react";
import { useListEvents, getListEventsQueryKey, useDeleteEvent, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { format } from "date-fns";
import { Droplet, Moon, Utensils, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function EventIcon({ type, className }: { type: string, className?: string }) {
  if (type === "feeding") return <Utensils className={cn("w-5 h-5", className)} />;
  if (type === "sleep") return <Moon className={cn("w-5 h-5", className)} />;
  if (type === "diaper") return <Droplet className={cn("w-5 h-5", className)} />;
  return null;
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: events, isLoading } = useListEvents({ limit: 100 }, {
    query: { queryKey: getListEventsQueryKey({ limit: 100 }) }
  });

  const deleteEvent = useDeleteEvent({
    mutation: {
      onSuccess: () => {
        setDeleteId(null);
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey() });
      }
    }
  });

  const groupedEvents = events?.reduce((acc, event) => {
    const date = format(new Date(event.startedAt), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      <PageHeader title="History" hebrewTitle="היסטוריה" />
      
      <div className="p-4 space-y-8">
        {isLoading && <div className="text-center text-muted-foreground py-8 animate-pulse">Loading history...</div>}
        
        {!isLoading && events?.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No events recorded yet.
          </div>
        )}

        {groupedEvents && Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="space-y-4">
            <h3 className="font-semibold text-lg sticky top-20 bg-background/95 backdrop-blur py-2 z-10">
              {format(new Date(date), "EEEE, MMMM d")}
            </h3>
            
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div key={event.id} className="flex gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm items-center">
                  <div className={cn(
                    "w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-background border border-border",
                    event.type === 'feeding' && "text-blue-500",
                    event.type === 'sleep' && "text-purple-500",
                    event.type === 'diaper' && "text-amber-500"
                  )}>
                    <EventIcon type={event.type} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold capitalize">{event.type}</span>
                      <span className="text-xs text-muted-foreground font-medium shrink-0 ml-2">{format(new Date(event.startedAt), "HH:mm")}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground truncate">
                      {event.type === 'feeding' && (
                        <>
                          {event.amountMl ? `${event.amountMl} ml` : ''} 
                          {event.amountMl && event.durationMinutes ? ' · ' : ''}
                          {event.durationMinutes ? `${event.durationMinutes} min` : ''}
                        </>
                      )}
                      
                      {event.type === 'sleep' && (
                        <>{event.isActive ? 'Sleeping...' : event.durationMinutes ? `${Math.floor(event.durationMinutes/60)}h ${event.durationMinutes%60}m` : ''}</>
                      )}
                      
                      {event.type === 'diaper' && (
                        <span className="capitalize">{event.diaperType}</span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setDeleteId(event.id)}
                    className="w-10 h-10 shrink-0 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 h-12 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteEvent.mutate({ id: deleteId })}
              className="h-12 rounded-xl bg-destructive hover:bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}