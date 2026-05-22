import { createContext, useContext, useState } from "react";

type PersonContextType = {
  name: string | null;
  setName: (name: string) => void;
  clearName: () => void;
};

const PersonContext = createContext<PersonContextType>({} as PersonContextType);

export function PersonProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState<string | null>(() =>
    localStorage.getItem("person-name"),
  );

  const setName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    localStorage.setItem("person-name", trimmed);
    setNameState(trimmed);
  };

  const clearName = () => {
    localStorage.removeItem("person-name");
    setNameState(null);
  };

  return (
    <PersonContext.Provider value={{ name, setName, clearName }}>
      {children}
    </PersonContext.Provider>
  );
}

export function usePerson() {
  return useContext(PersonContext);
}
