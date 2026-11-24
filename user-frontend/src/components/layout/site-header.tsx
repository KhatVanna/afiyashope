"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { RegionSelector } from "@/components/layout/region-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";

const departmentLinks = [
  { label: "ពណ៌ Pastel", href: "/products?tag=pastel" },
  { label: "ម៉ូដប្រណិត", href: "/products?tag=luxury" },
  { label: "ឈុតពេញ", href: "/products?tag=set" },
];

const exploreLinks = [
  { label: "Shop All", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "New Arrivals", href: "/products?sort=latest" },
  { label: "Blog & News", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const iconButtonClass =
  "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted sm:h-10 sm:w-10";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const openCart = useCartStore((state) => state.openCart);
  const items = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );
  const wishlistCount = wishlistItems.length;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    if (!query.trim()) {
      event.preventDefault();
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background shadow-sm">
      <div className="bg-[#21A8D8] text-white">
        <div className="mx-auto flex min-h-9 w-full max-w-7xl items-center justify-center gap-2 px-3 text-center text-[11px] sm:px-6 sm:text-xs">
          <span className="hidden font-semibold tracking-[0.16em] text-white sm:inline">
            សួស្តីមិត្តភក្តិ
          </span>
          <span className="hidden text-white/50 sm:inline" aria-hidden="true">
            |
          </span>
          <span>NEW COLLECTION 2026 • ២៥ ខេត្ត-ក្រុង</span>
          <Link
            href="/products"
            className="font-semibold text-white underline decoration-[#F9318D] underline-offset-2 hover:text-[#F9318D]"
          >
            មើលម៉ូដ
          </Link>
        </div>
      </div>

      <div className="border-b border-border bg-card">
        <div className="mx-auto grid h-[4.25rem] w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          <div className="flex min-w-0 items-center">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-muted lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav
              aria-label="Shop departments"
              className="hidden items-center gap-5 lg:flex xl:gap-7"
            >
              {departmentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-foreground transition hover:text-primary xl:text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <Logo
            height={38}
            className="justify-self-center"
          />

          <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1.5">
            <form
              action="/products"
              onSubmit={submitSearch}
              className="hidden h-10 w-48 items-center overflow-hidden rounded-full border border-border bg-background focus-within:border-primary xl:flex"
            >
              <label className="sr-only" htmlFor="desktop-site-search">
                Search products
              </label>
              <input
                id="desktop-site-search"
                name="q"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ស្វែងរកម៉ូដ Abaya..."
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="inline-flex h-full w-10 shrink-0 items-center justify-center text-muted-foreground transition hover:text-primary"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            <RegionSelector
              variant="header"
              compact
              className="hidden xl:block"
            />

            <div className="hidden md:inline-flex">
              <ThemeToggle />
            </div>

            <Link
              href="/wishlist"
              className={`${iconButtonClass} hidden sm:inline-flex`}
              aria-label={
                wishlistCount > 0
                  ? `Wishlist, ${wishlistCount} items`
                  : "Wishlist"
              }
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/account"
              className={`${iconButtonClass} hidden md:inline-flex`}
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={openCart}
              className={iconButtonClass}
              aria-label={
                itemCount > 0 ? `Open cart, ${itemCount} items` : "Open cart"
              }
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <form
          action="/products"
          onSubmit={submitSearch}
          className="flex items-center gap-2 border-t border-border px-3 py-2 xl:hidden sm:px-6"
        >
          <label className="sr-only" htmlFor="mobile-site-search">
            Search products
          </label>
          <input
            id="mobile-site-search"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ស្វែងរកម៉ូដ Abaya..."
            className="h-9 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <nav
        aria-label="Main navigation"
        className="hidden border-b border-border bg-card lg:block"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-8 px-6 py-2.5">
          {exploreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-muted-foreground transition hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/products?sort=offers"
            className="text-xs font-semibold text-accent transition hover:opacity-75"
          >
            Sale
          </Link>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(88vw,22rem)] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <Logo height={36} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 overflow-y-auto p-4">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Shop by department
              </p>
              {departmentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-3 border-t border-border" />

              {exploreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/products?sort=offers"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-accent transition hover:bg-muted"
              >
                Sale
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                My Account
              </Link>
            </nav>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border p-4">
              <ThemeToggle />
              <RegionSelector variant="header" />
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
