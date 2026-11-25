"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocaleText } from "@/components/i18n/locale-text";

type LogoProps = {
  href?: string;
  className?: string;
  height?: number;
  priority?: boolean;
};

export function Logo({
  href = "/",
  className = "",
  height = 40,
  priority = true,
}: LogoProps) {
  const t = useLocaleText();
  const width = Math.round(height * (2045 / 769));

  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label={t("Afiya Shope home", "ទំព័រដើម Afiya Shope")}
    >
      <span className="brand-logo-plate inline-flex items-center justify-center rounded-2xl border px-2 py-1">
        <Image
          src="/images/afiyashope_logo.png"
          alt="Afiya Shope"
          width={width}
          height={height}
          priority={priority}
          unoptimized
          className="rounded-md object-contain"
          style={{ width: "auto", height }}
        />
      </span>
    </Link>
  );
}
