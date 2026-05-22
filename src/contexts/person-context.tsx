import { createContext, useContext, useState } from "react";

const CURRENT_KEY = "person-name";
const KNOWN_KEY = "known-names";

type PersonContextType = {
  name: string | null;
  knownNames: string[];
  setName: (name: string) => void;
  clearName: () => void;
};

const PersonContext = createContext<PersonContextType>({} as PersonContextType);

function loadKnownNames(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KNOWN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function PersonProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState<string | null>(() =>
    localStorage.getItem(CURRENT_KEY),
  );
  const [knownNames, setKnownNames] = useState<string[]>(loadKnownNames);

  const setName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    localStorage.setItem(CURRENT_KEY, trimmed);
    setNameState(trimmed);
    // Add to known names list if not already there
    setKnownNames((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      localStorage.setItem(KNOWN_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearName = () => {
    localStorage.removeItem(CURRENT_KEY);
    setNameState(null);
  };

  return (
    <PersonContext.Provider value={{ name, knownNames, setName, clearName }}>
      {children}
    </PersonContext.Provider>
  );
}

export function usePerson() {
  return useContext(PersonContext);
}
