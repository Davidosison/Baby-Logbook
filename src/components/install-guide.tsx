import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";
import { X } from "lucide-react";

function isInstalled() {
  if (typeof window === "undefined") return true;
  const iosStandalone = (window.navigator as any).standalone === true;
  const pwaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  return iosStandalone || pwaStandalone;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function InstallGuide() {
  const { lang, dir } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<"ios" | "android">(isIOS() ? "ios" : "android");

  useEffect(() => {
    if (isInstalled()) return;
    if (localStorage.getItem("install-guide-dismissed")) return;
    // Short delay so it doesn't flash immediately on load
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem("install-guide-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  const steps = {
    ios: [
      tr("installIOS1", lang),
      tr("installIOS2", lang),
      tr("installIOS3", lang),
    ],
    android: [
      tr("installAndroid1", lang),
      tr("installAndroid2", lang),
      tr("installAndroid3", lang),
    ],
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[91] bg-card border-t border-border rounded-t-[2rem] p-6 pb-10 shadow-2xl"
        dir={dir}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-center text-xl font-bold mb-1">{tr("installTitle", lang)}</h2>
        <p className="text-center text-sm text-muted-foreground mb-5">{tr("installSubtitle", lang)}</p>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-muted rounded-2xl p-1 mb-5">
          <button
            onClick={() => setTab("ios")}
            className={[
              "flex-1 h-9 rounded-xl text-sm font-semibold transition-all",
              tab === "ios" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            ].join(" ")}
          >
            {tr("installIphone", lang)}
          </button>
          <button
            onClick={() => setTab("android")}
            className={[
              "flex-1 h-9 rounded-xl text-sm font-semibold transition-all",
              tab === "android" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
            ].join(" ")}
          >
            {tr("installAndroid", lang)}
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {steps[tab].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <span className="text-sm font-medium">{step}</span>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-95 transition-transform"
        >
          {tr("installDismiss", lang)}
        </button>
      </div>
    </>
  );
}
