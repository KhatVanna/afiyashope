"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Lock, Search } from "@/components/ui/emoji-icons";
import { Logo } from "@/components/logo";
import { RegionSelector } from "@/components/layout/region-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRegionLanguage } from "@/stores/region-store";

const departmentLinks = [
  { labelEn: "Shop All", labelKm: "ទាំងអស់", href: "/products" },
  { labelEn: "Pastel Colors", labelKm: "ពណ៌ប៉ាស្តែល", href: "/products?tag=pastel", icon: "🌸" },
  { labelEn: "Luxury Styles", labelKm: "ម៉ូដប្រណិត", href: "/products?tag=luxury", icon: "✨" },
  { labelEn: "Matching Sets", labelKm: "ឈុតពេញ", href: "/products?tag=set", icon: "👗" },
];

const iconButtonClass =
  "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted sm:h-10 sm:w-10";

export function SiteHeader() {
  const language = useRegionLanguage();
  const isKhmer = language === "KM";
  const [query, setQuery] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    if (!query.trim()) {
      event.preventDefault();
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background shadow-sm">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-[4.25rem] w-full max-w-[1800px] items-center justify-between gap-3 px-3 py-2 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo height={50} />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1.5 lg:gap-2.5">
            <RegionSelector
              variant="header"
              compact
            />

            <div className="inline-flex">
              <ThemeToggle />
            </div>

            <a
              href={
                process.env.NODE_ENV === "production"
                  ? "https://afiyashope-dashboard.vercel.app"
                  : process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"
              }
              className={`${iconButtonClass} border border-[#ff9999]/70 bg-card`}
              aria-label={isKhmer ? "ផ្ទាំងគ្រប់គ្រង" : "Admin dashboard"}
            >
              <Lock className="h-5 w-5" />
            </a>

          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 px-3 pb-3 sm:px-6 xl:flex-row xl:items-center xl:gap-3">
          <form
            action="/products"
            onSubmit={submitSearch}
            className="flex h-10 w-full items-center overflow-hidden rounded-full border border-[#ff9999]/70 bg-background focus-within:border-primary xl:min-w-0 xl:flex-1"
          >
            <label className="sr-only" htmlFor="site-search">
              {isKhmer ? "ស្វែងរកទំនិញ" : "Search products"}
            </label>
            <Search
              className="ml-4 mr-2 h-4 w-4 shrink-0 text-[#c95f86]"
              aria-hidden="true"
            />
            <input
              id="site-search"
              lang={isKhmer ? "km" : "en"}
              name="q"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={isKhmer ? "ស្វែងរកម៉ូដអាបាយ៉ា..." : "Search Abayas..."}
              className="h-full min-w-0 flex-1 bg-transparent pr-4 text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>

          <nav
            aria-label={isKhmer ? "ម៉ឺនុយប្រភេទទំនិញ" : "Category menu"}
            className="flex justify-start gap-2 overflow-x-auto sm:justify-center xl:w-auto xl:flex-none xl:justify-end"
          >
            {departmentLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  index === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {"icon" in link ? <span aria-hidden="true">{link.icon}</span> : null}
                {isKhmer ? link.labelKm : link.labelEn}
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </header>
  );
}
