"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "@/components/ui/emoji-icons";
import { useAdminText } from "@/components/layout/admin-language-selector";
import {
  applyThemeMode,
  getServerThemeModeSnapshot,
  getThemeModeSnapshot,
  subscribeToTheme,
  syncThemeMode,
} from "@/lib/admin-theme";

export function AdminThemeToggle() {
  const t = useAdminText();
  const themeMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeModeSnapshot,
    getServerThemeModeSnapshot
  );
  const isDark = themeMode === "dark";

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    syncThemeMode();
    preference.addEventListener("change", syncThemeMode);
    return () => preference.removeEventListener("change", syncThemeMode);
  }, []);

  return (
    <button
      type="button"
      onClick={() => applyThemeMode(isDark ? "light" : "dark")}
      className="rounded-xl border border-[#d6e8f2] bg-white p-2.5 text-slate-500 transition hover:bg-slate-50"
      aria-label={t("Appearance")}
      title={t(isDark ? "Light" : "Dark")}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
