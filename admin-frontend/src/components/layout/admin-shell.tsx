"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  BarChart3,
  Bell,
  Check,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Tag,
  Users,
  UserCog,
  X,
} from "lucide-react";
import {
  AdminLanguageSelector,
  useAdminText,
} from "@/components/layout/admin-language-selector";
import { SidebarBrand } from "@/components/layout/sidebar-brand";
import { getNavForUser, type AdminNavItem } from "@/lib/admin-nav";
import { useAuthStore } from "@/stores/auth-store";

const THEME_STORAGE_KEY = "afiya-admin-theme";
const THEME_CHANGE_EVENT = "afiya-admin-theme-change";
const SIDEBAR_STORAGE_KEY = "afiya-admin-sidebar-collapsed";
const SIDEBAR_CHANGE_EVENT = "afiya-admin-sidebar-change";

type ThemeMode = "light" | "dark" | "system";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getThemeModeSnapshot(): ThemeMode {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "dark" || savedTheme === "system" ? savedTheme : "light";
}

function getServerThemeModeSnapshot(): ThemeMode {
  return "light";
}

function applyThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const darkMode = mode === "dark" || (mode === "system" && systemPrefersDark);
  document.documentElement.classList.toggle("dark", darkMode);
  document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribeToSidebar(onChange: () => void) {
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSidebarCollapsedSnapshot() {
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

function getServerSidebarCollapsedSnapshot() {
  return false;
}

const ICONS = {
  dashboard: LayoutDashboard,
  products: Package,
  brands: Tag,
  orders: ShoppingCart,
  customers: Users,
  reports: BarChart3,
  "site-settings": PanelsTopLeft,
  settings: Settings,
  users: UserCog,
} as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useAdminText();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const logout = useAuthStore((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const themeMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeModeSnapshot,
    getServerThemeModeSnapshot
  );
  const sidebarCollapsed = useSyncExternalStore(
    subscribeToSidebar,
    getSidebarCollapsedSnapshot,
    getServerSidebarCollapsedSnapshot
  );

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    function syncTheme() {
      const selectedMode = getThemeModeSnapshot();
      const darkMode =
        selectedMode === "dark" ||
        (selectedMode === "system" && preference.matches);
      document.documentElement.classList.toggle("dark", darkMode);
      document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    }

    syncTheme();
    preference.addEventListener("change", syncTheme);
    return () => preference.removeEventListener("change", syncTheme);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!themeMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !themeMenuRef.current?.contains(event.target)
      ) {
        setThemeMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setThemeMenuOpen(false);
        themeButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [themeMenuOpen]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5fbff]">
        <p className="text-sm text-muted-foreground">
          {!hydrated
            ? t("Restoring session...")
            : t("Redirecting to sign in...")}
        </p>
      </div>
    );
  }

  const navItems = getNavForUser(user);
  const accountLinks = navItems.filter((item) =>
    ["/settings", "/users", "/site-settings"].includes(item.href)
  );
  const roleLabel =
    user.roles?.map((role) => t(role.name)).join(", ") || t("Staff");
  const displayName = user.name.replace(/\s+admin$/i, "").trim() || user.name;
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f5fbff]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label={t("Close menu overlay")}
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-[#d6e8f2] bg-white shadow-[0_0_40px_rgba(15,23,42,0.04)] transition-[width,transform] lg:translate-x-0 ${
          sidebarCollapsed ? "lg:w-[96px]" : "lg:w-[270px]"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`relative grid h-16 shrink-0 grid-cols-[1fr_auto] items-center border-b border-[#d6e8f2] px-4 ${
            sidebarCollapsed ? "lg:grid-cols-[1fr_40px_1fr] lg:px-0" : ""
          }`}
        >
          <SidebarBrand
            collapsed={sidebarCollapsed}
            className={
              sidebarCollapsed
                ? "col-start-1 lg:col-start-2 lg:justify-self-center"
                : "col-start-1"
            }
          />
          <button
            type="button"
            onClick={() => {
              const nextCollapsed = !sidebarCollapsed;
              window.localStorage.setItem(
                SIDEBAR_STORAGE_KEY,
                nextCollapsed ? "true" : "false"
              );
              window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
            }}
            className={`hidden rounded-lg text-slate-500 hover:bg-slate-100 lg:inline-flex ${
              sidebarCollapsed
                ? "col-start-3 h-7 w-7 justify-self-end p-1.5"
                : "col-start-2 ml-3 p-2"
            }`}
            aria-label={
              sidebarCollapsed ? t("Expand sidebar") : t("Collapse sidebar")
            }
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? t("Expand sidebar") : t("Collapse sidebar")}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label={t("Close sidebar")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`px-5 pb-2 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {t("Home")}
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

      </aside>

      <div
        className={`flex min-w-0 flex-1 flex-col ${
          sidebarCollapsed ? "lg:ml-[96px]" : "lg:ml-[270px]"
        }`}
      >
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#d6e8f2] bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-xl border border-[#d6e8f2] bg-white p-2 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label={t("Open sidebar")}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={t("Search products, orders, customers...")}
              className="h-11 w-full rounded-xl border border-[#d6e8f2] bg-[#f1f9fd] pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#0077b6] focus:bg-white"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div ref={themeMenuRef} className="relative">
              <button
                ref={themeButtonRef}
                type="button"
                onClick={() => setThemeMenuOpen((open) => !open)}
                className="rounded-xl border border-[#d6e8f2] p-2.5 text-slate-500 transition hover:bg-slate-50"
                aria-label={t("Appearance")}
                aria-expanded={themeMenuOpen}
                aria-controls="admin-theme-menu"
                title={t("Appearance")}
              >
                {themeMode === "dark" ? (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              {themeMenuOpen ? (
                <div
                  id="admin-theme-menu"
                  className="absolute right-0 top-full z-[70] mt-4 w-52 rounded-2xl border border-[#d6e8f2] bg-white p-2 shadow-xl"
                >
                  {(
                    [
                      ["light", "Light", Sun],
                      ["dark", "Dark", Moon],
                      ["system", "System", Monitor],
                    ] as const
                  ).map(([mode, label, Icon]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        applyThemeMode(mode);
                        setThemeMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        themeMode === mode
                          ? "bg-[#f1f9fd] text-[#0077b6]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                      aria-pressed={themeMode === mode}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{t(label)}</span>
                      {themeMode === mode ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <AdminLanguageSelector />
            <button
              type="button"
              className="relative rounded-xl border border-[#d6e8f2] p-2.5 text-slate-500 transition hover:bg-slate-50"
              aria-label={t("Notifications")}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0077b6]" />
            </button>

            <div ref={accountMenuRef} className="relative">
              <button
                ref={accountButtonRef}
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-[#d6e8f2] bg-white px-2 py-1.5 text-left transition hover:bg-slate-50 sm:gap-3 sm:px-2.5"
                aria-label={t("Account menu")}
                aria-expanded={accountMenuOpen}
                aria-controls="admin-account-menu"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0077b6] text-xs font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden min-w-0 pr-1 sm:block">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {roleLabel}
                  </span>
                </span>
              </button>

              {accountMenuOpen ? (
                <div
                  id="admin-account-menu"
                  className="absolute right-0 top-full z-[70] mt-3 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-[#d6e8f2] bg-white p-2 shadow-2xl"
                >
                  <div className="rounded-xl bg-[#f1f9fd] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0077b6] text-sm font-semibold text-white">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {displayName}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {user.email}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#0077b6]">
                          {roleLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {accountLinks.length > 0 ? (
                    <nav aria-label={t("Account links")} className="mt-2 space-y-1">
                      {accountLinks.map((item) => {
                        const Icon = ICONS[item.icon];
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            {t(item.label)}
                          </Link>
                        );
                      })}
                    </nav>
                  ) : null}

                  <div className="mt-2 border-t border-[#e2edf4] pt-2">
                    <button
                      type="button"
                      onClick={() => void logout().then(() => router.replace("/"))}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <X className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      {t("Sign out")}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  collapsed,
}: {
  item: AdminNavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = ICONS[item.icon];
  const t = useAdminText();

  return (
    <Link
      href={item.href}
      title={collapsed ? t(item.label) : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        collapsed ? "lg:justify-center lg:px-2" : ""
      } ${
        active
          ? "bg-[#0077b6] text-white shadow-md shadow-cyan-700/25"
          : "text-slate-600 hover:bg-[#e2f5fc] hover:text-[#0077b6]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={collapsed ? "lg:sr-only" : ""}>{t(item.label)}</span>
    </Link>
  );
}
