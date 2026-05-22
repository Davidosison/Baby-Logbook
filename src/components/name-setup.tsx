import { useState } from "react";
import { usePerson } from "@/contexts/person-context";
import { useLanguage } from "@/contexts/language-context";
import { tr } from "@/lib/translations";

export function NameSetup() {
  const { name, setName } = usePerson();
  const { lang, dir } = useLanguage();
  const [input, setInput] = useState("");

  if (name !== null) return null;

  const handleSave = () => {
    if (input.trim()) setName(input.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8"
      dir={dir}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="text-7xl">👶</div>

        <div>
          <h1 className="text-3xl font-bold mb-1">
            {tr("whoAreYou", lang)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tr("whoAreYouSub", lang)}
          </p>
        </div>

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
      </div>
    </div>
  );
}
