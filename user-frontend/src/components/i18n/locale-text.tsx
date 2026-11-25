"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { useRegionLanguage } from "@/stores/region-store";

type LocaleTextProps = {
  en: ReactNode;
  km: ReactNode;
};

export function LocaleText({ en, km }: LocaleTextProps) {
  const language = useRegionLanguage();
  const isKhmer = language === "KM";

  return <span lang={isKhmer ? "km" : "en"}>{isKhmer ? km : en}</span>;
}

export function useLocaleText() {
  const isKhmer = useRegionLanguage() === "KM";
  return useCallback((en: string, km: string) => (isKhmer ? km : en), [isKhmer]);
}
