export const THEME_STORAGE_KEY = "afiya-admin-theme";
export const THEME_CHANGE_EVENT = "afiya-admin-theme-change";

export type ThemeMode = "light" | "dark" | "system";

export function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getThemeModeSnapshot(): ThemeMode {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "dark" || savedTheme === "system" ? savedTheme : "light";
}

export function getServerThemeModeSnapshot(): ThemeMode {
  return "light";
}

export function syncThemeMode() {
  const mode = getThemeModeSnapshot();
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const darkMode = mode === "dark" || (mode === "system" && systemPrefersDark);
  document.documentElement.classList.toggle("dark", darkMode);
  document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function applyThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  syncThemeMode();
}
