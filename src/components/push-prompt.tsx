import { useState } from "react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "push-prompt-dismissed";

export function PushPrompt() {
  const { permission, isSubscribed, requestPermission } = usePushNotifications();
  const { lang, dir } = useLanguage();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY));
  const [loading, setLoading] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  if (permission === "unsupported" || permission === "denied") return null;
  if (permission === "granted") return null;
  if (dismissed) return null;
  if (isSubscribed && !justEnabled) return null;

  const handleEnable = async () => {
    setLoading(true);
    const success = await requestPermission();
    setLoading(false);
    if (success) {
      setJustEnabled(true);
      setTimeout(() => {
        localStorage.setItem(DISMISSED_KEY, "1");
        setDismissed(true);
      }, 2500);
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
        dir={dir}
      >
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {justEnabled ? (
              <>
                <div className="font-semibold text-sm">{tr("pushEnabledTitle", lang)}</div>
                <div className="text-xs text-muted-foreground">{tr("pushEnabledSub", lang)}</div>
              </>
            ) : (
              <>
                <div className="font-semibold text-sm">{tr("enablePushTitle", lang)}</div>
                <div className="text-xs text-muted-foreground">{tr("enablePushSub", lang)}</div>
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
                {loading ? "..." : tr("enable", lang)}
              </button>
              <button
                onClick={() => { localStorage.setItem(DISMISSED_KEY, "1"); setDismissed(true); }}
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
