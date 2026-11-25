"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSeoSettings } from "@/lib/site-settings-api";

const DEFAULT_SHOP_NAME = "Afiya Shope";

type SidebarBrandProps = {
  collapsed: boolean;
  className?: string;
};

function getShopName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const name = value.trim().split(/\s+(?:\||—|–)\s+/)[0]?.trim();
  return name || null;
}

export function SidebarBrand({
  collapsed,
  className = "",
}: SidebarBrandProps) {
  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [firstName, ...remainingName] = shopName.split(/\s+/);
  const secondName = remainingName.join(" ");

  useEffect(() => {
    let active = true;

    void loadSeoSettings()
      .then((settings) => {
        const configuredName = getShopName(settings.site_title_en);
        if (active && configuredName) setShopName(configuredName);
      })
      .catch(() => {
        if (active) {
          console.warn(
            "[sidebar-brand] Could not load the shop name from site settings; using the default."
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Link
      href="/dashboard"
      className={`inline-flex h-10 min-w-0 items-center gap-3 ${collapsed ? "lg:w-10 lg:justify-center lg:gap-0" : ""} ${className}`}
      aria-label={`${shopName} Dashboard`}
      title={collapsed ? `${shopName} Admin Panel` : undefined}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-black/10 dark:ring-white/10">
        <Image
          src="/brand/logo-mark.png"
          alt=""
          width={40}
          height={40}
          priority
          className="h-10 w-10 rounded-xl object-contain p-0.5"
        />
      </span>
      <span className={`min-w-0 leading-tight ${collapsed ? "lg:hidden" : ""}`}>
        <span className="block truncate text-base font-bold text-foreground">
          <span>{firstName}</span>
          {secondName ? (
            <>
              {" "}
              <span className="text-[#29B6E8]">{secondName}</span>
            </>
          ) : null}
        </span>
        <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
          Admin Panel
        </span>
      </span>
    </Link>
  );
}
