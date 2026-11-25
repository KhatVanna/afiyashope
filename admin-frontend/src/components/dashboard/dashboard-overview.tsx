"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "@/components/ui/emoji-icons";
import { getNavForUser } from "@/lib/admin-nav";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminText } from "@/components/layout/admin-language-selector";

const STAT_CARDS = [
  {
    label: "Products",
    value: "1,248",
    href: "/products",
    icon: Package,
    tone: "bg-[#e2f5fc] text-[#0077b6]",
  },
  {
    label: "Orders",
    value: "386",
    href: "/orders",
    icon: ShoppingCart,
    tone: "bg-[#fdede8] text-[#fa896b]",
  },
  {
    label: "Revenue",
    value: "$48.2k",
    href: "/reports",
    icon: Wallet,
    tone: "bg-[#e2f5fc] text-[#0da9d6]",
  },
  {
    label: "Customers",
    value: "2,914",
    href: "/customers",
    icon: Users,
    tone: "bg-[#e2f5fc] text-[#0da9d6]",
  },
  {
    label: "Low Stock",
    value: "27",
    href: "/products",
    icon: ShoppingBag,
    tone: "bg-[#fef5e5] text-[#ffae1f]",
  },
  {
    label: "Reports",
    value: "12",
    href: "/reports",
    icon: BarChart3,
    tone: "bg-[#fde7f3] text-[#c21868]",
  },
] as const;

export function DashboardOverview() {
  const t = useAdminText();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.name?.split(" ")[0] ?? "Admin";
  const navHrefs = new Set(getNavForUser(user).map((item) => item.href));
  const visibleStats = STAT_CARDS.filter((stat) => navHrefs.has(stat.href));

  return (
    <div className="space-y-6">
      <section className="dashboard-welcome overflow-hidden rounded-2xl bg-gradient-to-r from-[#e2f5fc] via-[#f5f8ff] to-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
              {t("Welcome back!")} {t(firstName)} 👋
            </h1>
            <p className="mt-2 text-base text-slate-500">
              {t("Check your store reports, orders, and catalog performance.")}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0077b6] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-700/20"
              >
                {t("View orders")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reports"
                className="inline-flex items-center rounded-xl border border-[#bfe9f8] bg-white px-4 py-2.5 text-sm font-semibold text-[#0077b6]"
              >
                {t("Open reports")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t("Today")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">$2,480</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#0da9d6]">
                <TrendingUp className="h-3.5 w-3.5" />
                +12%
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t("Orders")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">48</p>
              <p className="mt-1 text-xs text-slate-500">{t("Awaiting fulfillment")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={`${stat.label}-${stat.href}`}
              href={stat.href}
              className="rounded-2xl border border-white bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-500">{t(stat.label)}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{stat.value}</p>
            </Link>
          );
        })}
      </section>

    </div>
  );
}
