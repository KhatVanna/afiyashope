"use client";

import { create } from "zustand";

export type RegionPreset = {
  id: string;
  country: string;
  countryCode: string;
  currency: "USD" | "KHR";
  currencySymbol: string;
  language: "EN" | "KM";
  locale: string;
  flagSrc: string;
};

export type CurrencyCode = RegionPreset["currency"];

export const REGION_PRESETS: RegionPreset[] = [
  {
    id: "kh-usd-en",
    country: "Cambodia",
    countryCode: "KH",
    currency: "USD",
    currencySymbol: "USD $",
    language: "EN",
    locale: "en-US",
    flagSrc: "/flags/gb.svg",
  },
  {
    id: "kh-khr-km",
    country: "Cambodia",
    countryCode: "KH",
    currency: "KHR",
    currencySymbol: "KHR ៛",
    language: "KM",
    locale: "km-KH",
    flagSrc: "/flags/kh.svg",
  },
];

const STORAGE_KEY = "v2005-region";
const USD_TO_KHR = 4100;

type RegionState = {
  regionId: string;
  hydrated: boolean;
  hydrate: () => void;
  setRegionId: (regionId: string) => void;
  region: () => RegionPreset;
};

function findPreset(regionId: string) {
  return REGION_PRESETS.find((preset) => preset.id === regionId) ?? REGION_PRESETS[0];
}

export const useRegionStore = create<RegionState>((set, get) => ({
  regionId: REGION_PRESETS[0].id,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const valid = REGION_PRESETS.some((preset) => preset.id === stored);
    const regionId =
      stored === "kh-usd-km"
        ? "kh-khr-km"
        : valid && stored
          ? stored
          : REGION_PRESETS[0].id;
    if (stored !== regionId) {
      window.localStorage.setItem(STORAGE_KEY, regionId);
    }
    set({
      regionId,
      hydrated: true,
    });
  },
  setRegionId: (regionId) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, regionId);
    }
    set({ regionId });
  },
  region: () => findPreset(get().regionId),
}));

export function useRegionLanguage() {
  const regionId = useRegionStore((state) => state.regionId);
  return findPreset(regionId).language;
}

export function getLanguageName(
  language: RegionPreset["language"],
  displayLanguage: RegionPreset["language"]
) {
  if (displayLanguage === "KM") {
    return language === "KM" ? "ខ្មែរ" : "អង់គ្លេស";
  }
  return language === "KM" ? "Khmer" : "English";
}

export function getRegionLabel(preset: RegionPreset) {
  return `${preset.country} (${preset.currencySymbol}, ${preset.language})`;
}

export function formatMoneyForRegion(amount: number, preset?: RegionPreset) {
  const region = preset ?? REGION_PRESETS[0];
  const value = region.currency === "KHR" ? amount * USD_TO_KHR : amount;

  return new Intl.NumberFormat(region.locale === "km-KH" ? "km-KH" : "en-US", {
    style: "currency",
    currency: region.currency,
    minimumFractionDigits: region.currency === "KHR" ? 0 : 2,
    maximumFractionDigits: region.currency === "KHR" ? 0 : 2,
  }).format(value);
}

export function getDisplayMoney(
  amount: number,
  currency?: CurrencyCode | null,
  preset?: RegionPreset
) {
  const region = preset ?? REGION_PRESETS[0];
  if (currency) {
    return { amount, currency };
  }

  return {
    amount: region.currency === "KHR" ? amount * USD_TO_KHR : amount,
    currency: region.currency,
  };
}

export function formatMoneyForCurrency(
  amount: number,
  currency: CurrencyCode,
  preset?: RegionPreset
) {
  const region = preset ?? REGION_PRESETS[0];

  if (currency === "KHR") {
    const formattedAmount = new Intl.NumberFormat(
      region.locale === "km-KH" ? "km-KH" : "en-US",
      { maximumFractionDigits: 0 }
    ).format(amount);
    return `${formattedAmount} ៛`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
