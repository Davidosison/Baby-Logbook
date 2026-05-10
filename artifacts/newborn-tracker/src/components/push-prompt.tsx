import { useState } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Bell, BellOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PushPrompt() {
  const { permission, isSubscribed, requestPermission, unsubscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  // Don't show if unsupported, denied, or already subscribed (and not just enabled), or dismissed
  if (permission === "unsupported" || permission === "denied") return null;
  if (dismissed) return null;
  if (isSubscribed && !justEnabled) return null;

  const handleEnable = async () => {
    setLoading(true);
    const success = await requestPermission();
    setLoading(false);
    if (success) {
      setJustEnabled(true);
      setTimeout(() => setDismissed(true), 2500);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="push-prompt"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed bottom-24 left-4 right-4 z-50"
        dir="rtl"
      >
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {justEnabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <Bell className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {justEnabled ? (
              <>
                <div className="font-semibold text-sm">התראות מופעלות</div>
                <div className="text-xs text-muted-foreground">תקבלו התראה כשהתינוק לא הוזן 3 שעות</div>
              </>
            ) : (
              <>
                <div className="font-semibold text-sm">הפעל התראות האכלה</div>
                <div className="text-xs text-muted-foreground">קבלו תזכורת כל 3 שעות</div>
              </>
            )}
          </div>
          {!justEnabled && (
            <>
              <button
                onClick={handleEnable}
                disabled={loading}
                data-testid="button-enable-push"
                className="text-sm font-semibold text-primary px-3 py-1.5 rounded-xl bg-primary/10 active:bg-primary/20 transition-colors shrink-0"
              >
                {loading ? "..." : "הפעל"}
              </button>
              <button
                onClick={() => setDismissed(true)}
                data-testid="button-dismiss-push"
                className="text-muted-foreground p-1 rounded-full hover:bg-accent transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
