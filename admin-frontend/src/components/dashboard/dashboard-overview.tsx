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

const REVENUE_BARS = [
  { label: "Jan", sales: 42, profit: 28 },
  { label: "Feb", sales: 55, profit: 34 },
  { label: "Mar", sales: 38, profit: 24 },
  { label: "Apr", sales: 68, profit: 40 },
  { label: "May", sales: 50, profit: 32 },
  { label: "Jun", sales: 74, profit: 46 },
  { label: "Jul", sales: 58, profit: 36 },
];

const TRANSACTIONS = [
  {
    time: "09:30",
    title: "Payment received from Alice Nguyen",
    detail: "$385.90",
    tone: "bg-[#0da9d6]",
  },
  {
    time: "10:00",
    title: "New order recorded",
    detail: "#AFIYA-100248",
    tone: "bg-[#0077b6]",
  },
  {
    time: "12:00",
    title: "Refund processed for Michael",
    detail: "$64.95",
    tone: "bg-[#fa896b]",
  },
  {
    time: "14:20",
    title: "New sale recorded",
    detail: "#AFIYA-100249",
    tone: "bg-[#0077b6]",
  },
  {
    time: "16:45",
    title: "Payment completed",
    detail: "$129.00",
    tone: "bg-[#0da9d6]",
  },
];

const PRODUCT_ROWS = [
  {
    id: "1",
    sku: "SKU-1001",
    name: "Wireless Noise Cancelling Headphones",
    status: "High",
    statusTone: "bg-[#fdede8] text-[#fa896b]",
    sales: "$12.8K",
  },
  {
    id: "2",
    sku: "SKU-2044",
    name: "Smart Kitchen Scale Pro",
    status: "Medium",
    statusTone: "bg-[#fef5e5] text-[#ffae1f]",
    sales: "$9.3K",
  },
  {
    id: "3",
    sku: "SKU-3110",
    name: "Travel Backpack 30L",
    status: "Low",
    statusTone: "bg-[#e2f5fc] text-[#0da9d6]",
    sales: "$4.8K",
  },
  {
    id: "4",
    sku: "SKU-4188",
    name: "USB-C Hub Multiport Adapter",
    status: "Critical",
    statusTone: "bg-[#fde7f3] text-[#c21868]",
    sales: "$3.9K",
  },
  {
    id: "5",
    sku: "SKU-5202",
    name: "Kids STEM Robot Kit",
    status: "High",
    statusTone: "bg-[#fdede8] text-[#fa896b]",
    sales: "$7.1K",
  },
];

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

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] xl:col-span-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t("Revenue Updates")}</h2>
              <p className="text-sm text-slate-500">{t("Overview of sales vs profit")}</p>
            </div>
            <select
              className="h-10 rounded-xl border border-[#d6e8f2] bg-[#f1f9fd] px-3 text-sm text-slate-600 outline-none"
              defaultValue="2026"
            >
              <option>2026</option>
              <option>2025</option>
              <option>2024</option>
            </select>
          </div>

          <div className="mb-4 flex items-center gap-5 text-sm">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0077b6]" /> {t("Sales")}
            </span>
            <span className="inline-flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0da9d6]" /> {t("Profit")}
            </span>
          </div>

          <div className="flex h-56 items-end gap-3 sm:gap-4">
            {REVENUE_BARS.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-t-md bg-[#0077b6] sm:w-3"
                    style={{ height: `${bar.sales}%` }}
                  />
                  <div
                    className="w-2.5 rounded-t-md bg-[#0da9d6] sm:w-3"
                    style={{ height: `${bar.profit}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{t(bar.label)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:col-span-5">
          <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-lg font-semibold text-slate-800">{t("Yearly Breakup")}</h2>
            <div className="mt-5 flex items-center gap-6">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    strokeDasharray="55 45"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="4"
                    strokeDasharray="25 75"
                    strokeDashoffset="-55"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="4"
                    strokeDasharray="20 80"
                    strokeDashoffset="-80"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-semibold text-slate-800">$36,358</p>
                <p className="mt-1 text-sm font-medium text-[#0da9d6]">+9% {t("last year")}</p>
                <div className="mt-4 space-y-1.5 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0077b6]" /> 2026
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0da9d6]" /> 2025
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#e2f5fc]" /> 2024
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white bg-gradient-to-br from-[#0077b6] to-[#005d92] p-6 text-white shadow-lg shadow-cyan-700/20">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t("Monthly Earnings")}</h2>
                <p className="mt-4 text-3xl font-semibold">$6,820</p>
                <p className="mt-2 text-sm text-cyan-100">+9% {t("last month")}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] xl:col-span-4">
          <h2 className="text-lg font-semibold text-slate-800">{t("Recent Transactions")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("Latest store activity")}</p>
          <ul className="mt-6 space-y-5">
            {TRANSACTIONS.map((item) => (
              <li key={`${item.time}-${item.title}`} className="flex gap-3">
                <div className="w-12 shrink-0 text-xs font-medium text-slate-400">
                  {item.time}
                </div>
                <div className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{t(item.title)}</p>
                    <p className="text-sm text-slate-400">{item.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] xl:col-span-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t("Product Performance")}</h2>
              <p className="text-sm text-slate-500">{t("Top catalog movers this period")}</p>
            </div>
            <Link href="/products" className="text-sm font-semibold text-[#0077b6]">
              {t("View all")}
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2edf4] text-slate-400">
                  <th className="px-2 py-3 font-medium">{t("Id")}</th>
                  <th className="px-2 py-3 font-medium">{t("SKU")}</th>
                  <th className="px-2 py-3 font-medium">{t("Name")}</th>
                  <th className="px-2 py-3 font-medium">{t("Priority")}</th>
                  <th className="px-2 py-3 font-medium">{t("Sales")}</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCT_ROWS.map((row) => (
                  <tr key={row.id} className="border-b border-[#edf6fa] last:border-0">
                    <td className="px-2 py-4 text-slate-500">{row.id}</td>
                    <td className="px-2 py-4 font-medium text-slate-700">{row.sku}</td>
                    <td className="px-2 py-4 text-slate-700">{t(row.name)}</td>
                    <td className="px-2 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.statusTone}`}
                      >
                        {t(row.status)}
                      </span>
                    </td>
                    <td className="px-2 py-4 font-semibold text-slate-800">{row.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
