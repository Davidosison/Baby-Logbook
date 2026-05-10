import { useState } from "react";
import { useLocation } from "wouter";
import { useLogDiaper, getListEventsQueryKey, getGetRecentActivityQueryKey, getGetDailySummaryQueryKey } from "@workspace/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";

export default function DiaperPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [diaperType, setDiaperType] = useState<'pee'|'poop'|'both'|null>(null);
  const [notes, setNotes] = useState("");

  const logDiaper = useLogDiaper({
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
    if (!diaperType) return;
    
    logDiaper.mutate({
      data: {
        diaperType,
        notes: notes || undefined,
        startedAt: new Date().toISOString()
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-32" dir="rtl">
      <PageHeader hebrewTitle="טיטול" />
      
      <div className="p-4 max-w-md mx-auto mt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              data-testid="button-diaper-pee"
              onClick={() => setDiaperType(diaperType === 'pee' ? null : diaperType === 'poop' ? 'both' : diaperType === 'both' ? 'poop' : 'pee')}
              className={`h-32 rounded-3xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${
                diaperType === 'pee' || diaperType === 'both'
                  ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-400"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              <div className="text-3xl font-bold">פיפי</div>
            </button>

            <button
              type="button"
              data-testid="button-diaper-poop"
              onClick={() => setDiaperType(diaperType === 'poop' ? null : diaperType === 'pee' ? 'both' : diaperType === 'both' ? 'pee' : 'poop')}
              className={`h-32 rounded-3xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${
                diaperType === 'poop' || diaperType === 'both'
                  ? "bg-orange-800/20 border-orange-800 text-orange-900 dark:text-orange-600"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              <div className="text-3xl font-bold">קקי</div>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">הערות (אופציונלי)</label>
            <Textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="לדוגמה: הפריחה נראית טוב יותר..."
              className="resize-none h-24 bg-card"
              data-testid="input-diaper-notes"
            />
          </div>

          <Button 
            type="submit" 
            disabled={logDiaper.isPending || !diaperType}
            data-testid="button-save-diaper"
            className="w-full h-16 text-lg font-bold rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-500/20 active:scale-95 transition-transform"
          >
            שמור טיטול
          </Button>
          
        </form>
      </div>
    </div>
  );
}
