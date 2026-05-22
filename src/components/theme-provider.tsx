import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system" | "auto"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

function getAutoTheme(): "dark" | "light" {
  const h = new Date().getHours();
  return h >= 6 && h < 20 ? "light" : "dark";
}

const THEME_COLORS = { light: "#faf8f4", dark: "#0d121b" };

function applyThemeColor(resolved: "dark" | "light") {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = THEME_COLORS[resolved];
  document.head.appendChild(meta);
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      applyThemeColor(systemTheme)
      return
    }

    if (theme === "auto") {
      const apply = () => {
        const resolved = getAutoTheme()
        root.classList.remove("light", "dark")
        root.classList.add(resolved)
        applyThemeColor(resolved)
      }
      apply()
      const interval = setInterval(apply, 60_000)
      return () => clearInterval(interval)
    }

    root.classList.add(theme)
    applyThemeColor(theme as "dark" | "light")
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}