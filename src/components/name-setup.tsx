import { useState } from "react";
import { usePerson } from "@/contexts/person-context";
import { useLanguage } from "@/contexts/language-context";
import { useGetFamilyMembers } from "@/lib/queries";
import { tr } from "@/lib/translations";
import { UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NameSetup() {
  const { name, knownNames, setName } = usePerson();
  const { lang, dir, setLang } = useLanguage();
  const [showInput, setShowInput] = useState(false);
  const [input, setInput] = useState("");

  // Fetch names used by other family members across all devices
  const { data: dbNames = [] } = useGetFamilyMembers();
  // Merge local names + DB names, deduplicated
  const allNames = [...new Set([...knownNames, ...dbNames])].sort();

  if (name !== null) return null;

  const handleSave = () => {
    if (input.trim()) setName(input.trim());
  };

  const LangPicker = () => (
    <div className="flex gap-2 justify-center w-full">
      <button
        onClick={() => setLang("he")}
        className={cn(
          "flex-1 h-10 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95",
          lang === "he"
            ? "bg-primary/10 border-primary text-primary"
            : "bg-card border-border text-muted-foreground"
        )}
      >
        🇮🇱 עברית
      </button>
      <button
        onClick={() => setLang("ru")}
        className={cn(
          "flex-1 h-10 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95",
          lang === "ru"
            ? "bg-primary/10 border-primary text-primary"
            : "bg-card border-border text-muted-foreground"
        )}
      >
        🇷🇺 Русский
      </button>
    </div>
  );

  // No saved names yet — show plain text input
  if (allNames.length === 0 || showInput) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8"
        dir={dir}
      >
        <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
          <div className="text-7xl">👶</div>

          <div>
            <h1 className="text-3xl font-bold mb-1">{tr("whoAreYou", lang)}</h1>
            <p className="text-sm text-muted-foreground">{tr("whoAreYouSub", lang)}</p>
          </div>

          <LangPicker />

          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder={tr("yourNamePlaceholder", lang)}
            className="w-full h-14 px-4 text-xl text-center rounded-2xl bg-card border-2 border-border focus:border-primary outline-none transition-colors"
            maxLength={30}
          />

          <button
            onClick={handleSave}
            disabled={!input.trim()}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-lg disabled:opacity-40 active:scale-95 transition-transform"
          >
            {tr("letsGo", lang)}
          </button>

          {allNames.length > 0 && (
            <button
              onClick={() => { setShowInput(false); setInput(""); }}
              className="text-sm text-muted-foreground underline"
            >
              {tr("backToList", lang)}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Known names exist — show picker
  return (
    <div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8"
      dir={dir}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
        <div className="text-7xl">👶</div>

        <div>
          <h1 className="text-3xl font-bold mb-1">{tr("whoIsLogging", lang)}</h1>
          <p className="text-sm text-muted-foreground">{tr("pickYourName", lang)}</p>
        </div>

        <LangPicker />

        <div className="w-full flex flex-col gap-3">
          {allNames.map((n) => (
            <button
              key={n}
              onClick={() => setName(n)}
              className="w-full h-16 rounded-2xl bg-card border-2 border-border hover:border-primary active:scale-95 transition-all flex items-center gap-3 px-5"
            >
              <UserCircle2 className="w-6 h-6 text-muted-foreground shrink-0" />
              <span className="text-xl font-bold flex-1 text-start">{n}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => { setShowInput(true); setInput(""); }}
          className="text-sm text-primary font-semibold underline"
        >
          {tr("otherPerson", lang)}
        </button>
      </div>
    </div>
  );
}
