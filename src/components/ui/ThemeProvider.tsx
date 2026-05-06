"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme:     Theme;
  resolved:  "light" | "dark";
  setTheme:  (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme:    "system",
  resolved: "light",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme,    setThemeState] = useState<Theme>("system");
  const [resolved, setResolved]   = useState<"light" | "dark">("light");
  const [mounted,  setMounted]    = useState(false);

  useEffect(() => {
    // Đọc preference từ localStorage
    const saved = (localStorage.getItem("theme") as Theme) ?? "system";
    setThemeState(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    let isDark: boolean;

    if (theme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      isDark = theme === "dark";
    }

    root.classList.toggle("dark", isDark);
    setResolved(isDark ? "dark" : "light");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Lắng nghe system theme thay đổi
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
      setResolved(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
