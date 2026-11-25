"use client";

import Image from "next/image";
import Link from "next/link";
import { useAdminText } from "@/components/layout/admin-language-selector";

type LogoProps = {
  href?: string;
  className?: string;
  /** Visual height of the logo image in pixels */
  height?: number;
  priority?: boolean;
  showAdminLabel?: boolean;
};

export function Logo({
  href = "/",
  className = "",
  height = 40,
  priority = true,
  showAdminLabel = true,
}: LogoProps) {
  const t = useAdminText();
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label={`Afiya Shope ${t("Admin home")}`}
    >
      <span className="brand-logo-plate inline-flex items-center justify-center rounded-full border p-1">
        <Image
          src="/images/afiyashope_logo.png"
          alt="Afiya Shope"
          width={height}
          height={height}
          priority={priority}
          unoptimized
          className="rounded-full object-contain"
          style={{ width: height, height }}
        />
      </span>
      {showAdminLabel ? (
        <span className="hidden text-sm font-medium uppercase tracking-wider text-muted-foreground sm:inline">
          {t("Admin")}
        </span>
      ) : null}
    </Link>
  );
}
