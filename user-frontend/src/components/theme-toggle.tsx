"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";
import { useLocaleText } from "@/components/i18n/locale-text";

export function ThemeToggle() {
  const t = useLocaleText();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted sm:h-10 sm:w-10"
      aria-label={
        isDark
          ? t("Switch to light mode", "ប្តូរទៅរបៀបភ្លឺ")
          : t("Switch to dark mode", "ប្តូរទៅរបៀបងងឹត")
      }
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
