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
  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`}
      aria-label={t("Afiya Shope home", "ទំព័រដើម Afiya Shope")}
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
    </Link>
  );
}
