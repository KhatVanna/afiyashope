"use client";

import Link from "next/link";
import {
  siFacebook,
  siInstagram,
  siTelegram,
  siTiktok,
} from "simple-icons";
import { Logo } from "@/components/logo";

const menuLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Blog & News", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const aboutLinks = [
  { label: "Imprint", href: "/about" },
  { label: "Data protection", href: "/privacy" },
  { label: "Refund policy", href: "/refunds" },
  { label: "Shipping guidelines", href: "/shipping" },
  { label: "Terms of Use", href: "/terms" },
];

const paymentMethods = [
  {
    id: "khqr",
    label: "KHQR",
    src: "/images/images_payment_method/KHQR_lcon.webp",
  },
  {
    id: "aba-payway",
    label: "ABA PayWay",
    src: "/images/images_payment_method/ABA_payway_Icon.svg",
  },
] as const;

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1E66nep5tC/?mibextid=wwXIfr",
    icon: "facebook",
  },
  { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
  { label: "TikTok", href: "https://tiktok.com", icon: "tiktok" },
  { label: "Telegram", href: "https://t.me/", icon: "telegram" },
] as const;

const socialIcons = {
  facebook: siFacebook,
  instagram: siInstagram,
  tiktok: siTiktok,
  telegram: siTelegram,
} as const;

const snowflakePattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.07' stroke-width='1'%3E%3Cpath d='M40 12v56M18 26l44 28M18 54l44-28'/%3E%3Cpath d='M40 20l4 6-4 2-4-2zM40 54l4 6-4 2-4-2zM24 30l7 1-1 4-5 1zM49 45l7 1-1 4-5 1zM24 50l7-1-1-4-5-1zM49 35l7-1-1-4-5-1z'/%3E%3C/g%3E%3C/svg%3E")`;

export function SiteFooter() {
  return (
    <footer
      className="relative mt-auto overflow-hidden bg-[#21A8D8] text-white"
      style={{ backgroundImage: snowflakePattern }}
    >
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="space-y-4">
            <Logo height={44} priority={false} />
            <p className="max-w-xs text-sm leading-relaxed text-slate-200">
              Abaya Collection • បោះដុំ និងលក់រាយ ២៥ ខេត្ត-ក្រុង
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">menu</h3>
            <ul className="space-y-2.5">
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-white transition hover:text-[#F9318D]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">About Us</h3>
            <ul className="space-y-2.5">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-white transition hover:text-[#F9318D]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">Help & Contact</h3>
            <p className="mb-3 max-w-xs text-sm leading-relaxed text-slate-200">
              Need any advice before you buy? We&apos;re here to help.
            </p>
            <Link
              href="/contact"
              className="text-sm font-medium text-white underline underline-offset-4 transition hover:text-zinc-200"
            >
              Contact Us
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-2.5">
          {paymentMethods.map((method) => (
            <span
              key={method.id}
              className="inline-flex h-9 min-w-14 items-center justify-center rounded-md bg-white px-2 shadow-sm"
              title={method.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={method.src}
                alt={method.label}
                className="h-6 w-auto object-contain"
              />
            </span>
          ))}
        </div>

        <div className="mt-10 border-t border-zinc-800 pt-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs text-slate-300">
              © {new Date().getFullYear()}. Afiya Shope. Luxury Abaya Boutique
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-white transition hover:text-zinc-300"
                  >
                    <SocialGlyph name={social.icon} />
                  </a>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialGlyph({ name }: { name: (typeof socialLinks)[number]["icon"] }) {
  const icon = socialIcons[name];
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d={icon.path} />
    </svg>
  );
}
