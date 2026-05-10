import { useState } from "react";
import { useLocation } from "wouter";
import { useLogFeeding, getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function FeedingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [amountMl, setAmountMl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const logFeeding = useLogFeeding({
    mutation: {
      onSuccess: () => {
        const today = format(new Date(), "yyyy-MM-dd");
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDailySummaryQueryKey({ date: today }) });
        setLocation("/");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logFeeding.mutate({
      data: {
        amountMl: amountMl ? parseInt(amountMl) : undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        notes: notes || undefined,
        startedAt: new Date().toISOString()
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      <PageHeader title="Feeding" hebrewTitle="האכלה" />
      
      <div className="p-4 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4 bg-blue-500/5 p-6 rounded-3xl border border-blue-500/20">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-600 dark:text-blue-400">Amount (ml)</label>
              <Input 
                type="number" 
                pattern="[0-9]*" 
                inputMode="numeric"
                value={amountMl}
                onChange={e => setAmountMl(e.target.value)}
                placeholder="e.g. 120"
                className="h-14 text-lg bg-card border-blue-500/20"
              />
            </div>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-medium">OR / AND</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-blue-600 dark:text-blue-400">Duration (minutes)</label>
              <Input 
                type="number" 
                pattern="[0-9]*" 
                inputMode="numeric"
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
                placeholder="e.g. 20"
                className="h-14 text-lg bg-card border-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <Textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Left side first..."
              className="resize-none h-24 bg-card"
            />
          </div>

          <Button 
            type="submit" 
            disabled={logFeeding.isPending || (!amountMl && !durationMinutes)}
            className="w-full h-16 text-lg font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
          >
            Save Feeding
          </Button>
          
        </form>
      </div>
    </div>
  );
}