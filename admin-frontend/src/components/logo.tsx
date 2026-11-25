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
  const width = Math.round(height * (2045 / 769));

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label={`Afiya Shope ${t("Admin home")}`}
    >
      <span className="brand-logo-plate inline-flex items-center justify-center rounded-2xl border px-2 py-1">
        <Image
          src="/images/afiyashope_logo.png"
          alt="Afiya Shope"
          width={width}
          height={height}
          priority={priority}
          unoptimized
          className="h-auto w-auto rounded-md object-contain"
          style={{ height, width: "auto" }}
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
