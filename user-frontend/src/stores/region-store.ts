"use client";

import { create } from "zustand";

export type RegionPreset = {
  id: string;
  country: string;
  countryCode: string;
  currency: "USD" | "KHR";
  currencySymbol: string;
  language: "EN" | "KM";
  languageLabel: string;
  locale: string;
  flagSrc: string;
};

export const REGION_PRESETS: RegionPreset[] = [
  {
    id: "kh-usd-en",
    country: "Cambodia",
    countryCode: "KH",
    currency: "USD",
    currencySymbol: "USD $",
    language: "EN",
    languageLabel: "English",
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
    languageLabel: "ខ្មែរ",
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
